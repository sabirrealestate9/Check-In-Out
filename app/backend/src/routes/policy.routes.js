const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../models/database.model');
const { authenticateToken, requireStaff } = require('../middleware/auth.middleware');

// Get all policies
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const policies = await allQuery(
      'SELECT * FROM company_policies WHERE is_active = 1 ORDER BY category, title'
    );
    res.json({ policies });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ error: 'Failed to get policies' });
  }
});

// Get policy by ID
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const policy = await getQuery('SELECT * FROM company_policies WHERE id = ?', [id]);

    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }

    res.json({ policy });
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({ error: 'Failed to get policy' });
  }
});

// Create new policy
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await runQuery(
      'INSERT INTO company_policies (title, content, category) VALUES (?, ?, ?)',
      [title, content, category]
    );

    // Log creation
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'CREATE_POLICY', 'policy', result.id, JSON.stringify({ title, category }), req.ip]
    );

    res.status(201).json({
      message: 'Policy created successfully',
      policy: {
        id: result.id,
        title,
        content,
        category,
      },
    });
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({ error: 'Failed to create policy' });
  }
});

// Update policy
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, isActive } = req.body;

    const updates = [];
    const params = [];

    if (title) {
      updates.push('title = ?');
      params.push(title);
    }

    if (content) {
      updates.push('content = ?');
      params.push(content);
    }

    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
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
      `UPDATE company_policies SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params
    );

    // Log update
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, 'UPDATE_POLICY', 'policy', id, JSON.stringify({ title, category }), req.ip]
    );

    res.json({ message: 'Policy updated successfully' });
  } catch (error) {
    console.error('Update policy error:', error);
    res.status(500).json({ error: 'Failed to update policy' });
  }
});

// Delete policy
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;

    await runQuery('DELETE FROM company_policies WHERE id = ?', [id]);

    // Log deletion
    await runQuery(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, 'DELETE_POLICY', 'policy', id, req.ip]
    );

    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({ error: 'Failed to delete policy' });
  }
});

module.exports = router;
