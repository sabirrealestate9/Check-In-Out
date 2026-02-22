const express = require('express');
const router = express.Router();
const { authenticateToken, requireStaff } = require('../middleware/auth.middleware');
const { 
  isInitialized,
  listFiles,
  getFile,
  getFileDownloadUrl,
  getFolderStructure,
  getOrCreateStudioFolder,
} = require('../services/googleDrive.service');
const { allQuery } = require('../models/database.model');

// Check Google Drive connection status
router.get('/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const initialized = isInitialized();
    res.json({
      connected: initialized,
      message: initialized ? 'Google Drive API connected' : 'Google Drive API not initialized',
    });
  } catch (error) {
    console.error('Drive status error:', error);
    res.status(500).json({ error: 'Failed to check drive status' });
  }
});

// List all studios (folders in root)
router.get('/studios', authenticateToken, requireStaff, async (req, res) => {
  try {
    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootFolderId) {
      return res.status(500).json({ error: 'Root folder ID not configured' });
    }

    const files = await listFiles(rootFolderId);
    const studios = files
      .filter(file => file.mimeType === 'application/vnd.google-apps.folder')
      .map(folder => ({
        id: folder.id,
        name: folder.name,
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime,
      }));

    res.json({ studios });
  } catch (error) {
    console.error('List studios error:', error);
    res.status(500).json({ error: 'Failed to list studios' });
  }
});

// Get studio folder contents
router.get('/studios/:folderId/contents', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { folderId } = req.params;
    const files = await listFiles(folderId);

    const contents = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
      mimeType: file.mimeType,
      size: file.size,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
    }));

    res.json({ contents });
  } catch (error) {
    console.error('Get studio contents error:', error);
    res.status(500).json({ error: 'Failed to get studio contents' });
  }
});

// Get full folder structure recursively
router.get('/studios/:folderId/structure', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { maxDepth = 3 } = req.query;

    const structure = await getFolderStructure(folderId, 0, parseInt(maxDepth));
    res.json({ structure });
  } catch (error) {
    console.error('Get folder structure error:', error);
    res.status(500).json({ error: 'Failed to get folder structure' });
  }
});

// Get file details
router.get('/files/:fileId', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await getFile(fileId);
    res.json({ file });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file details' });
  }
});

// Get file download URL
router.get('/files/:fileId/download', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { fileId } = req.params;
    const downloadUrl = await getFileDownloadUrl(fileId);
    res.json({ downloadUrl });
  } catch (error) {
    console.error('Get download URL error:', error);
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

// Sync studios from database to Google Drive
router.post('/sync-studios', authenticateToken, requireStaff, async (req, res) => {
  try {
    const studios = await allQuery('SELECT id, name FROM studios WHERE is_active = 1');
    
    const results = [];
    for (const studio of studios) {
      try {
        const folderId = await getOrCreateStudioFolder(studio.name);
        
        // Update studio with folder ID if not set
        const { runQuery } = require('../models/database.model');
        await runQuery(
          'UPDATE studios SET google_drive_folder_id = ? WHERE id = ? AND (google_drive_folder_id IS NULL OR google_drive_folder_id = "")',
          [folderId, studio.id]
        );

        results.push({
          studioId: studio.id,
          studioName: studio.name,
          folderId,
          status: 'synced',
        });
      } catch (err) {
        results.push({
          studioId: studio.id,
          studioName: studio.name,
          status: 'error',
          error: err.message,
        });
      }
    }

    res.json({
      message: 'Studio sync completed',
      results,
    });
  } catch (error) {
    console.error('Sync studios error:', error);
    res.status(500).json({ error: 'Failed to sync studios' });
  }
});

// Search across Google Drive
router.get('/search', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const { google } = require('googleapis');
    const { auth } = require('../services/googleDrive.service');
    
    const drive = google.drive({ version: 'v3', auth });
    
    const response = await drive.files.list({
      q: `name contains '${q.replace(/'/g, "\\'")}' and trashed = false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)',
      pageSize: 50,
    });

    res.json({
      query: q,
      results: response.data.files,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search' });
  }
});

module.exports = router;
