# GCP Cloud Build Integration - Google Drive Setup Guide

**Project:** buildtrac-app
**Project ID:** buildtrac-app
**Project Number:** 102021166885
**Using Existing Resources:**
- Service Account: `buildtrack-cloudrun@buildtrac-app.iam.gserviceaccount.com`
- Google Drive Folder: `1OluJ1omjd7Hj6fePbb9hf1ioGYFVEs_z` ✅ (Already set up)

---

## Overview

This guide explains how to create secrets in Google Secret Manager for Google Drive file attachments. The secrets will be used by your existing Cloud Build and Cloud Run infrastructure to upload files to Google Drive automatically.

## Prerequisites

✅ Existing service account: `buildtrack-cloudrun@buildtrac-app.iam.gserviceaccount.com`
✅ Google Drive folder: `1OluJ1omjd7Hj6fePbb9hf1ioGYFVEs_z` (uploads folder)
✅ Service account credentials: `buildtrac-app-718b0caebb02.json`

---

## Step 1: Create Secrets in Google Secret Manager

Your service account credentials need to be securely stored in GCP Secret Manager. Run these commands in Cloud Shell:

```bash
# Set your project
gcloud config set project buildtrac-app

# 1. Service Account Email
echo "buildtrack-file-service@buildtrac-app.iam.gserviceaccount.com" | \
  gcloud secrets create buildtrack-google-drive-email --data-file=-

# 2. Private Key ID
echo "718b0caebb028bf2cda4109d7a5069b4a08350a6" | \
  gcloud secrets create buildtrack-google-drive-key-id --data-file=-

# 3. Project ID
echo "buildtrac-app" | \
  gcloud secrets create buildtrack-google-drive-project-id --data-file=-

# 4. Google Drive Folder ID (already set)
echo "1OluJ1omjd7Hj6fePbb9hf1ioGYFVEs_z" | \
  gcloud secrets create buildtrack-google-drive-folder-id --data-file=-
```

For the **Private Key** (longer), use one of these methods:

**Method A: Using GCP Console (Easiest)**
1. Go to [Secret Manager Console](https://console.cloud.google.com/security/secret-manager)
2. Click "Create Secret"
3. Name: `buildtrack-google-drive-private-key`
4. Paste the ENTIRE private key from `buildtrac-app-718b0caebb02.json`
   (Include the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines)
5. Click "Create Secret"

**Method B: Using Cloud Shell**
```bash
gcloud secrets create buildtrack-google-drive-private-key \
  --data-file=/path/to/private_key.txt
```

## Step 2: Grant Existing Service Account Access

Grant the existing `buildtrack-cloudrun` service account access to all secrets:

```bash
# Grant buildtrack-cloudrun service account access to all secrets
for SECRET in buildtrack-google-drive-email buildtrack-google-drive-key-id \
              buildtrack-google-drive-private-key buildtrack-google-drive-project-id \
              buildtrack-google-drive-folder-id; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member=serviceAccount:buildtrack-cloudrun@buildtrac-app.iam.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
done

# Also grant the Cloud Build default service account (if not already granted)
PROJECT_NUMBER=$(gcloud projects describe buildtrac-app --format='value(projectNumber)')
for SECRET in buildtrack-google-drive-email buildtrack-google-drive-key-id \
              buildtrack-google-drive-private-key buildtrack-google-drive-project-id \
              buildtrack-google-drive-folder-id; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
done
```

## Step 3: Verify Google Drive Folder Sharing

The Google Drive folder (`1OluJ1omjd7Hj6fePbb9hf1ioGYFVEs_z`) should already be shared with:
- `buildtrack-file-service@buildtrac-app.iam.gserviceaccount.com` (Editor)

If not shared, follow these steps:

1. Go to [Google Drive](https://drive.google.com)
2. Right-click the folder → Share
3. Add email: `buildtrack-file-service@buildtrac-app.iam.gserviceaccount.com`
4. Grant "Editor" permissions
5. Click Share

## Step 4: Verify Secrets Are Created

Verify all 5 secrets exist in Secret Manager:

```bash
# List all BuildTrack Google Drive secrets
gcloud secrets list | grep buildtrack-google-drive

# Output should show:
# buildtrack-google-drive-email
# buildtrack-google-drive-folder-id
# buildtrack-google-drive-key-id
# buildtrack-google-drive-private-key
# buildtrack-google-drive-project-id
```

## Step 5: Cloud Build Configuration

Your `cloudbuild.yaml` is **already updated** with Google Drive secrets. The backend deployment includes:

```yaml
--set-env-vars
GOOGLE_DRIVE_ENABLED=true

--set-secrets
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=buildtrack-google-drive-email:latest
GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY_ID=buildtrack-google-drive-key-id:latest
GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY=buildtrack-google-drive-private-key:latest
GOOGLE_DRIVE_SERVICE_ACCOUNT_PROJECT_ID=buildtrack-google-drive-project-id:latest
GOOGLE_DRIVE_UPLOADS_FOLDER_ID=buildtrack-google-drive-folder-id:latest
```

No changes needed to `cloudbuild.yaml` - it's ready to use!

## Step 6: Deploy with Cloud Build

Trigger a new build:

```bash
# Navigate to your repo directory
cd /path/to/buildtrack

# Submit build (automatically uses cloudbuild.yaml)
gcloud builds submit --config=cloudbuild.yaml
```

Monitor the build:

```bash
# View recent builds
gcloud builds list --limit=5

# Watch build logs in real-time
gcloud builds log <BUILD_ID> --stream

# Example: Watch the latest build
LATEST_BUILD=$(gcloud builds list --limit=1 --format='value(id)')
gcloud builds log $LATEST_BUILD --stream
```

## Step 7: Verify Deployment

After build succeeds:

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click `buildtrack-backend`
3. Verify environment variable: `GOOGLE_DRIVE_ENABLED=true`
4. Open the service URL and test file upload
5. Check [Google Drive folder](https://drive.google.com/drive/u/5/folders/1OluJ1omjd7Hj6fePbb9hf1ioGYFVEs_z) to confirm file was uploaded

## Verify Secrets Are Set

```bash
# Check that all secrets exist
gcloud secrets list | grep buildtrack-google-drive

# View secret details (use cautiously)
gcloud secrets versions access latest --secret="buildtrack-google-drive-email"
```

## Cloud Run Environment Variables

After deployment, verify the environment is set correctly:

```bash
# Check backend environment
gcloud run services describe buildtrack-backend --region us-central1 --format='value(spec.template.spec.containers[0].env)'
```

Should show `GOOGLE_DRIVE_ENABLED=true` in environment variables.

## Troubleshooting

### Secret Not Found
**Error:** `Secret 'buildtrack-google-drive-email' not found`

**Solution:** Create the missing secret in Secret Manager
```bash
gcloud secrets list | grep buildtrack-google-drive
```

### Permission Denied on Secret
**Error:** `Permission denied on secret 'buildtrack-google-drive-private-key'`

**Solution:** Re-run Step 3 to grant Cloud Build access

### Backend Fails to Start
**Error:** `Google Drive service not initialized`

**Solution:** 
- Check Cloud Run logs: `gcloud run logs read buildtrack-backend --limit 50`
- Verify all 5 secrets are created and accessible
- Check that Cloud Build service account has secret access

### Files Not Uploading
1. Check backend logs for errors
2. Verify service account email has Editor access to uploads folder
3. Verify folder ID is correct (not shortened or partial)

## Production Checklist

- [ ] All 5 secrets created in Secret Manager
  - [ ] buildtrack-google-drive-email
  - [ ] buildtrack-google-drive-key-id
  - [ ] buildtrack-google-drive-private-key
  - [ ] buildtrack-google-drive-project-id
  - [ ] buildtrack-google-drive-folder-id
- [ ] buildtrack-cloudrun service account has secret access
- [ ] Cloud Build service account has secret access
- [ ] Google Drive folder (`1OluJ1omjd7Hj6fePbb9hf1ioGYFVEs_z`) shared with service account
- [ ] cloudbuild.yaml verified (already configured)
- [ ] Build deployed successfully
- [ ] File upload tested in app
- [ ] Files appear in Google Drive uploads folder
- [ ] Backend logs show no errors

## Verify Secrets Have Correct Permissions

```bash
# Check buildtrack-cloudrun service account has access
gcloud secrets get-iam-policy buildtrack-google-drive-email

# Should show:
# bindings:
# - role: roles/secretmanager.secretAccessor
#   members:
#   - serviceAccount:buildtrack-cloudrun@buildtrac-app.iam.gserviceaccount.com
```

## Security Notes

✅ Credentials stored in Secret Manager (encrypted at rest)
✅ Using existing buildtrack-cloudrun service account
✅ Service account has limited permissions (Drive API only)
✅ Secrets rotated via versions (old versions kept for rollback)
✅ Files stored in isolated "uploads" folder
✅ RBAC enforced at application level
✅ No additional service accounts created

## Useful Commands

```bash
# Set project
gcloud config set project buildtrac-app

# List all secrets
gcloud secrets list | grep buildtrack-google-drive

# View secret value (be careful!)
gcloud secrets versions access latest --secret="buildtrack-google-drive-email"

# Update secret (if credentials change)
echo "NEW_VALUE" | gcloud secrets versions add buildtrack-google-drive-email --data-file=-

# Check build status
gcloud builds list --limit=10

# Stream latest build logs
LATEST=$(gcloud builds list --limit=1 --format='value(id)')
gcloud builds log $LATEST --stream

# Check Cloud Run backend environment
gcloud run services describe buildtrack-backend --region us-central1

# View backend logs
gcloud run logs read buildtrack-backend --region us-central1 --limit 50

# Check secret access for a service account
gcloud secrets get-iam-policy buildtrack-google-drive-email
```

## Quick Deployment Command

Once secrets are created:

```bash
# Navigate to repo and trigger build
cd /path/to/buildtrack
gcloud builds submit --config=cloudbuild.yaml

# Monitor build
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)') --stream
```

## Next Steps

1. ✅ Create 5 secrets in Secret Manager (Step 1)
2. ✅ Grant buildtrack-cloudrun service account access (Step 2)
3. ✅ Verify Google Drive folder sharing (Step 3)
4. ✅ Deploy with Cloud Build (Step 6)
5. ✅ Verify uploads work (Step 7)

**Estimated Time:** 15-20 minutes

All done! Files will now automatically upload to Google Drive during deployment. 🚀
