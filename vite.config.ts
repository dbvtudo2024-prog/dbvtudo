import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const buildTime = Date.now();
const appVersion = '3.0.83';

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
            "Novos vídeos adicionados para Desbravadores e manutenção da página atual ao alternar entre Desbravadores e Aventureiros no PC"
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
              "Novos vídeos adicionados para Desbravadores e manutenção da página atual ao alternar entre Desbravadores e Aventureiros no PC"
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
              const parsedBody = JSON.parse(body || '{}');
              const { prompt, systemInstruction } = parsedBody;
              const responseMimeType = parsedBody.responseMimeType ?? 'application/json';
              const temperature = typeof parsedBody.temperature === 'number' ? parsedBody.temperature : 0.3;

              if (!prompt) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Prompt ausente' }));
                return;
              }

              const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
              if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY não configurada' }));
                return;
              }

              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  }
                }
              });
              const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
              
              let resultText = '';
              let lastError = null;

              for (const modelName of models) {
                try {
                  const configObj: any = { temperature };
                  if (responseMimeType) {
                    configObj.responseMimeType = responseMimeType;
                  }
                  if (systemInstruction) {
                    configObj.systemInstruction = systemInstruction;
                  }

                  const response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt,
                    config: configObj
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
    const geminiApiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/supabase-proxy': {
            target: 'https://dembhtmryutggifbpuka.supabase.co',
            changeOrigin: true,
            secure: false,
            rewrite: (p) => p.replace(/^\/supabase-proxy/, '')
          }
        }
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

