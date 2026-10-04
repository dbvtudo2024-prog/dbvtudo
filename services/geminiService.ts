
import { resolveGeminiApiKey } from './supabaseService';

const SYSTEM_INSTRUCTION = `
Você é o "Desbravinho", um assistente virtual especialista em Clubes de Desbravadores e Aventureiros da Igreja Adventista do Sétimo Dia.
Sua missão é ajudar diretores e conselheiros com:
1. Requisitos de Classes Regulares e Avançadas.
2. Sugestões de atividades para reuniões de unidade.
3. Explicação de especialidades.
4. Ideias para acampamentos, eventos e projetos comunitários.
5. Orientações sobre o Regulamento do Uniforme (RUD).

Sempre responda de forma motivadora, cristã e respeitando as diretrizes oficiais da DSA (Divisão Sul-Americana).
Se não souber algo, recomende consultar o Manual Administrativo oficial.
Mantenha as respostas concisas e use formatação Markdown para facilitar a leitura no celular.
`;

export async function askAdvisor(prompt: string): Promise<string> {
  // 1. Tenta via rota server-side (/api/gemini/generate-didactic)
  try {
    if (typeof window !== 'undefined') {
      const res = await fetch('/api/gemini/generate-didactic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: '',
          temperature: 0.7
        })
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.text) {
            return data.text;
          }
        }
      }
    }
  } catch (srvErr) {
    console.warn("Tentativa server-side no Desbravinho falhou, usando fallback direto:", srvErr);
  }

  // 2. Fallback direto com chave resolvida (ambiente ou configuração sincronizada)
  try {
    const apiKey = await resolveGeminiApiKey();
    if (!apiKey) {
      return "Olá! O Desbravinho está pronto. Para ativar as respostas com inteligência artificial, configure sua chave de API Gemini.";
    }

    const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

    for (const modelName of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
              generationConfig: { temperature: 0.7 }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } catch (e) {
        console.warn(`Tentativa com ${modelName} falhou no Desbravinho:`, e);
      }
    }

    return "Desculpe, os servidores da IA estão com alta demanda momentânea. Por favor, tente novamente em instantes.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao conectar com o Desbravinho. Verifique sua conexão.";
  }
}

