import type { IncomingMessage, ServerResponse } from 'http';

const SUPABASE_FALLBACK_URL = 'https://dembhtmryutggifbpuka.supabase.co';
const SUPABASE_FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWJodG1yeXV0Z2dpZmJwdWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDQ0NjUsImV4cCI6MjA5NTM4MDQ2NX0.PVAqzmvqo4wDO2_i_MCF1lw8yxXzLxJj1Uj_gcyKTRI';
const DEFAULT_ENCODED_AI_CFG = 'JSsMPicMJVoPdWZAWRILRFgQNCAlAgNQJzFdWXByDQEBKxwhKSYf';

function decodeAiCfg(encoded: string): string {
  try {
    const mask = 'dbv_tudo_2026_dsa';
    const binary = Buffer.from(encoded, 'base64').toString('binary');
    let out = '';
    for (let i = 0; i < binary.length; i++) {
      out += String.fromCharCode(binary.charCodeAt(i) ^ mask.charCodeAt(i % mask.length));
    }
    return out;
  } catch {
    return '';
  }
}

let cachedServerAiKey = decodeAiCfg(DEFAULT_ENCODED_AI_CFG);

async function resolveServerApiKey(): Promise<string> {
  const envKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  if (envKey && envKey.length > 10) return envKey;
  if (cachedServerAiKey && cachedServerAiKey.length > 10) return cachedServerAiKey;

  try {
    const res = await fetch(`${SUPABASE_FALLBACK_URL}/rest/v1/Cultura?club_type=eq.PATHFINDER&select=insignias_tiras&limit=1`, {
      headers: {
        apikey: SUPABASE_FALLBACK_KEY,
        Authorization: `Bearer ${SUPABASE_FALLBACK_KEY}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      const raw = rows?.[0]?.insignias_tiras;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && parsed._ai_cfg) {
          const decoded = decodeAiCfg(parsed._ai_cfg);
          if (decoded && decoded.length > 10) {
            cachedServerAiKey = decoded;
            return decoded;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao recuperar configuração remota da IA no serverless:', e);
  }

  return decodeAiCfg(DEFAULT_ENCODED_AI_CFG);
}

export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Método não permitido. Use POST.' }));
    return;
  }

  try {
    let body = '';
    if (typeof req.body === 'object' && req.body !== null) {
      body = JSON.stringify(req.body);
    } else if (typeof req.body === 'string') {
      body = req.body;
    } else {
      for await (const chunk of req) {
        body += chunk;
      }
    }

    const parsedBody = body ? JSON.parse(body) : {};
    const prompt = parsedBody.prompt;
    const systemInstruction = parsedBody.systemInstruction;
    const responseMimeType = parsedBody.responseMimeType ?? 'application/json';
    const temperature = typeof parsedBody.temperature === 'number' ? parsedBody.temperature : 0.3;

    if (!prompt) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Prompt obrigatório ausente' }));
      return;
    }

    const apiKey = await resolveServerApiKey();
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'GEMINI_API_KEY não configurada no servidor Vercel.',
        code: 'MISSING_API_KEY'
      }));
      return;
    }

    const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let resultText = '';
    let lastError: any = null;

    for (const modelName of models) {
      try {
        const generationConfig: any = { temperature };
        if (responseMimeType) {
          generationConfig.responseMimeType = responseMimeType;
        }

        const payload: any = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig
        };

        if (systemInstruction) {
          payload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8500);
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: controller.signal
            }
          );

          if (response.ok) {
            const data = await response.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              resultText = text;
              break;
            }
          } else {
            lastError = new Error(`HTTP ${response.status}`);
          }
        } finally {
          clearTimeout(timer);
        }
      } catch (err) {
        lastError = err;
        console.warn(`Tentativa com ${modelName} falhou no Vercel Serverless:`, err);
      }
    }

    if (resultText) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ text: resultText }));
    } else {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'Falha ao gerar respostas com IA', 
        details: lastError?.message || String(lastError) 
      }));
    }
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      error: 'Erro interno ao processar requisição', 
      details: err?.message || String(err) 
    }));
  }
}
