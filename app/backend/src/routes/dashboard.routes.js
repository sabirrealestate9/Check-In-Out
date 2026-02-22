const express = require('express');
const router = express.Router();
const { authenticateToken, requireStaff } = require('../middleware/auth.middleware');
const { allQuery, getQuery } = require('../models/database.model');

// Get dashboard statistics
router.get('/stats', authenticateToken, requireStaff, async (req, res) => {
  try {
    // Active tenants count
    const activeTenants = await getQuery(
      "SELECT COUNT(*) as count FROM tenants WHERE status = 'active'"
    );

    // Total tenants
    const totalTenants = await getQuery(
      'SELECT COUNT(*) as count FROM tenants'
    );

    // Check-outs this month
    const checkoutsThisMonth = await getQuery(`
      SELECT COUNT(*) as count FROM tenants 
      WHERE status = 'checked_out' 
      AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')
    `);

    // Total studios
    const totalStudios = await getQuery(
      'SELECT COUNT(*) as count FROM studios WHERE is_active = 1'
    );

    // Recent checklists
    const recentChecklists = await allQuery(`
      SELECT c.*, t.full_name as tenant_name, s.name as studio_name
      FROM checklists c
      JOIN tenants t ON c.tenant_id = t.id
      LEFT JOIN studios s ON t.studio_id = s.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    // Upcoming check-outs (next 7 days)
    const upcomingCheckouts = await allQuery(`
      SELECT t.*, s.name as studio_name
      FROM tenants t
      LEFT JOIN studios s ON t.studio_id = s.id
      WHERE t.status = 'active'
      AND t.check_out_date <= date('now', '+7 days')
      AND t.check_out_date >= date('now')
      ORDER BY t.check_out_date ASC
    `);

    // Studio occupancy
    const studioOccupancy = await allQuery(`
      SELECT s.name, 
             COUNT(t.id) as tenant_count,
             CASE WHEN COUNT(t.id) > 0 THEN 'occupied' ELSE 'available' END as status
      FROM studios s
      LEFT JOIN tenants t ON s.id = t.studio_id AND t.status = 'active'
      WHERE s.is_active = 1
      GROUP BY s.id
      ORDER BY s.name
    `);

    res.json({
      stats: {
        activeTenants: activeTenants.count,
        totalTenants: totalTenants.count,
        checkoutsThisMonth: checkoutsThisMonth.count,
        totalStudios: totalStudios.count,
        occupancyRate: totalStudios.count > 0 
          ? Math.round((activeTenants.count / totalStudios.count) * 100) 
          : 0,
      },
      recentChecklists,
      upcomingCheckouts,
      studioOccupancy,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Get recent activity (audit logs)
router.get('/activity', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await allQuery(`
      SELECT al.*, u.full_name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]);

    res.json({ activities });
  } catch (error) {
    console.error('Activity log error:', error);
    res.status(500).json({ error: 'Failed to get activity log' });
  }
});

// Get tenant statistics
router.get('/tenant-stats', authenticateToken, requireStaff, async (req, res) => {
  try {
    // Tenants by month
    const tenantsByMonth = await allQuery(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM tenants
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `);

    // Average duration
    const avgDuration = await getQuery(`
      SELECT AVG(duration_days) as avg_days
      FROM tenants
      WHERE status = 'checked_out'
    `);

    // Checklist completion rate
    const checklistStats = await allQuery(`
      SELECT 
        checklist_type,
        COUNT(*) as count
      FROM checklists
      GROUP BY checklist_type
    `);

    res.json({
      tenantsByMonth,
      averageDuration: Math.round(avgDuration.avg_days || 0),
      checklistStats,
    });
  } catch (error) {
    console.error('Tenant stats error:', error);
    res.status(500).json({ error: 'Failed to get tenant stats' });
  }
});

module.exports = router;
