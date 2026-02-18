#!/bin/bash

# ============================================
# BuildTrack - GCP Quick Setup Script
# ============================================
# This script automates the initial GCP setup
# Usage: bash GCP-QUICK-SETUP.sh

set -e

echo "🚀 BuildTrack - GCP Quick Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI not found. Please install Google Cloud SDK first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# ============================================
# Step 1: Set up GCP Project
# ============================================
echo -e "${YELLOW}Step 1: Setting up GCP Project${NC}"
read -p "Enter your GCP Project ID [buildtrack-app]: " PROJECT_ID
PROJECT_ID=${PROJECT_ID:-buildtrack-app}

gcloud config set project $PROJECT_ID
echo -e "${GREEN}✅ Project set to: $PROJECT_ID${NC}"

# ============================================
# Step 2: Enable Required APIs
# ============================================
echo ""
echo -e "${YELLOW}Step 2: Enabling Required Google Cloud APIs${NC}"
echo "This may take a few minutes..."

gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  secretmanager.googleapis.com

echo -e "${GREEN}✅ APIs enabled${NC}"

# ============================================
# Step 3: Create Cloud SQL Instance
# ============================================
echo ""
echo -e "${YELLOW}Step 3: Creating Cloud SQL PostgreSQL Instance${NC}"
read -p "Enter database password: " DB_PASSWORD

gcloud sql instances create buildtrack-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --storage-type=PD_SSD \
  --storage-size=10GB \
  --enable-bin-log \
  --quiet

# Create database
gcloud sql databases create buildtrack_db \
  --instance=buildtrack-postgres

# Create user
gcloud sql users create buildtrack_user \
  --instance=buildtrack-postgres \
  --password=$DB_PASSWORD

echo -e "${GREEN}✅ Cloud SQL instance created${NC}"

# ============================================
# Step 4: Create Secrets
# ============================================
echo ""
echo -e "${YELLOW}Step 4: Creating GCP Secrets${NC}"

# Database URL
INSTANCE_CONNECTION=$(gcloud sql instances describe buildtrack-postgres \
  --format="value(connectionName)")
DATABASE_URL="postgresql://buildtrack_user:${DB_PASSWORD}@${INSTANCE_CONNECTION}/buildtrack_db"

echo -n "$DATABASE_URL" | gcloud secrets create buildtrack-db-url --data-file=- 2>/dev/null || \
  echo -n "$DATABASE_URL" | gcloud secrets versions add buildtrack-db-url --data-file=-

# JWT Secrets
echo -n "$(openssl rand -base64 32)" | gcloud secrets create buildtrack-jwt-secret --data-file=- 2>/dev/null || \
  echo -n "$(openssl rand -base64 32)" | gcloud secrets versions add buildtrack-jwt-secret --data-file=-

echo -n "$(openssl rand -base64 32)" | gcloud secrets create buildtrack-jwt-refresh-secret --data-file=- 2>/dev/null || \
  echo -n "$(openssl rand -base64 32)" | gcloud secrets versions add buildtrack-jwt-refresh-secret --data-file=-

# OAuth Secrets (you'll update these later)
echo -n "placeholder" | gcloud secrets create buildtrack-google-client-id --data-file=- 2>/dev/null || true
echo -n "placeholder" | gcloud secrets create buildtrack-google-client-secret --data-file=- 2>/dev/null || true
echo -n "placeholder" | gcloud secrets create buildtrack-microsoft-client-id --data-file=- 2>/dev/null || true
echo -n "placeholder" | gcloud secrets create buildtrack-microsoft-client-secret --data-file=- 2>/dev/null || true

# SMTP Secrets
echo -n "placeholder" | gcloud secrets create buildtrack-smtp-host --data-file=- 2>/dev/null || true
echo -n "placeholder" | gcloud secrets create buildtrack-smtp-port --data-file=- 2>/dev/null || true
echo -n "placeholder" | gcloud secrets create buildtrack-smtp-user --data-file=- 2>/dev/null || true
echo -n "placeholder" | gcloud secrets create buildtrack-smtp-password --data-file=- 2>/dev/null || true
echo -n "placeholder" | gcloud secrets create buildtrack-smtp-from --data-file=- 2>/dev/null || true

echo -e "${GREEN}✅ Secrets created${NC}"

# ============================================
# Step 5: Create Artifact Registry
# ============================================
echo ""
echo -e "${YELLOW}Step 5: Creating Artifact Registry${NC}"

gcloud artifacts repositories create buildtrack-registry \
  --repository-format=docker \
  --location=us-central1 \
  --quiet 2>/dev/null || true

echo -e "${GREEN}✅ Artifact Registry created${NC}"

# ============================================
# Step 6: Create Service Accounts
# ============================================
echo ""
echo -e "${YELLOW}Step 6: Creating Service Accounts${NC}"

# Cloud Run Service Account
gcloud iam service-accounts create buildtrack-cloudrun \
  --display-name="BuildTrack Cloud Run Service Account" \
  --quiet 2>/dev/null || true

# Cloud Build Service Account
gcloud iam service-accounts create buildtrack-cloudbuild \
  --display-name="BuildTrack Cloud Build Service Account" \
  --quiet 2>/dev/null || true

# Grant permissions to Cloud Run account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:buildtrack-cloudrun@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/cloudsql.client \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:buildtrack-cloudrun@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor \
  --quiet

# Grant permissions to Cloud Build account
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:buildtrack-cloudbuild@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/run.admin \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:buildtrack-cloudbuild@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:buildtrack-cloudbuild@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/artifactregistry.writer \
  --quiet

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member=serviceAccount:buildtrack-cloudbuild@${PROJECT_ID}.iam.gserviceaccount.com \
  --role=roles/cloudsql.client \
  --quiet

echo -e "${GREEN}✅ Service accounts created and configured${NC}"

# ============================================
# Summary
# ============================================
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Summary:"
echo "--------"
echo "Project ID: $PROJECT_ID"
echo "Database Instance: buildtrack-postgres"
echo "Database: buildtrack_db"
echo "Database User: buildtrack_user"
echo "Database Password: [saved to Secret Manager]"
echo ""
echo "Next Steps:"
echo "1. Update OAuth secrets with your Google/Microsoft credentials"
echo "2. Update SMTP secrets with your email configuration"
echo "3. Connect GitHub repository to Cloud Build"
echo "4. Push to master branch to trigger first deployment"
echo ""
echo "To update a secret:"
echo "  echo -n 'new-value' | gcloud secrets versions add SECRET_NAME --data-file=-"
echo ""
echo "Full setup guide: See GCP-DEPLOYMENT-GUIDE.md"
