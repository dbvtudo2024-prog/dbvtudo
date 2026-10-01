import type { IncomingMessage, ServerResponse } from 'http';

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
    } else {
      for await (const chunk of req) {
        body += chunk;
      }
    }

    const parsedBody = body ? JSON.parse(body) : {};
    const prompt = parsedBody.prompt;

    if (!prompt) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Prompt obrigatório ausente' }));
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: 'GEMINI_API_KEY não configurada no servidor Vercel. Adicione GEMINI_API_KEY nas variáveis de ambiente da Vercel.',
        code: 'MISSING_API_KEY'
      }));
      return;
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const models = ['gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

    let resultText = '';
    let lastError: any = null;

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
