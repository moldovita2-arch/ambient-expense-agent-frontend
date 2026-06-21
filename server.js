import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;
const BACKEND_URL = process.env.BACKEND_URL || 'https://ambient-expense-agent-917737942418.europe-west2.run.app';

const auth = new GoogleAuth();

// Proxy middleware configuration
const apiProxy = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove /api from the URL before proxying
  },
  on: {
    error: (err, req, res) => {
      console.error('Proxy Error:', err);
      res.status(500).send('Proxy Error');
    }
  }
});

// Middleware to inject IAM identity token
const injectIdentityToken = async (req, res, next) => {
  try {
    const client = await auth.getIdTokenClient(BACKEND_URL);
    const headers = await client.getRequestHeaders();
    if (headers.Authorization) {
      req.headers['authorization'] = headers.Authorization;
    }
  } catch (error) {
    console.error('Error fetching identity token:', error);
  }
  next();
};

// Use the token middleware then the proxy for all /api requests
app.use('/api', injectIdentityToken, apiProxy);

// Serve static files from the Vite build output directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for React Router (if used)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Proxying /api requests to ${BACKEND_URL}`);
});
