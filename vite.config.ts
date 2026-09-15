import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const buildTime = Date.now();
const appVersion = '3.0.12';

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
            "Remoção do botão redundante fechar PDF no menu lateral",
            "Substituição do botão voltar por X de fechar no topo durante a leitura de PDFs"
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
              "Remoção do botão redundante fechar PDF no menu lateral",
              "Substituição do botão voltar por X de fechar no topo durante a leitura de PDFs"
            ]
          }));
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), versionPlugin()],
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
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

