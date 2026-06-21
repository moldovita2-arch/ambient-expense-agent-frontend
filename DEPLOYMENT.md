# Google Cloud Deployment Guide

This guide details exactly how this frontend repository is deployed to Google Cloud Run and securely connected to the private ADK backend.

## 🏗 Architecture Overview
The deployment consists of two Cloud Run services:
1. **Backend (`ambient-expense-agent`)**: A private, highly-secure ADK agent that does not allow unauthenticated access.
2. **Frontend (`ambient-expense-agent-frontend`)**: A public-facing proxy server and React app. The Express.js server uses the Cloud Run metadata server to securely fetch IAM Identity tokens and proxy requests to the private backend.

## 📦 Containerization (`Dockerfile`)
The frontend is deployed using a multi-stage `Dockerfile`:
1. **Build Stage**: Uses Node.js to install dependencies and run `npm run build`, generating the static Vite assets into the `dist/` directory.
2. **Production Stage**: Copies the built `dist/` folder and the Express proxy server (`server.js`) into a lightweight Node.js Alpine image. It only installs production dependencies to keep the image small.

## 🚀 CI/CD Pipeline (Cloud Build)
We use Google Cloud Build to automate the deployment process. When a push is made to the `master` branch, the `.cloudbuild/deploy-to-prod.yaml` pipeline triggers:

1. **Docker Build**: Builds the container image.
2. **Docker Push**: Pushes the image to Google Container Registry (GCR) or Artifact Registry.
3. **Cloud Run Deploy**: Deploys the image to Cloud Run using the `gcloud run deploy` command.

## 🔐 IAM and Security Configuration

This is the most critical part of the deployment. For the public frontend to securely talk to the private backend, specific IAM rules must be enforced:

### 1. Frontend Ingress Configuration
The frontend Cloud Run service must be accessible to the public. During deployment, we ensure it has the following IAM policy binding:
```bash
gcloud run services add-iam-policy-binding ambient-expense-agent-frontend \
  --region=europe-west2 \
  --member="allUsers" \
  --role="roles/run.invoker"
```
*(This sets the service to "Allow unauthenticated" in the Google Cloud Console).*

### 2. Backend Ingress Configuration
The backend Cloud Run service must **NOT** be accessible to the public. It relies on Google Cloud IAM to verify requests.
- The frontend Cloud Run instance runs under a specific Google Cloud Service Account (e.g., `ambient-expense-agent-app@<project-id>.iam.gserviceaccount.com` or the Compute Engine default service account).
- This exact service account is granted the `roles/run.invoker` permission on the **backend** Cloud Run service.

### 3. Service-to-Service Authentication
Because of the IAM rules above, the frontend's Express server (`server.js`) must authenticate its proxy requests.
- It uses `google-auth-library` to call the Cloud Run Metadata Server.
- It fetches a secure Google ID Token explicitly for the backend's audience URL using `client.idTokenProvider.fetchIdToken(BACKEND_URL)`.
- The proxy attaches this token as a `Bearer` token in the `Authorization` header of every outgoing `/api` request.

## ⚙️ Environment Variables
The deployment requires specific environment variables to function correctly. These are set on the Cloud Run service:

- `NODE_ENV=production`: Tells Express to serve the static Vite files.
- `BACKEND_URL`: The exact deterministic or hash-based URL of the private backend Cloud Run service. The proxy server uses this to determine where to route requests *and* as the exact "Audience" required to fetch the IAM Identity Token.

## 🛠 Manual Deployment
If you ever need to manually deploy without Cloud Build, you can use the gcloud CLI:

```bash
gcloud run deploy ambient-expense-agent-frontend \
  --source . \
  --region europe-west2 \
  --allow-unauthenticated \
  --set-env-vars="BACKEND_URL=https://<your-backend-url>.run.app"
```
