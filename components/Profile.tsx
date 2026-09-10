
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
export const calculateAge = (birthDateString?: string): number | null => {
  if (!birthDateString || birthDateString.trim() === '') return null;
  const parts = birthDateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const birthDate = new Date(year, month, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age : null;
    }
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
            const mappedData = {
              name: profile.nome || userData.name,
              email: profile.email || (profile as any)['e - mail'] || user.email || userData.email,
              tipo: profile.clubes === "Aventureiro" ? "Aventureiro" : "Desbravador",
              clube: profile.clube || profile.clube_de || (profile as any)['clube de'] || userData.clube,
              cargo: profile.funçao || userData.cargo,
              telefone: profile.telefone || userData.telefone,
              avatar: profile.foto || userData.avatar,
              cidade: profile.cidade || "",
              estado: profile.estado || "",
              data_nascimento: profile.data_nascimento || (profile as any)['data de nascimento'] || (profile as any)['nascimento'] || "",
              isAdmin: profile.ADM || false
            };
            setUserData(mappedData);
            try {
              localStorage.setItem(storageKey, JSON.stringify(mappedData));
            } catch (e) {}
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
              style={{ backgroundColor: currentThemeColor }}
              className="p-8 pb-6 flex items-center justify-between text-white"
            >
              <div className="flex flex-col">
                <h3 className="text-xl font-black uppercase tracking-tight">Minha Faixa</h3>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Especialidades Conquistadas</p>
              </div>
              <button 
                onClick={() => setIsSashView(false)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-all border border-white/20"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-6 pb-2 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
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
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    title="Resetar especialidades favoritadas"
                    className="h-[50px] px-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center space-x-1.5 active:scale-95 transition-all flex-shrink-0 text-xs font-black uppercase tracking-wider hover:bg-rose-100 dark:hover:bg-rose-900/60 shadow-sm"
                  >
                    <RotateCcw size={16} />
                    <span className="hidden sm:inline">Resetar</span>
                  </button>
                )}
              </div>

              {likedIds.length > 0 && (
                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  <span>{likedIds.length} especialidade{likedIds.length > 1 ? 's' : ''} favoritada{likedIds.length > 1 ? 's' : ''}</span>
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="text-rose-500 hover:text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 active:scale-95 transition-all"
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
              {userData.name}
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
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight drop-shadow-sm uppercase truncate">
                  {userData.name}
                </h2>
                
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

            {/* DEMAIS INFORMAÇÕES AO LADO (LADO DIREITO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 md:w-[480px] lg:w-[540px] shrink-0">
              {/* Clube */}
              <div className="bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 text-white shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Shield size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/70">Clube</p>
                  <p className="text-xs font-black truncate text-white">{userData.clube || 'Não informado'}</p>
                </div>
              </div>

              {/* Telefone */}
              <div className="bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 text-white shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Phone size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/70">Telefone</p>
                  <p className="text-xs font-black truncate text-white">{userData.telefone || 'Não informado'}</p>
                </div>
              </div>

              {/* Cidade / UF */}
              <div className="bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 text-white shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <MapPin size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/70">Cidade / UF</p>
                  <p className="text-xs font-black truncate text-white">
                    {userData.cidade ? `${userData.cidade}${userData.estado ? ` - ${userData.estado}` : ''}` : 'Não informado'}
                  </p>
                </div>
              </div>

              {/* E-mail */}
              <div className="bg-white/15 dark:bg-black/25 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 text-white shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                  <Mail size={16} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black uppercase tracking-widest text-white/70">E-mail</p>
                  <p className="text-xs font-black truncate text-white">{userData.email || 'Não informado'}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Card 1: Conquistas & Distintivos (Simulação do Bolso Esquerdo do Uniforme de Gala) */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-[32px] p-5 sm:p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Trophy size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-xs text-slate-800 dark:text-white tracking-wider">
                      Conquistas & Distintivos
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      Simulação do bolso esquerdo do uniforme de gala
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 px-2.5 py-1 rounded-full">
                  {userAchievements.length} ativas
                </span>
              </div>

              {/* Simulação Têxtil do Uniforme de Gala */}
              <div className="w-full flex flex-col items-center">
                <div className="w-full max-w-[340px] sm:max-w-[360px] bg-[#d7c5a3] dark:bg-[#2b2318] border border-[#beaa82] dark:border-[#4b3c29] rounded-[28px] p-4 sm:p-6 flex flex-col items-center relative overflow-hidden shadow-inner">
                  {/* Textura sutil e costuras de alfaiataria */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#8f764a_1px,transparent_1px)] [background-size:12px_12px]" />
                  <div className="absolute top-2 left-4 right-4 border-b border-dashed border-[#b1986e]/40 dark:border-[#635038]/50 pointer-events-none" />

                  {/* 1. ACIMA DO BOLSO: Insígnia de Excelência */}
                  <div className="relative z-10 flex flex-col items-center mb-2.5">
                    {allConquistas.filter(c => c.tipo === 'INSIGNIA').map(con => (
                      <button
                        key={con.id}
                        onClick={() => toggleAchievement(con.id)}
                        className="w-32 h-6 sm:w-36 sm:h-7 relative transition-all active:scale-95 group hover:brightness-105"
                        title={`${con.nome} • Insígnia de Excelência (Toque para alternar)`}
                      >
                        <img
                          src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza}
                          className={`w-full h-full object-contain filter drop-shadow-sm transition-opacity ${
                            userAchievements.includes(con.id) ? 'opacity-100' : 'opacity-40 grayscale'
                          }`}
                          alt={con.nome}
                        />
                      </button>
                    ))}
                  </div>

                  {/* 2. ACIMA DO BOLSO: Classes Avançadas (Barretas em Pirâmide) */}
                  <div className="relative z-10 flex flex-col items-center mb-1">
                    {/* Fileira Superior das Classes Avançadas (Pioneiro, Excursionista, Guia) */}
                    <div className="flex items-center justify-center gap-0.5 mb-0.5">
                      {allConquistas
                        .filter(c => c.tipo === 'CLASSE_AVANCADA')
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                        .slice(3, 6)
                        .map(con => (
                          <button
                            key={con.id}
                            onClick={() => toggleAchievement(con.id)}
                            className="w-10 h-3.5 sm:w-11 sm:h-4 relative transition-all active:scale-95 group hover:brightness-105 rounded-xs overflow-hidden"
                            title={`${con.nome} • Classe Avançada (Toque para alternar)`}
                          >
                            <img
                              src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza}
                              className={`w-full h-full object-contain filter drop-shadow-2xs ${
                                userAchievements.includes(con.id) ? 'opacity-100' : 'opacity-35 grayscale'
                              }`}
                              alt={con.nome}
                            />
                          </button>
                        ))}
                    </div>

                    {/* Fileira Inferior das Classes Avançadas (Amigo, Companheiro, Pesquisador) - Encostada no bolso */}
                    <div className="flex items-center justify-center gap-0.5">
                      {allConquistas
                        .filter(c => c.tipo === 'CLASSE_AVANCADA')
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                        .slice(0, 3)
                        .map(con => (
                          <button
                            key={con.id}
                            onClick={() => toggleAchievement(con.id)}
                            className="w-10 h-3.5 sm:w-11 sm:h-4 relative transition-all active:scale-95 group hover:brightness-105 rounded-xs overflow-hidden"
                            title={`${con.nome} • Classe Avançada (Toque para alternar)`}
                          >
                            <img
                              src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza}
                              className={`w-full h-full object-contain filter drop-shadow-2xs ${
                                userAchievements.includes(con.id) ? 'opacity-100' : 'opacity-35 grayscale'
                              }`}
                              alt={con.nome}
                            />
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* 3. SIMULAÇÃO DO BOLSO ESQUERDO */}
                  <div className="w-[268px] sm:w-[286px] relative flex flex-col items-center">
                    {/* LAPELA / PORTINHOLA DO BOLSO */}
                    <div className="w-full h-14 sm:h-16 bg-[#ceb991] dark:bg-[#382e20] border-2 border-[#b8a074] dark:border-[#57462e] rounded-t-lg relative shadow-sm flex items-center justify-center px-2 z-10">
                      {/* Pesponto decorativo na lapela */}
                      <div className="absolute inset-1 border border-dashed border-[#b29769]/50 dark:border-[#5a4830]/60 pointer-events-none rounded-t-sm" />

                      {/* Botão de fechamento central da lapela (costura militar) */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#a38758] dark:bg-[#463622] border border-[#7a643f] dark:border-[#2f2415] shadow-xs flex items-center justify-center pointer-events-none z-20">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#beaa81]/60" />
                      </div>

                      {/* DISTINTIVOS DAS CLASSES REGULARES (CIRCULARES NA LAPELA) */}
                      <div className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                        {allConquistas
                          .filter(c => c.tipo === 'CLASSE_REGULAR')
                          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                          .map(con => (
                            <button
                              key={con.id}
                              onClick={() => toggleAchievement(con.id)}
                              className="w-7 h-7 sm:w-8 sm:h-8 relative transition-all active:scale-90 group hover:scale-105"
                              title={`${con.nome} • Classe Regular (Toque para alternar)`}
                            >
                              <img
                                src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza}
                                className={`w-full h-full object-contain filter drop-shadow-sm transition-all ${
                                  userAchievements.includes(con.id) ? 'opacity-100' : 'opacity-35 grayscale'
                                }`}
                                alt={con.nome}
                              />
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* CORPO DO BOLSO */}
                    <div className="w-full h-44 sm:h-48 bg-[#ceb991] dark:bg-[#382e20] border-x-2 border-b-2 border-[#b8a074] dark:border-[#57462e] rounded-b-2xl relative shadow-md flex flex-col items-center justify-center pt-2 pb-4 overflow-hidden -mt-0.5">
                      {/* Costura pespontada lateral e inferior */}
                      <div className="absolute inset-1.5 border-x border-b border-dashed border-[#b29769]/50 dark:border-[#5a4830]/60 pointer-events-none rounded-b-xl" />

                      {/* Prega macho central vertical com relevo */}
                      <div className="absolute top-0 bottom-0 w-8 sm:w-9 bg-[#c1ab81]/60 dark:bg-[#2b2318]/70 border-x border-[#b09668]/80 dark:border-[#4d3d27] pointer-events-none shadow-inner" />

                      {/* DISTINTIVOS DE LIDERANÇA (OVAIS NO CORPO DO BOLSO) */}
                      <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 flex-wrap px-2">
                        {allConquistas
                          .filter(c => c.tipo === 'LIDERANCA')
                          .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                          .map(con => (
                            <button
                              key={con.id}
                              onClick={() => toggleAchievement(con.id)}
                              className="w-12 h-14 sm:w-14 sm:h-16 relative transition-all active:scale-95 group hover:scale-105"
                              title={`${con.nome} • Distintivo de Liderança (Toque para alternar)`}
                            >
                              <img
                                src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza}
                                className={`w-full h-full object-contain filter drop-shadow-md transition-all ${
                                  userAchievements.includes(con.id) ? 'opacity-100' : 'opacity-35 grayscale'
                                }`}
                                alt={con.nome}
                              />
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Legenda Informativa */}
                  <div className="mt-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#79633e] dark:text-[#a89069]">
                      Bolso Esquerdo • Uniforme Oficial DSA
                    </p>
                    <p className="text-[9px] font-bold text-[#8c744c] dark:text-[#8e7a5c]">
                      Toque nas insígnias, barretas ou distintivos para condecorar
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Especialidades na Faixa */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-[32px] p-5 sm:p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/80">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Award size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-xs text-slate-800 dark:text-white tracking-wider">
                      Especialidades na Faixa
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {likedIds.length > 0 ? `${likedIds.length} na faixa oficial` : 'Nenhuma na faixa'}
                    </p>
                  </div>
                </div>
                {likedIds.length > 0 && (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="text-[9px] font-black text-rose-500 hover:text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 active:scale-95 transition-all shadow-xs"
                  >
                    <RotateCcw size={11} />
                    <span>Resetar</span>
                  </button>
                )}
              </div>

              {likedIds.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center px-4 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/40 shadow-inner">
                    <Award size={28} strokeWidth={2} />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">
                      Nenhuma especialidade na faixa
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
                      Favorite especialidades na aba de Especialidades ou use o botão Minha Faixa para montar sua faixa oficial.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSashView(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
                  >
                    Abrir Minha Faixa
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {isLoading && allSpecialties.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                      <div className="w-6 h-6 border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Carregando especialidades da faixa...</span>
                    </div>
                  ) : (
                    (() => {
                      const likedSpecialties = allSpecialties.filter(s => likedIds.includes(s.id.toString()));
                      const allMasterySpecialties = allSpecialties.filter(s => s.nome.toLowerCase().includes('mestrado'));
                      const ordinarySpecialties = likedSpecialties.filter(s => !s.nome.toLowerCase().includes('mestrado'));
                      
                      // Track which ordinary specialties have been assigned to an activated mastery group
                      const assignedIds = new Set<string>();

                      const normalize = (txt: string) => 
                        (txt || "")
                           .toLowerCase()
                           .normalize("NFD")
                           .replace(/[\u0300-\u036f]/g, "")
                           .replace('mestrado em ', '')
                           .replace('mestrado de ', '')
                           .replace('campreste', 'campestre')
                           .replace('tecinologia', 'tecnologia')
                           .trim();

                      // Helper para encontrar o objeto de especialidade oficial do Mestrado em allSpecialties (para obter seu logo/insígnia)
                      const findMasteryItem = (ruleName: string, category: string): Especialidade | undefined => {
                        const normRule = normalize(ruleName);
                        const normCat = normalize(category);
                        
                        // 1. Tentar por nome direto do mestrado
                        let found = allMasterySpecialties.find(s => {
                          const sNorm = normalize(s.nome);
                          return sNorm === normRule || sNorm.includes(normRule) || normRule.includes(sNorm);
                        });
                        
                        // 2. Tentar por categoria/área
                        if (!found) {
                          found = allMasterySpecialties.find(s => {
                            const sNorm = normalize(s.nome);
                            return sNorm === normCat || sNorm.includes(normCat) || normCat.includes(sNorm);
                          });
                        }

                        // 3. Fallback em allSpecialties completo
                        if (!found) {
                          found = allSpecialties.find(s => {
                            const sNorm = normalize(s.nome);
                            return sNorm.includes(normRule) || (normCat && sNorm.includes(normCat));
                          });
                        }
                        return found;
                      };

                      // Helper para normalizar strings de comparação
                      const cleanStr = (txt: string) => 
                        (txt || "")
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/[-–—_]/g, " ")
                          .replace(/\s+/g, " ")
                          .trim();

                      // Helper para filtrar especialidades que pertencem a uma regra de mestrado
                      const getSpecialtiesForRule = (rule: typeof MASTERY_RULES[0], pool: Especialidade[], masteryItem?: Especialidade) => {
                        const dbReqs = masteryItem?.requisitos?.map(r => cleanStr(r)) || [];

                        return pool.filter(s => {
                          const sClean = cleanStr(s.nome);
                          const sCat = cleanStr(s.area);
                          const sSigla = s.sigla || '';

                          // 1. Se a regra for de área global irrestrita (ADRA, Artes Manuais, Agrícolas, Domésticas, Ensinos Bíblicos)
                          if (rule.isGlobalArea) {
                            if (sCat && (sCat === cleanStr(rule.category) || sCat.includes(cleanStr(rule.category)))) return true;
                            if (sSigla && rule.siglas && rule.siglas.includes(sSigla)) return true;
                            return false;
                          }

                          // 2. Checagem contra a lista de especialidades oficiais do Mestrado
                          const isInRuleList = rule.specialties.some(rs => {
                            const rsClean = cleanStr(rs);
                            if (sClean === rsClean) return true;
                            if ((rsClean === "bacterias" && sClean === "bacteria") || (rsClean === "bacteria" && sClean === "bacterias")) return true;
                            return false;
                          });

                          const isInDbReqs = dbReqs.length > 0 && dbReqs.some(req => {
                            if (req.length < 3) return false;
                            if (req === sClean) return true;
                            const parts = req.split(';').map(p => p.trim());
                            return parts.some(p => p === sClean);
                          });

                          if (!isInRuleList && !isInDbReqs) return false;

                          // 3. Proteções contra colisão de nomes parecidos entre áreas diferentes
                          if (rule.name === "Mestrado em Atividades Profissionais") {
                            return sSigla === "AP";
                          }

                          if (rule.name === "Mestrado em Testificação") {
                            return sSigla === "AM" || sSigla === "MA";
                          }

                          if (rule.name === "Mestrado em Zoologia") {
                            return sSigla === "EN" || sClean === "zoonoses";
                          }

                          if (rule.name === "Mestrado em Botânica" || rule.name === "Mestrado em Ecologia") {
                            return sSigla === "EN" || sSigla === "AG";
                          }

                          return true;
                        });
                      };

                      // 1. Processar Mestrados (Ativados por seleção manual OU automaticamente pela quantidade mínima de especialidades)
                      interface ActiveMasteryGroup {
                        id: string | number;
                        name: string;
                        logo?: string;
                        items: Especialidade[];
                        isManual?: boolean;
                        requirementsCount: number;
                      }

                      const activeMasteryGroups: ActiveMasteryGroup[] = [];

                      // Avaliar cada regra oficial de Mestrado
                      MASTERY_RULES.forEach(rule => {
                        const masteryItem = findMasteryItem(rule.name, rule.category);
                        const isManuallyLiked = masteryItem && likedIds.includes(masteryItem.id.toString());
                        const matchingItems = getSpecialtiesForRule(rule, ordinarySpecialties, masteryItem);
                        const reqCount = rule.requirementsCount || 7;
                        const hasMetRequirements = matchingItems.length >= reqCount;

                        // Se o usuário selecionou a quantidade mínima OU curtiu o mestrado diretamente
                        if (hasMetRequirements || isManuallyLiked) {
                          matchingItems.forEach(s => assignedIds.add(s.id.toString()));
                          activeMasteryGroups.push({
                            id: masteryItem ? masteryItem.id : rule.name,
                            name: masteryItem ? masteryItem.nome.replace(/campreste/gi, 'Campestre') : rule.name,
                            logo: masteryItem?.logo,
                            items: matchingItems,
                            isManual: !!isManuallyLiked,
                            requirementsCount: reqCount
                          });
                        }
                      });

                      // Também verificar se o usuário curtiu algum mestrado do banco que não estava nas regras explícitas
                      allMasterySpecialties.forEach(mastery => {
                        if (likedIds.includes(mastery.id.toString())) {
                          const alreadyAdded = activeMasteryGroups.some(g => String(g.id) === String(mastery.id));
                          if (!alreadyAdded) {
                            const mName = normalize(mastery.nome);
                            const unassigned = ordinarySpecialties.filter(s => !assignedIds.has(s.id.toString()));
                            const matching = unassigned.filter(s => {
                              const area = s.area ? normalize(s.area) : '';
                              return area && (mName.includes(area) || area.includes(mName));
                            });
                            matching.forEach(s => assignedIds.add(s.id.toString()));
                            activeMasteryGroups.push({
                              id: mastery.id,
                              name: mastery.nome.replace(/campreste/gi, 'Campestre'),
                              logo: mastery.logo,
                              items: matching,
                              isManual: true,
                              requirementsCount: 7
                            });
                          }
                        }
                      });

                      // 2. Agrupar as especialidades restantes por Área
                      const remainingSpecialties = ordinarySpecialties.filter(s => !assignedIds.has(s.id.toString()));
                      const remainingGroups = Object.entries(
                        remainingSpecialties.reduce((acc, esp) => {
                          const area = esp.area || 'Outras';
                          if (!acc[area]) acc[area] = [];
                          acc[area].push(esp);
                          return acc;
                        }, {} as Record<string, Especialidade[]>)
                      ).map(([area, items]): { id: string; area: string; items: Especialidade[]; } => ({
                        id: area,
                        area,
                        items: items as Especialidade[]
                      }));

                      return (
                        <>
                          {/* Grupos de Mestrado Conquistados / Ativos com Insígnia Automática */}
                          {activeMasteryGroups.map(group => (
                            <div key={group.id} className="space-y-4">
                              <div className="flex flex-col items-center space-y-2">
                                <div className="relative group">
                                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 dark:to-transparent rounded-2xl border-2 border-amber-400/60 dark:border-amber-500/50 p-2.5 shadow-md flex items-center justify-center transition-transform hover:scale-105">
                                    {group.logo ? (
                                      <img src={group.logo} className="w-full h-full object-contain drop-shadow-sm" alt={group.name} />
                                    ) : (
                                      <Trophy size={36} className="text-amber-500" />
                                    )}
                                  </div>
                                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900" title="Insígnia de Mestrado Conquistada">
                                    <Trophy size={11} />
                                  </div>
                                </div>
                                <div className="text-center px-2">
                                  <h4 className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight leading-tight">
                                    {group.name}
                                  </h4>
                                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                    {group.items.length} {group.items.length === 1 ? 'Especialidade Concluída' : 'Especialidades Concluídas'}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 px-1">
                                {group.items.sort((a, b) => a.nome.localeCompare(b.nome)).map(esp => (
                                  <div key={esp.id} className="flex flex-col items-center">
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-center p-1.5 shadow-2xs hover:scale-105 transition-transform" title={esp.nome}>
                                      {esp.logo ? (
                                        <img src={esp.logo} className="w-full h-full object-contain" alt={esp.nome} />
                                      ) : (
                                        <Award size={20} className="text-slate-300 dark:text-slate-500" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Especialidades Restantes Agrupadas por Área */}
                          {remainingGroups.map(group => (
                            <div key={group.id} className="space-y-3">
                              <div className="flex items-center space-x-2 px-1">
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                  {group.area} ({group.items.length})
                                </span>
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                              </div>
                              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 px-1">
                                {group.items.sort((a, b) => a.nome.localeCompare(b.nome)).map(esp => (
                                  <div key={esp.id} className="flex flex-col items-center">
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-center p-1.5 shadow-2xs hover:scale-105 transition-transform" title={esp.nome}>
                                      {esp.logo ? (
                                        <img src={esp.logo} className="w-full h-full object-contain" alt={esp.nome} />
                                      ) : (
                                        <Award size={20} className="text-slate-300 dark:text-slate-500" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      );
                    })()
                  )}
                </div>
              )}
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
