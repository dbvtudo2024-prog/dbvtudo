
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Sparkles, ChevronLeft, Zap } from 'lucide-react';
import { askAdvisor } from '../services/geminiService';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface AiAssistantProps {
  onBack: () => void;
  initialPrompt?: string;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ onBack, initialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Olá, Líder! Eu sou o Desbravinho. Como posso potencializar o seu clube hoje? Estou pronto para planejar reuniões, explicar requisitos ou sugerir projetos.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialPromptSent = useRef(false);

  useEffect(() => {
    if (initialPrompt && !initialPromptSent.current) {
      handleSend(initialPrompt);
      initialPromptSent.current = true;
    }
  }, [initialPrompt]);

  const suggestions = [
    'Ideia para reunião de unidade',
    'Explique Especialidade de Astronomia',
    'Atividade de lazer ao ar livre',
    'Requisitos Classe de Amigo'
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageToSend = text || input;
    if (!messageToSend.trim() || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: messageToSend.trim() }]);
    setIsLoading(true);

    const response = await askAdvisor(messageToSend.trim());
    
    setMessages(prev => [...prev, { role: 'bot', text: response }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full animate-slide-in bg-slate-50 relative">
      {/* Dynamic Header */}
      <div className="glass sticky top-0 z-20 px-6 py-8 flex items-center border-b border-white/50">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 mr-4">
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight">Desbravinho</h1>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Online Agora</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-hide pb-32"
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            <div className={`flex max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1 ${
                msg.role === 'user' ? 'bg-slate-900 ml-3' : 'bg-white shadow-sm border border-slate-100 mr-3'
              }`}>
                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-indigo-500" />}
              </div>
              <div className={`p-4 rounded-[24px] text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white border border-slate-100 p-4 rounded-[24px] rounded-tl-none shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
      </div>

      {/* Bottom Interface */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="p-4 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent">
          {/* Quick Suggestions */}
          {!isLoading && messages.length < 3 && (
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide mb-4 px-2">
              {suggestions.map((s, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleSend(s)}
                  className="flex-shrink-0 bg-white/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-white text-[10px] font-bold text-indigo-600 shadow-sm active:scale-95 transition-all flex items-center"
                >
                  <Zap size={10} className="mr-1.5" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Glass Card */}
          <div className="glass p-2 rounded-[32px] shadow-2xl border-white/50 flex items-center space-x-2">
            <input 
              type="text" 
              placeholder="Digite sua dúvida liderança..."
              className="flex-grow px-6 py-4 bg-transparent border-none focus:ring-0 text-slate-700 text-sm placeholder:text-slate-400 font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="w-14 h-14 bg-indigo-600 text-white rounded-[24px] shadow-lg shadow-indigo-100 flex items-center justify-center disabled:opacity-50 transition-all active:scale-90"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
