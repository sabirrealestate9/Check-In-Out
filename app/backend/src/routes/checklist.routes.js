const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../models/database.model');
const { authenticateToken, requireStaff } = require('../middleware/auth.middleware');
const { upload, handleUploadError, cleanupUploads } = require('../middleware/upload.middleware');
const { 
  getOrCreateStudioFolder, 
  createChecklistFolder,
  uploadFile,
  uploadBuffer 
} = require('../services/googleDrive.service');
const { generateChecklistPDF } = require('../services/pdf.service');
const path = require('path');
const fs = require('fs');

// Get all checklists
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { tenantId, checklistType } = req.query;
    
    let sql = `
      SELECT c.*, t.full_name as tenant_name, s.name as studio_name, u.full_name as submitted_by_name
      FROM checklists c
      JOIN tenants t ON c.tenant_id = t.id
      LEFT JOIN studios s ON t.studio_id = s.id
      LEFT JOIN users u ON c.submitted_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (tenantId) {
      sql += ' AND c.tenant_id = ?';
      params.push(tenantId);
    }

    if (checklistType) {
      sql += ' AND c.checklist_type = ?';
      params.push(checklistType);
    }

    sql += ' ORDER BY c.created_at DESC';

    const checklists = await allQuery(sql, params);
    res.json({ checklists });
  } catch (error) {
    console.error('Get checklists error:', error);
    res.status(500).json({ error: 'Failed to get checklists' });
  }
});

// Get checklist by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const checklist = await getQuery(
      `SELECT c.*, t.full_name as tenant_name, s.name as studio_name, u.full_name as submitted_by_name
       FROM checklists c
       JOIN tenants t ON c.tenant_id = t.id
       LEFT JOIN studios s ON t.studio_id = s.id
       LEFT JOIN users u ON c.submitted_by = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    // Get media files
    const mediaFiles = await allQuery(
      'SELECT * FROM media_files WHERE checklist_id = ?',
      [id]
    );

    res.json({ checklist, mediaFiles });
  } catch (error) {
    console.error('Get checklist error:', error);
    res.status(500).json({ error: 'Failed to get checklist' });
  }
});

// Create new checklist with file uploads
router.post('/', 
  authenticateToken, 
  requireStaff,
  upload.array('mediaFiles', 20),
  handleUploadError,
  cleanupUploads,
  async (req, res) => {
    try {
      const {
        tenantId,
        checklistType,
        furnitureCondition,
        appliancesCondition,
        wallsPaintCondition,
        acCondition,
        utilitiesStatus,
        cleanlinessStatus,
        additionalNotes,
        digitalSignature,
      } = req.body;

      // Validation
      if (!tenantId || !checklistType) {
        return res.status(400).json({ error: 'Tenant ID and checklist type are required' });
      }

      if (!['check_in', 'check_out'].includes(checklistType)) {
        return res.status(400).json({ error: 'Checklist type must be check_in or check_out' });
      }

      // Get tenant details
      const tenant = await getQuery(
        `SELECT t.*, s.name as studio_name, s.google_drive_folder_id as studio_folder_id
         FROM tenants t
         LEFT JOIN studios s ON t.studio_id = s.id
         WHERE t.id = ?`,
        [tenantId]
      );

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      // Create checklist record
      const checklistResult = await runQuery(
        `INSERT INTO checklists 
         (tenant_id, checklist_type, furniture_condition, appliances_condition, walls_paint_condition, 
          ac_condition, utilities_status, cleanliness_status, additional_notes, digital_signature, submitted_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId, checklistType, furnitureCondition, appliancesCondition, wallsPaintCondition,
          acCondition, utilitiesStatus, cleanlinessStatus, additionalNotes, digitalSignature, req.user.id
        ]
      );

      const checklistId = checklistResult.id;

      // Google Drive integration
      let driveFolderId = null;
      let uploadedFiles = [];

      try {
        // Get or create studio folder
        const studioFolderId = await getOrCreateStudioFolder(tenant.studio_name);

        // Create checklist subfolder with naming convention
        const folderName = `${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}_From_${tenant.check_in_date}_To_${tenant.check_out_date}_${checklistType}`;
        driveFolderId = await createChecklistFolder(studioFolderId, folderName);

        // Upload media files
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
            const mimeType = file.mimetype;
            const fileType = mimeType.startsWith('image/') ? 'image' : 
                            mimeType.startsWith('video/') ? 'video' : 'document';

            // Upload to Google Drive
            const driveFile = await uploadFile(
              file.path,
              file.originalname,
              mimeType,
              driveFolderId
            );

            // Save to database
            await runQuery(
              'INSERT INTO media_files (checklist_id, file_name, file_type, file_size, google_drive_file_id, local_path) VALUES (?, ?, ?, ?, ?, ?)',
              [checklistId, file.originalname, fileType, file.size, driveFile.id, file.path]
            );

            uploadedFiles.push({
              name: file.originalname,
              driveId: driveFile.id,
              type: fileType,
            });
          }
        }

        // Generate and upload checklist PDF
        const checklistData = {
          checklist_type: checklistType,
          furniture_condition: furnitureCondition,
          appliances_condition: appliancesCondition,
          walls_paint_condition: wallsPaintCondition,
          ac_condition: acCondition,
          utilities_status: utilitiesStatus,
          cleanliness_status: cleanlinessStatus,
          additional_notes: additionalNotes,
          digital_signature: digitalSignature,
        };

        const pdfBuffer = await generateChecklistPDF(checklistData, tenant, tenant.studio_name);
        const pdfFile = await uploadBuffer(
          pdfBuffer,
          `Checklist_${checklistType}_${tenant.full_name.replace(/\s+/g, '_')}.pdf`,
          'application/pdf',
          driveFolderId
        );

        // Update checklist with Google Drive file ID
        await runQuery(
          'UPDATE checklists SET google_drive_file_id = ? WHERE id = ?',
          [pdfFile.id, checklistId]
        );

      } catch (driveError) {
        console.error('Google Drive error (checklist saved but upload failed):', driveError);
        // Don't fail the request, just log the error
      }

      // Log creation
      await runQuery(
        'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
        [req.user.id, 'CREATE_CHECKLIST', 'checklist', checklistId, JSON.stringify({ tenantId, checklistType }), req.ip]
      );

      res.status(201).json({
        message: 'Checklist created successfully',
        checklist: {
          id: checklistId,
          tenantId,
          checklistType,
          driveFolderId,
          uploadedFiles,
        },
      });
    } catch (error) {
      console.error('Create checklist error:', error);
      res.status(500).json({ error: 'Failed to create checklist' });
    }
  }
);

// Update checklist
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'furnitureCondition', 'appliancesCondition', 'wallsPaintCondition',
      'acCondition', 'utilitiesStatus', 'cleanlinessStatus', 'additionalNotes'
    ];

    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(key)) {
        setClauses.push(`${dbField} = ?`);
        params.push(value);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);

    await runQuery(
      `UPDATE checklists SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );

    // Log update
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE_CHECKLIST', 'checklist', id, JSON.stringify(updates), req.ip]
    );

    res.json({ message: 'Checklist updated successfully' });
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({ error: 'Failed to update checklist' });
  }
});

// Delete checklist
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated media files first
    await runQuery('DELETE FROM media_files WHERE checklist_id = ?', [id]);

    // Delete checklist
    await runQuery('DELETE FROM checklists WHERE id = ?', [id]);

    // Log deletion
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE_CHECKLIST', 'checklist', id, req.ip]
    );

    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    console.error('Delete checklist error:', error);
    res.status(500).json({ error: 'Failed to delete checklist' });
  }
});

module.exports = router;
