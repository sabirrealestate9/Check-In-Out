const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../models/database.model');
const { authenticateToken, requireStaff } = require('../middleware/auth.middleware');
const { getOrCreateStudioFolder } = require('../services/googleDrive.service');

// Get all studios
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const studios = await allQuery(
      'SELECT * FROM studios WHERE is_active = 1 ORDER BY name'
    );
    res.json({ studios });
  } catch (error) {
    console.error('Get studios error:', error);
    res.status(500).json({ error: 'Failed to get studios' });
  }
});

// Get studio by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const studio = await getQuery('SELECT * FROM studios WHERE id = ?', [id]);

    if (!studio) {
      return res.status(404).json({ error: 'Studio not found' });
    }

    res.json({ studio });
  } catch (error) {
    console.error('Get studio error:', error);
    res.status(500).json({ error: 'Failed to get studio' });
  }
});

// Create new studio
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { name, address, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Studio name is required' });
    }

    // Check if name exists
    const existing = await getQuery('SELECT id FROM studios WHERE name = ?', [name]);
    if (existing) {
      return res.status(409).json({ error: 'Studio name already exists' });
    }

    // Create Google Drive folder
    let folderId = null;
    try {
      folderId = await getOrCreateStudioFolder(name);
    } catch (driveError) {
      console.error('Google Drive folder creation failed:', driveError);
      // Continue without folder - can be synced later
    }

    const result = await runQuery(
      'INSERT INTO studios (name, address, description, google_drive_folder_id) VALUES (?, ?, ?, ?)',
      [name, address, description, folderId]
    );

    // Log creation
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE_STUDIO', 'studio', result.id, JSON.stringify({ name }), req.ip]
    );

    res.status(201).json({
      message: 'Studio created successfully',
      studio: {
        id: result.id,
        name,
        address,
        description,
        googleDriveFolderId: folderId,
      },
    });
  } catch (error) {
    console.error('Create studio error:', error);
    res.status(500).json({ error: 'Failed to create studio' });
  }
});

// Update studio
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, description, isActive } = req.body;

    const updates = [];
    const params = [];

    if (name) {
      // Check if new name conflicts
      const existing = await getQuery('SELECT id FROM studios WHERE name = ? AND id != ?', [name, id]);
      if (existing) {
        return res.status(409).json({ error: 'Studio name already exists' });
      }
      updates.push('name = ?');
      params.push(name);
    }

    if (address !== undefined) {
      updates.push('address = ?');
      params.push(address);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);

    await runQuery(
      `UPDATE studios SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    // Log update
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE_STUDIO', 'studio', id, JSON.stringify({ name, address, isActive }), req.ip]
    );

    res.json({ message: 'Studio updated successfully' });
  } catch (error) {
    console.error('Update studio error:', error);
    res.status(500).json({ error: 'Failed to update studio' });
  }
});

// Delete studio
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if studio has tenants
    const tenantCount = await getQuery(
      'SELECT COUNT(*) as count FROM tenants WHERE studio_id = ?',
      [id]
    );

    if (tenantCount.count > 0) {
      return res.status(400).json({ error: 'Cannot delete studio with existing tenants' });
    }

    await runQuery('DELETE FROM studios WHERE id = ?', [id]);

    // Log deletion
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE_STUDIO', 'studio', id, req.ip]
    );

    res.json({ message: 'Studio deleted successfully' });
  } catch (error) {
    console.error('Delete studio error:', error);
    res.status(500).json({ error: 'Failed to delete studio' });
  }
});

module.exports = router;
