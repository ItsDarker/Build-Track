import { google } from 'googleapis';
import { Readable, PassThrough } from 'stream';
import { config } from '../config/env';

let driveService: any = null;
let uploadsFolderId: string | null = null;

/**
 * Initialize Google Drive service with service account credentials
 */
export async function initializeGoogleDrive() {
  if (!config.googleDrive.enabled) {
    console.warn('Google Drive is not enabled in configuration');
    return false;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      projectId: config.googleDrive.serviceAccountProjectId,
      credentials: {
        type: 'service_account',
        project_id: config.googleDrive.serviceAccountProjectId,
        private_key_id: config.googleDrive.serviceAccountPrivateKeyId,
        private_key: config.googleDrive.serviceAccountPrivateKey,
        client_email: config.googleDrive.serviceAccountEmail,
        client_id: '',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    driveService = google.drive({ version: 'v3', auth });
    uploadsFolderId = config.googleDrive.uploadsFolderId;

    console.log('Google Drive service initialized successfully');
    return true;
  } catch (err) {
    console.error('Failed to initialize Google Drive:', err);
    return false;
  }
}

/**
 * Upload a file to Google Drive in the uploads folder
 * Accepts both Buffer and Readable stream
 */
export async function uploadFileToDrive(
  fileData: Buffer | Readable,
  filename: string,
  mimeType: string
): Promise<{ fileId: string; webViewLink: string }> {
  if (!driveService || !uploadsFolderId) {
    throw new Error('Google Drive service not initialized');
  }

  try {
    // Convert Buffer to stream if necessary
    let body: Readable;
    if (Buffer.isBuffer(fileData)) {
      const passThrough = new PassThrough();
      passThrough.end(fileData);
      body = passThrough;
    } else {
      body = fileData;
    }

    const response = await driveService.files.create({
      requestBody: {
        name: filename,
        mimeType,
        parents: [uploadsFolderId],
      },
      media: {
        mimeType,
        body,
      },
      fields: 'id, webViewLink, name, mimeType, size, createdTime',
    });

    return {
      fileId: response.data.id as string,
      webViewLink: response.data.webViewLink as string,
    };
  } catch (err) {
    console.error('Failed to upload file to Google Drive:', err);
    throw err;
  }
}

/**
 * Get file metadata from Google Drive
 */
export async function getFileMetadata(fileId: string) {
  if (!driveService) {
    throw new Error('Google Drive service not initialized');
  }

  try {
    const response = await driveService.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, webViewLink',
    });

    return response.data;
  } catch (err) {
    console.error('Failed to get file metadata:', err);
    throw err;
  }
}

/**
 * Get a readable stream for viewing/downloading a file
 */
export async function getFileStream(fileId: string) {
  if (!driveService) {
    throw new Error('Google Drive service not initialized');
  }

  try {
    const response = await driveService.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    );

    return response.data;
  } catch (err) {
    console.error('Failed to get file stream:', err);
    throw err;
  }
}

/**
 * Get file content as a string (for text/json files)
 */
export async function getFileContent(fileId: string): Promise<string> {
  if (!driveService) {
    throw new Error('Google Drive service not initialized');
  }

  try {
    const response = await driveService.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    );

    return new Promise((resolve, reject) => {
      let content = '';
      response.data.on('data', (chunk: Buffer) => {
        content += chunk.toString();
      });
      response.data.on('end', () => resolve(content));
      response.data.on('error', reject);
    });
  } catch (err) {
    console.error('Failed to get file content:', err);
    throw err;
  }
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  if (!driveService) {
    throw new Error('Google Drive service not initialized');
  }

  try {
    await driveService.files.delete({
      fileId,
    });
  } catch (err) {
    console.error('Failed to delete file from Google Drive:', err);
    throw err;
  }
}

/**
 * Create a folder in Google Drive (if uploads folder doesn't exist yet)
 */
export async function createFolder(folderName: string, parentFolderId?: string): Promise<string> {
  if (!driveService) {
    throw new Error('Google Drive service not initialized');
  }

  try {
    const response = await driveService.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentFolderId && { parents: [parentFolderId] }),
      },
      fields: 'id',
    });

    return response.data.id as string;
  } catch (err) {
    console.error('Failed to create folder in Google Drive:', err);
    throw err;
  }
}

/**
 * Find folder by name
 */
export async function findFolderByName(folderName: string): Promise<string | null> {
  if (!driveService) {
    throw new Error('Google Drive service not initialized');
  }

  try {
    const response = await driveService.files.list({
      q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      spaces: 'drive',
      fields: 'files(id, name)',
      pageSize: 1,
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id as string;
    }

    return null;
  } catch (err) {
    console.error('Failed to find folder in Google Drive:', err);
    throw err;
  }
}

/**
 * Grant read access to a user email
 */
export async function grantReadAccess(fileId: string, userEmail: string): Promise<void> {
  if (!driveService) {
    throw new Error('Google Drive service not initialized');
  }

  try {
    await driveService.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'user',
        emailAddress: userEmail,
      },
    });
  } catch (err) {
    console.error('Failed to grant read access:', err);
    // Don't throw, this is optional
  }
}
