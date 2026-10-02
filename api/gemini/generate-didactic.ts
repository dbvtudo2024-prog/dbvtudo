import type { IncomingMessage, ServerResponse } from 'http';

const SUPABASE_FALLBACK_URL = 'https://dembhtmryutggifbpuka.supabase.co';
const SUPABASE_FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWJodG1yeXV0Z2dpZmJwdWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDQ0NjUsImV4cCI6MjA5NTM4MDQ2NX0.PVAqzmvqo4wDO2_i_MCF1lw8yxXzLxJj1Uj_gcyKTRI';

let cachedServerAiKey = '';

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

  return '';
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

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

    let resultText = '';
    let lastError: any = null;

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
