import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const devGeminiProxy = () => ({
  name: 'dev-gemini-proxy',
  configureServer(server: any) {
    server.middlewares.use('/api/gemini', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
      }

      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          console.log('[DEV PROXY] Action:', parsed.action);
          res.statusCode = 410;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: 'Deprecated endpoint',
              details: 'Use /api/ai for AI requests in local development.',
            })
          );
        } catch (err: any) {
          console.error('[DEV PROXY ERROR]', err?.message || err);
          console.error('[DEV PROXY STACK]', err?.stack);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Gemini request failed', details: err?.message }));
        }
      });
    });
  },
});

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '');
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  const isDev = command === 'serve';
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), ...(isDev ? [devGeminiProxy()] : [])],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
