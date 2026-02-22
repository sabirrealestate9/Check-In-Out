const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Initialize Google Drive API
let auth = null;
let drive = null;

const initializeGoogleDrive = () => {
  try {
    let credentials;

    // Try to load from environment variable first
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
      // Load from file
      const keyPath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
      credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    } else {
      throw new Error('Google Drive credentials not configured');
    }

    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    drive = google.drive({ version: 'v3', auth });
    console.log('Google Drive API initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Google Drive API:', error.message);
    return false;
  }
};

// Check if Google Drive is initialized
const isInitialized = () => drive !== null;

// Get or create studio folder
const getOrCreateStudioFolder = async (studioName) => {
  if (!drive) throw new Error('Google Drive not initialized');

  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootFolderId) throw new Error('Root folder ID not configured');

  try {
    // Search for existing studio folder
    const query = `name = '${studioName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and '${rootFolderId}' in parents and trashed = false`;
    
    const response = await drive.files.list({
      q: query,
      spaces: 'drive',
      fields: 'files(id, name)',
    });

    if (response.data.files.length > 0) {
      console.log(`Found existing folder for studio: ${studioName}`);
      return response.data.files[0].id;
    }

    // Create new folder
    const folderMetadata = {
      name: studioName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id',
    });

    console.log(`Created new folder for studio: ${studioName}`);
    return folder.data.id;
  } catch (error) {
    console.error('Error in getOrCreateStudioFolder:', error);
    throw error;
  }
};

// Create check-in/check-out subfolder
const createChecklistFolder = async (studioFolderId, folderName) => {
  if (!drive) throw new Error('Google Drive not initialized');

  try {
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [studioFolderId],
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id, name',
    });

    console.log(`Created checklist folder: ${folderName}`);
    return folder.data.id;
  } catch (error) {
    console.error('Error creating checklist folder:', error);
    throw error;
  }
};

// Upload file to Google Drive
const uploadFile = async (filePath, fileName, mimeType, parentFolderId) => {
  if (!drive) throw new Error('Google Drive not initialized');

  try {
    const fileMetadata = {
      name: fileName,
      parents: [parentFolderId],
    };

    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, size',
    });

    console.log(`Uploaded file: ${fileName}`);
    return file.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Upload buffer to Google Drive (for generated files like PDF)
const uploadBuffer = async (buffer, fileName, mimeType, parentFolderId) => {
  if (!drive) throw new Error('Google Drive not initialized');

  try {
    const fileMetadata = {
      name: fileName,
      parents: [parentFolderId],
    };

    const media = {
      mimeType,
      body: buffer,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, size',
    });

    console.log(`Uploaded buffer as: ${fileName}`);
    return file.data;
  } catch (error) {
    console.error('Error uploading buffer:', error);
    throw error;
  }
};

// List files in a folder
const listFiles = async (folderId, pageSize = 100) => {
  if (!drive) throw new Error('Google Drive not initialized');

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      spaces: 'drive',
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime)',
      pageSize,
      orderBy: 'name',
    });

    return response.data.files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

// Get file by ID
const getFile = async (fileId) => {
  if (!drive) throw new Error('Google Drive not initialized');

  try {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink',
    });

    return response.data;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
};

// Get download URL for file
const getFileDownloadUrl = async (fileId) => {
  if (!drive) throw new Error('Google Drive not initialized');

  try {
    // Get file metadata
    const file = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType',
    });

    // For Google Workspace files, export as PDF
    if (file.data.mimeType.includes('google-apps')) {
      const exportMimeType = 'application/pdf';
      return `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportMimeType}`;
    }

    // For binary files, use direct download
    return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

// Delete file
const deleteFile = async (fileId) => {
  if (!drive) throw new Error('Google Drive not initialized');

  try {
    await drive.files.delete({ fileId });
    console.log(`Deleted file: ${fileId}`);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Get folder structure recursively
const getFolderStructure = async (folderId, depth = 0, maxDepth = 3) => {
  if (!drive) throw new Error('Google Drive not initialized');
  if (depth > maxDepth) return null;

  try {
    const folder = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType',
    });

    const children = await listFiles(folderId);
    const result = {
      id: folder.data.id,
      name: folder.data.name,
      type: 'folder',
      children: [],
    };

    for (const child of children) {
      if (child.mimeType === 'application/vnd.google-apps.folder') {
        const subfolder = await getFolderStructure(child.id, depth + 1, maxDepth);
        if (subfolder) result.children.push(subfolder);
      } else {
        result.children.push({
          id: child.id,
          name: child.name,
          type: 'file',
          mimeType: child.mimeType,
          size: child.size,
          createdTime: child.createdTime,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting folder structure:', error);
    throw error;
  }
};

// Initialize on module load
initializeGoogleDrive();

module.exports = {
  initializeGoogleDrive,
  isInitialized,
  getOrCreateStudioFolder,
  createChecklistFolder,
  uploadFile,
  uploadBuffer,
  listFiles,
  getFile,
  getFileDownloadUrl,
  deleteFile,
  getFolderStructure,
};
