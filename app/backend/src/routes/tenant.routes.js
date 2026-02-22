const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../models/database.model');
const { authenticateToken, requireStaff } = require('../middleware/auth.middleware');
const { 
  getOrCreateStudioFolder, 
  createChecklistFolder,
  uploadBuffer 
} = require('../services/googleDrive.service');
const { generateTenantPDF } = require('../services/pdf.service');

// Get all tenants
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { status, studioId, search } = req.query;
    
    let sql = `
      SELECT t.*, s.name as studio_name 
      FROM tenants t 
      LEFT JOIN studios s ON t.studio_id = s.id 
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (studioId) {
      sql += ' AND t.studio_id = ?';
      params.push(studioId);
    }

    if (search) {
      sql += ' AND (t.full_name LIKE ? OR t.email LIKE ? OR t.passport_id LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY t.created_at DESC';

    const tenants = await allQuery(sql, params);
    res.json({ tenants });
  } catch (error) {
    console.error('Get tenants error:', error);
    res.status(500).json({ error: 'Failed to get tenants' });
  }
});

// Get tenant by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await getQuery(
      `SELECT t.*, s.name as studio_name 
       FROM tenants t 
       LEFT JOIN studios s ON t.studio_id = s.id 
       WHERE t.id = ?`,
      [id]
    );

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get checklists for this tenant
    const checklists = await allQuery(
      `SELECT c.*, u.full_name as submitted_by_name 
       FROM checklists c 
       LEFT JOIN users u ON c.submitted_by = u.id 
       WHERE c.tenant_id = ? 
       ORDER BY c.created_at DESC`,
      [id]
    );

    res.json({ tenant, checklists });
  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: 'Failed to get tenant' });
  }
});

// Create new tenant
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      fullName,
      passportId,
      contactNumber,
      email,
      studioId,
      checkInDate,
      checkOutDate,
    } = req.body;

    // Validation
    if (!fullName || !studioId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ 
        error: 'Full name, studio, check-in date, and check-out date are required' 
      });
    }

    // Calculate duration
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const durationDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    if (durationDays <= 0) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date' });
    }

    // Get studio name
    const studio = await getQuery('SELECT name FROM studios WHERE id = ?', [studioId]);
    if (!studio) {
      return res.status(404).json({ error: 'Studio not found' });
    }

    // Create tenant record
    const result = await runQuery(
      `INSERT INTO tenants 
       (full_name, passport_id, contact_number, email, studio_id, check_in_date, check_out_date, duration_days, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullName, passportId, contactNumber, email, studioId, checkInDate, checkOutDate, durationDays, req.user.id]
    );

    const tenantId = result.id;

    // Create Google Drive folder structure
    try {
      // Get or create studio folder
      const studioFolderId = await getOrCreateStudioFolder(studio.name);

      // Create tenant subfolder
      const folderName = `${new Date().toISOString().split('T')[0]}_${fullName.replace(/\s+/g, '_')}`;
      const tenantFolderId = await createChecklistFolder(studioFolderId, folderName);

      // Update tenant with folder ID
      await runQuery(
        'UPDATE tenants SET google_drive_folder_id = ? WHERE id = ?',
        [tenantFolderId, tenantId]
      );

      // Generate and upload tenant details PDF
      const tenantData = {
        full_name: fullName,
        passport_id: passportId,
        contact_number: contactNumber,
        email,
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        duration_days: durationDays,
        status: 'active',
      };

      const pdfBuffer = await generateTenantPDF(tenantData, studio.name);
      await uploadBuffer(
        pdfBuffer,
        `Tenant_Details_${fullName.replace(/\s+/g, '_')}.pdf`,
        'application/pdf',
        tenantFolderId
      );

    } catch (driveError) {
      console.error('Google Drive error (tenant created but folder creation failed):', driveError);
      // Don't fail the request, just log the error
    }

    // Log creation
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE_TENANT', 'tenant', tenantId, JSON.stringify({ fullName, studioId }), req.ip]
    );

    res.status(201).json({
      message: 'Tenant created successfully',
      tenant: {
        id: tenantId,
        fullName,
        passportId,
        contactNumber,
        email,
        studioId,
        checkInDate,
        checkOutDate,
        durationDays,
      },
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// Update tenant
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'fullName', 'passportId', 'contactNumber', 'email',
      'studioId', 'checkInDate', 'checkOutDate', 'status'
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

    // Recalculate duration if dates changed
    if (updates.checkInDate || updates.checkOutDate) {
      const currentTenant = await getQuery(
        'SELECT check_in_date, check_out_date FROM tenants WHERE id = ?',
        [id]
      );
      
      const checkIn = new Date(updates.checkInDate || currentTenant.check_in_date);
      const checkOut = new Date(updates.checkOutDate || currentTenant.check_out_date);
      const durationDays = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      
      setClauses.push('duration_days = ?');
      params.push(durationDays);
    }

    params.push(id);

    await runQuery(
      `UPDATE tenants SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    // Log update
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE_TENANT', 'tenant', id, JSON.stringify(updates), req.ip]
    );

    res.json({ message: 'Tenant updated successfully' });
  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: 'Failed to update tenant' });
  }
});

// Check-out tenant
router.post('/:id/checkout', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await getQuery('SELECT * FROM tenants WHERE id = ?', [id]);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (tenant.status === 'checked_out') {
      return res.status(400).json({ error: 'Tenant already checked out' });
    }

    await runQuery(
      "UPDATE tenants SET status = 'checked_out', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    // Log check-out
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'CHECKOUT_TENANT', 'tenant', id, req.ip]
    );

    res.json({ message: 'Tenant checked out successfully' });
  } catch (error) {
    console.error('Check-out tenant error:', error);
    res.status(500).json({ error: 'Failed to check out tenant' });
  }
});

// Delete tenant
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    await runQuery('DELETE FROM tenants WHERE id = ?', [id]);

    // Log deletion
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE_TENANT', 'tenant', id, req.ip]
    );

    res.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    res.status(500).json({ error: 'Failed to delete tenant' });
  }
});

module.exports = router;
