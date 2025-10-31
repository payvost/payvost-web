#!/bin/bash
# Deploy PDF Generator to Cloud Run

# Configuration
PROJECT_ID="payvost"
REGION="us-central1"
SERVICE_NAME="pdf-generator"
IMAGE_NAME="pdf-generator"

echo "Building Docker image..."
docker build -t ${IMAGE_NAME}:latest .

echo "Tagging image for Artifact Registry..."
docker tag ${IMAGE_NAME}:latest ${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${IMAGE_NAME}:latest

echo ""
echo "========================================="
echo "Next steps to deploy to Cloud Run:"
echo "========================================="
echo ""
echo "1. Configure Docker to authenticate with Google Cloud:"
echo "   gcloud auth configure-docker ${REGION}-docker.pkg.dev"
echo ""
echo "2. Push the image to Artifact Registry:"
echo "   docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${IMAGE_NAME}:latest"
echo ""
echo "3. Deploy to Cloud Run:"
echo "   gcloud run deploy ${SERVICE_NAME} \\"
echo "     --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/cloud-run-source-deploy/${IMAGE_NAME}:latest \\"
echo "     --region ${REGION} \\"
echo "     --memory 1Gi \\"
echo "     --cpu 1 \\"
echo "     --min-instances 0 \\"
echo "     --max-instances 10 \\"
echo "     --allow-unauthenticated \\"
echo "     --platform managed \\"
echo "     --project ${PROJECT_ID}"
echo ""
echo "Or use the Firebase CLI (from project root):"
echo "   firebase deploy --only hosting"
echo ""
echo "========================================="
echo "Image is ready and tagged!"
echo "========================================="
