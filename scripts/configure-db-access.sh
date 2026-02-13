#!/bin/bash
set -e

# Configuration
PROJECT_ID=$(gcloud config get-value project)
DB_INSTANCE_NAME="buildtrack-db-${PROJECT_ID}"
DB_USER="buildtrack"
DB_NAME="buildtrack"

echo "🚀 Configuring remote access for Project: $PROJECT_ID"
echo "Target Instance: $DB_INSTANCE_NAME"

# Check if instance exists
if ! gcloud sql instances describe $DB_INSTANCE_NAME --project=$PROJECT_ID > /dev/null 2>&1; then
    echo "❌ Error: Instance '$DB_INSTANCE_NAME' not found."
    echo "Please check your project ID or ensure the instance was created."
    exit 1
fi

# Authorize all networks (0.0.0.0/0)
# This allows access from any IP, which is what you requested for your team.
echo "🔓 Authorizing public access (0.0.0.0/0)..."
gcloud sql instances patch $DB_INSTANCE_NAME \
    --project=$PROJECT_ID \
    --authorized-networks=0.0.0.0/0

# Get Public IP of the instance
echo "🔍 Fetching Public IP..."
PUBLIC_IP=$(gcloud sql instances describe $DB_INSTANCE_NAME \
    --project=$PROJECT_ID \
    --format='value(ipAddresses[0].ipAddress)')

echo ""
echo "✅ Configuration Complete!"
echo "================================================================================"
echo "👇 COPY THIS INTO YOUR local backend/.env FILE:"
echo ""
echo "DATABASE_URL=\"postgresql://${DB_USER}:<YOUR_PASSWORD>@${PUBLIC_IP}:5432/${DB_NAME}?schema=public\""
echo ""
echo "⚠️  IMPORTANT: Replace <YOUR_PASSWORD> with the password you set earlier."
echo "================================================================================"
