#!/bin/bash
set -e  # Exit strictly on any error

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
# Auto-detect project ID from the active gcloud session
PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
DB_INSTANCE_NAME="buildtrack-db-${PROJECT_ID}" # Make unique per project
DB_NAME="buildtrack"
DB_USER="buildtrack"

echo "🚀 Starting deployment for Project: $PROJECT_ID in Region: $REGION"

# Prompt for DB Password if not set
if [ -z "$DB_PASSWORD" ]; then
    read -s -p "Enter a secure DB Password: " DB_PASSWORD
    echo ""
fi

# -----------------------------------------------------------------------------
# 1. Enable APIs
# -----------------------------------------------------------------------------
echo "🔌 Enabling required APIs..."
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com

# -----------------------------------------------------------------------------
# 2. Setup Cloud SQL (PostgreSQL)
# -----------------------------------------------------------------------------
echo "💾 Checking Cloud SQL instance..."

if gcloud sql instances describe $DB_INSTANCE_NAME --project=$PROJECT_ID > /dev/null 2>&1; then
    echo "✅ Instance '$DB_INSTANCE_NAME' already exists. Skipping creation."
else
    echo "creating Cloud SQL instance '$DB_INSTANCE_NAME'..."
    gcloud sql instances create $DB_INSTANCE_NAME \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password=$DB_PASSWORD \
        --project=$PROJECT_ID
fi

echo "🗄️  Checking Database..."
if gcloud sql databases describe $DB_NAME --instance=$DB_INSTANCE_NAME --project=$PROJECT_ID > /dev/null 2>&1; then
    echo "✅ Database '$DB_NAME' already exists."
else
    echo "Creating database '$DB_NAME'..."
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME --project=$PROJECT_ID
fi

echo "👤 Checking Database User..."
if gcloud sql users list --instance=$DB_INSTANCE_NAME --project=$PROJECT_ID | grep -q $DB_USER; then
    echo "✅ User '$DB_USER' already exists. Updating password..."
    gcloud sql users set-password $DB_USER --instance=$DB_INSTANCE_NAME --password=$DB_PASSWORD --project=$PROJECT_ID
else
    echo "Creating user '$DB_USER'..."
    gcloud sql users create $DB_USER --instance=$DB_INSTANCE_NAME --password=$DB_PASSWORD --project=$PROJECT_ID
fi

# -----------------------------------------------------------------------------
# 3. Build & Deploy Backend
# -----------------------------------------------------------------------------
echo "🔨 Building Backend..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/buildtrack-backend ./backend --project=$PROJECT_ID

echo "🚀 Deploying Backend to Cloud Run..."
gcloud run deploy buildtrack-backend \
    --image gcr.io/$PROJECT_ID/buildtrack-backend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --add-cloudsql-instances $PROJECT_ID:$REGION:$DB_INSTANCE_NAME \
    --set-env-vars "DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE_NAME}" \
    --project=$PROJECT_ID

# -----------------------------------------------------------------------------
# 4. Build & Deploy Frontend
# -----------------------------------------------------------------------------
echo "🔨 Building Frontend..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/buildtrack-frontend ./frontend --project=$PROJECT_ID

# Get Backend URL
BACKEND_URL=$(gcloud run services describe buildtrack-backend --platform managed --region $REGION --format 'value(status.url)' --project=$PROJECT_ID)
echo "🔗 Backend URL detected: $BACKEND_URL"

echo "🚀 Deploying Frontend to Cloud Run..."
gcloud run deploy buildtrack-frontend \
    --image gcr.io/$PROJECT_ID/buildtrack-frontend \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
    --project=$PROJECT_ID

echo "✅ Deployment complete!"
echo "➡️  Frontend URL: $(gcloud run services describe buildtrack-frontend --platform managed --region $REGION --format 'value(status.url)' --project=$PROJECT_ID)"
