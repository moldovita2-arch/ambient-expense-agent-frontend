# Ambient Expense Agent - Frontend

This is the React frontend for the **Ambient Expense Agent**. It provides a sleek, modern, glassmorphic UI to interact with the backend AI agent for expense submissions and risk reviews.

## 🔗 Backend Repository

This frontend is designed to work in tandem with the ADK (Agent Development Kit) backend repository:
**[ambient-expense-agent Backend Repository](https://github.com/moldovita2-arch/ambient-expense-agent)**

Ensure that the backend is deployed to Cloud Run (or running locally) and properly configured before interacting with this frontend.

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

### API Configuration
In development, API requests starting with `/api` are proxied to the deployed Cloud Run instance. This can be configured in `vite.config.js`.

To test locally without modifying IAM policies on Cloud Run, use the **Settings (gear icon)** in the UI to paste your GCP Identity Token.
