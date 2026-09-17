import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const buildTime = Date.now();
const appVersion = '3.0.19';

function versionPlugin(): Plugin {
  return {
    name: 'version-generator-plugin',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({
          version: buildTime,
          versionName: appVersion,
          buildDate: new Date(buildTime).toISOString(),
          timestamp: buildTime,
          highlights: [
            "Correção de posicionamento do modal de PowerPoint em todas as resoluções",
            "Renderização com Portal nativo no document.body para centralização impecável"
          ]
        }, null, 2)
      });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/version.json')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.end(JSON.stringify({
            version: buildTime,
            versionName: appVersion,
            buildDate: new Date(buildTime).toISOString(),
            timestamp: buildTime,
            highlights: [
              "Correção de posicionamento do modal de PowerPoint em todas as resoluções",
              "Renderização com Portal nativo no document.body para centralização impecável"
            ]
          }));
          return;
        }

        // Endpoint de geração de respostas didáticas com IA no servidor
        if (req.url && req.url.startsWith('/api/gemini/generate-didactic') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { prompt } = JSON.parse(body || '{}');
              if (!prompt) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Prompt ausente' }));
                return;
              }

              const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
              if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY não configurada' }));
                return;
              }

              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({ apiKey });
              const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
              
              let resultText = '';
              let lastError = null;

              for (const modelName of models) {
                try {
                  const response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt,
                    config: {
                      responseMimeType: 'application/json',
                      temperature: 0.3
                    }
                  });
                  if (response && response.text) {
                    resultText = response.text;
                    break;
                  }
                } catch (err) {
                  lastError = err;
                  console.warn(`Tentativa com ${modelName} falhou no servidor:`, err);
                }
              }

              if (resultText) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text: resultText }));
              } else {
                res.statusCode = 502;
                res.end(JSON.stringify({ error: 'Todos os modelos de IA falharam', details: String(lastError) }));
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Erro interno ao processar requisição', details: err?.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), versionPlugin()],
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'global': 'globalThis',
        '__APP_BUILD_TIME__': JSON.stringify(buildTime),
        '__APP_VERSION__': JSON.stringify(appVersion),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

