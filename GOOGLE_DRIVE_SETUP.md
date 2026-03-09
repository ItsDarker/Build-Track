# Google Drive Integration Setup Guide

This guide walks you through setting up Google Drive as the file storage backend for BuildTrack attachments.

## Overview

All file uploads in BuildTrack modules are now stored in Google Drive instead of local disk. This provides:
- Centralized file management
- Cloud storage backup
- Easy sharing and permissions management
- Integration with Google services

## Prerequisites

1. A Google Cloud Platform (GCP) project
2. A Google Drive account where the "uploads" folder will be created
3. The service account email must have access to the Google Drive folder

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" at the top
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "BuildTrack Files")
5. Click "Create"
6. Wait for the project to be created

## Step 2: Enable Google Drive API

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on "Google Drive API"
4. Click "ENABLE"
5. Wait for it to enable

## Step 3: Create a Service Account

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "Service Account"
3. Fill in the form:
   - Service account name: "BuildTrack File Service"
   - Click "Create and Continue"
4. Grant the service account basic roles:
   - Click "Continue" (you can skip this for now)
5. Click "Create Key"
6. Choose "JSON" as the key type
7. Click "Create"
8. A JSON file will download - **SAVE THIS FILE SECURELY**

## Step 4: Create the "uploads" Folder in Google Drive

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder named "uploads"
3. Right-click the folder > "Share"
4. Share the folder with the service account email from the JSON file
   - Copy the `client_email` from your downloaded JSON file
   - Paste it in the share dialog
   - Grant "Editor" permissions
5. Note the **Folder ID** from the URL:
   - Open the uploads folder
   - The folder ID is the last part of the URL: `https://drive.google.com/drive/folders/[FOLDER_ID]`

## Step 5: Configure Environment Variables

Add these variables to your `.env` file in the backend:

```bash
# Google Drive Integration
GOOGLE_DRIVE_ENABLED=true
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=your-key-id
GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_SERVICE_ACCOUNT_PROJECT_ID=your-project-id
GOOGLE_DRIVE_UPLOADS_FOLDER_ID=your-uploads-folder-id
```

### Getting these values from the JSON file:

Open the JSON file you downloaded and find:
- `client_email` → `GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL`
- `private_key_id` → `GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY_ID`
- `private_key` → `GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY` (already has \n newlines)
- `project_id` → `GOOGLE_DRIVE_SERVICE_ACCOUNT_PROJECT_ID`

**Important**: When pasting the `private_key`, make sure:
- Keep the surrounding quotes
- The `\n` characters are preserved (they represent newlines)
- It's a single line in .env

## Step 6: Test the Integration

1. Restart the backend server
2. Go to any module page
3. Create or edit a record
4. You should see an "Attachments" section
5. Try uploading a test file
6. Check that the file appears in your Google Drive "uploads" folder

## Usage

### Uploading Files

- Click "Upload File" in any module record form
- Select one or multiple files (up to 50MB each)
- Files are automatically uploaded to Google Drive
- File metadata is stored in the database

### Viewing Files

- Click the eye icon or file name to view in popup
- Images display inline with preview
- PDFs display in an embedded viewer
- Text files show in a code viewer
- No redirect to Google Drive needed

### Downloading Files

- Click the download icon to download to your computer
- File is retrieved from Google Drive on-demand

### Deleting Files

- Click the trash icon to delete
- File is removed from Google Drive and database
- Only the uploader or admin can delete

## Troubleshooting

### "Google Drive service not initialized"
- Check that `GOOGLE_DRIVE_ENABLED=true`
- Verify all environment variables are set correctly
- Check the backend logs for initialization errors
- Restart the backend server

### "Permission denied" when uploading
- Verify the service account email has Editor access to the uploads folder
- Check that the folder ID is correct
- Make sure the private key has proper newline characters

### Files not appearing in Google Drive
- Check the folder ID in the environment variables
- Verify the service account has access to the folder
- Check backend logs for upload errors
- Verify the file size is under 50MB

### Slow uploads
- Google Drive API has rate limits
- Large files (>10MB) may take longer
- For bulk uploads, consider queuing them

## Security Considerations

1. **Service Account Key**: This JSON key grants full access to your files
   - Store it securely (never commit to Git)
   - Rotate keys periodically
   - Use environment variables, not hardcoded values

2. **Folder Sharing**: Only share the uploads folder, not your entire Drive
   - Limit permissions to necessary roles
   - Monitor access logs

3. **User Permissions**: Backend enforces that only uploaders or admins can delete files

4. **File Size Limits**: 50MB max per file enforced by multer

## Migration from Local Storage

If you have existing files stored locally:

1. Files remain in the database attachment table
2. The `path` field will contain the Google Drive file ID for new files
3. Old local files won't work - those records should be re-uploaded
4. Consider a migration script if you have many existing files

## Performance Tips

1. **Large Files**: Upload during off-peak hours
2. **Batch Uploads**: Space out multiple uploads to avoid rate limits
3. **Caching**: Browser caches files for 1 hour after viewing
4. **Bandwidth**: Files stream from Google Drive (no local disk I/O)

## Support

For issues with Google Drive API:
- Check [Google Drive API Documentation](https://developers.google.com/drive/api/guides)
- Review [Service Account Setup Guide](https://cloud.google.com/iam/docs/service-accounts)
- Check BuildTrack backend logs: `npm run dev`
