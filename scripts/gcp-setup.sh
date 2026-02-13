# GCP Setup Script
# Run this script to set up your GCP project and deploy services

# 1. Configuration
PROJECT_ID="202601"
REGION="us-central1"
DB_INSTANCE_NAME="buildtrack-db"
DB_PASSWORD="Adm!n@Build26" # Change this!

# 2. Enable APIs
gcloud services enable run.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com

# 3. Create Cloud SQL Instance (PostgreSQL)
gcloud sql instances create $DB_INSTANCE_NAME \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=$REGION \
    --root-password=$DB_PASSWORD

# Create database and user
gcloud sql databases create buildtrack --instance=$DB_INSTANCE_NAME
gcloud sql users create buildtrack --instance=$DB_INSTANCE_NAME --password=$DB_PASSWORD

# 4. Build and Push Backend Image
gcloud builds submit --tag gcr.io/$PROJECT_ID/buildtrack-backend ./backend

# 5. Deploy Backend to Cloud Run
gcloud run deploy buildtrack-backend \
    --image gcr.io/$PROJECT_ID/buildtrack-backend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances $PROJECT_ID:$REGION:$DB_INSTANCE_NAME \
    --set-env-vars "DATABASE_URL=postgresql://buildtrack:$DB_PASSWORD@localhost:5432/buildtrack?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE_NAME"

# 6. Build and Push Frontend Image
gcloud builds submit --tag gcr.io/$PROJECT_ID/buildtrack-frontend ./frontend

# 7. Deploy Frontend to Cloud Run
# Note: Get the backend URL from step 5 and set it here
BACKEND_URL=$(gcloud run services describe buildtrack-backend --platform managed --region $REGION --format 'value(status.url)')

gcloud run deploy buildtrack-frontend \
    --image gcr.io/$PROJECT_ID/buildtrack-frontend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL"

echo "Deployment complete!"
echo "Frontend URL: $(gcloud run services describe buildtrack-frontend --platform managed --region $REGION --format 'value(status.url)')"
