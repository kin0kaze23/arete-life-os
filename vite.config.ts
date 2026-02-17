import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAIAction } from './api/ai';
import { sanitizePayload, validatePayloadSize } from './api/_sanitize';

const devAIProxy = () => ({
  name: 'dev-ai-proxy',
  configureServer(server: any) {
    server.middlewares.use('/api/ai', (req: any, res: any) => {
      const origin = req.headers?.origin;
      const allowedOrigins = new Set([
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ]);
      if (origin && !allowedOrigins.has(origin)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Origin not allowed' }));
        return;
      }

      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
        if (body.length > 2 * 1024 * 1024) {
          res.statusCode = 413;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Payload too large' }));
          req.destroy();
        }
      });
      req.on('end', async () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (!validatePayloadSize(parsed, 2 * 1024 * 1024)) {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Payload too large' }));
            return;
          }
          console.log('[DEV PROXY] Action:', parsed.action);
          const sanitized = sanitizePayload(parsed.payload);
          const result = await handleAIAction(parsed.action, sanitized);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err: any) {
          console.error('[DEV PROXY ERROR]', err?.message || err);
          console.error('[DEV PROXY STACK]', err?.stack);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'AI request failed', details: err?.message }));
        }
      });
    });
  },
});

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '');
  const isDev = command === 'serve';
  return {
    server: {
      port: 3000,
      strictPort: true,
      host: true,
    },
    plugins: [react(), ...(isDev ? [devAIProxy()] : [])],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
