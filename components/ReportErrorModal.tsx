import React, { useState, useEffect } from 'react';
import { X, Send, AlertTriangle, CheckCircle2, Shield, Info, Laptop, Sparkles, MessageSquare, Tag, MapPin, User, Mail } from 'lucide-react';
import { submitErrorReport, getSystemDeviceInfo, NewErrorReport } from '../services/errorReportService';
import { APP_VERSION } from '../versionConfig';

interface ReportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScreenName?: string;
}

const CATEGORIES = [
  { id: 'CONTEUDO', label: 'Erro de Texto / Digitação / Requisito', icon: '📝' },
  { id: 'LAYOUT', label: 'Problema Visual ou Layout Quebrado', icon: '🎨' },
  { id: 'FALHA', label: 'Recurso com Falha / Botão que não responde', icon: '⚙️' },
  { id: 'TRAVAMENTO', label: 'Lentidão ou Travamento', icon: '🐌' },
  { id: 'SUGESTAO', label: 'Sugestão de Melhoria / Nova Ideia', icon: '💡' },
  { id: 'OUTRO', label: 'Outro Problema', icon: '❓' }
];

const LOCATIONS = [
  'Especialidades',
  'Classes',
  'Bíblia Sagrada',
  'Cantinho da Unidade & Acampamento',
  'Minha Faixa & Perfil',
  'Prova Ao Vivo',
  'Quiz & Simulado',
  'Biblioteca & Formulários',
  'Ordem Unida & Guia de Campo',
  'Ajustes & Sistema',
  'Geral / Outro'
];

export const ReportErrorModal: React.FC<ReportErrorModalProps> = ({ isOpen, onClose, currentScreenName }) => {
  const [category, setCategory] = useState<string>('CONTEUDO');
  const [location, setLocation] = useState<string>(() => currentScreenName || 'Especialidades');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [deviceInfo, setDeviceInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDeviceInfo(getSystemDeviceInfo());
      setIsSuccess(false);
      setErrorMessage(null);
      try {
        const profileRaw = localStorage.getItem('dbv_tudo_global_user_profile');
        if (profileRaw) {
          const parsed = JSON.parse(profileRaw);
          if (parsed.name && parsed.name !== 'Seu Nome Aqui') setUserName(parsed.name);
          if (parsed.email && parsed.email !== 'email@exemplo.com') setUserEmail(parsed.email);
        }
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMessage('Por favor, descreva o erro ou sugestão com mais detalhes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const categoryObj = CATEGORIES.find(c => c.id === category);
    const categoryLabel = categoryObj ? `${categoryObj.icon} ${categoryObj.label}` : category;

    const payload: NewErrorReport = {
      category: categoryLabel,
      title: title.trim() || `${categoryLabel} em ${location}`,
      description: description.trim(),
      location: location.trim(),
      userName: userName.trim() || undefined,
      userEmail: userEmail.trim() || undefined,
      deviceInfo: deviceInfo || getSystemDeviceInfo(),
      appVersion: `v${APP_VERSION}`
    };

    try {
      const result = await submitErrorReport(payload);
      if (result.ok) {
        setIsSuccess(true);
        setTitle('');
        setDescription('');
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setErrorMessage('Não foi possível enviar agora. Tente novamente em alguns instantes.');
      }
    } catch {
      setErrorMessage('Ocorreu um erro ao enviar o reporte. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Reportar Erro ou Sugestão
              </h3>
              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                O envio vai diretamente para o painel do administrador
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90 transition-all cursor-pointer"
            title="Fechar"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Formulário ou Mensagem de Sucesso */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-hide">
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={36} strokeWidth={2.5} />
              </div>
              <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                Reporte Enviado com Sucesso!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Muito obrigado pela colaboração! O administrador recebeu seu reporte diretamente no perfil e analisará a correção.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Categoria do Erro */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                  <Tag size={12} className="text-amber-500" />
                  <span>Tipo do Problema</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base shrink-0">{cat.icon}</span>
                        <span className="truncate text-[11px]">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Onde ocorreu (Local / Seção) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                  <MapPin size={12} className="text-indigo-500" />
                  <span>Onde no aplicativo isso ocorreu?</span>
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título ou Resumo (Opcional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">
                  Resumo Rápido (Opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Erro de digitação na questão 7 de Arte Culinária"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Descrição Detalhada do Erro */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center justify-between">
                  <span>Descrição Detalhada do Erro *</span>
                  <span className="text-[9px] font-medium text-slate-400">Obrigatório</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Explique o que aconteceu, a palavra errada ou o que você estava tentando fazer quando o problema ocorreu..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none leading-relaxed"
                  required
                />
              </div>

              {/* Informações do Solicitante (Nome e E-mail para retorno) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1">
                    <User size={11} />
                    <span>Seu Nome</span>
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1">
                    <Mail size={11} />
                    <span>Seu E-mail (Opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Informações Técnicas Automáticas */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 truncate">
                  <Laptop size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate font-semibold">{deviceInfo || 'Detectando aparelho...'}</span>
                </div>
                <span className="font-mono font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded shrink-0">
                  v{APP_VERSION}
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Botões do Rodapé */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Reporte'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportErrorModal;
