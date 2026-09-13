
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, LogOut, Shield, MapPin, Briefcase, Award, Camera, Check, X, User, Mail, Phone, ChevronDown, Heart, Search, Settings, Layers, Globe, Trophy, ArrowUp, RotateCcw, AlertTriangle, Calendar, Lock } from 'lucide-react';
import { ClubType, Especialidade, UserProfile, Conquista } from '../types';
import { MASTERY_RULES } from '../masteryRules';
import { 
  fetchEspecialidades, getCachedEspecialidades,
  fetchUserProfile, fetchUserProfileByEmail, updateUserProfile, supabase,
  fetchConquistas, fetchUserAchievements, updateUserAchievements,
  fetchFuncoes, DEFAULT_CARGOS, getCachedFuncoes,
  getLocalFaixaSpecialties, saveLocalFaixaSpecialties, clearLocalFaixaSpecialties,
  fetchUserFaixaSpecialties, updateUserFaixa
} from '../services/supabaseService';

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
    return { isEligible: true, minAge };
  }
  const isEligible = age >= minAge;
  let msg = '';
  if (!isEligible) {
    if (con.tipo === 'LIDERANCA') {
      msg = `Disponível a partir dos 18 anos (sua idade: ${age} anos)`;
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
}

export const TiraNome: React.FC<TiraNomeProps> = ({ name, age }) => {
  const isAdultUniform = age !== null && age >= 16;
  const bgColor = isAdultUniform ? 'bg-[#f8f6f0] text-[#0a0a0a]' : 'bg-[#c5a57d] text-[#0a0a0a]';
  const borderColor = 'border-[#223014]';
  
  // Imagem da faixa real: Nome bordado em destaque preenchendo a altura e largura da tira
  const firstName = (name || 'DESBRAVADOR').trim().split(/\s+/)[0].toUpperCase();

  return (
    <div className="w-full max-w-[240px] sm:max-w-[260px] my-1 relative group select-none">
      {/* Plaqueta com costura militar bordada fiel à faixa real */}
      <div className={`w-full py-1.5 sm:py-2 px-3 rounded-xs border-[3.5px] sm:border-[4px] ${borderColor} ${bgColor} shadow-md flex items-center justify-center relative overflow-hidden`}>
        {/* Textura têxtil de entretela e tecido bordado */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:3px_3px] pointer-events-none" />
        <span className="font-black text-2xl sm:text-3xl md:text-[32px] tracking-[0.15em] sm:tracking-[0.18em] uppercase truncate text-center leading-none font-mono drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">
          {firstName}
        </span>
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
      return getCachedEspecialidades(initialClubType);
    } catch {
      return [];
    }
  });
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
      isAdmin: false
    };
  };

  const [userData, setUserData] = useState(getInitialData);
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
  const isAdmin = userData.isAdmin || userData.email === 'ronaldosonic@gmail.com' || userData.email === 'dbvtudo2024@gmail.com';
  const userClubType = userData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
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

  // Carregar dados do Supabase se houver usuário logado
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          const user = data.user;
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
          if (dbIds && dbIds.length > 0) {
            setLikedIds(prev => {
              const combined = Array.from(new Set([...prev, ...dbIds]));
              if (prev.length === combined.length && prev.every((id, idx) => id === combined[idx])) {
                return prev;
              }
              saveLocalFaixaSpecialties(combined, userData.email, userClubType);
              return combined;
            });
          } else {
            // Se o banco retornou vazio mas temos especialidades locais da faixa, restaura no banco
            const currentLocal = getLocalFaixaSpecialties(userData.email, userClubType);
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

  // Carregar apenas as especialidades do clube ativo (Desbravador ou Aventureiro) para a faixa
  useEffect(() => {
    let isMounted = true;
    const loadSpecialties = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEspecialidades(userClubType);
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

    loadSpecialties();
    return () => { isMounted = false; };
  }, [userClubType, isSashView]);

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
    if (con && userAge !== null) {
      const eligibility = checkConquistaEligibility(con, userAge);
      if (!eligibility.isEligible) {
        alert(`⚠️ ${con.nome}: ${eligibility.msg}`);
        return;
      }
    }

    setUserAchievements(prev => {
      const isAcquired = prev.includes(id);
      const newList = isAcquired 
        ? prev.filter(i => i !== id) 
        : [...prev, id];
      
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
    return allSpecialties
      .filter(s => s.club === userClubType)
      .filter(s => likedIds.includes(s.id.toString()));
  }, [allSpecialties, likedIds, userClubType]);

  const filteredSpecialties = useMemo(() => {
    return allSpecialties
      .filter(s => s.club === userClubType)
      .filter(s => 
        s.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.codigo && s.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
      );
  }, [allSpecialties, searchTerm, userClubType]);

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
        // Salvar data_nascimento no Supabase Auth metadata para persistência definitiva na nuvem
        if (userData.data_nascimento) {
          try {
            await supabase.auth.updateUser({
              data: { data_nascimento: userData.data_nascimento }
            });
          } catch (authErr) {
            console.warn("Erro ao salvar data_nascimento no auth metadata:", authErr);
          }
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
          fundo: JSON.stringify({ data_nascimento: userData.data_nascimento }),
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
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 overflow-hidden relative transition-colors duration-500">
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

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
              <button 
                onClick={() => setIsSashView(false)}
                className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all border border-white/20"
              >
                <X size={18} strokeWidth={3} />
              </button>
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

            <div className="flex-grow overflow-y-auto p-6 pt-2 space-y-3 scrollbar-hide">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredSpecialties.length > 0 ? (
                filteredSpecialties.map((esp) => (
                  <div key={esp.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-4 flex items-center space-x-4 shadow-sm hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shrink-0 border border-slate-50 dark:border-slate-600">
                      {esp.logo ? (
                        <img src={esp.logo} className="w-10 h-10 object-contain" alt={esp.nome} />
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
                ))
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
          
          {isAdmin && onOpenAdmin && (
            <button 
              onClick={onOpenAdmin}
              className="w-full py-3.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg border border-slate-700 active:scale-95 transition-all flex items-center justify-center space-x-2.5"
            >
              <Shield size={18} className="text-indigo-400" />
              <span>Painel Administrativo</span>
            </button>
          )}
        </div>

        <div className="mt-8 px-4 sm:px-8 pb-10 animate-slide-up max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* LADO 1: SIMULAÇÃO TÊXTIL DO BOLSO ESQUERDO DO UNIFORME DE GALA */}
            <div className="w-full flex flex-col items-center">
              <div className={`w-full max-w-[340px] sm:max-w-[380px] ${
                isAdultUniform 
                  ? 'bg-white border-2 border-slate-300 text-slate-900 shadow-2xl' 
                  : 'bg-[#c7a783] dark:bg-[#b89874] border-2 border-[#a68662] dark:border-[#967753] shadow-2xl'
              } rounded-[28px] p-4 sm:p-5 flex flex-col items-center relative overflow-hidden transition-colors duration-500`}>
                {/* Textura sutil e costuras de alfaiataria */}
                <div className={`absolute inset-0 pointer-events-none ${
                  isAdultUniform 
                    ? 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] opacity-30' 
                    : 'bg-[radial-gradient(#6e502b_1px,transparent_1px)] opacity-15'
                } [background-size:12px_12px]`} />
                <div className={`absolute top-2 left-4 right-4 border-b border-dashed ${
                  isAdultUniform ? 'border-slate-300' : 'border-[#947450]/50 dark:border-[#856541]/60'
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
                        : 'bg-[#be9d77] dark:bg-[#b08f6b] border-2 border-[#9e7f5b] dark:border-[#91724f]'
                    } rounded-t-lg relative shadow-sm flex flex-col items-center justify-center pt-2.5 pb-2.5 px-2 z-10 transition-colors duration-500`}>
                      {/* Pesponto decorativo na lapela */}
                      <div className={`absolute inset-1 border border-dashed ${
                        isAdultUniform ? 'border-slate-300/80' : 'border-[#8f6f4b]/50 dark:border-[#7d5f3d]/60'
                      } pointer-events-none rounded-t-sm`} />

                      {/* Botão de fechamento central da lapela (costura militar) */}
                      <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${
                        isAdultUniform 
                          ? 'bg-slate-100 border border-slate-300' 
                          : 'bg-[#9e7f5b] dark:bg-[#8f704c] border border-[#7d603e] dark:border-[#6e5334]'
                      } shadow-xs flex items-center justify-center pointer-events-none z-20 transition-colors`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isAdultUniform ? 'bg-slate-300' : 'bg-[#dfcbb2]/70'}`} />
                      </div>

                      {/* 1. DISTINTIVOS DE LIDERANÇA (Aumentados e com relevo nítido no celular) */}
                      <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4 mb-2.5">
                        {allConquistas
                          .filter(c => c.tipo === 'LIDERANCA')
                          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                          .map(con => {
                            const eligibility = checkConquistaEligibility(con, userAge);
                            const sizeClasses = 
                              con.id === 9 
                                ? 'w-7 h-7 sm:w-8 sm:h-8' // Líder
                                : 'w-8 h-8 sm:w-9 sm:h-9'; // Master e Master Avançado

                            return (
                              <button
                                key={con.id}
                                onClick={() => toggleAchievement(con.id)}
                                className={`${sizeClasses} relative transition-all active:scale-95 group hover:scale-105 cursor-pointer flex items-center justify-center ${
                                  !eligibility.isEligible ? 'opacity-35 cursor-not-allowed' : ''
                                }`}
                                title={!eligibility.isEligible ? eligibility.msg : `${con.nome} • Distintivo de Liderança (Toque para alternar)`}
                              >
                                <img
                                  src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza}
                                  className={`w-full h-full object-contain filter drop-shadow-[0_2px_3.5px_rgba(0,0,0,0.5)] transition-all ${
                                    userAchievements.includes(con.id) ? 'opacity-100' : 'opacity-35 grayscale'
                                  }`}
                                  alt={con.nome}
                                />
                                {!eligibility.isEligible && (
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
                        : 'bg-[#be9d77] dark:bg-[#b08f6b] border-x-2 border-b-2 border-[#9e7f5b] dark:border-[#91724f]'
                    } rounded-b-2xl relative shadow-md flex flex-col items-center justify-center overflow-hidden -mt-0.5 transition-colors duration-500`}>
                      {/* Costura pespontada lateral e inferior */}
                      <div className={`absolute inset-2 border-x border-b border-dashed ${
                        isAdultUniform ? 'border-slate-300/80' : 'border-[#8f6f4b]/50 dark:border-[#7d5f3d]/60'
                      } pointer-events-none rounded-b-xl`} />

                      {/* Prega macho central vertical com relevo autêntico */}
                      <div className={`absolute top-0 bottom-0 w-10 sm:w-12 ${
                        isAdultUniform 
                          ? 'bg-slate-100 border-x border-slate-200 shadow-[inset_0_0_8px_rgba(0,0,0,0.04)]' 
                          : 'bg-[#ae8c66]/60 dark:bg-[#a07f59]/70 border-x border-[#91714e]/80 dark:border-[#856544] shadow-[inset_0_0_8px_rgba(0,0,0,0.12)]'
                      } pointer-events-none transition-colors duration-500`} />
                    </div>
                  </div>

                  {/* Legenda Informativa */}
                  <div className="mt-3 text-center">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${
                      isAdultUniform ? 'text-slate-700 dark:text-slate-300' : 'text-[#48351f] dark:text-[#f3e9da]'
                    }`}>
                      {isAdultUniform 
                        ? 'Bolso Esquerdo • Uniforme Branco Oficial (16+ anos)' 
                        : 'Bolso Esquerdo • Uniforme Cáqui Oficial (Até 15 anos)'}
                    </p>
                    <p className={`text-[9px] font-bold ${
                      isAdultUniform ? 'text-slate-400 dark:text-slate-400' : 'text-[#5e472a] dark:text-[#dfd0be]'
                    }`}>
                      {userAchievements.length} ativas • Toque para condecorar
                    </p>
                  </div>
                </div>
              </div>

              {/* LADO 2: FAIXA VERDE-PETRÓLEO OFICIAL (Sem container externo, proporção real de faixa militar) */}
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-[340px] sm:max-w-[380px] bg-[#0c3c31] dark:bg-[#07241d] border-2 border-[#092d25] dark:border-[#041612] rounded-[28px] shadow-2xl px-3 sm:px-4 py-4 sm:py-5 flex flex-col items-center relative overflow-hidden text-white transition-all duration-300">
                  {/* Textura e costuras pespontadas oficiais da faixa */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:10px_10px]" />
                  <div className="absolute top-0 bottom-0 left-2 sm:left-2.5 w-px border-l border-dashed border-emerald-300/25 pointer-events-none" />
                  <div className="absolute top-0 bottom-0 right-2 sm:right-2.5 w-px border-r border-dashed border-emerald-300/25 pointer-events-none" />

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

                    {/* 3. Tira de Nome logo abaixo: até 15 anos fundo cáqui, de 16 acima fundo branco */}
                    <div className="flex flex-col items-center w-full px-1">
                      <TiraNome name={userData.name} age={userAge} />
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
                        const likedSpecialties = allSpecialties.filter(s => likedIds.includes(s.id.toString()));
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

                        const getSpecialtiesForRule = (rule: typeof MASTERY_RULES[0], pool: Especialidade[], masteryItem?: Especialidade) => {
                          const dbReqs = (masteryItem?.requisitos || []).flatMap(r => {
                            return r.split(/\r?\n|;/).map(part => cleanStr(part)).filter(p => p.length >= 3);
                          });

                          return pool.filter(s => {
                            const sClean = cleanStr(s.nome);
                            const sCat = cleanStr(s.area);
                            const sSigla = (s.sigla || '').toUpperCase();

                            if (rule.isGlobalArea) {
                              if (sCat && (sCat === cleanStr(rule.category) || sCat.includes(cleanStr(rule.category)))) return true;
                              if (sSigla && rule.siglas && rule.siglas.map(sig => sig.toUpperCase()).includes(sSigla)) return true;
                              return false;
                            }

                            const isInRuleList = rule.specialties.some(rs => {
                              const rsClean = cleanStr(rs);
                              if (sClean === rsClean) return true;
                              if ((rsClean === "bacterias" && sClean === "bacteria") || (rsClean === "bacteria" && sClean === "bacterias")) return true;
                              return false;
                            });

                            const isInDbReqs = dbReqs.length > 0 && dbReqs.some(req => req === sClean);

                            return isInRuleList || isInDbReqs;
                          });
                        };

                        const getFamilyKey = (mName: string, category: string): string => {
                          const n = normalize(mName);
                          const c = normalize(category);
                          if (n.includes('profissional') || n.includes('tecnologia') || c.includes('profissional') || c.includes('tecnologia')) {
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
                        }

                        const activeMasteryGroups: ActiveMasteryGroup[] = [];

                        MASTERY_RULES.forEach(rule => {
                          const masteryItem = findMasteryItem(rule.name, rule.category);
                          const isManuallyLiked = masteryItem && likedIds.includes(masteryItem.id.toString());
                          const matchingItems = getSpecialtiesForRule(rule, ordinarySpecialties, masteryItem);
                          const reqCount = rule.requirementsCount || 7;
                          const hasMetRequirements = matchingItems.length >= reqCount;

                          if (hasMetRequirements || isManuallyLiked) {
                            activeMasteryGroups.push({
                              id: masteryItem ? masteryItem.id : rule.name,
                              name: masteryItem ? masteryItem.nome.replace(/campreste/gi, 'Campestre') : rule.name,
                              logo: masteryItem?.logo,
                              items: matchingItems,
                              isManual: !!isManuallyLiked,
                              requirementsCount: reqCount,
                              familyKey: getFamilyKey(rule.name, rule.category),
                              category: rule.category
                            });
                          }
                        });

                        // Fallback para mestrados marcados manualmente na modal Minha Faixa
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

                              activeMasteryGroups.push({
                                id: mastery.id,
                                name: mastery.nome.replace(/campreste/gi, 'Campestre'),
                                logo: mastery.logo,
                                items: matchingItems,
                                isManual: true,
                                requirementsCount: 7,
                                familyKey: getFamilyKey(mastery.nome, mastery.area || ''),
                                category: mastery.area || ''
                              });
                            }
                          }
                        });

                        // Estrutura de blocos na faixa conforme regra do usuário:
                        // "mestrado seguida de suas especialidades, se tem 2 mestrados, coloque o primeiro e suas especialidade,
                        // depois o segundo e suas especialidade e após isso as especialidades que não esta em nenhum dos 2 mestrados daquela área."
                        interface SashBlock {
                          mastery?: ActiveMasteryGroup;
                          specialties: Especialidade[];
                          areaName?: string;
                          isLeftoverFromMasteryArea?: boolean;
                        }

                        const sashBlocks: SashBlock[] = [];
                        const usedSpecialtyIds = new Set<string>();

                        const getFamilyDisplayName = (fKey: string): string => {
                          switch (fKey) {
                            case 'tecnologia_profissoes': return 'Ciência, Tecnologia e Atividades Profissionais';
                            case 'recreativas_campestre': return 'Atividades Recreativas e Vida Campestre';
                            case 'estudo_da_natureza': return 'Estudo da Natureza';
                            case 'espiritual': return 'Atividades Missionárias';
                            case 'artes_manuais': return 'Artes e Habilidades Manuais';
                            case 'agricolas': return 'Atividades Agrícolas';
                            case 'saude': return 'Saúde e Ciência';
                            case 'domesticas': return 'Habilidades Domésticas';
                            case 'adra': return 'ADRA';
                            default: return 'Outras Especialidades';
                          }
                        };

                        const isSpecialtyInFamily = (s: Especialidade, fKey: string): boolean => {
                          const sCat = cleanStr(s.area);
                          const sSigla = (s.sigla || '').toUpperCase();

                          if (fKey === 'tecnologia_profissoes') {
                            return sCat.includes('profissional') || sCat.includes('tecnologia') || sSigla === 'AP' || sSigla === 'CT';
                          }
                          if (fKey === 'estudo_da_natureza') {
                            return sCat.includes('natureza') || sSigla === 'EN';
                          }
                          if (fKey === 'recreativas_campestre') {
                            return sCat.includes('campestre') || sCat.includes('recreativas') || sSigla === 'VC' || sSigla === 'AR' || sSigla === 'ES';
                          }
                          if (fKey === 'espiritual') {
                            return sCat.includes('missionaria') || sCat.includes('biblico') || sSigla === 'AM' || sSigla === 'MA' || sSigla === 'AM-EB';
                          }
                          if (fKey === 'artes_manuais') {
                            return sCat.includes('manuais') || sCat.includes('artes') || sSigla === 'HM';
                          }
                          if (fKey === 'agricolas') {
                            return sCat.includes('agricola') || sSigla === 'AA' || sSigla === 'AG';
                          }
                          if (fKey === 'saude') {
                            return sCat.includes('saude') || sSigla === 'CS' || sSigla === 'SA';
                          }
                          if (fKey === 'adra') {
                            return sCat.includes('adra') || sSigla === 'AD';
                          }
                          if (fKey === 'domesticas') {
                            return sCat.includes('domestica') || sSigla === 'HD';
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

                        const familiesOrder = [
                          'tecnologia_profissoes',
                          'recreativas_campestre',
                          'estudo_da_natureza',
                          'espiritual',
                          'artes_manuais',
                          'agricolas',
                          'saude',
                          'domesticas',
                          'adra'
                        ];

                        const processedFamilies = new Set<string>();

                        const processFamily = (fKey: string, masteriesInFamily: ActiveMasteryGroup[]) => {
                          processedFamilies.add(fKey);

                          // Se houver 2 mestrados ou mais na mesma área, ordenamos por nome para estabilidade
                          const sortedMasteries = [...masteriesInFamily].sort((a, b) => a.name.localeCompare(b.name));

                          // Para cada mestrado: Coloca o mestrado e suas especialidades!
                          sortedMasteries.forEach(mGroup => {
                            const mSpecialties = mGroup.items
                              .filter(s => !usedSpecialtyIds.has(String(s.id)))
                              .sort((a, b) => a.nome.localeCompare(b.nome));

                            mSpecialties.forEach(s => usedSpecialtyIds.add(String(s.id)));

                            sashBlocks.push({
                              mastery: mGroup,
                              specialties: mSpecialties,
                              areaName: mGroup.name
                            });
                          });

                          // E após isso as especialidades que NÃO estão em nenhum dos mestrados daquela área!
                          const remainingInFamily = ordinarySpecialties
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

                        // Processa primeiro as famílias oficiais ordenadas
                        familiesOrder.forEach(fKey => {
                          if (familyGroups.has(fKey)) {
                            processFamily(fKey, familyGroups.get(fKey)!);
                          }
                        });

                        // Qualquer outra família com mestrado ativo não contemplada na lista fixa
                        familyGroups.forEach((mList, fKey) => {
                          if (!processedFamilies.has(fKey)) {
                            processFamily(fKey, mList);
                          }
                        });

                        // 2. Especialidades restantes (de áreas sem mestrado conquistado), agrupadas por área/cor
                        const leftoverSpecialties = ordinarySpecialties.filter(s => !usedSpecialtyIds.has(String(s.id)));
                        const leftoverByArea = Object.entries(
                          leftoverSpecialties.reduce((acc, esp) => {
                            const area = esp.area || 'Outras';
                            if (!acc[area]) acc[area] = [];
                            acc[area].push(esp);
                            return acc;
                          }, {} as Record<string, Especialidade[]>)
                        );

                        // Ordena as áreas restantes
                        leftoverByArea.sort(([a], [b]) => a.localeCompare(b));

                        leftoverByArea.forEach(([area, items]) => {
                          const sortedItems = [...items].sort((a, b) => a.nome.localeCompare(b.nome));
                          sashBlocks.push({
                            specialties: sortedItems,
                            areaName: area
                          });
                        });

                        return (
                          <div className="w-full space-y-4 sm:space-y-5">
                            {sashBlocks.map((block, idx) => (
                              <div key={idx} className="w-full space-y-1.5 sm:space-y-2">
                                {/* Mestrado do bloco: emblema oval do mestrado centralizado */}
                                {block.mastery && (
                                  <div className="flex flex-col items-center justify-center pt-1 pb-1">
                                    <div 
                                      className="w-32 h-22 sm:w-36 sm:h-24 flex items-center justify-center relative select-none pointer-events-none transition-transform"
                                      title={`Mestrado: ${block.mastery.name}`}
                                    >
                                      {block.mastery.logo ? (
                                        <img 
                                          src={block.mastery.logo} 
                                          className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.75)]" 
                                          alt={block.mastery.name} 
                                        />
                                      ) : (
                                        <Trophy size={44} className="text-amber-400 filter drop-shadow" />
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Especialidades correspondentes logo abaixo */}
                                {block.specialties.length > 0 && (
                                  <div className="grid grid-cols-4 gap-0.5 sm:gap-1 w-full justify-items-center">
                                    {block.specialties.map(esp => (
                                      <div 
                                        key={esp.id} 
                                        className="w-[74px] h-[74px] sm:w-[82px] sm:h-[82px] flex items-center justify-center select-none pointer-events-none p-0"
                                        title={esp.nome}
                                      >
                                        {esp.logo ? (
                                          <img 
                                            src={esp.logo} 
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
