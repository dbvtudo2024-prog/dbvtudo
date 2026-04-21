
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
  try {
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      return "Olá! O Desbravinho está pronto. Para ativar as respostas com inteligência artificial, configure sua chave de API Gemini.";
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "Desculpe, não consegui processar sua pergunta agora. Tente novamente.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao conectar com o Desbravinho. Verifique sua conexão.";
  }
}

