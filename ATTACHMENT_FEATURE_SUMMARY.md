# File Attachment Feature - Implementation Summary

## Overview
All BuildTrack modules now support file attachments that are automatically uploaded to Google Drive. Users can upload, view, and manage files directly from any module record without leaving the application.

## What Changed

### ✅ Backend Changes
1. **New Service**: `backend/src/services/googleDrive.ts`
   - Complete Google Drive API integration
   - Upload files to "uploads" folder in Google Drive
   - Stream files for viewing/downloading
   - Delete files from Drive
   - Manage folder structure

2. **Updated Routes**: `backend/src/routes/attachment.routes.ts`
   - Changed from local disk storage to Google Drive
   - Upload endpoint: stores Google Drive file ID instead of local path
   - View endpoint: streams files from Google Drive
   - Download endpoint: retrieves from Google Drive
   - Delete endpoint: removes from both Drive and database

3. **Configuration**: `backend/src/config/env.ts`
   - Added Google Drive service account configuration
   - Service account email, private key, project ID, folder ID

### ✅ Frontend Features (Unchanged from BT0018)
- Attachment fields auto-detected in all modules
- File upload form with drag-and-drop support
- Inline preview: images, PDFs, text files
- File list with metadata (size, upload date, uploader)
- View/Download/Delete actions
- Pop-up viewer (no Google Drive redirect)

## How It Works

### User Uploads a File
1. Opens a module record
2. Clicks "Upload File" in the Attachments section
3. Selects one or more files (up to 50MB each)
4. Backend:
   - Receives file buffer
   - Converts buffer to stream
   - Uploads to Google Drive "uploads" folder
   - Stores file metadata + Drive file ID in database
5. Frontend:
   - Shows upload success
   - Displays file in attachments list
   - Disables upload until page refresh (or auto-refetch)

### User Views a File
1. Clicks file name or eye icon
2. Frontend:
   - Makes request to `/api/attachments/view/{id}`
   - Streams file content from Google Drive
   - Renders in popup viewer:
     - Images: inline preview
     - PDFs: embedded iframe viewer
     - Text: code block display
3. User can download or close modal

### User Deletes a File
1. Clicks trash icon on file
2. Backend:
   - Verifies user is uploader or admin
   - Deletes from Google Drive
   - Removes from database
3. File disappears from list

## Modules with Attachment Support

All 16 modules automatically detect attachment fields:
- CRM / Leads
- Project Requirements
- Design Configurator
- Quoting & Contracts
- Approval Workflow
- Job Confirmation
- Work Orders / Support & Warranty
- BOM / Materials Planning
- Procurement
- Production Scheduling
- Manufacturing
- Quality Control
- Packaging
- Delivery & Installation
- Billing & Invoicing
- Closure

**Field Names**: Any field containing "attachment", "file", "upload", or "document" triggers the upload feature.

## Setup Instructions

See `GOOGLE_DRIVE_SETUP.md` for detailed setup:

1. Create GCP project
2. Enable Google Drive API
3. Create service account
4. Share "uploads" folder (in finofranklin@geodigitalpartners.com Drive)
5. Extract credentials from JSON
6. Set environment variables:
   ```
   GOOGLE_DRIVE_ENABLED=true
   GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=...
   GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=...
   GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY=...
   GOOGLE_DRIVE_SERVICE_ACCOUNT_PROJECT_ID=...
   GOOGLE_DRIVE_UPLOADS_FOLDER_ID=...
   ```
7. Restart backend

## Configuration

### Backend (.env)
```bash
GOOGLE_DRIVE_ENABLED=true|false          # Toggle feature
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=...   # Service account email
GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=...
GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY=... # Private key (JSON format)
GOOGLE_DRIVE_SERVICE_ACCOUNT_PROJECT_ID=...
GOOGLE_DRIVE_UPLOADS_FOLDER_ID=...      # ID of "uploads" folder in Drive
```

### Frontend
No changes needed - attachment fields are auto-detected and rendered.

## API Endpoints

### POST /api/attachments/upload
Upload files to a module record
```json
{
  "moduleRecordId": "record-id",
  "files": [file1, file2, ...]
}
```
Response: Array of attachment metadata with Drive file IDs

### GET /api/attachments/view/:id
Stream file from Google Drive for viewing (inline)

### GET /api/attachments/download/:id
Stream file from Google Drive for downloading

### GET /api/attachments/record/:recordId
List all attachments for a record

### DELETE /api/attachments/:id
Delete attachment from Drive and database (uploader or admin only)

## File Storage Location

- **Service Account**: Uses service account credentials (not user OAuth)
- **Folder**: `finofranklin@geodigitalpartners.com` Drive → "uploads" folder
- **Organization**: Files stored directly in uploads folder (flat structure)
- **Naming**: Original filename preserved in Drive
- **Metadata**: File ID, MIME type, size, upload date stored in database

## Limits

- **Max File Size**: 50MB per file
- **Supported Types**: All file types (enforced at app level, not server)
- **Upload Rate**: Limited by Google Drive API rate limits
- **Simultaneous Uploads**: Browser handles multiple files sequentially

## Error Handling

- **Service Unavailable**: Shows "File upload service not available" if Google Drive not configured
- **Upload Failure**: Shows error message, does not crash page
- **View Failure**: Shows error modal, falls back to download
- **Delete Failure**: Shows error, file remains in list until retry
- **Large Files**: Timeouts after 60 seconds (can be configured)

## Security

✅ **Backend**: Service account credentials never exposed to frontend
✅ **Permissions**: RBAC enforced before upload/delete
✅ **Uploader Check**: Only uploader or admin can delete
✅ **File Isolation**: Files stored in dedicated "uploads" folder
✅ **Size Limits**: 50MB max enforced by multer
✅ **Credentials**: Stored as environment variables, not in code

⚠️ **TODO**: 
- File access logging (who viewed what file)
- Rate limiting per user
- Quarantine infected files (antivirus scan)
- Archive deleted files

## Performance

- **Upload**: Direct stream to Google Drive (no local disk I/O)
- **View**: Streamed from Drive to browser
- **Download**: Streamed from Drive to browser
- **List**: Database query (fast)
- **Caching**: Browser caches viewed files for 1 hour

## Troubleshooting

See `GOOGLE_DRIVE_SETUP.md` "Troubleshooting" section for:
- "Google Drive service not initialized"
- "Permission denied" when uploading
- Files not appearing in Drive
- Slow uploads
- Service account issues

## Future Enhancements

1. **Folder Organization**: Create subfolders per module
2. **Sharing**: Allow users to grant read access to other team members
3. **Versioning**: Track file revisions
4. **Search**: Full-text search of document content
5. **Antivirus**: Scan uploaded files before storing
6. **Thumbnails**: Cache thumbnail previews
7. **Drag & Drop**: Enhanced UX with drag-and-drop zones
8. **Bulk Upload**: Upload folders/multiple files at once

## Testing Checklist

- [ ] Upload file to a module record
- [ ] File appears in attachments list
- [ ] View file in popup (image, PDF, text)
- [ ] Download file to computer
- [ ] Delete file from record and Drive
- [ ] Try uploading 50MB file (should work)
- [ ] Try uploading 100MB file (should fail with error)
- [ ] Check Google Drive folder for uploaded files
- [ ] Verify only uploader can delete their own files
- [ ] Verify admin can delete any file
