import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, LogOut, Shield, MapPin, Briefcase, Award, Camera, Check, X, User, Mail, Phone, ChevronDown, Heart, Search, Settings, Layers, Globe, Trophy, ArrowUp, RotateCcw, AlertTriangle, Calendar, Lock, Droplet, CheckCircle2, ShoppingBag, ShoppingCart, Plus, Trash2, Edit3, Share2, Copy, Sparkles, Filter, CheckSquare, Square, Tag, ExternalLink, RefreshCw, FileDown, FileText, Printer, Loader2, ArrowDownAZ } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { ClubType, Especialidade, UserProfile, Conquista, CompletedSpecialty } from '../types';
import { MASTERY_RULES } from '../masteryRules';
import { 
  fetchEspecialidades, getCachedEspecialidades, invalidateEspecialidadesCache,
  fetchUserProfile, fetchUserProfileByEmail, updateUserProfile, supabase, getSafeAuthUser,
  fetchConquistas, fetchUserAchievements, updateUserAchievements,
  fetchFuncoes, DEFAULT_CARGOS, getCachedFuncoes,
  getLocalFaixaSpecialties, saveLocalFaixaSpecialties, clearLocalFaixaSpecialties,
  fetchUserFaixaSpecialties, updateUserFaixa,
  fetchFaixaConfig, FaixaConfig, DEFAULT_FAIXA_CONFIG,
  saveUserCompletedSpecialtiesToCloud, fetchUserCompletedSpecialties,
  fetchRemoteSpecialtyOverrides,
  recordDeletedCompletedSpecialtyId, unrecordDeletedCompletedSpecialtyId, getDeletedCompletedSpecialtyIds
} from '../services/supabaseService';
import { pushLocalStateToCloud } from '../services/userCloudSync';
import { fetchAllErrorReports, updateErrorReportStatus, deleteErrorReport, ErrorReport } from '../services/errorReportService';


// Helpers para Cálculo de Idade e Elegibilidade de Conquistas
export const calculateAge = (birthDateString?: any): number | null => {
  if (!birthDateString) return null;
  const str = String(birthDateString).trim();
  if (!str) return null;

  // Se já for um número de idade direto (ex: "28" ou "15")
  if (/^\d{1,2}$/.test(str)) {
    const num = parseInt(str, 10);
    return num >= 0 && num <= 120 ? num : null;
  }

  // Remove tempo se vier com ISO timestamp
  const cleanStr = str.split('T')[0].trim();

  let year: number, month: number, day: number;

  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    } else {
      return null;
    }
  } else if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    } else {
      return null;
    }
  } else {
    return null;
  }

  if (!isNaN(year) && !isNaN(month) && !isNaN(day) && year > 1900) {
    const birthDate = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 && age <= 120 ? age : null;
  }
  return null;
};

export const formatBirthDate = (birthDateString?: string): string => {
  if (!birthDateString) return '';
  const parts = birthDateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return birthDateString;
};

// Helper universal para identificar se um item é Mestrado ou Especialidade regular
export const isMasterySpecialty = (item?: { name?: string; nome?: string; area?: string; code?: string; sigla?: string } | null): boolean => {
  if (!item) return false;
  const name = (item.name || item.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const area = (item.area || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const code = (item.code || item.sigla || '').toUpperCase().trim();
  return (
    area.includes('mestrado') ||
    name.startsWith('mestrado') ||
    name.includes('mestre em') ||
    code.startsWith('ME')
  );
};

// Idades mínimas oficiais conforme regra dos Desbravadores:
// 10 anos: Amigo e Amigo da Natureza
// 11 anos: Companheiro e Companheiro de Excursionismo
// 12 anos: Pesquisador e Pesquisador de Campos de Bosques
// 13 anos: Pioneiro e Pioneiro de Novas Fronteiras
// 14 anos: Excursionista e Excursionista na Mata
// 15 anos: Guia e Guia de Exploração
// Qualquer idade: Insígnia de Excelência
// 18+ anos: Líder, Líder Master e Líder Master Avançado
export const getConquistaMinAge = (con: Conquista): number => {
  if (con.tipo === 'INSIGNIA') {
    return 0; // Em qualquer idade
  }
  if (con.tipo === 'LIDERANCA') {
    return 18; // A partir dos 18 anos
  }
  if (con.tipo === 'CLASSE_REGULAR' || con.tipo === 'CLASSE_AVANCADA') {
    const ordem = con.ordem || 1;
    switch (ordem) {
      case 1: return 10;
      case 2: return 11;
      case 3: return 12;
      case 4: return 13;
      case 5: return 14;
      case 6: return 15;
      default: return 10;
    }
  }
  return 0;
};

export const checkConquistaEligibility = (con: Conquista, age: number | null): { isEligible: boolean; minAge: number; msg?: string } => {
  const minAge = getConquistaMinAge(con);
  if (age === null) {
    if (con.tipo === 'LIDERANCA') {
      return {
        isEligible: false,
        minAge,
        msg: 'Investidura disponível a partir dos 18 anos (informe sua data de nascimento no perfil)'
      };
    }
    return { isEligible: true, minAge };
  }
  const isEligible = age >= minAge;
  let msg = '';
  if (!isEligible) {
    if (con.tipo === 'LIDERANCA') {
      msg = `Investidura disponível a partir dos 18 anos, apesar de poder iniciar a classe aos 16 anos (sua idade: ${age} anos)`;
    } else {
      msg = `Disponível a partir dos ${minAge} anos (sua idade: ${age} anos)`;
    }
  }
  return { isEligible, minAge, msg };
};

// Descrição da cor de fundo oficial de cada área conforme o Manual de Especialidades dos Desbravadores
export const getAreaColorDescription = (areaName: string): string => {
  const norm = (areaName || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (norm.includes('natureza')) return 'fundo branco';
  if (norm.includes('missionar') || norm.includes('comunitaria')) return 'fundo azul escuro';
  if (norm.includes('profissional') || norm.includes('profissoes')) return 'fundo vermelho';
  if (norm.includes('agricola') || norm.includes('agro')) return 'fundo marrom';
  if (norm.includes('manual') || norm.includes('manuais') || norm.includes('artes')) return 'fundo azul celeste';
  if (norm.includes('recreativ')) return 'fundo verde';
  if (norm.includes('ciencia') || norm.includes('saude')) return 'fundo roxo';
  if (norm.includes('domestica')) return 'fundo amarelo';
  return '';
};

// 1. Bandeira do Brasil oficial (Imagem 3: bandeira um pouco maior)
export const BandeiraBrasil: React.FC = () => (
  <div 
    className="w-24 h-16 sm:w-28 sm:h-18 rounded-xs overflow-hidden shadow-lg border border-black/40 flex-shrink-0 relative select-none"
    title="Bandeira do Brasil • Faixa Oficial de Desbravadores"
  >
    <svg viewBox="0 0 100 70" className="w-full h-full block">
      <rect width="100" height="70" fill="#009c3b" />
      <polygon points="50,6 94,35 50,64 6,35" fill="#ffdf00" />
      <circle cx="50" cy="35" r="17.5" fill="#002776" />
      <path d="M 33 38 Q 50 31 67 36" fill="none" stroke="#ffffff" strokeWidth="2.5" />
    </svg>
  </div>
);

// 2. Pin de Batismo Oficial dos Desbravadores (Proporcional e menor na faixa, conforme regulamento e imagem de referência)
interface PinBatismoProps {
  isBaptized: boolean;
  onToggle: () => void;
  imageUrlColorida?: string;
  imageUrlCinza?: string;
}

export const PinBatismo: React.FC<PinBatismoProps> = ({ 
  isBaptized, 
  onToggle,
  imageUrlColorida = "https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/insignias/batismo.png",
  imageUrlCinza = "https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/insignias/batismo%20PB.png"
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      type="button"
      onClick={onToggle}
      className="group relative transition-transform active:scale-90 hover:scale-105 focus:outline-none flex flex-col items-center select-none cursor-pointer"
      title={`Pin de Batismo ${isBaptized ? '• Condecorado (Toque para alternar)' : '• Toque para condecorar'}`}
    >
      <div className="w-8 h-10 sm:w-9 sm:h-11 relative transition-all duration-300 flex items-center justify-center">
        {!imageError ? (
          <img
            src={isBaptized ? imageUrlColorida : imageUrlCinza}
            alt="Pin de Batismo"
            className={`w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] transition-all ${
              isBaptized ? 'opacity-100 brightness-105' : 'opacity-40 grayscale hover:opacity-75'
            }`}
            onError={() => setImageError(true)}
          />
        ) : (
          <svg viewBox="0 0 100 120" className={`w-full h-full overflow-visible filter drop-shadow-md ${
            isBaptized ? 'opacity-100 brightness-105' : 'grayscale opacity-40 hover:opacity-75'
          }`}>
            <defs>
              <linearGradient id="goldPinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="30%" stopColor="#eab308" />
                <stop offset="70%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
              <linearGradient id="flamePinGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#b45309" />
                <stop offset="40%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#fef08a" />
              </linearGradient>
            </defs>
            <path
              d="M 12 10 Q 50 18 88 10 Q 86 55 50 110 Q 14 55 12 10 Z"
              fill="url(#goldPinGradient)"
              stroke="#713f12"
              strokeWidth="1.5"
            />
            <path
              d="M 18 16 Q 50 23 82 16 Q 80 53 50 102 Q 20 53 18 16 Z"
              fill="#121212"
            />
            <path
              d="M 21 19 Q 50 25 79 19 Q 77 51 50 97 Q 23 51 21 19 Z"
              fill="none"
              stroke="url(#goldPinGradient)"
              strokeWidth="0.8"
              opacity="0.5"
            />
            <path
              d="M 50 25 C 54 35 60 47 57 60 C 54 48 48 41 50 25 Z"
              fill="url(#flamePinGradient)"
            />
            <path
              d="M 43 37 C 40 45 38 55 45 64 C 39 56 39 48 43 37 Z"
              fill="url(#flamePinGradient)"
            />
            <path
              d="M 57 35 C 64 45 62 57 53 64 C 61 56 62 46 57 35 Z"
              fill="url(#flamePinGradient)"
            />
            <g transform="translate(26, 61)">
              <path
                d="M 24 14 Q 12 8 0 13 Q 12 18 24 14 Z"
                fill="url(#flamePinGradient)"
              />
              <path
                d="M 24 14 Q 36 8 48 13 Q 36 18 24 14 Z"
                fill="url(#flamePinGradient)"
              />
              <rect x="23" y="10" width="2" height="10" fill="#121212" />
              <rect x="20.5" y="13" width="7" height="2" fill="#121212" />
            </g>
          </svg>
        )}
      </div>
    </button>
  );
};

// 3. Tira de Nome oficial bordada dos Desbravadores (Proporcional à faixa real: Imagem 2 e Imagem 4)
interface TiraNomeProps {
  name: string;
  age: number | null;
  tipoSanguineo?: string;
  fatorRh?: string;
}

export const TiraNome: React.FC<TiraNomeProps> = ({ name, age, tipoSanguineo, fatorRh }) => {
  const isAdultUniform = age !== null && age >= 16;
  const bgColor = isAdultUniform ? 'bg-[#f8f6f0] text-[#0a0a0a]' : 'bg-[#c5a57d] text-[#0a0a0a]';
  const borderColor = 'border-[#223014]';
  
  // Imagem da faixa real: Nome bordado em destaque preenchendo a altura e largura da tira
  const firstName = (name || 'DESBRAVADOR').trim().split(/\s+/)[0].toUpperCase();

  // Informação de tipo sanguíneo e fator RH exclusiva da faixa (canto direito em vermelho)
  const bloodTypeDisplay = (tipoSanguineo || fatorRh)
    ? `${tipoSanguineo || ''}${fatorRh || ''}`.trim()
    : '';

  return (
    <div className="w-full max-w-[240px] sm:max-w-[260px] my-1 relative group select-none">
      {/* Plaqueta com costura militar bordada fiel à faixa real */}
      <div className={`w-full py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xs border-[3.5px] sm:border-[4px] ${borderColor} ${bgColor} shadow-md flex items-center justify-center relative overflow-hidden min-h-[38px] sm:min-h-[42px]`}>
        {/* Textura têxtil de entretela e tecido bordado */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px] pointer-events-none" />
        
        {/* Nome do desbravador centralizado */}
        <span className={`font-black text-2xl sm:text-3xl md:text-[32px] tracking-[0.15em] sm:tracking-[0.18em] uppercase truncate text-center leading-none font-mono drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] z-0 ${
          bloodTypeDisplay ? 'pr-9 sm:pr-11 pl-2' : ''
        }`}>
          {firstName}
        </span>

        {/* Tipo sanguíneo e Fator RH exclusivamente na faixa, do lado direito da caixa do nome apenas a escrita em vermelho */}
        {bloodTypeDisplay && (
          <span 
            style={{ color: '#dc2626' }}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-10 font-black text-sm sm:text-base md:text-lg text-red-600 font-mono tracking-tight leading-none pointer-events-none select-none drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.2)] no-accent-override"
            title={`Tipo Sanguíneo e Fator RH: ${bloodTypeDisplay}`}
          >
            {bloodTypeDisplay}
          </span>
        )}
      </div>
    </div>
  );
};

const CARGOS = DEFAULT_CARGOS;

interface EditInputProps {
  label: string;
  value: string;
  name: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EditInput: React.FC<EditInputProps> = ({ label, value, name, type = "text", onChange }) => (
  <div className="space-y-1.5 text-left">
    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>
    <input 
      type={type}
      value={value}
      name={name}
      onChange={onChange}
      className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
    />
  </div>
);

interface EditSelectProps {
  label: string;
  value: string;
  name: string;
  options: string[];
  onChange: (e: { target: { name: string; value: string } }) => void;
}

const EditSelect: React.FC<EditSelectProps> = ({ label, value, name, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const mergedOptions = useMemo(() => {
    if (value && !options.includes(value)) {
      return [value, ...options];
    }
    return options;
  }, [options, value]);

  const handleSelect = (selectedVal: string) => {
    onChange({ target: { name, value: selectedVal } });
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5 text-left">
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>
      
      {/* Botão de Trigger */}
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-5 text-sm text-left text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm font-bold flex items-center justify-between group active:scale-[0.99]"
      >
        <div className="flex items-center space-x-2.5 truncate">
          <Briefcase size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 shrink-0 transition-colors" />
          <span className={value ? "text-slate-800 dark:text-slate-200 truncate" : "text-slate-400 dark:text-slate-500 font-normal"}>
            {value || "Selecione uma função..."}
          </span>
        </div>
        <ChevronDown size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors shrink-0 ml-2" />
      </button>

      {/* Modal Compacto para Selecionar Função - Sem Campo de Pesquisa */}
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[70vh] sm:max-h-[460px] animate-in zoom-in-95 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Briefcase size={16} strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    Selecionar Função
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {mergedOptions.length} opções disponíveis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center transition-colors active:scale-90"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Lista de Opções Compacta sem pesquisa */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              {mergedOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 active:bg-slate-200'
                    }`}
                  >
                    <span className="truncate pr-2">{opt}</span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DEFAULT_CONQUISTAS_FALLBACK: Conquista[] = [
  { id: 8, nome: 'Excelência', tipo: 'INSIGNIA', shape: 'RECTANGLE', ordem: 1, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/excelencia.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/excelencia%20PB.png' },
  { id: 17, nome: 'Guia de Exploração', tipo: 'CLASSE_AVANCADA', shape: 'RECTANGLE', ordem: 6, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/16.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/16%20PB.png' },
  { id: 16, nome: 'Excursionista na mata', tipo: 'CLASSE_AVANCADA', shape: 'RECTANGLE', ordem: 5, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/15.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/15%20PB.png' },
  { id: 15, nome: 'Pioneiro de Novas Fronteiras', tipo: 'CLASSE_AVANCADA', shape: 'RECTANGLE', ordem: 4, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/14.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/14%20PB.png' },
  { id: 14, nome: 'Pesquisador de Campos de Bosques', tipo: 'CLASSE_AVANCADA', shape: 'RECTANGLE', ordem: 3, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/13.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/13%20PB.png' },
  { id: 13, nome: 'Companheiro de Excursionismo', tipo: 'CLASSE_AVANCADA', shape: 'RECTANGLE', ordem: 2, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/12.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/12%20PB.png' },
  { id: 12, nome: 'Amigo da Natureza', tipo: 'CLASSE_AVANCADA', shape: 'RECTANGLE', ordem: 1, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/11.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/11%20PB.png' },
  { id: 2, nome: 'Amigo', tipo: 'CLASSE_REGULAR', shape: 'CIRCLE', ordem: 1, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/01.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/01%20PB.png' },
  { id: 3, nome: 'Companheiro', tipo: 'CLASSE_REGULAR', shape: 'CIRCLE', ordem: 2, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/02.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/02%20PB.png' },
  { id: 4, nome: 'Pesquisador', tipo: 'CLASSE_REGULAR', shape: 'CIRCLE', ordem: 3, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/03.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/03%20PB.png' },
  { id: 5, nome: 'Pioneiro', tipo: 'CLASSE_REGULAR', shape: 'CIRCLE', ordem: 4, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/04.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/04%20PB.png' },
  { id: 6, nome: 'Excursionista', tipo: 'CLASSE_REGULAR', shape: 'CIRCLE', ordem: 5, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/05.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/05%20PB.png' },
  { id: 7, nome: 'Guia', tipo: 'CLASSE_REGULAR', shape: 'CIRCLE', ordem: 6, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/06.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/06%20PB.png' },
  { id: 9, nome: 'Líder', tipo: 'LIDERANCA', shape: 'OVAL', ordem: 1, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/07.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/07%20PB.png' },
  { id: 10, nome: 'Líder Master', tipo: 'LIDERANCA', shape: 'OVAL', ordem: 2, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/08.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/08%20PB.png' },
  { id: 11, nome: 'Líder Master Avançado', tipo: 'LIDERANCA', shape: 'OVAL', ordem: 3, imagem_colorida: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/09.png', imagem_cinza: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Classes/conquistas/09%20PB.png' }
];

interface ProfileProps {
  club: ClubType;
  onBack: (club?: ClubType) => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ club, onBack, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSashView, setIsSashView] = useState(false);
  const [allSpecialties, setAllSpecialties] = useState<Especialidade[]>(() => {
    try {
      const initialData = getInitialData();
      const initialClubType = initialData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
      return getCachedEspecialidades(initialClubType, true);
    } catch {
      return [];
    }
  });
  const [visibleSashModalCount, setVisibleSashModalCount] = useState<number>(40);
  const [allConquistas, setAllConquistas] = useState<Conquista[]>(DEFAULT_CONQUISTAS_FALLBACK);
  const [userAchievements, setUserAchievements] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('dbv_tudo_user_achievements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const storageKey = `dbv_tudo_global_user_profile`;
  
  // Função para ler o estado inicial síncronamente do localStorage
  const getInitialData = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      name: "Seu Nome Aqui",
      email: "email@exemplo.com",
      tipo: club === ClubType.PATHFINDER ? "Desbravador" : "Aventureiro",
      clube: "Nome do Clube",
      cargo: "Diretor(a)",
      telefone: "(00) 00000-0000",
      avatar: "",
      cidade: "",
      estado: "",
      data_nascimento: "",
      tipo_sanguineo: "",
      fator_rh: "",
      isAdmin: false
    };
  };

  const [userData, setUserData] = useState(getInitialData);
  const userClubType = userData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
  const [userId, setUserId] = useState<string | null>(null);
  const [cargosList, setCargosList] = useState<string[]>(() => getCachedFuncoes());

  // Idade calculada do usuário
  const userAge = useMemo(() => calculateAge(userData.data_nascimento), [userData.data_nascimento]);

  // Regra de Uniforme Oficial: até 15 anos cáqui, a partir de 16 anos branco
  // Se ainda não cadastrou data mas exerce cargo de diretoria/liderança (ex: Diretor Associado), adota uniforme adulto branco
  const isAdultUniform = useMemo(() => {
    if (userAge !== null) return userAge >= 16;
    const norm = (userData.cargo || '').toLowerCase();
    return norm.includes('diretor') || norm.includes('lider') || norm.includes('líder') || 
           norm.includes('conselheiro') || norm.includes('pastor') || norm.includes('ancião') || 
           norm.includes('anciao') || norm.includes('instrutor') || norm.includes('coordenador') || 
           norm.includes('regional') || norm.includes('distrital');
  }, [userAge, userData.cargo]);

  // Pin de Batismo oficial dos Desbravadores (persiste estado no localStorage e sincroniza com conquistas)
  const [isBaptized, setIsBaptized] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dbv_tudo_user_baptized');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const batismoConquista = useMemo(() => {
    return allConquistas.find(c => c.id === 18 || c.nome.toLowerCase().includes('batismo'));
  }, [allConquistas]);

  const isBaptizedEffective = useMemo(() => {
    if (batismoConquista && userAchievements.includes(batismoConquista.id)) return true;
    return isBaptized;
  }, [batismoConquista, userAchievements, isBaptized]);

  // Configuração das imagens da ponta da faixa (Globos)
  const [faixaConfig, setFaixaConfig] = useState<FaixaConfig>(DEFAULT_FAIXA_CONFIG);
  const [showGloboModal, setShowGloboModal] = useState(false);

  // Chave e estado de Especialidades Concluídas (com data de conclusão e controle de compra de insígnias)
  const completedStorageKey = useMemo(() => {
    return userData.email && userData.email !== 'email@exemplo.com'
      ? `dbv_tudo_completed_specialties_${userData.email}`
      : 'dbv_tudo_completed_specialties';
  }, [userData.email]);

  const [completedSpecialties, setCompletedSpecialties] = useState<CompletedSpecialty[]>(() => {
    try {
      const initialEmail = getInitialData().email;
      const key = initialEmail && initialEmail !== 'email@exemplo.com'
        ? `dbv_tudo_completed_specialties_${initialEmail}`
        : 'dbv_tudo_completed_specialties';
      const saved = localStorage.getItem(key) || localStorage.getItem('dbv_tudo_completed_specialties');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn("Erro ao ler especialidades concluídas:", e);
    }
    return [];
  });

  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [completedFilterTab, setCompletedFilterTab] = useState<'ALL' | 'SPECIALTIES' | 'MASTERIES' | 'PURCHASED' | 'PENDING'>('ALL');
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSpecialtyId, setEditingSpecialtyId] = useState<string | number | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfExportType, setPdfExportType] = useState<'ALL_COMPLETED' | 'PENDING_ONLY'>('ALL_COMPLETED');
  const [pdfSortOrder, setPdfSortOrder] = useState<'ALPHABETICAL' | 'CODE' | 'DATE'>('ALPHABETICAL');
  const [isModalScrolled, setIsModalScrolled] = useState(false);

  // Campos do formulário de adicionar / editar especialidade concluída
  const [formSelectedSpecialty, setFormSelectedSpecialty] = useState<Especialidade | null>(null);
  const [formSpecialtySearch, setFormSpecialtySearch] = useState('');
  const [formCompletionDate, setFormCompletionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formPurchased, setFormPurchased] = useState<boolean>(true);
  const [formInstructor, setFormInstructor] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAddToSash, setFormAddToSash] = useState<boolean>(true);

  const saveCompletedList = (newList: CompletedSpecialty[]) => {
    setCompletedSpecialties(newList);
    try {
      localStorage.setItem(completedStorageKey, JSON.stringify(newList));
      localStorage.setItem('dbv_tudo_completed_specialties', JSON.stringify(newList));
      window.dispatchEvent(new CustomEvent('dbv_completed_specialties_updated', { detail: newList }));
      window.dispatchEvent(new Event('storage'));

      // Sincroniza imediatamente com o banco Supabase e nuvem para refletir entre Celular e PC
      saveUserCompletedSpecialtiesToCloud(newList, userData.email, userId).catch(console.warn);
      pushLocalStateToCloud().catch(console.warn);
    } catch (err) {
      console.error("Erro ao salvar especialidades concluídas:", err);
    }
  };

  const togglePurchaseStatus = (specialtyId: string | number) => {
    const updated = completedSpecialties.map(item => {
      if (String(item.specialtyId) === String(specialtyId)) {
        return { ...item, purchased: !item.purchased };
      }
      return item;
    });
    saveCompletedList(updated);
  };

  const handleDeleteCompleted = (specialtyId: string | number) => {
    const target = completedSpecialties.find(c => String(c.specialtyId) === String(specialtyId));
    const confirmName = target?.name || 'esta especialidade';
    if (window.confirm(`Deseja remover "${confirmName}" das suas especialidades concluídas?`)) {
      recordDeletedCompletedSpecialtyId(specialtyId);
      const updated = completedSpecialties.filter(c => String(c.specialtyId) !== String(specialtyId));
      saveCompletedList(updated);
    }
  };


  const handleOpenAddModal = (specialtyToPreselect?: Especialidade) => {
    setEditingSpecialtyId(null);
    setFormSelectedSpecialty(specialtyToPreselect || null);
    setFormSpecialtySearch('');
    setFormCompletionDate(new Date().toISOString().split('T')[0]);
    setFormPurchased(true);
    setFormInstructor('');
    setFormNotes('');
    setFormAddToSash(true);
    setIsAddEditModalOpen(true);
  };

  const handleOpenEditModal = (item: CompletedSpecialty) => {
    setEditingSpecialtyId(item.specialtyId);
    const esp = allSpecialties.find(s => String(s.id) === String(item.specialtyId)) || {
      id: Number(item.specialtyId) || 0,
      nome: item.name,
      area: item.area,
      logo: item.logo || '',
      requisitos: [],
      club: userClubType,
      codigo: item.code
    };
    setFormSelectedSpecialty(esp);
    setFormSpecialtySearch('');
    setFormCompletionDate(item.completionDate || new Date().toISOString().split('T')[0]);
    setFormPurchased(item.purchased);
    setFormInstructor(item.instructor || '');
    setFormNotes(item.notes || '');
    setFormAddToSash(likedIds.includes(String(item.specialtyId)));
    setIsAddEditModalOpen(true);
  };

  const handleSaveCompletedForm = () => {
    if (!formSelectedSpecialty) {
      alert("Por favor, selecione uma especialidade da lista.");
      return;
    }
    if (!formCompletionDate) {
      alert("Por favor, informe a data de conclusão.");
      return;
    }

    const now = Date.now();
    const newItem: CompletedSpecialty = {
      specialtyId: formSelectedSpecialty.id,
      name: formSelectedSpecialty.nome,
      code: formSelectedSpecialty.codigo,
      area: formSelectedSpecialty.area,
      logo: formSelectedSpecialty.logo,
      completionDate: formCompletionDate,
      purchased: formPurchased,
      instructor: formInstructor.trim() || undefined,
      notes: formNotes.trim() || undefined,
      addedAt: now // Sempre atualiza timestamp de adição para que fique no topo do Gerenciar
    };

    // Remove registro existente se for edição ou re-salvamento e coloca a última adicionada no TOPO absoluto (índice 0)
    unrecordDeletedCompletedSpecialtyId(formSelectedSpecialty.id);
    const otherItems = completedSpecialties.filter(c => String(c.specialtyId) !== String(formSelectedSpecialty.id));
    const updated = [newItem, ...otherItems];

    saveCompletedList(updated);


    // Se marcado para adicionar à faixa
    if (formAddToSash && !likedIds.includes(String(formSelectedSpecialty.id))) {
      const nextLiked = [...likedIds, String(formSelectedSpecialty.id)];
      setLikedIds(nextLiked);
      saveLocalFaixaSpecialties(nextLiked, userData.email, userClubType);
      if (userData.email && userData.email !== "email@exemplo.com") {
        updateUserFaixa(userData.email, nextLiked, userId, userClubType).catch(console.warn);
      }
    }

    setIsAddEditModalOpen(false);
  };

  const handleGeneratePDF = async (
    exportType: 'ALL_COMPLETED' | 'PENDING_ONLY',
    sortOrder: 'ALPHABETICAL' | 'CODE' | 'DATE' = pdfSortOrder
  ) => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const innerWidth = pageWidth - (margin * 2);
      let currentY = margin;
      let pageNumber = 1;

      // Helper de Cabeçalho e Rodapé de cada página
      const drawHeaderAndFooter = (isFirstPage: boolean) => {
        // Rodapé
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text(
          `DBV Tudo • Sistema de Gestão de Especialidades • Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          margin,
          pageHeight - 8
        );
        pdf.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 8, { align: 'right' });

        // Se for página secundária, desenha linha sutil no topo
        if (!isFirstPage) {
          pdf.setFillColor(15, 23, 42);
          pdf.rect(margin, margin - 4, innerWidth, 0.4, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7.5);
          pdf.setTextColor(100, 116, 139);
          const subTitle = exportType === 'PENDING_ONLY' 
            ? 'LISTA DE COMPRAS DE INSÍGNIAS (CONTINUAÇÃO)' 
            : 'RELATÓRIO DE ESPECIALIDADES CONCLUÍDAS (CONTINUAÇÃO)';
          pdf.text(subTitle, margin, margin - 1.5);
        }
      };

      const checkPageBreak = (neededHeight: number) => {
        if (currentY + neededHeight > pageHeight - margin - 10) {
          drawHeaderAndFooter(pageNumber === 1);
          pdf.addPage();
          pageNumber++;
          currentY = margin + 5;
          return true;
        }
        return false;
      };

      // Banner Principal do Topo (Verde Oficial #0c3c31)
      pdf.setFillColor(12, 60, 49);
      pdf.roundedRect(margin, currentY, innerWidth, 24, 3, 3, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(255, 255, 255);
      const titleText = exportType === 'PENDING_ONLY'
        ? 'LISTA DE COMPRAS • INSÍGNIAS DE ESPECIALIDADES'
        : 'RELATÓRIO DE ESPECIALIDADES CONCLUÍDAS';
      pdf.text(titleText, margin + 6, currentY + 8);

      const sortLabel = sortOrder === 'ALPHABETICAL'
        ? 'Ordem Alfabética (A-Z)'
        : sortOrder === 'CODE'
        ? 'Ordem por Código'
        : 'Ordem por Data de Conclusão';

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(209, 250, 229);
      const subText = exportType === 'PENDING_ONLY'
        ? `Insígnias marcadas como "Preciso Comprar" • Total a adquirir: ${completedCounts.pending} insígnias • ${sortLabel}`
        : `Controle de datas de conclusão e controle de compra • Total concluído: ${completedCounts.total} • ${sortLabel}`;
      pdf.text(subText, margin + 6, currentY + 14);

      pdf.setFontSize(7.5);
      pdf.setTextColor(254, 243, 199); // amber-100
      pdf.text(
        `Desbravador(a): ${userData.name || 'Membro'}  |  Clube: ${userData.clube || 'Clube de Desbravadores'}`,
        margin + 6,
        currentY + 19.5
      );

      currentY += 28;

      // Resumo em 4 blocos
      const cardW = (innerWidth - 6) / 4;
      const cardH = 13;

      // Bloco 1: Especialidades
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(margin, currentY, cardW, cardH, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('ESPECIALIDADES', margin + 3, currentY + 4.5);
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.text(String(completedCounts.specialties), margin + 3, currentY + 10.5);

      // Bloco 2: Mestrados
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(margin + cardW + 2, currentY, cardW, cardH, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text('MESTRADOS', margin + cardW + 5, currentY + 4.5);
      pdf.setFontSize(11);
      pdf.setTextColor(30, 41, 59);
      pdf.text(String(completedCounts.masteries), margin + cardW + 5, currentY + 10.5);

      // Bloco 3: Já Compradas (Verde)
      pdf.setFillColor(236, 253, 245);
      pdf.roundedRect(margin + (cardW + 2) * 2, currentY, cardW, cardH, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(5, 150, 105);
      pdf.text('JÁ COMPRADAS', margin + (cardW + 2) * 2 + 3, currentY + 4.5);
      pdf.setFontSize(11);
      pdf.setTextColor(6, 95, 70);
      pdf.text(String(completedCounts.purchased), margin + (cardW + 2) * 2 + 3, currentY + 10.5);

      // Bloco 4: Preciso Comprar (Vermelho)
      pdf.setFillColor(255, 241, 242);
      pdf.roundedRect(margin + (cardW + 2) * 3, currentY, cardW, cardH, 2, 2, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(6.5);
      pdf.setTextColor(225, 29, 72);
      pdf.text('PRECISO COMPRAR', margin + (cardW + 2) * 3 + 3, currentY + 4.5);
      pdf.setFontSize(11);
      pdf.setTextColor(159, 18, 57);
      pdf.text(String(completedCounts.pending), margin + (cardW + 2) * 3 + 3, currentY + 10.5);

      currentY += 17;

      // CONTEÚDO PRINCIPAL: Especialidades ordenadas conforme escolha do usuário
      let itemsToPrint = exportType === 'PENDING_ONLY'
        ? completedSpecialties.filter(item => !item.purchased)
        : [...completedSpecialties];

      // Aplicação da Ordenação Selecionada (Alfabética, Código ou Data de Conclusão)
      if (sortOrder === 'ALPHABETICAL') {
        itemsToPrint.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));
      } else if (sortOrder === 'CODE') {
        itemsToPrint.sort((a, b) => {
          const codeA = (a.code || '').trim();
          const codeB = (b.code || '').trim();
          if (!codeA && !codeB) return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
          if (!codeA) return 1;
          if (!codeB) return -1;
          return codeA.localeCompare(codeB, 'pt-BR', { numeric: true, sensitivity: 'base' });
        });
      } else if (sortOrder === 'DATE') {
        itemsToPrint.sort((a, b) => {
          const dateA = a.completionDate || '';
          const dateB = b.completionDate || '';
          if (dateB !== dateA) return dateB.localeCompare(dateA);
          const addedA = Number(a.addedAt || 0);
          const addedB = Number(b.addedAt || 0);
          if (addedB !== addedA) return addedB - addedA;
          return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' });
        });
      }

      if (itemsToPrint.length === 0) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text(
          exportType === 'PENDING_ONLY' 
            ? 'Parabéns! Todas as suas insígnias já foram compradas.' 
            : 'Nenhuma especialidade registrada como concluída.',
          pageWidth / 2,
          currentY + 15,
          { align: 'center' }
        );
      } else {
        // Cabeçalho da Tabela
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, currentY, innerWidth, 6.5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(71, 85, 105);

        if (exportType === 'PENDING_ONLY') {
          pdf.text('[ ]', margin + 3, currentY + 4.5);
          pdf.text('CÓD', margin + 10, currentY + 4.5);
          pdf.text('INSÍGNIA / ESPECIALIDADE', margin + 25, currentY + 4.5);
          pdf.text('ÁREA', margin + 98, currentY + 4.5);
          pdf.text('DATA CONCL.', margin + 142, currentY + 4.5);
          pdf.text('QTD', pageWidth - margin - 10, currentY + 4.5);
        } else {
          pdf.text('CÓD', margin + 3, currentY + 4.5);
          pdf.text('ESPECIALIDADE / MESTRADO', margin + 18, currentY + 4.5);
          pdf.text('ÁREA', margin + 92, currentY + 4.5);
          pdf.text('DATA CONCL.', margin + 132, currentY + 4.5);
          pdf.text('STATUS', pageWidth - margin - 26, currentY + 4.5);
        }

        currentY += 8.5;

        itemsToPrint.forEach((item, idx) => {
          checkPageBreak(6.5);

          if (!item.purchased) {
            // Destaque de fundo vermelho suave para itens que precisam ser comprados!
            pdf.setFillColor(255, 241, 242);
            pdf.rect(margin, currentY - 4, innerWidth, 6, 'F');
          } else if (idx % 2 === 1) {
            pdf.setFillColor(248, 250, 252);
            pdf.rect(margin, currentY - 4, innerWidth, 6, 'F');
          }

          if (exportType === 'PENDING_ONLY') {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(225, 29, 72);
            pdf.text('[ ]', margin + 3, currentY);

            pdf.setFontSize(7.5);
            pdf.setTextColor(item.code ? 79 : 148, item.code ? 70 : 163, item.code ? 229 : 184);
            pdf.text(item.code || '—', margin + 10, currentY);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(15, 23, 42);
            pdf.text(item.name.length > 38 ? item.name.substring(0, 36) + '...' : item.name, margin + 25, currentY);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(100, 116, 139);
            pdf.text((item.area || 'Geral').substring(0, 22), margin + 98, currentY);

            pdf.text(formatBirthDate(item.completionDate) || '—', margin + 142, currentY);

            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(225, 29, 72);
            pdf.text('1x', pageWidth - margin - 10, currentY);
          } else {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7.5);
            pdf.setTextColor(item.code ? 79 : 148, item.code ? 70 : 163, item.code ? 229 : 184);
            pdf.text(item.code || '—', margin + 3, currentY);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(8);
            pdf.setTextColor(15, 23, 42);
            pdf.text(item.name.length > 38 ? item.name.substring(0, 36) + '...' : item.name, margin + 18, currentY);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7);
            pdf.setTextColor(100, 116, 139);
            pdf.text((item.area || 'Geral').substring(0, 22), margin + 92, currentY);

            pdf.text(formatBirthDate(item.completionDate) || '—', margin + 132, currentY);

            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            if (item.purchased) {
              pdf.setTextColor(5, 150, 105);
              pdf.text('JÁ COMPREI', pageWidth - margin - 26, currentY);
            } else {
              pdf.setTextColor(225, 29, 72);
              pdf.text('PRECISO COMPRAR', pageWidth - margin - 26, currentY);
            }
          }

          currentY += 6;
        });
      }

      drawHeaderAndFooter(pageNumber === 1);

      const filePrefix = exportType === 'PENDING_ONLY'
        ? 'Lista_de_Compras_Insignias'
        : 'Relatorio_Especialidades_Concluidas';
      const dateSuffix = new Date().toISOString().slice(0, 10);
      pdf.save(`${filePrefix}_${dateSuffix}.pdf`);
      setIsPdfModalOpen(false);
    } catch (err) {
      console.error('Erro ao gerar PDF de especialidades:', err);
      alert('Não foi possível gerar o arquivo PDF. Tente novamente.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyWishlist = () => {
    const pending = completedSpecialties.filter(c => !c.purchased);
    if (pending.length === 0) {
      alert("Você não possui especialidades na lista de compras pendentes!");
      return;
    }

    const today = new Date().toLocaleDateString('pt-BR');
    let text = `📋 *LISTA DE COMPRAS DE INSÍGNIAS (DSA)*\n`;
    text += `👤 *Desbravador(a):* ${userData.name}\n`;
    if (userData.clube) text += `🏕️ *Clube:* ${userData.clube}\n`;
    text += `📅 *Data:* ${today}\n`;
    text += `🎯 *Total de Insígnias Pendentes:* ${pending.length}\n\n`;
    text += `*Especialidades Concluídas a Comprar:*\n`;

    pending.forEach((esp, idx) => {
      const codeStr = esp.code ? ` (${esp.code})` : '';
      const dateStr = esp.completionDate ? ` • Concluída em ${formatBirthDate(esp.completionDate)}` : '';
      text += `${idx + 1}. *${esp.name}*${codeStr}${dateStr}\n`;
    });

    text += `\n_Gerado pelo App DBV Tudo_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 3000);
    }).catch(() => {
      alert("Não foi possível copiar automaticamente. Selecione e copie o texto.");
    });
  };

  const completedCounts = useMemo(() => {
    const total = completedSpecialties.length;
    const masteries = completedSpecialties.filter(c => isMasterySpecialty(c)).length;
    const specialties = total - masteries;
    const purchased = completedSpecialties.filter(c => c.purchased).length;
    const pending = total - purchased;
    return { total, specialties, masteries, purchased, pending };
  }, [completedSpecialties]);

  const filteredCompletedList = useMemo(() => {
    let list = [...completedSpecialties];

    if (completedFilterTab === 'PURCHASED') {
      list = list.filter(c => c.purchased);
    } else if (completedFilterTab === 'PENDING') {
      list = list.filter(c => !c.purchased);
    } else if (completedFilterTab === 'SPECIALTIES') {
      list = list.filter(c => !isMasterySpecialty(c));
    } else if (completedFilterTab === 'MASTERIES') {
      list = list.filter(c => isMasterySpecialty(c));
    }

    if (completedSearchTerm.trim()) {
      const term = completedSearchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      const tokens = term.split(/\s+/).filter(t => t.length > 0 && t !== 'de' && t !== 'da' && t !== 'do' && t !== 'e' && t !== 'em');
      list = list.filter(c => {
        const nameNorm = (c.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const codeNorm = (c.code || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const areaNorm = (c.area || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const haystack = `${nameNorm} ${codeNorm} ${areaNorm}`;
        if (haystack.includes(term)) return true;
        if (tokens.length > 0 && tokens.every(tok => haystack.includes(tok))) return true;
        return false;
      });
    }

    return list.sort((a, b) => {
      // Regra de Negócio: No 'Gerenciar', a última especialidade adicionada fica sempre no topo da lista
      const addedA = Number(a.addedAt || 0);
      const addedB = Number(b.addedAt || 0);
      if (addedB !== addedA) {
        return addedB - addedA;
      }
      const dateA = a.completionDate || '';
      const dateB = b.completionDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [completedSpecialties, completedFilterTab, completedSearchTerm]);

  const availableSpecialtiesForAdd = useMemo(() => {
    let source = allSpecialties;
    if (!source || source.length === 0) {
      source = getCachedEspecialidades(userClubType, true);
    }

    // Deduplicação rigorosa por ID do banco e nome para evitar repetições no catálogo
    const seen = new Set<string>();
    const uniqueSource: Especialidade[] = [];
    for (const esp of source) {
      if (!esp || !esp.nome) continue;
      const key = `${esp.id}_${(esp.nome || '').trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSource.push(esp);
      }
    }

    if (!formSpecialtySearch.trim()) {
      return uniqueSource.slice(0, 40);
    }

    const term = formSpecialtySearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const searchTokens = term.split(/\s+/).filter(t => t.length > 0 && t !== 'de' && t !== 'da' && t !== 'do' && t !== 'e' && t !== 'em');
    const isSearchingRetired = term.includes('antig') || term.includes('manual') || term.includes('retirad') || term.includes('excluid') || term.includes('histor');

    return uniqueSource.filter(s => {
      const nameNorm = (s.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const codeNorm = (s.codigo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const areaNorm = (s.area || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const fullText = `${nameNorm} ${codeNorm} ${areaNorm}`;

      // 1. Busca exata ou por trecho
      if (fullText.includes(term)) return true;

      // 2. Busca por todas as palavras digitadas separadas (ex: "arte" e "acampar" localiza "Arte de acampar")
      if (searchTokens.length > 0 && searchTokens.every(tok => fullText.includes(tok))) return true;

      // 3. Busca por especialidades retiradas do manual ou históricas
      if (isSearchingRetired) {
        if (
          nameNorm.includes('telecartofilia') || nameNorm.includes('estofamento') || nameNorm.includes('fantoches') ||
          nameNorm.includes('gado leiteiro') || nameNorm.includes('plantas silvestres') || nameNorm.includes('marcenaria') ||
          nameNorm.includes('artes mateiras') || nameNorm.includes('construcoes rusticas') || nameNorm.includes('skate') ||
          nameNorm.includes('waveboarding') || nameNorm.includes('braille') || nameNorm.includes('lingua de sinais') ||
          nameNorm.includes('producao de video') || nameNorm.includes('computacao iii') || nameNorm.includes('mecanica automotiva') ||
          nameNorm.includes('soldagem') || (Number(s.id) >= 2330)
        ) {
          return true;
        }
      }

      return false;
    }).slice(0, 60);
  }, [allSpecialties, formSpecialtySearch, userClubType]);

  const isAdmin = userData.isAdmin || userData.email === 'ronaldosonic@gmail.com' || userData.email === 'dbvtudo2024@gmail.com';
  const [isAdminReportsModalOpen, setIsAdminReportsModalOpen] = useState(false);
  const [errorReportsList, setErrorReportsList] = useState<ErrorReport[]>([]);
  const [errorReportsFilter, setErrorReportsFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
  const [errorReportsSearch, setErrorReportsSearch] = useState('');
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [selectedReportForView, setSelectedReportForView] = useState<ErrorReport | null>(null);
  const [copiedReportId, setCopiedReportId] = useState<string | null>(null);
  const [confirmDeleteReportId, setConfirmDeleteReportId] = useState<string | null>(null);
  const [isDeletingReportId, setIsDeletingReportId] = useState<string | null>(null);

  // Suporte ao botão lateral do mouse ("Voltar") para fechar modais ou sair da visão da faixa no Perfil
  useEffect(() => {
    const handleProfileBack = (e: Event) => {
      if (isPdfModalOpen) {
        setIsPdfModalOpen(false);
        e.preventDefault();
        return;
      }
      if (isAddEditModalOpen) {
        setIsAddEditModalOpen(false);
        e.preventDefault();
        return;
      }
      if (isCompletedModalOpen) {
        setIsCompletedModalOpen(false);
        e.preventDefault();
        return;
      }
      if (showGloboModal) {
        setShowGloboModal(false);
        e.preventDefault();
        return;
      }
      if (showResetConfirm) {
        setShowResetConfirm(false);
        e.preventDefault();
        return;
      }
      if (isAdminReportsModalOpen) {
        setIsAdminReportsModalOpen(false);
        e.preventDefault();
        return;
      }
      if (isSashView) {
        setIsSashView(false);
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('dbv_app_back_request', handleProfileBack);
    return () => {
      window.removeEventListener('dbv_app_back_request', handleProfileBack);
    };
  }, [showGloboModal, showResetConfirm, isAdminReportsModalOpen, isSashView, isCompletedModalOpen, isAddEditModalOpen, isPdfModalOpen]);

  useEffect(() => {
    fetchFaixaConfig().then(setFaixaConfig).catch(console.warn);

    const handleFaixaConfigChange = (e: any) => {
      if (e?.detail) {
        setFaixaConfig(e.detail);
      } else {
        fetchFaixaConfig().then(setFaixaConfig).catch(console.warn);
      }
    };

    window.addEventListener('storage', handleFaixaConfigChange);
    window.addEventListener('dbv_faixa_config_updated', handleFaixaConfigChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleFaixaConfigChange);
      window.removeEventListener('dbv_faixa_config_updated', handleFaixaConfigChange as EventListener);
    };
  }, []);

  // IDs das 6 Classes Regulares (Amigo, Companheiro, Pesquisador, Pioneiro, Excursionista e Guia)
  const regularClassIds = useMemo(() => {
    const ids = allConquistas
      .filter(c => c.tipo === 'CLASSE_REGULAR')
      .map(c => c.id);
    return ids.length >= 6 ? ids : [2, 3, 4, 5, 6, 7];
  }, [allConquistas]);

  // Verifica se TODAS as 6 Classes Regulares estão ativas
  const hasAllRegularClasses = useMemo(() => {
    return regularClassIds.length > 0 && regularClassIds.every(id => userAchievements.includes(id));
  }, [regularClassIds, userAchievements]);

  // Verifica se o usuário tem o pin de Líder, Master ou Master Avançado ativo
  // Regra: Só pode investir em Líder a partir de 18 anos e com todas as 6 classes regulares ativas
  const hasLeaderPin = useMemo(() => {
    if (userAge === null || userAge < 18 || !hasAllRegularClasses) return false;
    const leaderIds = [9, 10, 11];
    if (userAchievements.some(id => leaderIds.includes(id))) return true;

    return allConquistas.some(c => 
      userAchievements.includes(c.id) && (
        c.tipo === 'LIDERANCA' || 
        (c.nome && (
          c.nome.toLowerCase().includes('lider') || 
          c.nome.toLowerCase().includes('líder') ||
          c.nome.toLowerCase().includes('master')
        ))
      )
    );
  }, [userAchievements, allConquistas, userAge, hasAllRegularClasses]);

  // Determina dinamicamente o Globo a ser exibido na ponta da faixa:
  // 1. Quem ativar o pin de líder, master e master avançado -> "globo lider"
  // 2. 16 anos acima -> "globo liderança" (fundo branco)
  // 3. Até 15 anos -> "globo desbravador" (fundo cáqui)
  const sashGlobeInfo = useMemo(() => {
    if (hasLeaderPin) {
      return {
        type: 'LIDER' as const,
        url: faixaConfig.globo_lider || DEFAULT_FAIXA_CONFIG.globo_lider,
        label: 'Globo de Líder',
        sublabel: 'Pin de Líder / Master Ativo',
        description: 'Emblema L1 oficial de liderança com a estrela de ouro ao centro. Exibido na ponta da faixa para quem conquistou e ativou o pin de Líder, Líder Master ou Líder Master Avançado.',
        badgeColor: 'bg-amber-400 text-slate-900 border-amber-300'
      };
    }

    const is16OrAbove = userAge !== null ? userAge >= 16 : isAdultUniform;
    if (is16OrAbove) {
      return {
        type: 'LIDERANCA' as const,
        url: faixaConfig.globo_lideranca || DEFAULT_FAIXA_CONFIG.globo_lideranca,
        label: 'Globo Liderança (16+ anos)',
        sublabel: 'Fundo Branco Oficial',
        description: 'Emblema D4 bordado sobre fundo branco oficial da liderança dos Desbravadores para membros a partir de 16 anos.',
        badgeColor: 'bg-white text-slate-800 border-slate-200'
      };
    }

    return {
      type: 'DESBRAVADOR' as const,
      url: faixaConfig.globo_desbravador || DEFAULT_FAIXA_CONFIG.globo_desbravador,
      label: 'Globo Desbravador (Até 15 anos)',
      sublabel: 'Fundo Cáqui Oficial',
      description: 'Emblema D4 bordado sobre fundo cáqui oficial dos Desbravadores para membros de até 15 anos de idade.',
      badgeColor: 'bg-[#bba882] text-white border-[#9b8862]'
    };
  }, [hasLeaderPin, userAge, isAdultUniform, faixaConfig]);

  const toggleBaptism = () => {
    const next = !isBaptizedEffective;
    setIsBaptized(next);
    try {
      localStorage.setItem('dbv_tudo_user_baptized', JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    if (batismoConquista) {
      toggleAchievement(batismoConquista.id);
    }
  };

  useEffect(() => {
    fetchFuncoes().then(loaded => {
      if (loaded && loaded.length > 0) {
        setCargosList(loaded);
      }
    });
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setIsLoadingReports(true);
      fetchAllErrorReports()
        .then(setErrorReportsList)
        .catch(console.warn)
        .finally(() => setIsLoadingReports(false));

      const handleReportsUpdated = (e: any) => {
        if (e?.detail && Array.isArray(e.detail)) {
          setErrorReportsList(e.detail);
        } else {
          fetchAllErrorReports().then(setErrorReportsList).catch(console.warn);
        }
      };
      window.addEventListener('dbv_error_reports_updated', handleReportsUpdated);
      return () => {
        window.removeEventListener('dbv_error_reports_updated', handleReportsUpdated);
      };
    }
  }, [isAdmin]);

  const pendingReportsCount = useMemo(() => {
    return errorReportsList.filter(r => r.status === 'PENDING').length;
  }, [errorReportsList]);

  const filteredAdminReports = useMemo(() => {
    let list = [...errorReportsList];
    if (errorReportsFilter === 'PENDING') {
      list = list.filter(r => r.status === 'PENDING');
    } else if (errorReportsFilter === 'RESOLVED') {
      list = list.filter(r => r.status === 'RESOLVED');
    }
    if (errorReportsSearch.trim()) {
      const q = errorReportsSearch.toLowerCase();
      list = list.filter(r =>
        (r.title || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.userName || '').toLowerCase().includes(q) ||
        (r.userEmail || '').toLowerCase().includes(q) ||
        (r.location || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [errorReportsList, errorReportsFilter, errorReportsSearch]);

  const likedKey = `dbv_tudo_liked_specialties_${userClubType}`;

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const initialData = getInitialData();
      const initialClubType = initialData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
      return getLocalFaixaSpecialties(initialData.email, initialClubType);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleCloudAppliedInProfile = () => {
      try {
        const clubType = userData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
        const freshFaixa = getLocalFaixaSpecialties(userData.email, clubType);
        setLikedIds((prev) => (JSON.stringify(prev) === JSON.stringify(freshFaixa) ? prev : freshFaixa));

        const achRaw = localStorage.getItem('dbv_tudo_user_achievements');
        if (achRaw) {
          const parsedAch = JSON.parse(achRaw);
          if (Array.isArray(parsedAch)) {
            setUserAchievements((prev) => (JSON.stringify(prev) === JSON.stringify(parsedAch) ? prev : parsedAch));
          }
        }
        const bapRaw = localStorage.getItem('dbv_tudo_user_baptized');
        if (bapRaw !== null) {
          const parsedBap = JSON.parse(bapRaw);
          setIsBaptized(Boolean(parsedBap));
        }

        // Sincroniza especialidades concluídas que vieram da nuvem (Celular <-> PC)
        const compRaw = localStorage.getItem(completedStorageKey) || localStorage.getItem('dbv_tudo_completed_specialties');
        if (compRaw) {
          const parsedComp = JSON.parse(compRaw);
          if (Array.isArray(parsedComp)) {
            setCompletedSpecialties((prev) => (JSON.stringify(prev) === JSON.stringify(parsedComp) ? prev : parsedComp));
          }
        }
      } catch {}
    };
    window.addEventListener('dbv_cloud_sync_applied', handleCloudAppliedInProfile);
    window.addEventListener('dbv_completed_specialties_updated', handleCloudAppliedInProfile);
    window.addEventListener('storage', handleCloudAppliedInProfile);
    return () => {
      window.removeEventListener('dbv_cloud_sync_applied', handleCloudAppliedInProfile);
      window.removeEventListener('dbv_completed_specialties_updated', handleCloudAppliedInProfile);
      window.removeEventListener('storage', handleCloudAppliedInProfile);
    };
  }, [userData.email, userData.tipo, completedStorageKey]);

  // Carregar dados do Supabase se houver usuário logado
  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getSafeAuthUser();
        if (user) {
          setUserId(user.id);
          let profile = await fetchUserProfile(user.id);
          
          if (!profile && user.email) {
            profile = await fetchUserProfileByEmail(user.email);
            if (profile) {
              await updateUserProfile({ user_id: user.id, email: user.email });
            }
          }

          if (profile) {
            // Recupera a data de nascimento priorizando banco, auth metadata, campo fundo ou storage local
            let birthDate = 
              profile.data_nascimento || 
              (profile as any)['data de nascimento'] || 
              (profile as any)['nascimento'] ||
              user.user_metadata?.data_nascimento;

            if (!birthDate && profile.fundo) {
              try {
                const parsed = JSON.parse(profile.fundo);
                if (parsed.data_nascimento) birthDate = parsed.data_nascimento;
              } catch {
                if (/^\d{4}-\d{2}-\d{2}$/.test(profile.fundo)) {
                  birthDate = profile.fundo;
                }
              }
            }

            // Preserva data existente caso o banco não retorne nenhuma
            if (!birthDate) {
              const currentLocal = getInitialData();
              birthDate = userData.data_nascimento || currentLocal.data_nascimento || "";
            }

            // Recupera tipo sanguíneo e fator RH (banco, fundo JSON, auth metadata ou local)
            let bloodType = profile.tipo_sanguineo || (profile as any)['tipo sanguineo'] || (profile as any)['tipo_sanguineo'] || user.user_metadata?.tipo_sanguineo;
            let rhFactor = profile.fator_rh || (profile as any)['fator rh'] || (profile as any)['fator_rh'] || user.user_metadata?.fator_rh;

            if (profile.fundo) {
              try {
                const parsed = JSON.parse(profile.fundo);
                if (!bloodType && parsed.tipo_sanguineo) bloodType = parsed.tipo_sanguineo;
                if (!rhFactor && parsed.fator_rh) rhFactor = parsed.fator_rh;
                const cloudList = (parsed.completedSpecialties && Array.isArray(parsed.completedSpecialties))
                  ? parsed.completedSpecialties
                  : [];

                const effMail = profile.email || user.email || userData.email;
                const cKey = effMail && effMail !== 'email@exemplo.com' ? `dbv_tudo_completed_specialties_${effMail}` : 'dbv_tudo_completed_specialties';

                setCompletedSpecialties(prev => {
                  const deletedSet = getDeletedCompletedSpecialtyIds();
                  const byId = new Map<string, any>();
                  for (const item of [...cloudList, ...prev]) {
                    if (!item) continue;
                    const sId = String(item.specialtyId ?? item.id ?? item.code ?? item.name);
                    if (deletedSet.has(sId)) continue;
                    const exist = byId.get(sId);
                    byId.set(sId, exist ? { ...exist, ...item } : item);
                  }
                  const merged = Array.from(byId.values()).sort((a: any, b: any) => {
                    const addedA = Number(a.addedAt || 0);
                    const addedB = Number(b.addedAt || 0);
                    if (addedB !== addedA) return addedB - addedA;
                    return (b.completionDate || '').localeCompare(a.completionDate || '');
                  });

                  try {
                    localStorage.setItem(cKey, JSON.stringify(merged));
                    localStorage.setItem('dbv_tudo_completed_specialties', JSON.stringify(merged));
                  } catch {}

                  // Se o aparelho local tiver especialidades que a nuvem ainda não tem, faz upload
                  if (cloudList.length < merged.length && user.id) {
                    saveUserCompletedSpecialtiesToCloud(merged, effMail, user.id).catch(console.warn);
                    pushLocalStateToCloud().catch(console.warn);
                  }

                  return merged;
                });

              } catch {}
            }

            if (!bloodType) {
              const currentLocal = getInitialData();
              bloodType = userData.tipo_sanguineo || currentLocal.tipo_sanguineo || "";
            }
            if (!rhFactor) {
              const currentLocal = getInitialData();
              rhFactor = userData.fator_rh || currentLocal.fator_rh || "";
            }

            const effectiveEmail = profile.email || (profile as any)['e - mail'] || user.email || userData.email;
            const mappedData = {
              name: profile.nome || userData.name,
              email: effectiveEmail,
              tipo: profile.clubes === "Aventureiro" ? "Aventureiro" : "Desbravador",
              clube: profile.clube || profile.clube_de || (profile as any)['clube de'] || userData.clube,
              cargo: profile.funçao || userData.cargo,
              telefone: profile.telefone || userData.telefone,
              avatar: profile.foto || userData.avatar,
              cidade: profile.cidade || "",
              estado: profile.estado || "",
              data_nascimento: birthDate || "",
              tipo_sanguineo: bloodType || "",
              fator_rh: rhFactor || "",
              isAdmin: profile.ADM || false
            };
            setUserData(mappedData);
            try {
              localStorage.setItem(storageKey, JSON.stringify(mappedData));
            } catch (e) {}

            // Carrega e sincroniza imediatamente as especialidades da faixa do Supabase
            const userClub = mappedData.tipo === "Aventureiro" ? ClubType.ADVENTURER : ClubType.PATHFINDER;
            const dbSpecialtiesRaw = profile.Especialidades !== undefined ? profile.Especialidades : (profile as any).especialidades;
            if (dbSpecialtiesRaw !== undefined && dbSpecialtiesRaw !== null) {
              let parsedIds: string[] = [];
              if (typeof dbSpecialtiesRaw === 'string') {
                parsedIds = dbSpecialtiesRaw.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
              } else if (Array.isArray(dbSpecialtiesRaw)) {
                parsedIds = dbSpecialtiesRaw.map((id: any) => String(id).trim()).filter((id: string) => id.length > 0);
              }
              if (parsedIds.length > 0) {
                setLikedIds(parsedIds);
                saveLocalFaixaSpecialties(parsedIds, effectiveEmail, userClub);
              }
            }
          } else if (user.user_metadata?.data_nascimento) {
            setUserData(prev => ({ ...prev, data_nascimento: user.user_metadata.data_nascimento }));
          }
        }
      } catch (err) {
        console.warn("Erro ao verificar usuário:", err);
      }
    };
    checkUser();
  }, []);

  // Carregar faixa e sincronizar com o banco sem perder especialidades da faixa local
  useEffect(() => {
    const loadLiked = async () => {
      // 1. Sempre carrega imediatamente os dados locais da faixa do clube atual
      const local = getLocalFaixaSpecialties(userData.email, userClubType);
      if (local.length > 0) {
        setLikedIds(prev => {
          const combined = Array.from(new Set([...prev, ...local]));
          if (prev.length === combined.length && prev.every((id, idx) => id === combined[idx])) {
            return prev;
          }
          return combined;
        });
      }

      // 2. Se tiver email do usuário, busca do banco e sincroniza
      if (userData.email && userData.email !== "email@exemplo.com") {
        try {
          const dbIds = await fetchUserFaixaSpecialties(userData.email, userId, userClubType);
          const currentLocal = getLocalFaixaSpecialties(userData.email, userClubType);

          if (dbIds && dbIds.length > 0) {
            setLikedIds(prev => {
              const combined = Array.from(new Set([...prev, ...dbIds, ...currentLocal]));
              if (prev.length === combined.length && prev.every((id, idx) => id === combined[idx])) {
                return prev;
              }
              saveLocalFaixaSpecialties(combined, userData.email, userClubType);
              return combined;
            });

            // Se o dispositivo local tiver especialidades que ainda não estão no banco (ex: salvas no celular), envia agora
            if (currentLocal.some(id => !dbIds.includes(id))) {
              const merged = Array.from(new Set([...dbIds, ...currentLocal]));
              await updateUserFaixa(userData.email, merged, userId, userClubType);
            }
          } else {
            // Se o banco retornou vazio mas temos especialidades locais da faixa, restaura no banco
            if (currentLocal.length > 0) {
              await updateUserFaixa(userData.email, currentLocal, userId, userClubType);
            }
          }
        } catch (err) {
          console.warn("Erro ao buscar especialidades da faixa do usuário:", err);
        }
      }
    };

    loadLiked();
  }, [userClubType, userData.email, userId]);

  const currentThemeColor = userData.tipo === "Desbravador" ? '#dc371b' : '#800000';
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowScrollTop(scrollTop > 150);
    setIsHeaderScrolled(scrollTop > 80);
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Sincronizar se o localStorage mudar externamente ou se dados do perfil forem alterados
  useEffect(() => {
    const data = getInitialData();
    setUserData(data);
  }, [storageKey]);

  // Listener para sincronização imediata de especialidades da Faixa
  useEffect(() => {
    const handleFaixaSync = (e: any) => {
      const targetClub = userClubType === ClubType.ADVENTURER ? 'ADVENTURER' : 'PATHFINDER';
      if (e?.detail?.club && e.detail.club !== targetClub) return;
      
      const incoming: string[] = (e?.detail?.specialties && Array.isArray(e.detail.specialties))
        ? e.detail.specialties
        : getLocalFaixaSpecialties(userData.email, userClubType);

      if (incoming && Array.isArray(incoming)) {
        setLikedIds(prev => {
          if (prev.length === incoming.length && prev.every((id, idx) => id === incoming[idx])) {
            return prev;
          }
          return incoming;
        });
      }
    };
    window.addEventListener('dbv_faixa_changed', handleFaixaSync);
    window.addEventListener('storage', handleFaixaSync);
    return () => {
      window.removeEventListener('dbv_faixa_changed', handleFaixaSync);
      window.removeEventListener('storage', handleFaixaSync);
    };
  }, [userData.email, userClubType]);

  // Carregar metadados das especialidades do clube ativo garantindo sincronia imediata com o Supabase
  useEffect(() => {
    let isMounted = true;
    const loadSpecialties = async (force = false) => {
      setIsLoading(true);
      try {
        const data = await fetchEspecialidades(userClubType, undefined, { excludeQuestions: true, forceRefresh: force });
        if (isMounted && data && data.length > 0) {
          const clubOnly = data.filter(s => s.club === userClubType);
          const sorted = [...clubOnly].sort((a, b) => a.nome.localeCompare(b.nome));
          setAllSpecialties(sorted);
        }
      } catch (err) {
        console.warn("Erro ao buscar especialidades no perfil:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Sempre executa busca atualizada na nuvem
    loadSpecialties(true);

    const handleSpecialtiesUpdated = (e: any) => {
      if (e?.detail?.specialties && Array.isArray(e.detail.specialties)) {
        const clubOnly = e.detail.specialties.filter((s: Especialidade) => s.club === userClubType);
        if (clubOnly.length > 0) {
          const sorted = [...clubOnly].sort((a, b) => a.nome.localeCompare(b.nome));
          setAllSpecialties(sorted);
        }
      } else {
        loadSpecialties(true);
      }
    };

    window.addEventListener('dbv_especialidades_updated', handleSpecialtiesUpdated);
    window.addEventListener('dbv_especialidades_cache_invalidated', handleSpecialtiesUpdated);

    return () => { 
      isMounted = false; 
      window.removeEventListener('dbv_especialidades_updated', handleSpecialtiesUpdated);
      window.removeEventListener('dbv_especialidades_cache_invalidated', handleSpecialtiesUpdated);
    };
  }, [userClubType, isSashView, isCompletedModalOpen, isAddEditModalOpen]);

  useEffect(() => {
    setVisibleSashModalCount(40);
  }, [searchTerm, isSashView, userClubType]);

  // Salvar especialidades da faixa no localStorage ao alterar
  useEffect(() => {
    if (likedIds && likedIds.length > 0) {
      saveLocalFaixaSpecialties(likedIds, userData.email, userClubType);
    }
  }, [likedIds, userData.email, userClubType]);

  // Carregar conquistas
  useEffect(() => {
    fetchConquistas()
      .then(setAllConquistas)
      .catch(err => console.warn("Erro ao buscar conquistas:", err));

    if (userData.email && userData.email !== "email@exemplo.com") {
      fetchUserAchievements(userData.email)
        .then(data => {
          if (data && data.length > 0) {
            setUserAchievements(data);
            localStorage.setItem('dbv_tudo_user_achievements', JSON.stringify(data));
          }
        })
        .catch(err => console.warn("Erro ao buscar conquistas do usuário:", err));
    }
  }, [userData.email]);

  // Salvar conquistas no localStorage ao mudar
  useEffect(() => {
    localStorage.setItem('dbv_tudo_user_achievements', JSON.stringify(userAchievements));
  }, [userAchievements]);

  const toggleAchievement = async (id: number) => {
    const con = allConquistas.find(c => c.id === id);
    if (con) {
      const eligibility = checkConquistaEligibility(con, userAge);
      if (!eligibility.isEligible) {
        alert(`⚠️ ${con.nome}: ${eligibility.msg}`);
        return;
      }
    }

    // Regras de progressão de Liderança:
    // 0. Só libera Líder (9), Líder Master (10) e Líder Master Avançado (11) se tiver 18+ anos e TODAS as 6 Classes Regulares ativas
    if ((id === 9 || id === 10 || id === 11 || con?.tipo === 'LIDERANCA') && !userAchievements.includes(id)) {
      if (userAge === null || userAge < 18) {
        alert("⚠️ A investidura em Líder só é permitida a partir dos 18 anos (apesar de poder iniciar a classe aos 16 anos).");
        return;
      }
      if (!hasAllRegularClasses) {
        alert("⚠️ Para liberar o distintivo de Líder, é necessário estar com todas as 6 Classes Regulares (Amigo, Companheiro, Pesquisador, Pioneiro, Excursionista e Guia) ativas.");
        return;
      }
    }

    // 1. Só pode selecionar Líder Master (ID 10) se Líder (ID 9) estiver selecionado
    if (id === 10 && !userAchievements.includes(10) && !userAchievements.includes(9)) {
      alert("⚠️ Para condecorar o distintivo de Líder Master, é necessário primeiro selecionar o distintivo de Líder.");
      return;
    }

    // 2. Só pode selecionar Líder Master Avançado (ID 11) se Líder Master (ID 10) estiver selecionado
    if (id === 11 && !userAchievements.includes(11) && !userAchievements.includes(10)) {
      alert("⚠️ Para condecorar o distintivo de Líder Master Avançado, é necessário primeiro selecionar o distintivo de Líder Master.");
      return;
    }

    setUserAchievements(prev => {
      const isAcquired = prev.includes(id);
      let newList: number[];

      if (isAcquired) {
        // Ao desmarcar Líder (9), desmarca também Líder Master (10) e Líder Master Avançado (11)
        if (id === 9) {
          newList = prev.filter(i => i !== 9 && i !== 10 && i !== 11);
        } else if (id === 10) {
          // Ao desmarcar Líder Master (10), desmarca também Líder Master Avançado (11)
          newList = prev.filter(i => i !== 10 && i !== 11);
        } else if (regularClassIds.includes(id)) {
          // Ao desmarcar qualquer uma das 6 Classes Regulares, as classes de Liderança também são desativadas
          newList = prev.filter(i => i !== id && i !== 9 && i !== 10 && i !== 11);
        } else {
          newList = prev.filter(i => i !== id);
        }
      } else {
        newList = [...prev, id];
      }
      
      // Update Supabase in background
      if (userData.email && userData.email !== "email@exemplo.com") {
        updateUserAchievements(userData.email, newList);
      }
      
      return newList;
    });
  };

  const toggleLike = async (id: number) => {
    const idStr = id.toString();
    const isLiked = likedIds.includes(idStr);
    
    // Calcula a nova lista exclusiva da Faixa
    const newList = isLiked 
      ? likedIds.filter(i => i !== idStr) 
      : [...likedIds, idStr];

    // Atualiza localmente primeiro (UI rápida) exclusivamente para a Faixa
    setLikedIds(newList);
    saveLocalFaixaSpecialties(newList, userData.email, userClubType);

    // Salva no banco de dados na coluna Especialidades de Usuarios
    if (userData.email && userData.email !== "email@exemplo.com") {
      await updateUserFaixa(userData.email, newList, userId, userClubType);
    }
  };

  const handleResetSpecialties = async () => {
    setLikedIds([]);
    clearLocalFaixaSpecialties(userData.email, userClubType);

    if (userData.email && userData.email !== "email@exemplo.com") {
      await updateUserFaixa(userData.email, [], userId, userClubType);
    }
    setShowResetConfirm(false);
  };

  const likedSpecialtiesList = useMemo(() => {
    const list: Especialidade[] = [];
    const seenIds = new Set<string>();

    allSpecialties
      .filter(s => s.club === userClubType)
      .filter(s => likedIds.includes(s.id.toString()))
      .forEach(s => {
        list.push(s);
        seenIds.add(s.id.toString());
      });

    // Se houver especialidade concluída marcada para a faixa mas que não estava no catálogo oficial moderno
    completedSpecialties.forEach(c => {
      const cId = String(c.specialtyId);
      if (likedIds.includes(cId) && !seenIds.has(cId)) {
        list.push({
          id: Number(c.specialtyId) || Date.now(),
          nome: c.name,
          codigo: c.code,
          area: c.area || 'Atividades Recreativas',
          logo: c.logo || '',
          requisitos: [],
          club: userClubType
        });
        seenIds.add(cId);
      }
    });

    return list;
  }, [allSpecialties, likedIds, completedSpecialties, userClubType]);

  const filteredSpecialties = useMemo(() => {
    const base: Especialidade[] = [...allSpecialties.filter(s => s.club === userClubType)];
    const seen = new Set(base.map(s => String(s.id)));

    // Permite que qualquer especialidade concluída adicionada pelo usuário também possa ser favoritada para a faixa
    completedSpecialties.forEach(c => {
      const cId = String(c.specialtyId);
      if (!seen.has(cId)) {
        seen.add(cId);
        base.push({
          id: Number(c.specialtyId) || 0,
          nome: c.name,
          codigo: c.code,
          area: c.area || 'Outras',
          logo: c.logo || '',
          requisitos: [],
          club: userClubType
        });
      }
    });

    const q = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (!q) return base;

    const tokens = q.split(/\s+/).filter(t => t.length > 0 && t !== 'de' && t !== 'da' && t !== 'do' && t !== 'e' && t !== 'em');
    const isSearchingRetired = q.includes('antig') || q.includes('manual') || q.includes('retirad') || q.includes('excluid') || q.includes('histor');

    return base.filter(s => {
      const n = (s.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const c = (s.codigo || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const a = (s.area || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const fullText = `${n} ${c} ${a}`;

      if (fullText.includes(q)) return true;
      if (tokens.length > 0 && tokens.every(tok => fullText.includes(tok))) return true;

      if (isSearchingRetired) {
        if (
          n.includes('telecartofilia') || n.includes('estofamento') || n.includes('fantoches') ||
          n.includes('gado leiteiro') || n.includes('plantas silvestres') || n.includes('marcenaria') ||
          n.includes('artes mateiras') || n.includes('construcoes rusticas') || n.includes('skate') ||
          n.includes('waveboarding') || n.includes('braille') || n.includes('lingua de sinais') ||
          n.includes('producao de video') || n.includes('computacao iii') || n.includes('mecanica automotiva') ||
          n.includes('soldagem') || n.includes('mordomia') || n.includes('violao') || n.includes('impressora') || (Number(s.id) >= 2330)
        ) {
          return true;
        }
      }
      return false;
    });
  }, [allSpecialties, completedSpecialties, searchTerm, userClubType]);

  // Bloquear scroll do fundo quando modal aberto
  useEffect(() => {
    if (isSashView || isEditing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSashView, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleClubToggle = (type: string) => {
    setUserData(prev => ({ ...prev, tipo: type }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setUserData(prev => ({ ...prev, avatar: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(userData));
      
      // Filtrar conquistas se a idade mudou e alguma não for mais elegível
      const currentAge = calculateAge(userData.data_nascimento);
      let updatedAchievements = userAchievements;
      if (currentAge !== null) {
        updatedAchievements = userAchievements.filter(id => {
          const con = allConquistas.find(c => c.id === id);
          return !con || checkConquistaEligibility(con, currentAge).isEligible;
        });
        if (updatedAchievements.length !== userAchievements.length) {
          setUserAchievements(updatedAchievements);
          localStorage.setItem('dbv_tudo_user_achievements', JSON.stringify(updatedAchievements));
        }
      }

      // Salvar no Supabase se tiver userId ou email
      if (userData.email && userData.email !== "email@exemplo.com") {
        // Salvar data_nascimento, tipo_sanguineo, fator_rh e cargo no Supabase Auth metadata para persistência definitiva na nuvem
        try {
          await supabase.auth.updateUser({
            data: { 
              data_nascimento: userData.data_nascimento,
              tipo_sanguineo: userData.tipo_sanguineo,
              fator_rh: userData.fator_rh,
              cargo: userData.cargo
            }
          });
        } catch (authErr) {
          console.warn("Erro ao salvar dados médicos no auth metadata:", authErr);
        }

        // 1. Salvar Perfil Básico
        const profile: Partial<UserProfile> = {
          nome: userData.name,
          email: userData.email,
          telefone: userData.telefone,
          foto: userData.avatar,
          clube: userData.clube,
          funçao: userData.cargo,
          clubes: userData.tipo,
          cidade: userData.cidade,
          estado: userData.estado,
          data_nascimento: userData.data_nascimento,
          tipo_sanguineo: userData.tipo_sanguineo,
          fator_rh: userData.fator_rh,
          fundo: JSON.stringify({ 
            data_nascimento: userData.data_nascimento,
            tipo_sanguineo: userData.tipo_sanguineo,
            fator_rh: userData.fator_rh,
            cargo: userData.cargo,
            completedSpecialties: completedSpecialties
          }),
          ADM: userData.isAdmin
        };

        if (userId) {
          profile.user_id = userId;
        }

        await updateUserProfile(profile);

        // 2. Salvar Especialidades da Faixa (likedIds ou locais)
        const effectiveSpecialties = likedIds.length > 0 ? likedIds : getLocalFaixaSpecialties(userData.email, userClubType);
        await updateUserFaixa(userData.email, effectiveSpecialties, userId, userClubType);

        // 3. Salvar Conquistas
        await updateUserAchievements(userData.email, updatedAchievements);
      }
      
      setIsEditing(false);
      // Disparar evento de storage para outros componentes (como o dashboard) saberem que mudou
      window.dispatchEvent(new Event('storage'));
      alert("Perfil e dados salvos com sucesso na nuvem!");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao sincronizar com a nuvem. Verifique sua conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackNavigation = () => {
    const clubToNavigate = userData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
    onBack(clubToNavigate);
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden relative transition-colors duration-500">
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      {/* Modal Informativo do Globo da Faixa */}
      {showGloboModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setShowGloboModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[36px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            {/* Header com tecido verde da faixa */}
            <div className="bg-[#0c3c31] px-6 pt-6 pb-5 text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />
              <div className="relative z-10 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Shield size={22} className="text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight">Ponta da Faixa Oficial</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-200/80">Extremidade Inferior & Globo</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGloboModal(false)}
                className="relative z-10 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white active:scale-90 transition-all"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Conteúdo com visual do globo em destaque */}
            <div className="p-6 space-y-5">
              <div className="flex flex-col items-center">
                <div className="w-28 h-28 bg-[#0c3c31] rounded-3xl p-2.5 flex items-center justify-center shadow-lg relative border-2 border-[#092d25]">
                  <div className="absolute inset-0 opacity-15 rounded-3xl pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px]" />
                  <img 
                    src={sashGlobeInfo.url} 
                    alt={sashGlobeInfo.label}
                    className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)] relative z-10" 
                  />
                </div>
                <div className="mt-3 text-center">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider shadow-sm"
                    style={{
                      backgroundColor: sashGlobeInfo.type === 'LIDER' ? '#fef3c7' : sashGlobeInfo.type === 'LIDERANCA' ? '#f8fafc' : '#fef3c7',
                      color: sashGlobeInfo.type === 'LIDER' ? '#92400e' : sashGlobeInfo.type === 'LIDERANCA' ? '#0f172a' : '#78350f',
                      borderColor: sashGlobeInfo.type === 'LIDER' ? '#fcd34d' : sashGlobeInfo.type === 'LIDERANCA' ? '#cbd5e1' : '#fde68a'
                    }}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>{sashGlobeInfo.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs font-medium leading-relaxed">
                    {sashGlobeInfo.description}
                  </p>
                </div>
              </div>

              {/* Critérios Oficiais do Manual de Uniformes */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 space-y-2.5 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Regras Oficiais do Uniforme (DSA)</span>
                
                <div className="space-y-2 text-xs">
                  <div className={`flex items-start space-x-2 p-2.5 rounded-xl transition-all ${sashGlobeInfo.type === 'DESBRAVADOR' ? 'bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 font-bold text-amber-900 dark:text-amber-200' : 'opacity-70'}`}>
                    <span className="text-base leading-none">🏕️</span>
                    <div>
                      <strong className="block">Até 15 anos: Globo Desbravador</strong>
                      <span className="text-[11px] opacity-80">Fundo cáqui oficial na extremidade da faixa.</span>
                    </div>
                  </div>

                  <div className={`flex items-start space-x-2 p-2.5 rounded-xl transition-all ${sashGlobeInfo.type === 'LIDERANCA' ? 'bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/60 font-bold text-emerald-900 dark:text-emerald-200' : 'opacity-70'}`}>
                    <span className="text-base leading-none">👔</span>
                    <div>
                      <strong className="block">A partir de 16 anos: Globo Liderança</strong>
                      <span className="text-[11px] opacity-80">Fundo branco oficial da liderança.</span>
                    </div>
                  </div>

                  <div className={`flex items-start space-x-2 p-2.5 rounded-xl transition-all ${sashGlobeInfo.type === 'LIDER' ? 'bg-amber-100/70 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 font-bold text-amber-900 dark:text-amber-200' : 'opacity-70'}`}>
                    <span className="text-base leading-none">🌟</span>
                    <div>
                      <strong className="block">Pins Líder / Master / Master Avançado</strong>
                      <span className="text-[11px] opacity-80">Globo de Líder (L1) com a estrela dourada de ouro ao centro.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Atual do Usuário */}
              <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>Idade: <strong className="text-slate-800 dark:text-slate-200">{userAge !== null ? `${userAge} anos` : 'Não informada'}</strong></span>
                <span>Pin Líder: <strong className={hasLeaderPin ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}>{hasLeaderPin ? "Ativo" : "Inativo"}</strong></span>
              </div>

              {/* Botão Admin para Gerenciar Imagens */}
              {userData.isAdmin && onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowGloboModal(false);
                    onOpenAdmin();
                  }}
                  className="w-full py-3 bg-[#0c3c31] hover:bg-[#092d25] active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Settings size={15} />
                  <span>Configurar Imagens no Painel Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Minha Faixa */}
      {isSashView && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSashView(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 h-[90vh] flex flex-col">
            <div 
              style={{ backgroundColor: userData.tipo === "Desbravador" ? '#0c3c31' : currentThemeColor }}
              className="p-6 pb-5 flex items-center justify-between text-white"
            >
              <div className="flex flex-col">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight">Minha Faixa Oficial</h3>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mt-0.5">Faixa Verde-Petróleo • Especialidades</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    invalidateEspecialidadesCache(userClubType);
                    const fresh = await fetchEspecialidades(userClubType, undefined, { excludeQuestions: true, forceRefresh: true });
                    if (fresh && fresh.length > 0) {
                      const clubOnly = fresh.filter(s => s.club === userClubType);
                      setAllSpecialties([...clubOnly].sort((a, b) => a.nome.localeCompare(b.nome)));
                    }
                    setIsLoading(false);
                  }}
                  title="Sincronizar especialidades com o banco de dados"
                  className="h-9 px-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center gap-1.5 text-white active:scale-95 transition-all text-[11px] font-bold border border-white/20 cursor-pointer"
                >
                  <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
                <button 
                  onClick={() => setIsSashView(false)}
                  className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all border border-white/20 cursor-pointer"
                  title="Fechar"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>
            </div>
            
            <div className="p-6 pb-2 space-y-3">
              <div className="relative w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400">
                  <Search size={18} />
                </div>
                <input 
                  type="text"
                  placeholder="Buscar especialidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-400"
                />
              </div>

              {likedIds.length > 0 && (
                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{likedIds.length} especialidade{likedIds.length > 1 ? 's' : ''} favoritada{likedIds.length > 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="text-rose-500 hover:text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    <span>Limpar tudo</span>
                  </button>
                </div>
              )}
            </div>

            <div 
              className="flex-grow overflow-y-auto p-6 pt-2 space-y-3 scrollbar-hide"
              onScroll={(e) => {
                const el = e.currentTarget;
                if (el.scrollHeight - el.scrollTop - el.clientHeight < 250 && visibleSashModalCount < filteredSpecialties.length) {
                  setVisibleSashModalCount(prev => Math.min(prev + 40, filteredSpecialties.length));
                }
              }}
            >
              {isLoading && allSpecialties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredSpecialties.length > 0 ? (
                <>
                  {filteredSpecialties.slice(0, visibleSashModalCount).map((esp) => (
                    <div key={esp.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-4 flex items-center space-x-4 shadow-sm hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                      <div className="w-14 h-14 flex items-center justify-center flex-shrink-0 shrink-0">
                        {esp.logo ? (
                          <img src={esp.logo} loading="lazy" decoding="async" className="w-full h-full object-contain filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.25)] select-none pointer-events-none" alt={esp.nome} />
                        ) : (
                          <Award size={24} className="text-slate-300 dark:text-slate-400" />
                        )}
                      </div>
                      <div className="flex-grow text-left min-w-0 pr-1">
                        <h4 className="font-black text-slate-700 dark:text-slate-200 text-[12px] uppercase tracking-tight leading-tight">
                          {esp.nome}
                        </h4>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                          {esp.codigo}
                        </p>
                      </div>
                      <button 
                        onClick={() => toggleLike(esp.id)}
                        className={`w-11 h-11 min-w-[44px] max-w-[44px] min-h-[44px] max-h-[44px] shrink-0 flex-shrink-0 aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
                          likedIds.includes(esp.id.toString()) 
                            ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 shadow-sm' 
                            : 'bg-slate-50 dark:bg-slate-700 text-slate-300 dark:text-slate-500'
                        }`}
                      >
                        <Heart size={20} className="shrink-0" fill={likedIds.includes(esp.id.toString()) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  ))}
                  {visibleSashModalCount < filteredSpecialties.length && (
                    <button
                      type="button"
                      onClick={() => setVisibleSashModalCount(prev => Math.min(prev + 40, filteredSpecialties.length))}
                      className="w-full py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider transition-all active:scale-95"
                    >
                      Mostrar mais ({filteredSpecialties.length - visibleSashModalCount} restantes)
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Nenhuma especialidade encontrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {isEditing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[84vh] flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Editar Perfil</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 active:scale-90 transition-all"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 pt-4 space-y-5 scrollbar-hide">
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[28px] border-4 border-slate-50 dark:border-slate-800 shadow-md overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all flex items-center justify-center ring-4 ring-emerald-500/5">
                    {userData.avatar ? (
                      <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <User size={40} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[28px] transition-opacity opacity-0 group-hover:opacity-100"
                  >
                    <Camera size={22} className="text-white" />
                  </button>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg border-2 border-white dark:border-slate-900 shadow-sm bg-amber-500 flex items-center justify-center">
                    <Settings size={11} className="text-white" />
                  </div>
                </div>
                <p className="mt-2.5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Alterar Foto</p>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">Tipo de Ministério</label>
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl space-x-1 border border-slate-200/50 dark:border-slate-700/50">
                  <button 
                    onClick={() => handleClubToggle("Desbravador")} 
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${userData.tipo === "Desbravador" ? 'bg-[#dc371b] text-white shadow' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
                  >
                    Desbravador
                  </button>
                  <button 
                    onClick={() => handleClubToggle("Aventureiro")} 
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${userData.tipo === "Aventureiro" ? 'bg-[#800000] text-white shadow' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
                  >
                    Aventureiro
                  </button>
                </div>
              </div>

              <EditInput label="Nome Completo" value={userData.name} name="name" onChange={handleInputChange} />
              <EditInput label="E-mail" value={userData.email} name="email" type="email" onChange={handleInputChange} />
              <EditInput label="Nome do Clube" value={userData.clube} name="clube" onChange={handleInputChange} />
              <EditSelect label="Cargo / Função" value={userData.cargo} name="cargo" options={cargosList} onChange={handleInputChange} />
              <EditInput label="Telefone" value={userData.telefone} name="telefone" onChange={handleInputChange} />

              {/* Data de Nascimento com indicador de idade em tempo real */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                    <Calendar size={13} className="text-emerald-500" />
                    <span>Data de Nascimento</span>
                  </label>
                  {calculateAge(userData.data_nascimento) !== null && (
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                      {calculateAge(userData.data_nascimento)} anos
                    </span>
                  )}
                </div>
                <input 
                  type="date"
                  value={userData.data_nascimento || ""}
                  name="data_nascimento"
                  onChange={handleInputChange}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 px-5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm font-bold"
                />
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-1">
                  A sua idade define as classes e distintivos que você pode condecorar no uniforme oficial.
                </p>
              </div>

              {/* Tipo Sanguíneo e Fator RH (Exclusivo da Faixa) */}
              <div className="space-y-1.5 text-left p-3.5 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-1.5 ml-1">
                  <Droplet size={13} className="text-red-500" />
                  <label className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-[0.15em]">
                    Dados Médicos (Exclusivo da Faixa)
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 ml-1">Tipo Sanguíneo</label>
                    <select
                      name="tipo_sanguineo"
                      value={userData.tipo_sanguineo || ""}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm font-bold cursor-pointer"
                    >
                      <option value="">Não informado</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 ml-1">Fator RH</label>
                    <select
                      name="fator_rh"
                      value={userData.fator_rh || ""}
                      onChange={handleInputChange}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-3.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all shadow-sm font-bold cursor-pointer"
                    >
                      <option value="">Não informado</option>
                      <option value="+">+ (Positivo)</option>
                      <option value="-">- (Negativo)</option>
                    </select>
                  </div>
                </div>

                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 ml-1 pt-0.5">
                  Exibido em vermelho dentro da plaqueta do nome no lado direito, exclusivamente na faixa.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <EditInput label="Cidade" value={userData.cidade || ""} name="cidade" onChange={handleInputChange} />
                <EditInput label="Estado" value={userData.estado || ""} name="estado" onChange={handleInputChange} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button 
                onClick={handleSave} 
                disabled={isLoading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={18} strokeWidth={3} />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Minhas Especialidades Concluídas & Controle de Compra */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 z-[205] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsCompletedModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-[36px] sm:rounded-[36px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 h-[92vh] sm:h-[86vh] flex flex-col border border-slate-100 dark:border-slate-800">
            {/* Header com identidade oficial (sem botão redundante de PDF e com espaçamento superior limpo) */}
            <div 
              style={{ backgroundColor: userData.tipo === "Desbravador" ? '#0c3c31' : currentThemeColor }}
              className="pt-5 sm:pt-6 pb-4 px-4 sm:px-6 flex items-center justify-between text-white relative overflow-hidden border-b border-emerald-900/40 shrink-0"
            >
              <div className="absolute inset-0 opacity-12 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />
              <div className="flex items-center space-x-3 sm:space-x-3.5 relative z-10 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 shadow-sm">
                  <CheckCircle2 size={22} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-white leading-tight truncate">
                      Especialidades Concluídas
                    </h3>
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                      {completedCounts.total} no total
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-200/90 truncate mt-0.5">
                    Data de Conclusão & Controle de Compra de Insígnias
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 sm:space-x-2 relative z-10 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    invalidateEspecialidadesCache(userClubType);
                    const fresh = await fetchEspecialidades(userClubType, undefined, { excludeQuestions: true, forceRefresh: true });
                    if (fresh && fresh.length > 0) {
                      const clubOnly = fresh.filter(s => s.club === userClubType);
                      setAllSpecialties([...clubOnly].sort((a, b) => a.nome.localeCompare(b.nome)));
                    }
                    setIsLoading(false);
                  }}
                  title="Sincronizar especialidades com o banco de dados"
                  className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center gap-1.5 text-white active:scale-95 transition-all text-[11px] font-bold border border-white/20 cursor-pointer"
                >
                  <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>
                <button 
                  onClick={() => setIsCompletedModalOpen(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all border border-white/20 cursor-pointer"
                  title="Fechar"
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Painel de Estatísticas / KPI Interativo (Diminui para 1 linha ao rolar a página) */}
            <div className={`border-b border-slate-100 dark:border-slate-800 transition-all duration-300 ${
              isModalScrolled
                ? 'p-2 sm:p-2.5 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md shadow-xs space-y-1.5'
                : 'p-4 sm:p-5 pb-2 bg-slate-50 dark:bg-slate-800/50 space-y-3'
            }`}>
              {/* Grid das 4 Caixas: 1 linha em grid-cols-4 quando rolado */}
              <div className={`grid gap-1.5 sm:gap-2 transition-all duration-300 ${
                isModalScrolled ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'
              }`}>
                {/* 1. Especialidades */}
                <button
                  type="button"
                  onClick={() => setCompletedFilterTab(completedFilterTab === 'SPECIALTIES' ? 'ALL' : 'SPECIALTIES')}
                  className={`rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
                    isModalScrolled ? 'py-1 px-1.5 sm:py-1.5 sm:px-2.5' : 'p-3'
                  } ${
                    completedFilterTab === 'SPECIALTIES'
                      ? 'bg-blue-500/15 dark:bg-blue-950/50 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white/70 dark:bg-slate-800/70 border-slate-200/60 dark:border-slate-700/60 hover:bg-white'
                  }`}
                  title="Filtrar especialidades regulares"
                >
                  {isModalScrolled ? (
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <Award size={12} className="text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 truncate hidden xs:inline">
                          Esp.
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-blue-700 dark:text-blue-300 leading-none shrink-0">
                        {completedCounts.specialties}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider">Especialidades</span>
                        <Award size={13} />
                      </div>
                      <div className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-300 leading-none">
                        {completedCounts.specialties}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5 block truncate">
                        Regulares
                      </span>
                    </>
                  )}
                </button>

                {/* 2. Mestrados */}
                <button
                  type="button"
                  onClick={() => setCompletedFilterTab(completedFilterTab === 'MASTERIES' ? 'ALL' : 'MASTERIES')}
                  className={`rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
                    isModalScrolled ? 'py-1 px-1.5 sm:py-1.5 sm:px-2.5' : 'p-3'
                  } ${
                    completedFilterTab === 'MASTERIES'
                      ? 'bg-purple-500/15 dark:bg-purple-950/50 border-purple-500 shadow-xs ring-2 ring-purple-500/20'
                      : 'bg-white/70 dark:bg-slate-800/70 border-slate-200/60 dark:border-slate-700/60 hover:bg-white'
                  }`}
                  title="Filtrar mestrados conquistados"
                >
                  {isModalScrolled ? (
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <Trophy size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 truncate hidden xs:inline">
                          Mest.
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-purple-700 dark:text-purple-300 leading-none shrink-0">
                        {completedCounts.masteries}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider">Mestrados</span>
                        <Trophy size={13} />
                      </div>
                      <div className="text-lg sm:text-xl font-black text-purple-700 dark:text-purple-300 leading-none">
                        {completedCounts.masteries}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 mt-0.5 block truncate">
                        Conquistados
                      </span>
                    </>
                  )}
                </button>

                {/* 3. Já Compradas */}
                <button
                  type="button"
                  onClick={() => setCompletedFilterTab(completedFilterTab === 'PURCHASED' ? 'ALL' : 'PURCHASED')}
                  className={`rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
                    isModalScrolled ? 'py-1 px-1.5 sm:py-1.5 sm:px-2.5' : 'p-3'
                  } ${
                    completedFilterTab === 'PURCHASED'
                      ? 'bg-emerald-500/15 dark:bg-emerald-950/50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white/70 dark:bg-slate-800/70 border-slate-200/60 dark:border-slate-700/60 hover:bg-emerald-50/50'
                  }`}
                  title="Filtrar insígnias já compradas"
                >
                  {isModalScrolled ? (
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <Check size={12} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 truncate hidden xs:inline">
                          Comprei
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none shrink-0">
                        {completedCounts.purchased}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider">Já Compradas</span>
                        <Check size={13} strokeWidth={3} />
                      </div>
                      <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                        {completedCounts.purchased}
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/70 mt-0.5 block truncate">
                        Já na mão
                      </span>
                    </>
                  )}
                </button>

                {/* 4. Preciso Comprar (Fundo Vermelho) */}
                <button
                  type="button"
                  onClick={() => setCompletedFilterTab(completedFilterTab === 'PENDING' ? 'ALL' : 'PENDING')}
                  className={`rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer ${
                    isModalScrolled ? 'py-1 px-1.5 sm:py-1.5 sm:px-2.5' : 'p-3'
                  } ${
                    completedFilterTab === 'PENDING'
                      ? 'bg-rose-500/25 dark:bg-rose-950/70 border-rose-500 shadow-xs ring-2 ring-rose-500/20'
                      : 'bg-rose-500/15 dark:bg-rose-950/40 border-rose-500/40 dark:border-rose-500/50 hover:bg-rose-500/25'
                  }`}
                  title="Filtrar insígnias pendentes de compra"
                >
                  {isModalScrolled ? (
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <ShoppingBag size={12} className="text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 truncate hidden xs:inline">
                          Comprar
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-300 leading-none shrink-0">
                        {completedCounts.pending}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider">Preciso Comprar</span>
                        <ShoppingBag size={13} />
                      </div>
                      <div className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-300 leading-none">
                        {completedCounts.pending}
                      </div>
                      <span className="text-[9px] font-bold text-rose-600/80 dark:text-rose-400/80 mt-0.5 block truncate">
                        Para investir
                      </span>
                    </>
                  )}
                </button>
              </div>

              {completedFilterTab !== 'ALL' && (
                <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Filtrando por: <strong className="text-slate-800 dark:text-slate-200">
                      {completedFilterTab === 'SPECIALTIES' ? 'Especialidades Regulares' :
                       completedFilterTab === 'MASTERIES' ? 'Mestrados' :
                       completedFilterTab === 'PURCHASED' ? 'Já Compradas' : 'Preciso Comprar'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCompletedFilterTab('ALL')}
                    className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 underline cursor-pointer"
                  >
                    Mostrar todas ({completedCounts.total})
                  </button>
                </div>
              )}

              {/* Barra de Busca + Botão Adicionar + Botão ÚNICO Gerar PDF */}
              <div className="flex items-center gap-2 pt-0.5">
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={15} />
                  </div>
                  <input
                    type="text"
                    value={completedSearchTerm}
                    onChange={(e) => setCompletedSearchTerm(e.target.value)}
                    placeholder="Buscar especialidade concluída..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-2 pl-9 pr-8 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {completedSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setCompletedSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Botão ÚNICO Gerar PDF */}
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                  title="Gerar e exportar PDF oficial com a lista de especialidades"
                >
                  <FileDown size={15} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Gerar PDF</span>
                  <span className="sm:hidden">PDF</span>
                </button>

                {/* Botão Nova Especialidade */}
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus size={15} strokeWidth={3} />
                  <span className="hidden sm:inline">Nova Especialidade</span>
                  <span className="sm:hidden">Nova</span>
                </button>
              </div>

              {/* Botão de Copiar Lista de Compras e Baixar PDF (Fundo Vermelho de Destaque) */}
              {completedFilterTab === 'PENDING' && completedCounts.pending > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-rose-900 dark:text-rose-200 uppercase tracking-tight truncate">
                      Lista de Compras ({completedCounts.pending} insígnias a comprar)
                    </h5>
                    <p className="text-[10px] text-rose-700 dark:text-rose-400 font-medium truncate">
                      Baixe a folha de compras em PDF ou copie o pedido formatado
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleGeneratePDF('PENDING_ONLY')}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      title="Baixar folha de compras em PDF"
                    >
                      <FileDown size={13} strokeWidth={2.5} />
                      <span>Baixar PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyWishlist}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-wider shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      {copyFeedback ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
                      <span>{copyFeedback ? 'Copiada!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista com Rolagem (detecta scroll para diminuir os quadros para 1 linha) */}
            <div 
              onScroll={(e) => {
                const top = e.currentTarget.scrollTop;
                if (top > 25 && !isModalScrolled) {
                  setIsModalScrolled(true);
                } else if (top <= 25 && isModalScrolled) {
                  setIsModalScrolled(false);
                }
              }}
              className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-3 scrollbar-hide"
            >
              {filteredCompletedList.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
                    <Award size={32} className="opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                      {completedFilterTab === 'PURCHASED' ? 'Nenhuma insígnia comprada ainda' : completedFilterTab === 'PENDING' ? 'Nenhuma insígnia pendente de compra' : 'Nenhuma especialidade concluída'}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                      {completedSearchTerm 
                        ? 'Tente outro termo na busca acima.' 
                        : 'Clique no botão abaixo para adicionar a primeira especialidade concluída.'}
                    </p>
                  </div>
                  {!completedSearchTerm && (
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal()}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus size={15} strokeWidth={3} />
                      <span>Registrar Conclusão</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredCompletedList.map((item) => {
                  const isInSash = likedIds.includes(String(item.specialtyId));
                  return (
                    <div
                      key={item.specialtyId}
                      className={`border rounded-2xl p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group text-left ${
                        !item.purchased
                          ? 'bg-rose-500/[0.04] dark:bg-rose-950/[0.18] border-rose-200 dark:border-rose-900/60'
                          : 'bg-white dark:bg-slate-800/90 border-slate-100 dark:border-slate-700/80'
                      }`}
                    >
                      {/* Lado Esquerdo: Imagem + Detalhes */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-14 h-14 flex items-center justify-center shrink-0">
                          {item.logo ? (
                            <img
                              src={item.logo}
                              alt={item.name}
                              className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] select-none pointer-events-none"
                              loading="lazy"
                            />
                          ) : (
                            <Award size={26} className="text-slate-400" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-tight truncate leading-tight">
                              {item.name}
                            </h4>
                            {item.code && (
                              <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.2 rounded-md">
                                {item.code}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                              <Calendar size={12} className="text-emerald-500" />
                              <span>{formatBirthDate(item.completionDate)}</span>
                            </span>
                            {item.area && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {item.area}
                              </span>
                            )}
                          </div>

                          {(item.instructor || item.notes) && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {item.instructor && <span className="font-bold text-slate-600 dark:text-slate-400">Instrutor: {item.instructor} • </span>}
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lado Direito: Alternador de Compra + Ações */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/50">
                        {/* Botão Alternador de Compra (Verde p/ Comprei, Vermelho p/ Preciso Comprar) */}
                        <button
                          type="button"
                          onClick={() => togglePurchaseStatus(item.specialtyId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs ${
                            item.purchased
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                          title={`Clique para alternar para ${item.purchased ? '"Preciso Comprar"' : '"Já Comprei"'}`}
                        >
                          {item.purchased ? (
                            <>
                              <Check size={13} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400" />
                              <span>Já Comprei</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={13} className="text-rose-600 dark:text-rose-400" />
                              <span>Preciso Comprar</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          {/* Botão Faixa */}
                          <button
                            type="button"
                            onClick={() => toggleLike(Number(item.specialtyId))}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
                              isInSash
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-emerald-500'
                            }`}
                            title={isInSash ? 'Na Faixa Oficial (Clique para remover)' : 'Adicionar à Faixa Oficial'}
                          >
                            <Award size={15} />
                          </button>

                          {/* Botão Editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                            title="Editar data ou notas"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Botão Excluir */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCompleted(item.specialtyId)}
                            className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar / Editar Especialidade Concluída */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setIsAddEditModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-left">
                <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                  {editingSpecialtyId ? 'Editar Especialidade' : 'Registrar Conclusão'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {editingSpecialtyId ? 'Altere data ou status de compra' : 'Selecione e registre sua conquista'}
                </p>
              </div>
              <button 
                onClick={() => setIsAddEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 active:scale-90 transition-all cursor-pointer"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <div className="flex-grow overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-hide text-left">
              {/* Especialidade Selecionada ou Seletor */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">
                  Especialidade Oficial
                </label>

                {formSelectedSpecialty ? (
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 flex items-center justify-center shrink-0">
                        {formSelectedSpecialty.logo ? (
                          <img src={formSelectedSpecialty.logo} alt={formSelectedSpecialty.nome} className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] select-none pointer-events-none" />
                        ) : (
                          <Award size={22} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-tight truncate">
                          {formSelectedSpecialty.nome}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {formSelectedSpecialty.codigo && (
                            <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                              {formSelectedSpecialty.codigo}
                            </span>
                          )}
                          <span className="text-[9px] font-bold text-slate-400 truncate">
                            {formSelectedSpecialty.area}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!editingSpecialtyId && (
                      <button
                        type="button"
                        onClick={() => setFormSelectedSpecialty(null)}
                        className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                      >
                        Trocar
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={formSpecialtySearch}
                        onChange={(e) => setFormSpecialtySearch(e.target.value)}
                        placeholder="Digite o nome da especialidade..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-100 dark:border-slate-800 rounded-2xl p-1.5 bg-slate-50/50 dark:bg-slate-900/50 scrollbar-hide">
                      {availableSpecialtiesForAdd.length > 0 ? (
                        availableSpecialtiesForAdd.map((esp) => (
                          <button
                            key={`${esp.club || 'DBV'}_${esp.id}`}
                            type="button"
                            onClick={() => {
                              setFormSelectedSpecialty(esp);
                              setFormSpecialtySearch('');
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 flex items-center gap-2.5 transition-all cursor-pointer group"
                          >
                            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                              {esp.logo ? (
                                <img src={esp.logo} alt={esp.nome} className="w-full h-full object-contain filter drop-shadow-xs select-none pointer-events-none" />
                              ) : (
                                <Award size={14} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                {esp.nome}
                              </span>
                              <span className="text-[9px] text-slate-400 block truncate">
                                {esp.codigo ? `${esp.codigo} • ` : ''}{esp.area}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400 font-bold">
                          Nenhuma especialidade encontrada no catálogo.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Data de Conclusão */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1 flex items-center gap-1.5">
                    <Calendar size={13} className="text-emerald-500" />
                    <span>Data de Conclusão</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormCompletionDate(new Date().toISOString().split('T')[0])}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Hoje
                  </button>
                </div>
                <input
                  type="date"
                  value={formCompletionDate}
                  onChange={(e) => setFormCompletionDate(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
              </div>

              {/* Status da Insígnia (Compra) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">
                  Status da Insígnia Física
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPurchased(true)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      formPurchased
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black uppercase">Já Comprei</span>
                      <Check size={14} strokeWidth={3} className={formPurchased ? 'text-emerald-600' : 'text-slate-400'} />
                    </div>
                    <span className="text-[9px] font-semibold leading-tight opacity-80">
                      Insígnia já adquirida ou costurada
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormPurchased(false)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      !formPurchased
                        ? 'bg-amber-500/15 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black uppercase">Preciso Comprar</span>
                      <ShoppingBag size={14} className={!formPurchased ? 'text-amber-600' : 'text-slate-400'} />
                    </div>
                    <span className="text-[9px] font-semibold leading-tight opacity-80">
                      Entrar na lista de compras
                    </span>
                  </button>
                </div>
              </div>

              {/* Instrutor / Avaliador (Opcional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">
                  Instrutor / Avaliador (Opcional)
                </label>
                <input
                  type="text"
                  value={formInstructor}
                  onChange={(e) => setFormInstructor(e.target.value)}
                  placeholder="Ex: Instrutor Marcos ou Pastor Lucas"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
              </div>

              {/* Observações / Local (Opcional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">
                  Observações / Evento (Opcional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ex: Campori DSA 2024 ou Clube Local"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                />
              </div>

              {/* Checkbox: Adicionar também à Minha Faixa */}
              <label className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formAddToSash}
                  onChange={(e) => setFormAddToSash(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="min-w-0">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    Exibir também na Minha Faixa Oficial
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Adiciona a insígnia na faixa virtual do perfil
                  </span>
                </div>
              </label>
            </div>

            {/* Footer com Botão Salvar */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex space-x-3">
              <button
                type="button"
                onClick={() => setIsAddEditModalOpen(false)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCompletedForm}
                disabled={!formSelectedSpecialty}
                className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Check size={16} strokeWidth={3} />
                <span>Salvar Conclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exportação de Especialidades em PDF */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={() => !isGeneratingPdf && setIsPdfModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 text-left">
            {/* Header com identidade oficial */}
            <div 
              style={{ background: userData.tipo === "Desbravador" ? 'linear-gradient(135deg, #092c24 0%, #0c3c31 60%, #082d24 100%)' : currentThemeColor }}
              className="p-5 flex items-center justify-between text-white relative overflow-hidden border-b border-emerald-900/40"
            >
              <div className="flex items-center space-x-3 relative z-10 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0 shadow-md">
                  <FileDown size={20} className="text-amber-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black uppercase tracking-tight truncate">
                    Exportar Lista em PDF
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200/90 truncate">
                    Documento Oficial A4 para Impressão & Compras
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => !isGeneratingPdf && setIsPdfModalOpen(false)}
                disabled={isGeneratingPdf}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all border border-white/20 cursor-pointer disabled:opacity-50"
                title="Fechar"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  1. Selecione o Tipo de Relatório
                </label>
                <div className="space-y-2">
                  {/* Opção 1: Relatório Completo de Concluídas */}
                  <button
                    type="button"
                    onClick={() => setPdfExportType('ALL_COMPLETED')}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      pdfExportType === 'ALL_COMPLETED'
                        ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      pdfExportType === 'ALL_COMPLETED' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      <Award size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-white">
                          Especialidades Concluídas (Completo)
                        </h4>
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                          {completedCounts.total} itens
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Relatório completo com datas, instrutores e status de compra (Já Comprei vs. Preciso Comprar).
                      </p>
                    </div>
                  </button>

                  {/* Opção 2: Lista de Compras de Insígnias (Somente as Pendentes) */}
                  <button
                    type="button"
                    onClick={() => setPdfExportType('PENDING_ONLY')}
                    className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      pdfExportType === 'PENDING_ONLY'
                        ? 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      pdfExportType === 'PENDING_ONLY' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}>
                      <ShoppingBag size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-xs uppercase tracking-tight text-slate-800 dark:text-white">
                          Lista de Compras de Insígnias (A Comprar)
                        </h4>
                        <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                          {completedCounts.pending} insígnias
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Folha de compras com caixas de marcação [ ], código oficial e área para levar à loja ou repassar à secretaria do clube.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Seção 2: Opções de Ordenação solicitadas pelo usuário */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  2. Ordem de Exibição no PDF
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Ordem Alfabética */}
                  <button
                    type="button"
                    onClick={() => setPdfSortOrder('ALPHABETICAL')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      pdfSortOrder === 'ALPHABETICAL'
                        ? 'bg-emerald-500/15 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100/70'
                    }`}
                  >
                    <ArrowDownAZ size={19} className={pdfSortOrder === 'ALPHABETICAL' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                    <span className="text-[11px] font-black uppercase tracking-tight leading-tight">
                      Alfabética
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      De A a Z
                    </span>
                  </button>

                  {/* Por Código */}
                  <button
                    type="button"
                    onClick={() => setPdfSortOrder('CODE')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      pdfSortOrder === 'CODE'
                        ? 'bg-emerald-500/15 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100/70'
                    }`}
                  >
                    <Tag size={19} className={pdfSortOrder === 'CODE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                    <span className="text-[11px] font-black uppercase tracking-tight leading-tight">
                      Por Código
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      Ex: 001, 002...
                    </span>
                  </button>

                  {/* Por Data de Conclusão */}
                  <button
                    type="button"
                    onClick={() => setPdfSortOrder('DATE')}
                    className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      pdfSortOrder === 'DATE'
                        ? 'bg-emerald-500/15 dark:bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100/70'
                    }`}
                  >
                    <Calendar size={19} className={pdfSortOrder === 'DATE' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'} />
                    <span className="text-[11px] font-black uppercase tracking-tight leading-tight">
                      Data Conclusão
                    </span>
                    <span className="text-[9px] font-bold text-slate-400">
                      Mais recentes
                    </span>
                  </button>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  disabled={isGeneratingPdf}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleGeneratePDF(pdfExportType, pdfSortOrder)}
                  disabled={isGeneratingPdf}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Gerando PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={16} strokeWidth={2.5} />
                      <span>Baixar PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto scrollbar-hide pb-16 relative"
      >
        {/* Barra Sticky com Botão Voltar e Ações (Idêntico ao padrão de Classes e Especialidades) */}
        <div className={`sticky top-0 z-30 flex items-center justify-between py-2 px-3.5 sm:px-5 transition-all duration-300 ${
          isHeaderScrolled 
            ? 'bg-[#F8FAFC]/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800' 
            : 'bg-transparent -mb-[64px] pointer-events-none'
        }`}>
          <button 
            onClick={handleBackNavigation} 
            className={`w-11 h-11 rounded-2xl active:scale-90 transition-all flex items-center justify-center pointer-events-auto ${
              isHeaderScrolled
                ? 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-100 dark:border-slate-700 shadow-sm ml-0'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/25 shadow-sm ml-0.5'
            }`}
            title="Voltar"
            aria-label="Voltar"
          >
            <ChevronLeft size={22} strokeWidth={3} />
          </button>
          
          <div className={`text-center flex-1 px-3 truncate transition-all duration-300 ${isHeaderScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none mb-0.5">
              Meu Perfil
            </p>
            <h4 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-tight truncate">
              {userData.name} {userAge !== null ? userAge : ''}
            </h4>
          </div>
          
          <button 
            onClick={onLogout}
            className={`w-11 h-11 rounded-2xl active:scale-90 transition-all flex items-center justify-center pointer-events-auto ${
              isHeaderScrolled
                ? 'bg-white dark:bg-slate-800 text-red-500 border border-slate-100 dark:border-slate-700 shadow-sm mr-0'
                : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/25 shadow-sm mr-0.5'
            }`}
            title="Sair da Conta"
            aria-label="Sair da Conta"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Header Visual do Perfil com Foto, Nome e Função na Esquerda, Demais Informações ao Lado */}
        <div 
          className="relative w-full rounded-b-[40px] shadow-lg transition-all duration-500 flex-shrink-0 pt-16 pb-7 px-4 sm:px-8 overflow-hidden"
          style={{ 
            backgroundColor: currentThemeColor,
            backgroundImage: `radial-gradient(at 0% 0%, rgba(255,255,255,0.22) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(0,0,0,0.2) 0px, transparent 50%)`
          }}
        >
          {/* Efeitos de iluminação de fundo */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none overflow-hidden rounded-b-[40px]">
            <div className="absolute top-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-52 h-52 bg-black rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* LADO ESQUERDO: Foto, Nome e Função */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              {/* Foto de Perfil com Botão de Editar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] border-4 border-white/90 dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all flex items-center justify-center">
                  {userData.avatar ? (
                    <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                  ) : (
                    <User size={44} className="text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-9 sm:h-9 rounded-xl border-2 border-white dark:border-slate-800 shadow-md transition-all flex items-center justify-center bg-amber-500 text-white hover:bg-amber-600 active:scale-90"
                  title="Editar Foto ou Perfil"
                >
                  <Camera size={15} />
                </button>
              </div>

              {/* Nome e Função */}
              <div className="min-w-0 flex-1 text-white">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight drop-shadow-sm uppercase truncate">
                    {userData.name}
                  </h2>
                  {userAge !== null ? (
                    <span 
                      className="text-base sm:text-xl font-black text-white/95 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-xl border border-white/25 shadow-xs select-none" 
                      title={`Idade: ${userAge} anos`}
                    >
                      {userAge}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-xs sm:text-sm font-black text-amber-200 bg-black/35 hover:bg-black/50 border border-amber-300/40 px-2.5 py-1 rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer select-none"
                      title="Clique para adicionar sua data de nascimento e calcular a idade"
                    >
                      <Calendar size={13} className="text-amber-300" />
                      <span>+ Idade</span>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {/* Função / Cargo */}
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-wider text-white border border-white/25 inline-flex items-center gap-1.5 shadow-xs">
                    <Briefcase size={12} strokeWidth={2.5} />
                    <span>{userData.cargo || 'Membro'}</span>
                  </span>

                  {/* Ministério / Tipo */}
                  <span className="px-2.5 py-1 bg-black/25 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-white/90 border border-white/10">
                    {userData.tipo}
                  </span>
                </div>
              </div>
            </div>

            {/* DEMAIS INFORMAÇÕES AO LADO (LADO DIREITO - 2 colunas responsivas para celular e desktop não ficarem longos) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:w-[480px] lg:w-[540px] shrink-0">
              {/* Clube */}
              <div className="bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-2.5 text-white shadow-xs min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Shield size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-white/70">Clube</p>
                  <p className="text-[11px] sm:text-xs font-black truncate text-white">{userData.clube || 'Não informado'}</p>
                </div>
              </div>

              {/* E-mail */}
              <div className="bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-2.5 text-white shadow-xs min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Mail size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-white/70">E-mail</p>
                  <p className="text-[11px] sm:text-xs font-black truncate text-white" title={userData.email}>{userData.email || 'Não informado'}</p>
                </div>
              </div>

              {/* Nascimento */}
              <div className="bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-2.5 text-white shadow-xs min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Calendar size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-white/70">Nascimento</p>
                  <p className="text-[11px] sm:text-xs font-black truncate text-white">
                    {userData.data_nascimento ? formatBirthDate(userData.data_nascimento) : 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Cidade / UF */}
              <div className="bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-2.5 text-white shadow-xs min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <MapPin size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-white/70">Cidade / UF</p>
                  <p className="text-[11px] sm:text-xs font-black truncate text-white">
                    {userData.cidade ? `${userData.cidade}${userData.estado ? ` - ${userData.estado}` : ''}` : 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Telefone */}
              <div className="bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-2.5 text-white shadow-xs col-span-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Phone size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-white/70">Telefone</p>
                  <p className="text-[11px] sm:text-xs font-black truncate text-white">{userData.telefone || 'Não informado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="px-4 sm:px-8 mt-5 flex flex-col space-y-3 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setIsEditing(true)} 
              style={{ backgroundColor: currentThemeColor }} 
              className="py-3.5 px-3 rounded-2xl text-white font-black uppercase text-xs tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 border border-white/10"
            >
              <Settings size={18} />
              <span>Editar Perfil</span>
            </button>
            <button 
              onClick={() => setIsSashView(true)}
              className="py-3.5 px-3 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-white font-black uppercase text-xs tracking-wider shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center space-x-2 border border-emerald-500/20"
            >
              <Award size={18} />
              <span>Minha Faixa</span>
              {likedIds.length > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black ml-1">
                  {likedIds.length}
                </span>
              )}
            </button>
          </div>

          {/* Card em Destaque: Minhas Especialidades Concluídas & Controle de Compra de Insígnias */}
          <div className="bg-white dark:bg-slate-800/90 rounded-[28px] border border-slate-200/80 dark:border-slate-700/80 shadow-md hover:shadow-lg transition-all p-4 sm:p-5 flex flex-col gap-3.5 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
                  <CheckCircle2 size={24} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      Minhas Especialidades Concluídas
                    </h3>
                    <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {completedCounts.total} no total
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Registre a data de conclusão e controle as insígnias já compradas e a comprar.
                  </p>
                </div>
              </div>

              {/* Botões rápidos */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Registrar nova especialidade concluída"
                >
                  <Plus size={15} strokeWidth={3} />
                  <span>Concluir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompletedModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Ver todas e gerenciar compras"
                >
                  <span>Gerenciar</span>
                  <ChevronDown size={14} className="-rotate-90" />
                </button>
              </div>
            </div>

            {/* Badges Interativas de Status (Especialidades, Mestrados, Já Compradas e Preciso Comprar) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              {/* 1. Total de Especialidades */}
              <button
                type="button"
                onClick={() => {
                  setCompletedFilterTab('SPECIALTIES');
                  setIsCompletedModalOpen(true);
                }}
                className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/25 flex items-center justify-between transition-all text-left cursor-pointer group"
                title="Ver especialidades concluídas"
              >
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-blue-700 dark:text-blue-300 tracking-wider block truncate">
                    Especialidades
                  </span>
                  <span className="text-sm sm:text-base font-black text-blue-700 dark:text-blue-200">
                    {completedCounts.specialties}
                  </span>
                </div>
                <Award size={16} className="text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
              </button>

              {/* 2. Total de Mestrados */}
              <button
                type="button"
                onClick={() => {
                  setCompletedFilterTab('MASTERIES');
                  setIsCompletedModalOpen(true);
                }}
                className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/25 flex items-center justify-between transition-all text-left cursor-pointer group"
                title="Ver mestrados concluídos"
              >
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-purple-700 dark:text-purple-300 tracking-wider block truncate">
                    Mestrados
                  </span>
                  <span className="text-sm sm:text-base font-black text-purple-700 dark:text-purple-200">
                    {completedCounts.masteries}
                  </span>
                </div>
                <Trophy size={16} className="text-purple-500 shrink-0 group-hover:scale-110 transition-transform" />
              </button>

              {/* 3. Já Compradas */}
              <button
                type="button"
                onClick={() => {
                  setCompletedFilterTab('PURCHASED');
                  setIsCompletedModalOpen(true);
                }}
                className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-between transition-all text-left cursor-pointer group"
                title="Ver insígnias já compradas"
              >
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider block truncate">
                    Já Compradas
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-700 dark:text-emerald-200">
                    {completedCounts.purchased}
                  </span>
                </div>
                <Check size={16} strokeWidth={3} className="text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              </button>

              {/* 4. Preciso Comprar (Fundo Vermelho) */}
              <button
                type="button"
                onClick={() => {
                  setCompletedFilterTab('PENDING');
                  setIsCompletedModalOpen(true);
                }}
                className="p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 dark:bg-rose-950/50 border border-rose-500/40 dark:border-rose-500/50 flex items-center justify-between transition-all text-left cursor-pointer group shadow-xs"
                title="Ver insígnias a comprar"
              >
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase text-rose-700 dark:text-rose-300 tracking-wider block truncate">
                    Preciso Comprar
                  </span>
                  <span className="text-sm sm:text-base font-black text-rose-700 dark:text-rose-200">
                    {completedCounts.pending}
                  </span>
                </div>
                <ShoppingBag size={16} className="text-rose-600 dark:text-rose-400 shrink-0 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {isAdmin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {onOpenAdmin && (
                <button 
                  onClick={onOpenAdmin}
                  className="py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg border border-slate-700 active:scale-95 transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
                >
                  <Shield size={18} className="text-indigo-400" />
                  <span>Painel Administrativo</span>
                </button>
              )}
              <button 
                type="button"
                onClick={() => {
                  setIsAdminReportsModalOpen(true);
                  setIsLoadingReports(true);
                  fetchAllErrorReports()
                    .then(setErrorReportsList)
                    .catch(console.warn)
                    .finally(() => setIsLoadingReports(false));
                }}
                className="py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-amber-600/25 border border-amber-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
              >
                <AlertTriangle size={18} className="text-amber-200" />
                <span>Reportes de Erros</span>
                {pendingReportsCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
                    {pendingReportsCount}
                  </span>
                )}
              </button>
            </div>
          )}

        </div>

        <div className="mt-8 px-4 sm:px-8 pb-10 animate-slide-up max-w-7xl mx-auto no-accent-override">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* LADO 1: SIMULAÇÃO TÊXTIL DO BOLSO ESQUERDO DO UNIFORME DE GALA */}
            <div className="w-full flex flex-col items-center">
              <div className={`w-full max-w-[340px] sm:max-w-[380px] ${
                isAdultUniform 
                  ? 'bg-white border-2 border-slate-300 text-slate-900 shadow-2xl' 
                  : 'bg-[#c7a783] border-2 border-[#a68662] shadow-2xl'
              } rounded-[28px] p-4 sm:p-5 flex flex-col items-center relative overflow-hidden`}>
                {/* Textura sutil e costuras de alfaiataria */}
                <div className={`absolute inset-0 pointer-events-none ${
                  isAdultUniform 
                    ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] opacity-30' 
                    : 'bg-[radial-gradient(#6e502b_1px,transparent_1px)] opacity-15'
                } [background-size:12px_12px]`} />
                <div className={`absolute top-2 left-4 right-4 border-b border-dashed ${
                  isAdultUniform ? 'border-slate-300' : 'border-[#947450]/50'
                } pointer-events-none`} />

                {/* 1. ACIMA DO BOLSO: Insígnia de Excelência (Comprimento proporcional, sem ficar excessivamente longa) */}
                <div className="relative z-10 flex flex-col items-center mb-2.5">
                  {allConquistas
                    .filter(c => c.tipo === 'INSIGNIA' && c.id !== 18 && !c.nome.toLowerCase().includes('batismo'))
                    .map(con => {
                      const eligibility = checkConquistaEligibility(con, userAge);
                      return (
                        <button
                          key={con.id}
                          onClick={() => toggleAchievement(con.id)}
                          className={`w-24 sm:w-28 h-6 sm:h-7 relative transition-all active:scale-95 group hover:brightness-105 cursor-pointer rounded-[3px] p-[1.5px] bg-gradient-to-b from-[#fae596] via-[#caa048] to-[#806019] shadow-[0_2px_5px_rgba(0,0,0,0.45)] ${
                            !eligibility.isEligible ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                          title={!eligibility.isEligible ? eligibility.msg : `${con.nome} • Insígnia de Excelência (Toque para alternar)`}
                        >
                          <div className="w-full h-full relative rounded-[1.5px] overflow-hidden bg-slate-900/10 flex items-center justify-center">
                            <img
                              src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza}
                              className={`w-full h-full object-fill transition-opacity ${
                                userAchievements.includes(con.id) ? 'opacity-100' : 'opacity-40 grayscale'
                              }`}
                              alt={con.nome}
                            />
                            {/* Brilho vitrificado superior da barreta de excelência (conforme Imagem 3) */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 pointer-events-none" />
                          </div>
                          {!eligibility.isEligible && (
                            <span className="absolute -top-1 -right-1 bg-black/80 text-amber-300 p-0.5 rounded-full shadow-xs z-20">
                              <Lock size={8} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>

                  {/* 2. ACIMA DO BOLSO: Classes Avançadas (Régua metálica dourada dupla ampliada e esmaltada) */}
                  <div className="relative z-10 flex flex-col items-center mb-2">
                    <div className="p-[2px] bg-gradient-to-b from-[#fae596] via-[#caa048] to-[#806019] rounded-[4px] shadow-[0_2px_5px_rgba(0,0,0,0.45)]">
                      <div className="flex flex-col border border-[#b58b2d] bg-[#caa048] rounded-[2px] overflow-hidden shadow-inner">
                        {/* Fileira Superior (Pioneiro, Excursionista, Guia - ordens 4, 5, 6) */}
                        <div className="flex items-center divide-x divide-[#9a7420] border-b border-[#9a7420]">
                          {allConquistas
                            .filter(c => c.tipo === 'CLASSE_AVANCADA')
                            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                            .slice(3, 6)
                            .map(con => {
                              const eligibility = checkConquistaEligibility(con, userAge);
                              return (
                                <button
                                  key={con.id}
                                  onClick={() => toggleAchievement(con.id)}
                                  className={`w-16 sm:w-18 h-5 sm:h-5.5 relative transition-all active:scale-95 group hover:brightness-105 cursor-pointer flex items-center justify-center overflow-hidden bg-black/10 ${
                                    !eligibility.isEligible ? 'opacity-35 cursor-not-allowed' : ''
                                  }`}
                                  title={!eligibility.isEligible ? eligibility.msg : `${con.nome} • Classe Avançada (Toque para alternar)`}
                                >
                                  <img
                                    src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza}
                                    className={`w-full h-full object-fill ${
                                      userAchievements.includes(con.id) ? 'opacity-100' : 'opacity-35 grayscale'
                                    }`}
                                    alt={con.nome}
                                  />
                                  {/* Brilho esmaltado vitrificado característico da Imagem 2 */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/10 pointer-events-none" />
                                  {!eligibility.isEligible && (
                                    <span className="absolute top-0 right-0 bg-black/80 text-amber-300 p-0.5 rounded-xs leading-none z-20">
                                      <Lock size={7} />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>

                        {/* Fileira Inferior (Amigo, Companheiro, Pesquisador - ordens 1, 2, 3) */}
                        <div className="flex items-center divide-x divide-[#9a7420]">
                          {allConquistas
                            .filter(c => c.tipo === 'CLASSE_AVANCADA')
                            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                            .slice(0, 3)
                            .map(con => {
                              const eligibility = checkConquistaEligibility(con, userAge);
                              return (
                                <button
                                  key={con.id}
                                  onClick={() => toggleAchievement(con.id)}
                                  className={`w-16 sm:w-18 h-5 sm:h-5.5 relative transition-all active:scale-95 group hover:brightness-105 cursor-pointer flex items-center justify-center overflow-hidden bg-black/10 ${
                                    !eligibility.isEligible ? 'opacity-35 cursor-not-allowed' : ''
                                  }`}
                                  title={!eligibility.isEligible ? eligibility.msg : `${con.nome} • Classe Avançada (Toque para alternar)`}
                                >
                                  <img
                                    src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza}
                                    className={`w-full h-full object-fill ${
                                      userAchievements.includes(con.id) ? 'opacity-100' : 'opacity-35 grayscale'
                                    }`}
                                    alt={con.nome}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-black/10 pointer-events-none" />
                                  {!eligibility.isEligible && (
                                    <span className="absolute top-0 right-0 bg-black/80 text-amber-300 p-0.5 rounded-xs leading-none z-20">
                                      <Lock size={7} />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. SIMULAÇÃO DO BOLSO ESQUERDO (Aumentado e proporcional no celular) */}
                  <div className="w-full max-w-[310px] sm:max-w-[350px] relative flex flex-col items-center">
                    {/* LAPELA / PORTINHOLA DO BOLSO */}
                    <div className={`w-full h-28 sm:h-30 ${
                      isAdultUniform 
                        ? 'bg-white border-2 border-slate-300' 
                        : 'bg-[#be9d77] border-2 border-[#9e7f5b]'
                    } rounded-t-lg relative shadow-sm flex flex-col items-center justify-center pt-2.5 pb-2.5 px-2 z-10`}>
                      {/* Pesponto decorativo na lapela */}
                      <div className={`absolute inset-1 border border-dashed ${
                        isAdultUniform ? 'border-slate-300/80' : 'border-[#8f6f4b]/50'
                      } pointer-events-none rounded-t-sm`} />

                      {/* Botão de fechamento central da lapela (costura militar) */}
                      <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${
                        isAdultUniform 
                          ? 'bg-slate-100 border border-slate-300' 
                          : 'bg-[#9e7f5b] border border-[#7d603e]'
                      } shadow-xs flex items-center justify-center pointer-events-none z-20`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isAdultUniform ? 'bg-slate-300' : 'bg-[#dfcbb2]/70'}`} />
                      </div>

                      {/* 1. DISTINTIVOS DE LIDERANÇA (Aumentados e com relevo nítido no celular) */}
                      <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4 mb-2.5">
                        {allConquistas
                          .filter(c => c.tipo === 'LIDERANCA')
                          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                          .map(con => {
                            const eligibility = checkConquistaEligibility(con, userAge);
                            const hasLeadershipPrerequisite = 
                              con.id === 9 ? hasAllRegularClasses :
                              con.id === 10 ? (hasAllRegularClasses && userAchievements.includes(9)) :
                              con.id === 11 ? (hasAllRegularClasses && userAchievements.includes(9) && userAchievements.includes(10)) :
                              hasAllRegularClasses;

                            const isAvailable = eligibility.isEligible && hasLeadershipPrerequisite;
                            const isUnlocked = isAvailable && userAchievements.includes(con.id);
                            const sizeClasses = 
                              con.id === 9 
                                ? 'w-7 h-7 sm:w-8 sm:h-8' // Líder
                                : 'w-8 h-8 sm:w-9 sm:h-9'; // Master e Master Avançado

                            let tooltipText = `${con.nome} • Distintivo de Liderança (Toque para alternar)`;
                            if (!eligibility.isEligible) {
                              tooltipText = eligibility.msg || 'Investidura disponível a partir dos 18 anos';
                            } else if (!hasAllRegularClasses) {
                              tooltipText = 'Requer todas as 6 Classes Regulares ativas (Amigo a Guia)';
                            } else if (!hasLeadershipPrerequisite) {
                              tooltipText = con.id === 10 
                                ? 'Requer distintivo de Líder selecionado' 
                                : 'Requer distintivo de Líder Master selecionado';
                            }

                            return (
                              <button
                                key={con.id}
                                onClick={() => toggleAchievement(con.id)}
                                className={`${sizeClasses} relative transition-all active:scale-95 group hover:scale-105 cursor-pointer flex items-center justify-center ${
                                  !isAvailable ? 'opacity-35 cursor-not-allowed' : ''
                                }`}
                                title={tooltipText}
                              >
                                <img
                                  src={isUnlocked ? con.imagem_colorida : con.imagem_cinza}
                                  className={`w-full h-full object-contain filter drop-shadow-[0_2px_3.5px_rgba(0,0,0,0.5)] transition-all ${
                                    isUnlocked ? 'opacity-100' : 'opacity-35 grayscale'
                                  }`}
                                  alt={con.nome}
                                />
                                {!isAvailable && (
                                  <span className="absolute -top-0.5 -right-0.5 bg-black/80 text-amber-300 p-0.5 rounded-full leading-none z-20">
                                    <Lock size={7} />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>

                      {/* 2. DISTINTIVOS DAS CLASSES REGULARES (Barrete metálico dourado contido estritamente atrás das medalhas, sem sobrar pontas externas) */}
                      <div className="relative z-10 flex items-center justify-center w-full">
                        <div className="relative inline-flex items-center justify-center">
                          {/* Barra de suporte metálico que começa atrás do centro do primeiro distintivo e termina atrás do centro do último distintivo (sem sobrar pontas visíveis para fora) */}
                          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-2 sm:h-2.5 bg-gradient-to-b from-[#fae8a4] via-[#d4af37] to-[#7c5b16] shadow-[0_1.5px_4px_rgba(0,0,0,0.45)] border-y border-[#b58b2d] pointer-events-none z-0" />
                          
                          {/* As 6 medalhas circulares ampliadas em linha com aro dourado e resina vitrificada */}
                          <div className="relative z-10 flex items-center gap-1 sm:gap-1.5">
                            {allConquistas
                              .filter(c => c.tipo === 'CLASSE_REGULAR')
                              .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                              .map(con => {
                                const eligibility = checkConquistaEligibility(con, userAge);
                                const isUnlocked = userAchievements.includes(con.id);
                                return (
                                  <button
                                    key={con.id}
                                    onClick={() => toggleAchievement(con.id)}
                                    className={`w-8 h-8 sm:w-9 sm:h-9 relative transition-all active:scale-90 group hover:scale-110 cursor-pointer flex items-center justify-center rounded-full p-[2px] bg-gradient-to-b from-[#fce99f] via-[#cfa038] to-[#735112] shadow-[0_2px_5px_rgba(0,0,0,0.65)] ${
                                      !eligibility.isEligible ? 'opacity-35 cursor-not-allowed' : ''
                                    }`}
                                    title={!eligibility.isEligible ? eligibility.msg : `${con.nome} • Classe Regular (Toque para alternar)`}
                                  >
                                    {/* Miolo circular esmaltado com aro interno fino e efeito de resina vitrificada */}
                                    <div className="w-full h-full rounded-full overflow-hidden relative flex items-center justify-center border border-[#9b7621] bg-black/10">
                                      <img
                                        src={isUnlocked ? con.imagem_colorida : con.imagem_cinza}
                                        className={`w-full h-full object-cover transition-all ${
                                          isUnlocked ? 'opacity-100 brightness-105' : 'opacity-35 grayscale'
                                        }`}
                                        alt={con.nome}
                                      />
                                      {/* Brilho esmaltado de resina vitrificada (cúpula abaulada de condecoração militar) */}
                                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent pointer-events-none rounded-full" />
                                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-full" />
                                    </div>
                                    {!eligibility.isEligible && (
                                      <span className="absolute -top-1 -right-1 bg-black/80 text-amber-300 p-0.5 rounded-full leading-none z-20 shadow-xs">
                                        <Lock size={6} />
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* CORPO DO BOLSO: Altura proporcional e realista (Mais alto que largo, estilo bolso com prega macho: Imagem 1) */}
                    <div className={`w-full h-64 sm:h-72 ${
                      isAdultUniform 
                        ? 'bg-white border-x-2 border-b-2 border-slate-300' 
                        : 'bg-[#be9d77] border-x-2 border-b-2 border-[#9e7f5b]'
                    } rounded-b-2xl relative shadow-md flex flex-col items-center justify-center overflow-hidden -mt-0.5`}>
                      {/* Costura pespontada lateral e inferior */}
                      <div className={`absolute inset-2 border-x border-b border-dashed ${
                        isAdultUniform ? 'border-slate-300/80' : 'border-[#8f6f4b]/50'
                      } pointer-events-none rounded-b-xl`} />

                      {/* Prega macho central vertical com relevo autêntico */}
                      <div className={`absolute top-0 bottom-0 w-10 sm:w-12 ${
                        isAdultUniform 
                          ? 'bg-slate-100 border-x border-slate-200 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)]' 
                          : 'bg-[#ae8c66]/60 border-x border-[#91714e]/80 shadow-[inset_0_0_8px_rgba(0,0,0,0.12)]'
                      } pointer-events-none`} />
                    </div>
                  </div>

                  {/* Legenda Informativa */}
                  <div className="mt-3 text-center">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${
                      isAdultUniform ? 'text-slate-700' : 'text-[#48351f]'
                    }`}>
                      {isAdultUniform 
                        ? 'Bolso Esquerdo • Uniforme Branco Oficial (16+ anos)' 
                        : 'Bolso Esquerdo • Uniforme Cáqui Oficial (Até 15 anos)'}
                    </p>
                    <p className={`text-[9px] font-bold ${
                      isAdultUniform ? 'text-slate-400' : 'text-[#5e472a]'
                    }`}>
                      {userAchievements.length} ativas • Toque para condecorar
                    </p>
                  </div>
                </div>
              </div>

              {/* LADO 2: FAIXA VERDE-PETRÓLEO OFICIAL (Conforme uniforme e faixa real) */}
              <div className="w-full flex flex-col items-center filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.5)] drop-shadow-[0_8px_10px_rgba(0,0,0,0.3)]">
                <div 
                  className="w-[340px] sm:w-[380px] max-w-full bg-[#0c3c31] border-2 border-[#092d25] px-3 sm:px-4 pt-4 sm:pt-5 pb-6 flex flex-col items-center relative overflow-hidden text-white"
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 340px), 0 100%)'
                  }}
                >
                  {/* Textura e costuras pespontadas oficiais da faixa */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />
                  <div className="absolute top-2 bottom-3 left-2 sm:left-2.5 w-px border-l border-dashed border-emerald-300/25 pointer-events-none" />
                  <div 
                    className="absolute top-2 right-2 sm:right-2.5 w-px border-r border-dashed border-emerald-300/25 pointer-events-none"
                    style={{ bottom: '345px' }}
                  />
                  {/* Costura pespontada acompanhando o corte diagonal a 45° estritamente na ponta inferior da faixa */}
                  <div className="absolute bottom-0 left-0 right-0 h-[340px] pointer-events-none z-10 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line 
                        x1="3" 
                        y1="97" 
                        x2="97" 
                        y2="3" 
                        stroke="rgba(110, 231, 183, 0.28)" 
                        strokeWidth="1.5" 
                        strokeDasharray="4,4" 
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </div>

                  {/* TOPO DA FAIXA: A ~6cm do topo */}
                  <div className="pt-8 sm:pt-9 pb-2 flex flex-col items-center w-full relative z-10 space-y-3">
                    {/* 1. Bandeira do Brasil a 6cm do topo */}
                    <div className="flex flex-col items-center">
                      <BandeiraBrasil />
                    </div>

                    {/* 2. Pin de Batismo logo abaixo na faixa */}
                    <div className="flex flex-col items-center -my-0.5">
                      <PinBatismo 
                        isBaptized={isBaptizedEffective} 
                        onToggle={toggleBaptism}
                        imageUrlColorida={batismoConquista?.imagem_colorida}
                        imageUrlCinza={batismoConquista?.imagem_cinza}
                      />
                    </div>

                    {/* 3. Tira de Nome logo abaixo: até 15 anos fundo cáqui, de 16 acima fundo branco com tipo sanguíneo e fator RH exclusivos da faixa */}
                    <div className="flex flex-col items-center w-full px-1">
                      <TiraNome 
                        name={userData.name} 
                        age={userAge} 
                        tipoSanguineo={userData.tipo_sanguineo}
                        fatorRh={userData.fator_rh}
                      />
                    </div>
                  </div>

                  {/* 4. ESPECIALIDADES NA FAIXA: PRIMEIRO AS QUE TÊM MESTRADO, DEPOIS AGRUPADAS POR ÁREA (Conforme faixa real da foto) */}
                  <div className="w-full relative z-10 pt-3 pb-4">
                    {isLoading && allSpecialties.length === 0 ? (
                      <div className="py-8 flex flex-col items-center justify-center space-y-2 text-emerald-200/60">
                        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-300 rounded-full animate-spin"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Carregando especialidades da faixa...</span>
                      </div>
                    ) : likedIds.length === 0 ? (
                      <div className="py-8 px-4 text-center flex flex-col items-center space-y-3 bg-black/20 rounded-2xl border border-emerald-500/20 my-2">
                        <Award size={28} className="text-emerald-300/60" />
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase text-emerald-100 tracking-wider">
                            Sua faixa está pronta!
                          </p>
                          <p className="text-[10px] text-emerald-200/70 font-semibold leading-relaxed max-w-[220px]">
                            Adicione suas especialidades conquistadas para exibi-las na sua faixa oficial.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsSashView(true)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#0c3c31] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
                        >
                          Adicionar Especialidades
                        </button>
                      </div>
                    ) : (
                      (() => {
                        const likedSpecialties = (() => {
                          const list: Especialidade[] = [];
                          const seenIds = new Set<string>();

                          allSpecialties
                            .filter(s => likedIds.includes(s.id.toString()))
                            .forEach(s => {
                              list.push(s);
                              seenIds.add(s.id.toString());
                            });

                          completedSpecialties.forEach(c => {
                            const cId = String(c.specialtyId);
                            if (likedIds.includes(cId) && !seenIds.has(cId)) {
                              list.push({
                                id: Number(c.specialtyId) || Date.now(),
                                nome: c.name,
                                codigo: c.code,
                                area: c.area || 'Atividades Recreativas',
                                logo: c.logo || '',
                                requisitos: [],
                                club: userClubType
                              });
                              seenIds.add(cId);
                            }
                          });

                          return list;
                        })();
                        const isMastery = (s: Especialidade) => {
                          const n = (s.nome || '').toLowerCase();
                          const a = (s.area || '').toLowerCase();
                          const sig = (s.sigla || '').toUpperCase();
                          return n.includes('mestrado') || n.includes('mestre em') || a === 'mestrados' || sig === 'ME';
                        };
                        const allMasterySpecialties = allSpecialties.filter(isMastery);
                        const ordinarySpecialties = likedSpecialties.filter(s => !isMastery(s));
                        
                        const normalize = (txt: string) => 
                          (txt || "")
                             .toLowerCase()
                             .normalize("NFD")
                             .replace(/[\u0300-\u036f]/g, "")
                             .replace('mestrado em ', '')
                             .replace('mestrado de ', '')
                             .replace('mestre em ', '')
                             .replace('mestre de ', '')
                             .replace('campreste', 'campestre')
                             .replace('tecinologia', 'tecnologia')
                             .trim();

                        const cleanStr = (txt: string) => 
                          (txt || "")
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[;:,.]/g, " ")
                            .replace(/[-–—_]/g, " ")
                            .replace(/\s+/g, " ")
                            .trim();

                        const findMasteryItem = (ruleName: string, category: string): Especialidade | undefined => {
                          const normRule = normalize(ruleName);
                          const normCat = normalize(category);
                          
                          let found = allMasterySpecialties.find(s => {
                            const sNorm = normalize(s.nome);
                            return sNorm === normRule || sNorm.includes(normRule) || normRule.includes(sNorm);
                          });
                          
                          if (!found) {
                            found = allMasterySpecialties.find(s => {
                              const sNorm = normalize(s.nome);
                              return sNorm === normCat || sNorm.includes(normCat) || normCat.includes(sNorm);
                            });
                          }

                          if (!found) {
                            found = allSpecialties.find(s => {
                              const sNorm = normalize(s.nome);
                              return sNorm.includes(normRule) || (normCat && sNorm.includes(normCat));
                            });
                          }
                          return found;
                        };

                        const normalizeSpecialtyStrict = (str: string) => {
                          return (str || "")
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]/g, "");
                        };

                        const replaceNumerals = (s: string) => s
                          .replace(/i{1,3}$/, m => m === 'i' ? '1' : m === 'ii' ? '2' : '3')
                          .replace(/iv$/, '4')
                          .replace(/v$/, '5');

                        const isSpecialtyMatch = (sNome: string, ruleSpecialty: string): boolean => {
                          const normS = normalizeSpecialtyStrict(sNome);
                          const normR = normalizeSpecialtyStrict(ruleSpecialty);

                          if (!normS || !normR) return false;
                          if (normS === normR) return true;
                          if (replaceNumerals(normS) === replaceNumerals(normR)) return true;
                          if (normS + 's' === normR || normR + 's' === normS) return true;
                          if ((normR === "bacterias" && normS === "bacteria") || (normR === "bacteria" && normS === "bacterias")) return true;
                          return false;
                        };

                        const getSpecialtiesForRule = (rule: typeof MASTERY_RULES[0], pool: Especialidade[], masteryItem?: Especialidade) => {
                          const dbReqs = (masteryItem?.requisitos || []).flatMap(r => {
                            return r.split(/\r?\n|;/).map(part => part.trim()).filter(p => p.length >= 3);
                          });

                          return pool.filter(s => {
                            const sCat = cleanStr(s.area);
                            const sSigla = (s.sigla || '').toUpperCase();

                            if (rule.isGlobalArea) {
                              if (sCat && (sCat === cleanStr(rule.category) || sCat.includes(cleanStr(rule.category)))) return true;
                              if (sSigla && rule.siglas && rule.siglas.map(sig => sig.toUpperCase()).includes(sSigla)) return true;
                              return false;
                            }

                            const isInRuleList = rule.specialties.some(rs => isSpecialtyMatch(s.nome, rs));
                            const isInDbReqs = dbReqs.length > 0 && dbReqs.some(req => isSpecialtyMatch(s.nome, req));

                            return isInRuleList || isInDbReqs;
                          });
                        };

                        const getFamilyKey = (mName: string, category: string): string => {
                          const n = normalize(mName);
                          const c = normalize(category);
                          if (n.includes('profissiona') || n.includes('tecnologia') || c.includes('profissiona') || c.includes('tecnologia')) {
                            return 'tecnologia_profissoes'; // Vermelho: Atividades Profissionais & Ciência e Tecnologia compartilham especialidades de computação
                          }
                          if (n.includes('botanica') || n.includes('zoologia') || n.includes('ecologia') || c.includes('natureza')) {
                            return 'estudo_da_natureza'; // Verde claro
                          }
                          if (n.includes('campestre') || n.includes('esporte') || n.includes('aquatica') || n.includes('recreativas') || c.includes('recreativas') || c.includes('campestre')) {
                            return 'recreativas_campestre'; // Verde escuro
                          }
                          if (n.includes('testificacao') || n.includes('biblico') || c.includes('missionaria') || c.includes('biblico')) {
                            return 'espiritual'; // Azul
                          }
                          if (n.includes('manual') || n.includes('artes') || c.includes('artes')) {
                            return 'artes_manuais'; // Amarelo
                          }
                          if (n.includes('agricola') || c.includes('agricola')) {
                            return 'agricolas';
                          }
                          if (n.includes('saude') || c.includes('saude')) {
                            return 'saude';
                          }
                          if (n.includes('adra') || c.includes('adra')) {
                            return 'adra';
                          }
                          if (n.includes('domestica') || c.includes('domestica')) {
                            return 'domesticas';
                          }
                          return n;
                        };

                        interface ActiveMasteryGroup {
                          id: string | number;
                          name: string;
                          logo?: string;
                          items: Especialidade[];
                          isManual?: boolean;
                          requirementsCount: number;
                          familyKey: string;
                          category: string;
                          canonicalOrder: number;
                          rule?: any;
                        }

                        const getMasteryCanonicalIndex = (name: string): number => {
                          const n = normalize(name);
                          const idx = MASTERY_RULES.findIndex(r => {
                            const rNorm = normalize(r.name);
                            return rNorm === n || n.includes(rNorm) || rNorm.includes(n);
                          });
                          return idx !== -1 ? idx : 999;
                        };

                        const activeMasteryGroups: ActiveMasteryGroup[] = [];

                        // REGRA OFICIAL E ESTRITA: É para pôr APENAS os mestrados que têm as especialidades necessárias para completá-los
                        MASTERY_RULES.forEach((rule, ruleIdx) => {
                          const masteryItem = findMasteryItem(rule.name, rule.category);
                          const matchingItems = getSpecialtiesForRule(rule, ordinarySpecialties, masteryItem);
                          const reqCount = rule.requirementsCount || 7;
                          const hasMetRequirements = matchingItems.length >= reqCount;

                          // Só inclui na faixa se o usuário tiver todas as especialidades exigidas para completar o mestrado!
                          if (hasMetRequirements) {
                            activeMasteryGroups.push({
                              id: masteryItem ? masteryItem.id : rule.name,
                              name: masteryItem ? masteryItem.nome.replace(/campreste/gi, 'Campestre') : rule.name,
                              logo: masteryItem?.logo,
                              items: matchingItems,
                              isManual: false,
                              requirementsCount: reqCount,
                              familyKey: getFamilyKey(rule.name, rule.category),
                              category: rule.category,
                              canonicalOrder: ruleIdx,
                              rule: rule
                            });
                          }
                        });

                        // Fallback para mestrados marcados manualmente na modal Minha Faixa:
                        // Também SÓ entra se possuir as especialidades necessárias para completar!
                        allMasterySpecialties.forEach(mastery => {
                          if (likedIds.includes(mastery.id.toString())) {
                            const alreadyAdded = activeMasteryGroups.some(g => String(g.id) === String(mastery.id));
                            if (!alreadyAdded) {
                              const mName = normalize(mastery.nome);
                              const matchingRule = MASTERY_RULES.find(r => {
                                const rNorm = normalize(r.name);
                                return rNorm === mName || mName.includes(rNorm) || rNorm.includes(mName);
                              });
                              
                              const matchingItems = matchingRule 
                                ? getSpecialtiesForRule(matchingRule, ordinarySpecialties, mastery)
                                : ordinarySpecialties.filter(s => {
                                    const area = s.area ? normalize(s.area) : '';
                                    return area && (mName.includes(area) || area.includes(mName));
                                  });

                              const reqCount = matchingRule?.requirementsCount || 7;
                              if (matchingItems.length >= reqCount) {
                                activeMasteryGroups.push({
                                  id: mastery.id,
                                  name: mastery.nome.replace(/campreste/gi, 'Campestre'),
                                  logo: mastery.logo,
                                  items: matchingItems,
                                  isManual: true,
                                  requirementsCount: reqCount,
                                  familyKey: getFamilyKey(mastery.nome, mastery.area || ''),
                                  category: mastery.area || '',
                                  canonicalOrder: getMasteryCanonicalIndex(mastery.nome),
                                  rule: matchingRule
                                });
                              }
                            }
                          }
                        });

                        // Estrutura de blocos na faixa conforme regra oficial e referência:
                        // "mestrado seguida de suas especialidades, se tem 2 mestrados, coloque o primeiro e suas especialidade,
                        // depois o segundo e suas especialidade e após isso as especialidades que não esta em nenhum dos 2 mestrados daquela área."
                        // "se houver um mestrado que compartilhe de mesma especialidade colocar os dois mestrados juntos lado a lado acima das especialidades."
                        // "primeiro as que têm mestrado, depois agrupadas por área"
                        interface SashBlock {
                          masteries?: ActiveMasteryGroup[];
                          specialties: Especialidade[];
                          areaName?: string;
                          isLeftoverFromMasteryArea?: boolean;
                        }

                        const sashBlocks: SashBlock[] = [];
                        const usedSpecialtyIds = new Set<string>();

                        // Todas as especialidades que pertencem a qualquer mestrado ativo são reservadas para o seu mestrado!
                        const allActiveMasterySpecialtyIds = new Set<string>();
                        activeMasteryGroups.forEach(mGroup => {
                          mGroup.items.forEach(s => allActiveMasterySpecialtyIds.add(String(s.id)));
                        });

                        const getFamilyDisplayName = (fKey: string): string => {
                          switch (fKey) {
                            case 'adra': return 'ADRA';
                            case 'artes_manuais': return 'Artes e Habilidades Manuais';
                            case 'agricolas': return 'Atividades Agrícolas';
                            case 'espiritual': return 'Atividades Missionárias e Ensinos Bíblicos';
                            case 'tecnologia_profissoes': return 'Ciência, Tecnologia e Atividades Profissionais';
                            case 'recreativas_campestre': return 'Atividades Recreativas e Vida Campestre';
                            case 'saude': return 'Ciência e Saúde';
                            case 'estudo_da_natureza': return 'Estudo da Natureza';
                            case 'domesticas': return 'Habilidades Domésticas';
                            default: return 'Outras Especialidades';
                          }
                        };

                        const isSpecialtyInFamily = (s: Especialidade, fKey: string): boolean => {
                          const sCat = cleanStr(s.area);
                          const sSigla = (s.sigla || '').toUpperCase();

                          if (fKey === 'adra') {
                            return sCat.includes('adra') || sSigla === 'AD';
                          }
                          if (fKey === 'artes_manuais') {
                            return sCat.includes('manuais') || sCat.includes('artes') || sSigla === 'HM';
                          }
                          if (fKey === 'agricolas') {
                            return sCat.includes('agricola') || sSigla === 'AA' || sSigla === 'AG';
                          }
                          if (fKey === 'espiritual') {
                            return sCat.includes('missionaria') || sCat.includes('biblico') || sSigla === 'AM' || sSigla === 'MA' || sSigla === 'AM-EB';
                          }
                          if (fKey === 'tecnologia_profissoes') {
                            return sCat.includes('profissional') || sCat.includes('tecnologia') || sSigla === 'AP' || sSigla === 'CT';
                          }
                          if (fKey === 'recreativas_campestre') {
                            return sCat.includes('campestre') || sCat.includes('recreativa') || sSigla === 'VC' || sSigla === 'AR' || sSigla === 'ES' || sSigla === 'AQ';
                          }
                          if (fKey === 'saude') {
                            return sCat.includes('saude') || sCat.includes('ciencia') || sSigla === 'CS' || sSigla === 'SA';
                          }
                          if (fKey === 'estudo_da_natureza') {
                            return sCat.includes('natureza') || sSigla === 'EN';
                          }
                          if (fKey === 'domesticas') {
                            return sCat.includes('domestica') || sSigla === 'HD';
                          }
                          return false;
                        };

                        // Ordena especialidades conforme o rol canônico de requisitos do mestrado quando existir
                        const sortSpecialtiesForRule = (items: Especialidade[], rule?: any): Especialidade[] => {
                          if (!rule || !rule.specialties || rule.specialties.length === 0) {
                            return [...items].sort((a, b) => a.nome.localeCompare(b.nome));
                          }
                          return [...items].sort((a, b) => {
                            const idxA = rule.specialties.findIndex((rs: string) => isSpecialtyMatch(a.nome, rs));
                            const idxB = rule.specialties.findIndex((rs: string) => isSpecialtyMatch(b.nome, rs));
                            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                            if (idxA !== -1) return -1;
                            if (idxB !== -1) return 1;
                            return a.nome.localeCompare(b.nome);
                          });
                        };

                        // Verifica se dois mestrados compartilham de mesma especialidade
                        const masteriesShareSpecialty = (m1: ActiveMasteryGroup, m2: ActiveMasteryGroup): boolean => {
                          // 1. Compartilham especialidades concluídas pelo usuário
                          const m1Ids = new Set(m1.items.map(s => String(s.id)));
                          const sharesUserItems = m2.items.some(s => m1Ids.has(String(s.id)));
                          if (sharesUserItems) return true;

                          // 2. Ambos pertencem à família Ciência e Tecnologia / Atividades Profissionais que compartilham campo de computação
                          const isAP1 = cleanStr(m1.name).includes('profissiona') || cleanStr(m1.category).includes('profissiona');
                          const isCT1 = cleanStr(m1.name).includes('tecnologia') || cleanStr(m1.category).includes('tecnologia');
                          const isAP2 = cleanStr(m2.name).includes('profissiona') || cleanStr(m2.category).includes('profissiona');
                          const isCT2 = cleanStr(m2.name).includes('tecnologia') || cleanStr(m2.category).includes('tecnologia');

                          if ((isAP1 && isCT2) || (isCT1 && isAP2)) {
                            return true;
                          }

                          return false;
                        };

                        // 1. Agrupa os mestrados ativos por família/área
                        const familyGroups = new Map<string, ActiveMasteryGroup[]>();
                        activeMasteryGroups.forEach(mGroup => {
                          const fKey = mGroup.familyKey;
                          if (!familyGroups.has(fKey)) {
                            familyGroups.set(fKey, []);
                          }
                          familyGroups.get(fKey)!.push(mGroup);
                        });

                        // Ordem canônica oficial das 9 áreas da Divisão Sul-Americana (DSA):
                        // 1. ADRA
                        // 2. Artes e Habilidades Manuais
                        // 3. Atividades Agrícolas
                        // 4. Atividades Missionárias e Comunitárias / Ensinos Bíblicos
                        // 5. Atividades Profissionais & Ciência e Tecnologia
                        // 6. Atividades Recreativas (Aquática, Esportes, Vida Campestre, Atividades Recreativas)
                        // 7. Ciência e Saúde
                        // 8. Estudo da Natureza (Zoologia, Ecologia, Botânica)
                        // 9. Habilidades Domésticas
                        const familiesOrder = [
                          'adra',
                          'artes_manuais',
                          'agricolas',
                          'espiritual',
                          'tecnologia_profissoes',
                          'recreativas_campestre',
                          'saude',
                          'estudo_da_natureza',
                          'domesticas'
                        ];

                        const processedFamilies = new Set<string>();

                        const processFamily = (fKey: string, masteriesInFamily: ActiveMasteryGroup[]) => {
                          processedFamilies.add(fKey);

                          // Ordena mestrados pela sequência canônica de regras oficiais da DSA
                          const sortedMasteries = [...masteriesInFamily].sort((a, b) => {
                            if (a.canonicalOrder !== b.canonicalOrder) {
                              return a.canonicalOrder - b.canonicalOrder;
                            }
                            return a.name.localeCompare(b.name);
                          });

                          // Agrupa os mestrados da área em clusters com base em especialidades compartilhadas:
                          // - Mestrados que compartilham de mesma especialidade ficam no mesmo cluster
                          // - Mestrados que NÃO compartilham especialidades ficam em clusters separados
                          const clusters: ActiveMasteryGroup[][] = [];
                          const visited = new Set<string>();

                          for (const m of sortedMasteries) {
                            const mId = String(m.id);
                            if (visited.has(mId)) continue;

                            const cluster: ActiveMasteryGroup[] = [];
                            const queue: ActiveMasteryGroup[] = [m];
                            visited.add(mId);

                            while (queue.length > 0) {
                              const curr = queue.shift()!;
                              cluster.push(curr);

                              for (const other of sortedMasteries) {
                                const otherId = String(other.id);
                                if (!visited.has(otherId) && masteriesShareSpecialty(curr, other)) {
                                  visited.add(otherId);
                                  queue.push(other);
                                }
                              }
                            }

                            // Quando o cluster tem Ciência e Tecnologia e Atividades Profissionais, coloca Ciência e Tecnologia à esquerda e Atividades Profissionais à direita conforme padrão oficial de referência
                            cluster.sort((a, b) => {
                              const aIsCT = cleanStr(a.name).includes('tecnologia');
                              const bIsCT = cleanStr(b.name).includes('tecnologia');
                              if (aIsCT && !bIsCT) return -1;
                              if (!aIsCT && bIsCT) return 1;
                              return a.canonicalOrder - b.canonicalOrder;
                            });
                            clusters.push(cluster);
                          }

                          // Processa cada cluster na ordem:
                          // Se não compartilham especialidades: "colocar o primeiro mestrado seguido de suas especialidades, depois o segundo mestrado e suas especialidades"
                          // Se compartilham especialidades: "se houver um mestrado que compartilhe de mesma especialidade colocar os dois mestrados juntos lado a lado acima das especialidades."
                          clusters.forEach(cluster => {
                            if (cluster.length === 1) {
                              // Mestrado individual: emblema centralizado seguido de suas especialidades
                              const mGroup = cluster[0];
                              const mSpecialties = sortSpecialtiesForRule(
                                mGroup.items.filter(s => !usedSpecialtyIds.has(String(s.id))),
                                mGroup.rule
                              );

                              mSpecialties.forEach(s => usedSpecialtyIds.add(String(s.id)));

                              sashBlocks.push({
                                masteries: [mGroup],
                                specialties: mSpecialties,
                                areaName: mGroup.name
                              });
                            } else {
                              // Dois ou mais mestrados que COMPARTILHAM a mesma especialidade:
                              // Coloca os mestrados juntos lado a lado acima das especialidades!
                              const clusterSpecialties: Especialidade[] = [];
                              const seenClusterSpecialtyIds = new Set<string>();

                              if (cluster.length === 2) {
                                const mLeft = cluster[0];
                                const mRight = cluster[1];

                                const leftSorted = sortSpecialtiesForRule(
                                  mLeft.items.filter(s => !usedSpecialtyIds.has(String(s.id))),
                                  mLeft.rule
                                );
                                const leftIds = new Set(leftSorted.map(s => String(s.id)));

                                const rightSorted = sortSpecialtiesForRule(
                                  mRight.items.filter(s => !usedSpecialtyIds.has(String(s.id))),
                                  mRight.rule
                                );
                                const rightOnly = rightSorted.filter(s => !leftIds.has(String(s.id)));

                                // Alinha no grid de 4 colunas:
                                // As primeiras 3 colunas sob o mestrado da esquerda, a 4ª coluna sob o mestrado da direita
                                let leftIdx = 0;
                                let rightIdx = 0;

                                while (leftIdx < leftSorted.length || rightIdx < rightOnly.length) {
                                  // Adiciona até 3 do mestrado da esquerda (ou compartilhadas)
                                  for (let c = 0; c < 3 && leftIdx < leftSorted.length; c++) {
                                    const s = leftSorted[leftIdx++];
                                    const sId = String(s.id);
                                    if (!seenClusterSpecialtyIds.has(sId)) {
                                      seenClusterSpecialtyIds.add(sId);
                                      usedSpecialtyIds.add(sId);
                                      clusterSpecialties.push(s);
                                    }
                                  }

                                  // Adiciona 1 do mestrado da direita na 4ª coluna
                                  if (rightIdx < rightOnly.length) {
                                    const s = rightOnly[rightIdx++];
                                    const sId = String(s.id);
                                    if (!seenClusterSpecialtyIds.has(sId)) {
                                      seenClusterSpecialtyIds.add(sId);
                                      usedSpecialtyIds.add(sId);
                                      clusterSpecialties.push(s);
                                    }
                                  }
                                }

                                // Se restou algo não incluído de mRight:
                                rightSorted.forEach(s => {
                                  const sId = String(s.id);
                                  if (!seenClusterSpecialtyIds.has(sId) && !usedSpecialtyIds.has(sId)) {
                                    seenClusterSpecialtyIds.add(sId);
                                    usedSpecialtyIds.add(sId);
                                    clusterSpecialties.push(s);
                                  }
                                });
                              } else {
                                cluster.forEach(mGroup => {
                                  const orderedItems = sortSpecialtiesForRule(mGroup.items, mGroup.rule);
                                  orderedItems.forEach(s => {
                                    const sId = String(s.id);
                                    if (!seenClusterSpecialtyIds.has(sId) && !usedSpecialtyIds.has(sId)) {
                                      seenClusterSpecialtyIds.add(sId);
                                      usedSpecialtyIds.add(sId);
                                      clusterSpecialties.push(s);
                                    }
                                  });
                                });
                              }

                              sashBlocks.push({
                                masteries: cluster,
                                specialties: clusterSpecialties,
                                areaName: getFamilyDisplayName(fKey)
                              });
                            }
                          });

                          // "depois as especialidades que não completam um mestrado" daquela área:
                          // Filtra apenas especialidades da área que NÃO pertencem a nenhum mestrado ativo
                          const remainingInFamily = ordinarySpecialties
                            .filter(s => !allActiveMasterySpecialtyIds.has(String(s.id)))
                            .filter(s => !usedSpecialtyIds.has(String(s.id)))
                            .filter(s => isSpecialtyInFamily(s, fKey))
                            .sort((a, b) => a.nome.localeCompare(b.nome));

                          if (remainingInFamily.length > 0) {
                            remainingInFamily.forEach(s => usedSpecialtyIds.add(String(s.id)));
                            sashBlocks.push({
                              specialties: remainingInFamily,
                              areaName: getFamilyDisplayName(fKey),
                              isLeftoverFromMasteryArea: true
                            });
                          }
                        };

                        // FASE 1: Processa PRIMEIRO todas as famílias oficiais que POSSUEM mestrados ativos
                        // Garantindo que mestrados e suas respectivas especialidades venham no topo da faixa
                        familiesOrder.forEach(fKey => {
                          if (familyGroups.has(fKey)) {
                            processFamily(fKey, familyGroups.get(fKey)!);
                          }
                        });

                        // Qualquer outra família fora das 9 oficiais com mestrado ativo
                        familyGroups.forEach((mList, fKey) => {
                          if (!processedFamilies.has(fKey)) {
                            processFamily(fKey, mList);
                          }
                        });

                        // FASE 2: Processa as famílias que NÃO possuem mestrado ativo (especialidades agrupadas por área na ordem oficial)
                        familiesOrder.forEach(fKey => {
                          const ordinaryInFamily = ordinarySpecialties
                            .filter(s => !allActiveMasterySpecialtyIds.has(String(s.id)))
                            .filter(s => !usedSpecialtyIds.has(String(s.id)))
                            .filter(s => isSpecialtyInFamily(s, fKey))
                            .sort((a, b) => a.nome.localeCompare(b.nome));

                          if (ordinaryInFamily.length > 0) {
                            ordinaryInFamily.forEach(s => usedSpecialtyIds.add(String(s.id)));
                            sashBlocks.push({
                              specialties: ordinaryInFamily,
                              areaName: getFamilyDisplayName(fKey)
                            });
                          }
                        });

                        // FASE 3: Especialidades restantes que não caíram em nenhuma família conhecida
                        const leftoverSpecialties = ordinarySpecialties
                          .filter(s => !allActiveMasterySpecialtyIds.has(String(s.id)))
                          .filter(s => !usedSpecialtyIds.has(String(s.id)));

                        if (leftoverSpecialties.length > 0) {
                          const leftoverByArea = Object.entries(
                            leftoverSpecialties.reduce((acc, esp) => {
                              const area = esp.area || 'Outras';
                              if (!acc[area]) acc[area] = [];
                              acc[area].push(esp);
                              return acc;
                            }, {} as Record<string, Especialidade[]>)
                          );

                          leftoverByArea.sort(([a], [b]) => a.localeCompare(b));

                          leftoverByArea.forEach(([area, items]) => {
                            const sortedItems = [...items].sort((a, b) => a.nome.localeCompare(b.nome));
                            sortedItems.forEach(s => usedSpecialtyIds.add(String(s.id)));
                            sashBlocks.push({
                              specialties: sortedItems,
                              areaName: area
                            });
                          });
                        }

                        return (
                          <div className="w-full space-y-4 sm:space-y-5">
                            {sashBlocks.map((block, idx) => (
                              <div key={idx} className="w-full space-y-1.5 sm:space-y-2">
                                {/* Mestrados do bloco: se tiver 2 ou mais mestrados que dividem especialidades, coloca-os juntos lado a lado acima das especialidades */}
                                {block.masteries && block.masteries.length > 0 && (
                                  <div className="flex flex-row flex-nowrap items-center justify-center gap-2 sm:gap-3.5 pt-1 pb-1.5 w-full">
                                    {block.masteries.map(mGroup => (
                                      <div 
                                        key={mGroup.id}
                                        className="w-[136px] h-[92px] sm:w-[150px] sm:h-[102px] flex items-center justify-center relative select-none pointer-events-none transition-transform flex-shrink-0"
                                        title={`Mestrado: ${mGroup.name}`}
                                      >
                                        {mGroup.logo ? (
                                          <img 
                                            src={mGroup.logo} 
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.75)]" 
                                            alt={mGroup.name} 
                                          />
                                        ) : (
                                          <Trophy size={44} className="text-amber-400 filter drop-shadow" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Especialidades correspondentes logo abaixo */}
                                {block.specialties.length > 0 && (
                                  <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full justify-items-center">
                                    {block.specialties.map(esp => (
                                      <div 
                                        key={esp.id} 
                                        className="w-[70px] h-[70px] sm:w-[76px] sm:h-[76px] flex items-center justify-center select-none pointer-events-none p-0"
                                        title={esp.nome}
                                      >
                                        {esp.logo ? (
                                          <img 
                                            src={esp.logo} 
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" 
                                            alt={esp.nome} 
                                          />
                                        ) : (
                                          <Award size={34} className="text-emerald-200" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    )}
                  </div>

                  {/* 5. PONTA DA FAIXA: GLOBO OFICIAL CORTADO NA DIAGONAL A 45° COM ROTAÇÃO ALINHADA AO CORTE */}
                  <div className="w-full relative z-20 pt-6 pb-2 flex flex-col items-center">
                    <div 
                      onClick={() => setShowGloboModal(true)}
                      className="relative group cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 flex flex-col items-center translate-x-1 sm:translate-x-2 -translate-y-4 sm:-translate-y-6"
                      title={`${sashGlobeInfo.label} • Toque para ver detalhes`}
                    >
                      <div 
                        className="w-[240px] h-[240px] sm:w-[280px] sm:h-[280px] relative flex items-center justify-center rotate-[45deg]"
                      >
                        <img 
                          src={sashGlobeInfo.url} 
                          alt={sashGlobeInfo.label}
                          className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.75)] transition-all" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Botão Voltar ao Topo */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-28 right-6 w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 active:scale-90 transition-all z-[60] animate-bounce-in"
          title="Voltar ao Topo"
          aria-label="Voltar ao Topo"
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
      )}

      {/* Modal de Gestão de Reportes de Erros (Apenas Administrador) */}
      {isAdmin && isAdminReportsModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={() => setIsAdminReportsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-left">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight">
                      Central de Reportes de Erros
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      Admin
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    Feedback, bugs e correções enviadas pelos usuários do app
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminReportsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 active:scale-90 transition-all cursor-pointer"
                title="Fechar"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Filtros e Barra de Pesquisa */}
            <div className="p-4 sm:p-5 pb-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setErrorReportsFilter('ALL')}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    errorReportsFilter === 'ALL'
                      ? 'bg-white dark:bg-slate-800 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Todos</span>
                  <span className="text-base font-black text-slate-800 dark:text-white leading-none">
                    {errorReportsList.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setErrorReportsFilter('PENDING')}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    errorReportsFilter === 'PENDING'
                      ? 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 block tracking-wider">Pendentes</span>
                  <span className="text-base font-black text-amber-600 dark:text-amber-400 leading-none">
                    {pendingReportsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setErrorReportsFilter('RESOLVED')}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    errorReportsFilter === 'RESOLVED'
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block tracking-wider">Resolvidos</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {errorReportsList.filter(r => r.status === 'RESOLVED').length}
                  </span>
                </button>
              </div>

              {/* Barra de Pesquisa */}
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={errorReportsSearch}
                  onChange={(e) => setErrorReportsSearch(e.target.value)}
                  placeholder="Pesquisar reporte por título, e-mail, tela ou descrição..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-2 pl-9 pr-8 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {errorReportsSearch && (
                  <button
                    type="button"
                    onClick={() => setErrorReportsSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Reportes */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-hide">
              {isLoadingReports ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">Carregando reportes de erros...</span>
                </div>
              ) : filteredAdminReports.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400 text-center">
                  <CheckCircle2 size={36} className="text-emerald-500/40" />
                  <p className="text-sm font-black text-slate-600 dark:text-slate-300">
                    Nenhum reporte encontrado
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    {errorReportsFilter === 'PENDING'
                      ? 'Nenhum erro pendente de resolução no momento. Tudo limpo!'
                      : 'Nenhum registro corresponde aos filtros selecionados.'}
                  </p>
                </div>
              ) : (
                filteredAdminReports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      report.status === 'RESOLVED'
                        ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-80'
                        : 'bg-white dark:bg-slate-800 border-amber-500/30 dark:border-amber-500/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          report.status === 'RESOLVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                        }`}>
                          {report.status === 'RESOLVED' ? 'Resolvido' : 'Pendente'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {report.category || 'Geral'}
                        </span>
                        {report.location && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            {report.location}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {new Date(report.createdAt).toLocaleDateString('pt-BR')} às {new Date(report.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-800 dark:text-white mb-1.5">
                      {report.title}
                    </h4>

                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed mb-3">
                      {report.description}
                    </div>

                    {/* Informações do Solicitante e Aparelho */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-3 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                      <div>
                        <span className="font-bold text-slate-600 dark:text-slate-300">Autor: </span>
                        <span>{report.userName || 'Anônimo'}</span>
                        {report.userEmail && (
                          <span className="text-indigo-500 dark:text-indigo-400 block truncate">
                            {report.userEmail}
                          </span>
                        )}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-slate-600 dark:text-slate-300">Aparelho: </span>
                        <span className="truncate">{report.deviceInfo || 'Não detectado'}</span>
                        {report.appVersion && (
                          <span className="text-emerald-500 block font-mono font-bold">
                            {report.appVersion}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            const details = `📋 REPORTE DE ERRO (DBV Tudo)\nID: ${report.id}\nCategoria: ${report.category}\nTítulo: ${report.title}\nLocal: ${report.location || 'Geral'}\nData: ${new Date(report.createdAt).toLocaleString('pt-BR')}\nAutor: ${report.userName || 'Anônimo'} (${report.userEmail || 'sem email'})\nAparelho: ${report.deviceInfo || '-'}\nVersão: ${report.appVersion || '-'}\n\nDescrição:\n${report.description}`;
                            navigator.clipboard.writeText(details);
                            setCopiedReportId(report.id);
                            setTimeout(() => setCopiedReportId(null), 2500);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Copy size={13} />
                          <span>{copiedReportId === report.id ? 'Copiado!' : 'Copiar'}</span>
                        </button>

                        {confirmDeleteReportId === report.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              disabled={isDeletingReportId === report.id}
                              onClick={async () => {
                                setIsDeletingReportId(report.id);
                                setErrorReportsList(prev => prev.filter(r => r.id !== report.id));
                                setConfirmDeleteReportId(null);
                                await deleteErrorReport(report.id);
                                setIsDeletingReportId(null);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-all"
                            >
                              <Trash2 size={13} />
                              <span>{isDeletingReportId === report.id ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteReportId(null)}
                              className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 text-[11px] font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteReportId(report.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                          >
                            <Trash2 size={13} />
                            <span>Excluir</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          const nextStatus = report.status === 'RESOLVED' ? 'PENDING' : 'RESOLVED';
                          await updateErrorReportStatus(report.id, nextStatus);
                          setErrorReportsList(prev => prev.map(r => r.id === report.id ? { ...r, status: nextStatus, resolvedAt: nextStatus === 'RESOLVED' ? Date.now() : undefined } : r));
                        }}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                          report.status === 'RESOLVED'
                            ? 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                        <span>{report.status === 'RESOLVED' ? 'Reabrir' : 'Marcar Resolvido'}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Reset de Especialidades */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">

          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setShowResetConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[36px] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/40 shadow-inner">
              <RotateCcw size={30} strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white">
                Resetar Minha Faixa?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                Tem certeza que deseja desmarcar todas as <span className="text-rose-500 font-black">{likedIds.length}</span> especialidades favoritadas da sua faixa?
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetSpecialties}
                className="flex-1 py-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <RotateCcw size={15} strokeWidth={2.5} />
                <span>Sim, Limpar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
