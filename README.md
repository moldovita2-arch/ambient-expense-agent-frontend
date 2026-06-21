# Ambient Expense Agent - Frontend

This is the React frontend for the **Ambient Expense Agent**. It provides a sleek, modern, glassmorphic UI to interact with a backend AI agent for expense submissions, automated risk reviews, and complex Human-in-the-Loop (HITL) workflows.

## 🔗 Backend Repository

This frontend is designed to work in tandem with the ADK (Agent Development Kit) backend repository:
**[ambient-expense-agent Backend Repository](https://github.com/moldovita2-arch/ambient-expense-agent)**

## 🏗️ Architecture & How It Works

The frontend architecture consists of two primary layers designed to securely bridge a public-facing React application with a private, IAM-secured Google Cloud Run backend.

### 1. The Express.js Proxy Server (`server.js`)
Since the ADK backend is deployed securely behind Google Cloud IAM (meaning it requires a valid Google Identity token to accept requests), we cannot expose this token generation to the browser. 

To solve this, the frontend is served by a custom Node.js/Express server that acts as a secure reverse proxy:
- **Automatic IAM Authentication**: Before any API request is proxied to the backend, an asynchronous middleware uses the `google-auth-library` to fetch a valid Google Cloud Identity Token for the active service account.
- **Proxy Injection**: The fetched token is dynamically injected into the `Authorization` header (`Bearer <token>`).
- **Seamless Routing**: The `http-proxy-middleware` seamlessly forwards the authenticated request to the secure backend (`BACKEND_URL`). This hides all authentication complexity from the React app.

### 2. The React Frontend (`src/`)
Built with Vite, React, and Vanilla CSS, the UI handles user interaction and agent communication.
- **Agent API (`agentApi.js`)**: Communicates with the proxy server using the ADK standard endpoints (`/sessions` and `/run`). It parses the streaming or structured JSON events returned by the agent.
- **Human-in-the-Loop (HITL)**: If the backend agent determines that an expense is too risky or violates policy, it can pause execution and issue an `adk_request_input` function call. The frontend intercepts this, stores the `sessionId`, and renders an **Approve/Reject** interface. The user's decision is then sent back to the exact same session to resume the agent's workflow.

## 🚀 Getting Started Locally

### Prerequisites
1. Ensure the [backend repository](https://github.com/moldovita2-arch/ambient-expense-agent) is deployed or running locally.
2. Have Node.js installed.

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

*Note: In local development, Vite proxies `/api` requests directly. If your backend requires IAM authentication locally, you will need to start the backend with `--allow-unauthenticated` or run `node server.js` locally with valid Application Default Credentials.*

## ☁️ Deployment

This frontend is fully containerized and deployed to **Google Cloud Run**.

The deployment process is managed automatically via Google Cloud Build. Pushing to the `master` branch triggers the CI/CD pipeline which:
1. Builds a production optimized Vite bundle (`npm run build`).
2. Packages the static assets alongside the Express.js proxy server into a Docker image.
3. Deploys the image to Cloud Run as a publicly accessible service (`ambient-expense-agent-frontend`).
4. Automatically wires up the proxy to securely communicate with the private backend.
