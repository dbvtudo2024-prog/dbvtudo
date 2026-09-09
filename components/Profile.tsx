
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, LogOut, Shield, MapPin, Briefcase, Award, Camera, Check, X, User, Mail, Phone, ChevronDown, Heart, Search, Settings, Layers, Globe, Trophy, ArrowUp, RotateCcw, AlertTriangle } from 'lucide-react';
import { ClubType, Especialidade, UserProfile, Conquista } from '../types';
import { MASTERY_RULES } from '../masteryRules';
import { 
  fetchEspecialidades, fetchAllEspecialidades, getCachedEspecialidades, updateUserSpecialties, fetchUserSpecialties, 
  fetchUserProfile, fetchUserProfileByEmail, updateUserProfile, supabase,
  fetchConquistas, fetchUserAchievements, updateUserAchievements,
  fetchFuncoes, DEFAULT_CARGOS, getCachedFuncoes,
  getLocalUserSpecialties, saveLocalUserSpecialties, clearLocalUserSpecialties
} from '../services/supabaseService';

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
  const [search, setSearch] = useState('');

  const mergedOptions = useMemo(() => {
    if (value && !options.includes(value)) {
      return [value, ...options];
    }
    return options;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return mergedOptions;
    const q = search.toLowerCase().trim();
    return mergedOptions.filter(opt => opt.toLowerCase().includes(q));
  }, [mergedOptions, search]);

  const handleSelect = (selectedVal: string) => {
    onChange({ target: { name, value: selectedVal } });
    setIsOpen(false);
    setSearch('');
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

      {/* Modal Compacto para Selecionar Função */}
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setSearch('');
            }}
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
                    {filteredOptions.length} opções disponíveis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearch('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center transition-colors active:scale-90"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar cargo ou função..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Lista de Opções Compacta */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide">
              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center px-4">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500">Nenhuma função encontrada com "{search}"</p>
                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSelect(search.trim())}
                      className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm active:scale-95"
                    >
                      Usar "{search.trim()}"
                    </button>
                  )}
                </div>
              ) : (
                filteredOptions.map((opt) => {
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
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProfileProps {
  club: ClubType;
  onBack: (club?: ClubType) => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ club, onBack, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSashView, setIsSashView] = useState(false);
  const [allSpecialties, setAllSpecialties] = useState<Especialidade[]>(() => getCachedEspecialidades());
  const [allConquistas, setAllConquistas] = useState<Conquista[]>([]);
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
      isAdmin: false
    };
  };

  const [userData, setUserData] = useState(getInitialData);
  const [userId, setUserId] = useState<string | null>(null);
  const [cargosList, setCargosList] = useState<string[]>(() => getCachedFuncoes());

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
      return getLocalUserSpecialties(initialData.email, initialClubType);
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

  // Carregar curtidas e sincronizar com o banco sem perder especialidades locais
  useEffect(() => {
    const loadLiked = async () => {
      // 1. Sempre carrega imediatamente os dados do localStorage
      const local = getLocalUserSpecialties(userData.email, userClubType);
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
          const dbIds = await fetchUserSpecialties(userData.email, userId);
          if (dbIds && dbIds.length > 0) {
            setLikedIds(prev => {
              const combined = Array.from(new Set([...prev, ...dbIds]));
              if (prev.length === combined.length && prev.every((id, idx) => id === combined[idx])) {
                return prev;
              }
              saveLocalUserSpecialties(combined, userData.email, userClubType);
              return combined;
            });
          } else {
            // Se o banco retornou vazio mas temos especialidades locais, restaura no banco
            const currentLocal = getLocalUserSpecialties(userData.email, userClubType);
            if (currentLocal.length > 0) {
              await updateUserSpecialties(userData.email, currentLocal, userId);
            }
          }
        } catch (err) {
          console.warn("Erro ao buscar especialidades do usuário:", err);
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

  // Sincronizar se o localStorage mudar externamente ou se especialidades forem alteradas
  useEffect(() => {
    const data = getInitialData();
    setUserData(data);
  }, [storageKey]);

  // Listener para sincronização imediata de especialidades entre abas/telas
  useEffect(() => {
    const handleSpecialtiesSync = (e: any) => {
      const incoming: string[] = (e?.detail && Array.isArray(e.detail))
        ? e.detail
        : getLocalUserSpecialties(userData.email, userClubType);

      if (incoming && Array.isArray(incoming)) {
        setLikedIds(prev => {
          if (prev.length === incoming.length && prev.every((id, idx) => id === incoming[idx])) {
            return prev;
          }
          return incoming;
        });
      }
    };
    window.addEventListener('dbv_specialties_changed', handleSpecialtiesSync);
    window.addEventListener('storage', handleSpecialtiesSync);
    return () => {
      window.removeEventListener('dbv_specialties_changed', handleSpecialtiesSync);
      window.removeEventListener('storage', handleSpecialtiesSync);
    };
  }, [userData.email, userClubType]);

  // Carregar todas as especialidades para a faixa ou se houver curtidas
  useEffect(() => {
    let isMounted = true;
    const loadSpecialties = async () => {
      if (allSpecialties.length > 0 && !isSashView) return;
      setIsLoading(true);
      try {
        const data = await fetchAllEspecialidades();
        if (isMounted && data && data.length > 0) {
          const sorted = [...data].sort((a, b) => a.nome.localeCompare(b.nome));
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
  }, [isSashView]);

  // Salvar curtidas no localStorage apenas se houver IDs ou se for uma mudança intencional
  useEffect(() => {
    if (likedIds && likedIds.length > 0) {
      saveLocalUserSpecialties(likedIds, userData.email, userClubType);
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
    
    // Calcula a nova lista
    const newList = isLiked 
      ? likedIds.filter(i => i !== idStr) 
      : [...likedIds, idStr];

    // Atualiza localmente primeiro (UI rápida)
    setLikedIds(newList);
    saveLocalUserSpecialties(newList, userData.email, userClubType);

    // Salva no banco se tiver email (atualiza a coluna Especialidades na tabela Usuarios)
    if (userData.email && userData.email !== "email@exemplo.com") {
      await updateUserSpecialties(userData.email, newList, userId);
    }
  };

  const handleResetSpecialties = async () => {
    setLikedIds([]);
    clearLocalUserSpecialties(userData.email, userClubType);

    if (userData.email && userData.email !== "email@exemplo.com") {
      await updateUserSpecialties(userData.email, [], userId);
    }
    setShowResetConfirm(false);
  };

  const likedSpecialtiesList = useMemo(() => {
    return allSpecialties.filter(s => likedIds.includes(s.id.toString()));
  }, [allSpecialties, likedIds]);

  const filteredSpecialties = useMemo(() => {
    return allSpecialties.filter(s => 
      s.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.codigo && s.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allSpecialties, searchTerm]);

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
          ADM: userData.isAdmin
        };

        if (userId) {
          profile.user_id = userId;
        }

        await updateUserProfile(profile);

        // 2. Salvar Especialidades (likedIds ou locais)
        const effectiveSpecialties = likedIds.length > 0 ? likedIds : getLocalUserSpecialties(userData.email, userClubType);
        await updateUserSpecialties(userData.email, effectiveSpecialties, userId);

        // 3. Salvar Conquistas
        await updateUserAchievements(userData.email, userAchievements);
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

        {/* Header Visual do Perfil com Avatar e Banner */}
        <div 
          className="relative w-full flex flex-col items-center justify-start rounded-b-[48px] shadow-lg transition-all duration-500 flex-shrink-0 pt-16 pb-10"
          style={{ 
            backgroundColor: currentThemeColor,
            backgroundImage: `radial-gradient(at 0% 0%, rgba(255,255,255,0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0,0,0,0.12) 0px, transparent 50%)`
          }}
        >
          {/* Efeitos de luz no fundo do banner */}
          <div className="absolute top-0 left-0 w-full h-full opacity-15 pointer-events-none overflow-hidden rounded-b-[48px]">
            <div className="absolute top-10 right-10 w-36 h-36 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-44 h-44 bg-black rounded-full blur-3xl"></div>
          </div>

          {/* Foto de Perfil Centralizada */}
          <div className="relative z-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[40px] border-[6px] border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all flex items-center justify-center">
                {userData.avatar ? (
                  <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <User size={52} className="text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg transition-colors flex items-center justify-center bg-emerald-500">
                <Check size={14} className="text-white" />
              </div>
            </div>
          </div>

          <div className="text-center text-white mt-4 z-10 px-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none drop-shadow-sm">
              {userData.name}
            </h2>
            <p className="text-white/80 font-bold text-xs mt-1.5 uppercase tracking-widest opacity-90">
              {userData.email}
            </p>
          </div>
        </div>

      <div className="px-8 mt-6 border-t border-slate-100 dark:border-slate-800 pt-5">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Tipo', value: userData.tipo },
            { label: 'Clube', value: userData.clube },
            { label: 'Cargo', value: userData.cargo },
            { label: 'Telefone', value: userData.telefone },
            { label: 'Cidade', value: userData.cidade || '-' },
            { label: 'Estado', value: userData.estado || '-' }
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-3 shadow-sm flex flex-col items-center text-center group hover:border-slate-200 dark:hover:border-slate-600 transition-all">
              <p className="text-[7px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-0.5">{item.label}</p>
              <p className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-tight line-clamp-1">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 mt-6 flex flex-col space-y-4">
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsEditing(true)} 
            style={{ backgroundColor: currentThemeColor }} 
            className="flex-1 py-5 rounded-[28px] text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3"
          >
            <Settings size={18} />
            <span>Editar Perfil</span>
          </button>
          <button 
            onClick={() => setIsSashView(true)}
            className="flex-1 py-5 bg-emerald-600 rounded-[28px] text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3"
          >
            <Award size={18} />
            <span>Minha Faixa</span>
          </button>
        </div>
        
        {isAdmin && onOpenAdmin && (
          <button 
            onClick={onOpenAdmin}
            className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white rounded-[28px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl border border-slate-900 dark:border-slate-500/60 active:scale-95 transition-all flex items-center justify-center space-x-3"
          >
            <Shield size={18} className="text-indigo-400" />
            <span>Painel Administrativo</span>
          </button>
        )}
      </div>

      <div className="mt-10 px-8 pb-10 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <div className="h-[1px] flex-grow bg-slate-100 dark:bg-slate-800"></div>
          <h3 className="px-6 font-black uppercase text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.3em]">Conquistas</h3>
          <div className="h-[1px] flex-grow bg-slate-100 dark:bg-slate-800"></div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[40px] p-6 shadow-sm flex flex-col items-center space-y-8">
          <div className="flex flex-col items-center space-y-8 w-full">
            {/* Top: Insígnia de Excelência */}
            {allConquistas.filter(c => c.tipo === 'INSIGNIA').map(con => (
              <button 
                key={con.id}
                onClick={() => toggleAchievement(con.id)}
                className="w-40 h-10 relative group transition-all active:scale-95"
              >
                <img 
                  src={userAchievements.includes(con.id) ? con.imagem_colorida : con.imagem_cinza} 
                  className="w-full h-full object-contain" 
                  alt={con.nome}
                />
              </button>
            ))}

            {/* Row 2: Classes Avançadas (Retangulares) - Grid 3x2 ou similar */}
            <div className="grid grid-cols-3 gap-x-3 gap-y-0 w-full max-w-[280px]">
              {allConquistas.filter(c => c.tipo === 'CLASSE_AVANCADA').map(con => (
                <button 
                  key={con.id}
                  onClick={() => toggleAchievement(con.id)}
                  className="aspect-[5/3] w-full relative group transition-all active:scale-95 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-lg overflow-hidden"
                >
                  {userAchievements.includes(con.id) ? (
                    <img 
                      src={con.imagem_colorida} 
                      className="w-full h-full object-contain" 
                      alt={con.nome}
                    />
                  ) : con.imagem_cinza ? (
                    <img 
                      src={con.imagem_cinza} 
                      className="w-full h-full object-contain opacity-40 grayscale" 
                      alt={con.nome}
                    />
                  ) : (
                    <Award size={20} className="text-slate-200 dark:text-slate-700" />
                  )}
                </button>
              ))}
            </div>

            {/* Row 3: Liderança (Ovais) */}
            <div className="flex justify-center flex-wrap gap-4 w-full">
              {allConquistas.filter(c => c.tipo === 'LIDERANCA').map(con => (
                <button 
                  key={con.id}
                  onClick={() => toggleAchievement(con.id)}
                  className="w-16 h-12 relative group transition-all active:scale-95 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden"
                >
                  {userAchievements.includes(con.id) ? (
                    <img 
                      src={con.imagem_colorida} 
                      className="w-full h-full object-contain" 
                      alt={con.nome}
                    />
                  ) : con.imagem_cinza ? (
                    <img 
                      src={con.imagem_cinza} 
                      className="w-full h-full object-contain opacity-40 grayscale" 
                      alt={con.nome}
                    />
                  ) : (
                    <Trophy size={18} className="text-slate-200 dark:text-slate-700" />
                  )}
                </button>
              ))}
            </div>

            {/* Row 4: Classes Regulares (Circulares) */}
            <div className="grid grid-cols-6 gap-2 w-full">
              {allConquistas.filter(c => c.tipo === 'CLASSE_REGULAR').map(con => (
                <button 
                  key={con.id}
                  onClick={() => toggleAchievement(con.id)}
                  className="aspect-square w-full relative group transition-all active:scale-95 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden"
                >
                  {userAchievements.includes(con.id) ? (
                    <img 
                      src={con.imagem_colorida} 
                      className="w-full h-full object-contain" 
                      alt={con.nome}
                    />
                  ) : con.imagem_cinza ? (
                    <img 
                      src={con.imagem_cinza} 
                      className="w-full h-full object-contain opacity-40 grayscale" 
                      alt={con.nome}
                    />
                  ) : (
                    <Check size={14} className="text-slate-200 dark:text-slate-700" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Especialidades Curtidas (Minha Faixa) */}
          {likedIds.length > 0 && (
            <div className="w-full pt-6 border-t border-slate-50 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em]">
                  Especialidades na Faixa ({likedIds.length})
                </p>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="text-[9px] font-black text-rose-500 hover:text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center space-x-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 active:scale-95 transition-all shadow-xs"
                >
                  <RotateCcw size={11} />
                  <span>Resetar</span>
                </button>
              </div>
              
              <div className="space-y-12">
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

                    // 2. Agrupar as especialidades restantes (que ainda não completaram mestrado) por Área
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
                          <div key={group.id} className="space-y-6">
                            <div className="flex flex-col items-center space-y-3">
                              <div className="relative group">
                                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/20 dark:via-amber-500/10 dark:to-transparent rounded-[32px] border-2 border-amber-400/60 dark:border-amber-500/50 p-3.5 shadow-xl shadow-amber-500/10 flex items-center justify-center transition-transform hover:scale-105">
                                  {group.logo ? (
                                    <img src={group.logo} className="w-full h-full object-contain drop-shadow-md" alt={group.name} />
                                  ) : (
                                    <Trophy size={48} className="text-amber-500" />
                                  )}
                                </div>
                                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900" title="Insígnia de Mestrado Conquistada">
                                  <Trophy size={13} />
                                </div>
                              </div>
                              <div className="text-center px-4">
                                <h4 className="text-[12px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight leading-tight">
                                  {group.name}
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                  {group.items.length} {group.items.length === 1 ? 'Especialidade Concluída' : 'Especialidades Concluídas'}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3 w-full px-2">
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest">
                                  Insígnia de Mestrado
                                </span>
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-3 px-2">
                              {group.items.sort((a, b) => a.nome.localeCompare(b.nome)).map(esp => (
                                <div key={esp.id} className="flex flex-col items-center">
                                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-center p-2 shadow-sm hover:scale-105 transition-transform" title={esp.nome}>
                                    {esp.logo ? (
                                      <img src={esp.logo} className="w-full h-full object-contain" alt={esp.nome} />
                                    ) : (
                                      <Award size={24} className="text-slate-300 dark:text-slate-500" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Especialidades Restantes Agrupadas por Área */}
                        {remainingGroups.map(group => (
                          <div key={group.id} className="space-y-6">
                            <div className="flex items-center space-x-3 px-2">
                              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {group.area} ({group.items.length})
                              </span>
                              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                            </div>
                            <div className="grid grid-cols-4 gap-3 px-2">
                              {group.items.sort((a, b) => a.nome.localeCompare(b.nome)).map(esp => (
                                <div key={esp.id} className="flex flex-col items-center">
                                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/80 flex items-center justify-center p-2 shadow-sm hover:scale-105 transition-transform" title={esp.nome}>
                                    {esp.logo ? (
                                      <img src={esp.logo} className="w-full h-full object-contain" alt={esp.nome} />
                                    ) : (
                                      <Award size={24} className="text-slate-300 dark:text-slate-500" />
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
            </div>
          )}
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
