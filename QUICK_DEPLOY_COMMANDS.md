# Quick Deploy Commands - Google Drive Integration

**Copy & paste these commands in Cloud Shell or your terminal**

## Prerequisites

✅ Project: buildtrac-app
✅ Service Account: buildtrack-cloudrun@buildtrac-app.iam.gserviceaccount.com
✅ Drive Folder: 1OluJ1omjd7Hj6fePbb9hf1ioGYFVEs_z
✅ Credentials: buildtrac-app-718b0caebb02.json

---

## Command 1: Set Project

```bash
gcloud config set project buildtrac-app
```

## Command 2: Create 4 Secrets (Copy & Paste Each)

```bash
echo "buildtrack-file-service@buildtrac-app.iam.gserviceaccount.com" | \
  gcloud secrets create buildtrack-google-drive-email --data-file=-
```

```bash
echo "718b0caebb028bf2cda4109d7a5069b4a08350a6" | \
  gcloud secrets create buildtrack-google-drive-key-id --data-file=-
```

```bash
echo "buildtrac-app" | \
  gcloud secrets create buildtrack-google-drive-project-id --data-file=-
```

```bash
echo "1OluJ1omjd7Hj6fePbb9hf1ioGYFVEs_z" | \
  gcloud secrets create buildtrack-google-drive-folder-id --data-file=-
```

## Command 3: Create Private Key Secret (Via Console)

⚠️ **This secret is too long for command line. Use GCP Console:**

1. Go to https://console.cloud.google.com/security/secret-manager
2. Click "Create Secret"
3. Name: `buildtrack-google-drive-private-key`
4. Value: Copy entire private key from buildtrac-app-718b0caebb02.json
   (Include `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
5. Click "Create Secret"

---

## Command 4: Grant buildtrack-cloudrun Access

```bash
for SECRET in buildtrack-google-drive-email buildtrack-google-drive-key-id \
              buildtrack-google-drive-private-key buildtrack-google-drive-project-id \
              buildtrack-google-drive-folder-id; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member=serviceAccount:buildtrack-cloudrun@buildtrac-app.iam.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
done
```

## Command 5: Grant Cloud Build Access

```bash
PROJECT_NUMBER=$(gcloud projects describe buildtrac-app --format='value(projectNumber)')

for SECRET in buildtrack-google-drive-email buildtrack-google-drive-key-id \
              buildtrack-google-drive-private-key buildtrack-google-drive-project-id \
              buildtrack-google-drive-folder-id; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member=serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor
done
```

## Command 6: Verify Secrets Created

```bash
gcloud secrets list | grep buildtrack-google-drive
```

Should output:
```
buildtrack-google-drive-email
buildtrack-google-drive-folder-id
buildtrack-google-drive-key-id
buildtrack-google-drive-private-key
buildtrack-google-drive-project-id
```

## Command 7: Deploy with Cloud Build

Navigate to your repo and run:

```bash
cd /path/to/buildtrack
gcloud builds submit --config=cloudbuild.yaml
```

## Command 8: Monitor Build

```bash
# View builds
gcloud builds list --limit=5

# Watch latest build
LATEST=$(gcloud builds list --limit=1 --format='value(id)')
gcloud builds log $LATEST --stream
```

## Command 9: Verify Deployment

```bash
# Check backend environment
gcloud run services describe buildtrack-backend --region us-central1

# View logs
gcloud run logs read buildtrack-backend --region us-central1 --limit 20
```

---

## All Done! ✅

Files will now automatically upload to Google Drive when users use the app.

**Test it:**
1. Go to the deployed app
2. Go to any module page
3. Click "Create New" and create a record
4. Upload a file
5. Check Google Drive folder: https://drive.google.com/drive/u/5/folders/1OluJ1omjd7Hj6fePbb9hf1ioGYFVEs_z

---

## Troubleshooting

### Secret already exists error?
Delete and recreate:
```bash
gcloud secrets delete buildtrack-google-drive-email
echo "buildtrack-file-service@buildtrac-app.iam.gserviceaccount.com" | \
  gcloud secrets create buildtrack-google-drive-email --data-file=-
```

### Build fails?
Check logs:
```bash
gcloud builds log <BUILD_ID> --stream
```

### Files not uploading?
Check backend:
```bash
gcloud run logs read buildtrack-backend --region us-central1 --limit 50
```

