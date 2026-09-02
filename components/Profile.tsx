
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, LogOut, Shield, MapPin, Briefcase, Award, Camera, Check, X, User, Mail, Phone, ChevronDown, Heart, Search, Settings, Layers, Globe, Trophy } from 'lucide-react';
import { ClubType, Especialidade, UserProfile, Conquista } from '../types';
import { MASTERY_RULES } from '../masteryRules';
import { 
  fetchEspecialidades, updateUserSpecialties, fetchUserSpecialties, 
  fetchUserProfile, fetchUserProfileByEmail, updateUserProfile, supabase,
  fetchConquistas, fetchUserAchievements, updateUserAchievements
} from '../services/supabaseService';

const CARGOS = [
  "Diretor(a)",
  "Diretor(a) Associado(a)",
  "Secretário(a)",
  "Tesoureiro(a)",
  "Capelão(ã)",
  "Conselheiro(a)",
  "Instrutor(a)",
  "Regional",
  "Distrital",
  "Pastor"
];

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
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const EditSelect: React.FC<EditSelectProps> = ({ label, value, name, options, onChange }) => (
  <div className="space-y-1.5 text-left">
    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className="relative">
      <select 
        value={value}
        name={name}
        onChange={onChange}
        className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl py-3.5 pl-5 pr-12 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all shadow-sm font-bold appearance-none"
      >
        <option value="">Selecione...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" />
    </div>
  </div>
);

interface ProfileProps {
  club: ClubType;
  onBack: (club?: ClubType) => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ club, onBack, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSashView, setIsSashView] = useState(false);
  const [allSpecialties, setAllSpecialties] = useState<Especialidade[]>([]);
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
  const isAdmin = userData.isAdmin || userData.email === 'ronaldosonic@gmail.com' || userData.email === 'dbvtudo2024@gmail.com';
  const userClubType = userData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
  const likedKey = `dbv_tudo_liked_specialties_${userClubType}`;

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    try {
      const initialData = getInitialData();
      const initialClubType = initialData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
      const initialKey = `dbv_tudo_liked_specialties_${initialClubType}`;
      const saved = localStorage.getItem(initialKey);
      return saved ? JSON.parse(saved) : [];
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

  // Carregar curtidas quando o tipo de clube mudar (ex: edição de perfil)
  useEffect(() => {
    const loadLiked = async () => {
      // Tenta carregar do banco primeiro se tiver email
      if (userData.email && userData.email !== "email@exemplo.com") {
        const dbIds = await fetchUserSpecialties(userData.email);
        if (dbIds.length > 0) {
          setLikedIds(dbIds);
          localStorage.setItem(likedKey, JSON.stringify(dbIds));
          return;
        }
      }

      // Fallback para localStorage
      const saved = localStorage.getItem(likedKey);
      const currentSaved = saved ? JSON.parse(saved) : [];
      if (JSON.stringify(currentSaved) !== JSON.stringify(likedIds)) {
        setLikedIds(currentSaved);
      }
    };

    loadLiked();
  }, [likedKey, userData.email]);

  const currentThemeColor = userData.tipo === "Desbravador" ? '#dc371b' : '#800000';
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  // Sincronizar se o localStorage mudar externamente
  useEffect(() => {
    const data = getInitialData();
    setUserData(data);
  }, [storageKey]);

  // Resetar especialidades quando o tipo de clube mudar
  useEffect(() => {
    setAllSpecialties([]);
  }, [userClubType]);

  // Carregar todas as especialidades para a faixa ou se houver curtidas
  useEffect(() => {
    if ((isSashView || likedIds.length > 0) && allSpecialties.length === 0) {
      setIsLoading(true);
      fetchEspecialidades(userClubType)
        .then(data => {
          // Ordenar alfabeticamente
          const sorted = [...data].sort((a, b) => a.nome.localeCompare(b.nome));
          setAllSpecialties(sorted);
        })
        .catch(err => {
          console.warn("Erro ao buscar especialidades no perfil:", err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isSashView, userClubType, allSpecialties.length]);

  // Salvar curtidas no localStorage apenas se houver IDs ou se for uma mudança intencional
  useEffect(() => {
    // Evita salvar dados de um clube no outro durante a transição
    const saved = localStorage.getItem(likedKey);
    const savedIds = saved ? JSON.parse(saved) : [];
    
    // Só salva se likedIds for diferente do que já está no banco para este clube específico
    // Isso evita que o estado temporário do clube anterior sobrescreva o novo clube
    if (JSON.stringify(savedIds) !== JSON.stringify(likedIds)) {
      localStorage.setItem(likedKey, JSON.stringify(likedIds));
    }
  }, [likedIds, likedKey]);

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

    // Salva no banco se tiver email (atualiza a coluna Especialidades na tabela Usuarios)
    if (userData.email && userData.email !== "email@exemplo.com") {
      await updateUserSpecialties(userData.email, newList);
    }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

        // 2. Salvar Especialidades (likedIds)
        await updateUserSpecialties(userData.email, likedIds);

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
    <>
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
            
            <div className="p-6 pb-2">
              <div className="relative">
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
            </div>

            <div className="flex-grow overflow-y-auto p-6 pt-2 space-y-3 scrollbar-hide">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-8 h-8 border-3 border-slate-100 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : filteredSpecialties.length > 0 ? (
                filteredSpecialties.map((esp) => (
                  <div key={esp.id} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[28px] p-4 flex items-center space-x-4 shadow-sm hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-700 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-50 dark:border-slate-600">
                      {esp.logo ? (
                        <img src={esp.logo} className="w-10 h-10 object-contain" alt={esp.nome} />
                      ) : (
                        <Award size={24} className="text-slate-300 dark:text-slate-400" />
                      )}
                    </div>
                    <div className="flex-grow text-left">
                      <h4 className="font-black text-slate-700 dark:text-slate-200 text-[12px] uppercase tracking-tight leading-tight">
                        {esp.nome}
                      </h4>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">
                        {esp.codigo}
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleLike(esp.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                        likedIds.includes(esp.id.toString()) 
                          ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 shadow-sm' 
                          : 'bg-slate-50 dark:bg-slate-700 text-slate-300 dark:text-slate-500'
                      }`}
                    >
                      <Heart size={20} fill={likedIds.includes(esp.id.toString()) ? "currentColor" : "none"} />
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
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditing(false)}></div>
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 max-h-[90vh] flex flex-col">
            <div className="p-8 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Editar Perfil</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 active:scale-90 transition-all"
              >
                <X size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 pt-6 space-y-6 scrollbar-hide">
              <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-[32px] border-[5px] border-slate-50 dark:border-slate-800 shadow-lg overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all flex items-center justify-center ring-8 ring-emerald-500/5">
                    {userData.avatar ? (
                      <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      <User size={48} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[32px] transition-opacity opacity-0 group-hover:opacity-100"
                  >
                    <Camera size={24} className="text-white" />
                  </button>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl border-4 border-white dark:border-slate-900 shadow-md bg-amber-500 flex items-center justify-center">
                    <Settings size={12} className="text-white" />
                  </div>
                </div>
                <p className="mt-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Alterar Foto</p>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] ml-1">Tipo de Ministério</label>
                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-[24px] space-x-1.5 border border-slate-200/50 dark:border-slate-700/50">
                  <button 
                    onClick={() => handleClubToggle("Desbravador")} 
                    className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase transition-all ${userData.tipo === "Desbravador" ? 'bg-[#dc371b] text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
                  >
                    Desbravador
                  </button>
                  <button 
                    onClick={() => handleClubToggle("Aventureiro")} 
                    className={`flex-1 py-3 rounded-[18px] text-[10px] font-black uppercase transition-all ${userData.tipo === "Aventureiro" ? 'bg-[#800000] text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'}`}
                  >
                    Aventureiro
                  </button>
                </div>
              </div>

              <EditInput label="Nome Completo" value={userData.name} name="name" onChange={handleInputChange} />
              <EditInput label="E-mail" value={userData.email} name="email" type="email" onChange={handleInputChange} />
              <EditInput label="Nome do Clube" value={userData.clube} name="clube" onChange={handleInputChange} />
              <EditSelect label="Cargo / Função" value={userData.cargo} name="cargo" options={CARGOS} onChange={handleInputChange} />
              <EditInput label="Telefone" value={userData.telefone} name="telefone" onChange={handleInputChange} />
              <div className="grid grid-cols-2 gap-5">
                <EditInput label="Cidade" value={userData.cidade || ""} name="cidade" onChange={handleInputChange} />
                <EditInput label="Estado" value={userData.estado || ""} name="estado" onChange={handleInputChange} />
              </div>
            </div>

            <div className="p-8 pt-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <button 
                onClick={handleSave} 
                disabled={isLoading}
                className="w-full py-5 bg-emerald-600 rounded-[28px] text-white font-black uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={20} strokeWidth={3} />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div 
        onScroll={(e) => setIsHeaderScrolled(e.currentTarget.scrollTop > 80)}
        className="flex flex-col h-full bg-[#F8FAFC] dark:bg-slate-900 animate-slide-in transition-colors duration-500 overflow-y-auto scrollbar-hide pb-16 relative"
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
              <p className="text-center text-[9px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-4">
                Especialidades na Faixa ({likedIds.length})
              </p>
              
              <div className="space-y-12">
                {isLoading ? (
                  <div className="py-4 text-center text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-widest">
                    Carregando...
                  </div>
                ) : (
                  (() => {
                    const likedSpecialties = allSpecialties.filter(s => likedIds.includes(s.id.toString()));
                    // 0. Pré-processar TODAS as especialidades curtidas para garantir que tenham a área CORRETA de acordo com as regras
                    const processedSpecialties = likedSpecialties.map(s => {
                      const sName = s.nome.toLowerCase().trim();
                      // Se for um item de mestrado, não mexemos na área dele aqui
                      if (sName.includes('mestrado')) return s;

                      // 1. Tentar match por NOME EXATO na lista de especialidades (Prioridade Máxima)
                      // Isso permite que especialidades como 'Bactérias' ou 'Plantas Silvestres' 
                      // fujam de suas siglas originais se estiverem em uma lista específica.
                      let specificRule = MASTERY_RULES.find(r => 
                        r.specialties.some(rs => {
                          const rsName = rs.toLowerCase().trim();
                          // Match exato ou tratamento de singular/plural comum
                          return rsName === sName || 
                                 (rsName === "bacterias" && sName === "bacteria") ||
                                 (rsName === "bacteria" && sName === "bacterias");
                        })
                      );

                      // 2. Tentar match por Sigla + Lista Específica
                      if (!specificRule) {
                        specificRule = MASTERY_RULES.find(r => 
                          s.sigla && r.siglas?.includes(s.sigla) &&
                          r.specialties.some(rs => {
                            const rsName = rs.toLowerCase().trim();
                            if (rsName === "fisica" && sName.includes("cultura fisica")) return false;
                            return sName === rsName || sName.includes(rsName);
                          })
                        );
                      }
                      
                      // 3. Se ainda não encontrar, tentar match por inclusão com proteções
                      if (!specificRule) {
                        specificRule = MASTERY_RULES.find(r => 
                          !r.isGlobalArea && 
                          r.specialties.some(rs => {
                            const rsName = rs.toLowerCase().trim();
                            
                            // Caso especial: "Física" vs "Cultura Física"
                            if (rsName === "fisica" && sName.includes("cultura fisica")) return false;
                            
                            // Se a regra for curta, exige match mais preciso para evitar capturas erradas
                            if (rsName.length <= 5) return sName === rsName;
                            
                            return sName.includes(rsName);
                          })
                        );
                      }

                      // 4. Se for uma Área Global e a sigla bater, atribui
                      if (!specificRule && s.sigla) {
                        const globalRule = MASTERY_RULES.find(r => 
                          r.isGlobalArea && r.siglas?.includes(s.sigla!)
                        );
                        if (globalRule) return { ...s, area: globalRule.category };
                      }

                      if (specificRule) {
                        return { ...s, area: specificRule.category };
                      }
                      return s;
                    });

                    const masteries = processedSpecialties.filter(s => s.nome.toLowerCase().includes('mestrado'));
                    const ordinarySpecialties = processedSpecialties.filter(s => !s.nome.toLowerCase().includes('mestrado'));
                    
                    // Track which ordinary specialties have been assigned to a mastery group
                    const assignedIds = new Set<string>();
                    
                    // 1. Processar Mestrados Oficiais
                    const masteryGroups = masteries.map(mastery => {
                      // Normalização ultra-robusta para evitar erros de digitação (ex: Campreste vs Campestre)
                      const normalize = (txt: string) => 
                        txt.toLowerCase()
                           .normalize("NFD")
                           .replace(/[\u0300-\u036f]/g, "")
                           .replace('mestrado em ', '')
                           .replace('mestrado de ', '')
                           .replace('campreste', 'campestre')
                           .replace('tecinologia', 'tecnologia')
                           .trim();

                      const mName = normalize(mastery.nome);
                      
                      // Encontrar a regra correspondente ao item de mestrado
                      const rule = MASTERY_RULES.find(r => {
                        const rName = normalize(r.name);
                        return mName === rName || mName.includes(rName) || rName.includes(mName);
                      });
                      
                      let groupItems: Especialidade[] = [];
                      if (rule) {
                        // Capturamos itens que pertencem a esta regra
                        groupItems = ordinarySpecialties.filter(s => {
                          const sName = s.nome.toLowerCase().trim();
                          
                          // Se a regra for de área global (ex: ADRA, Agrícolas), usa a área
                          if (rule.isGlobalArea) {
                            return s.area?.toLowerCase() === rule.category.toLowerCase() ||
                                   s.area?.toLowerCase().includes(rule.category.toLowerCase());
                          }

                          // SISTEMA DE TRÊS CAMADAS PARA GRUPOS
                          // 1. Se a sigla bater E estiver na lista deste mestrado
                          const hasSiglaMatch = s.sigla && rule.siglas?.includes(s.sigla) && 
                                               rule.specialties.some(rs => rs.toLowerCase().trim() === sName || sName.includes(rs.toLowerCase().trim()));
                          if (hasSiglaMatch) return true;

                          // 2. Se o nome for idêntico a algum item da lista deste mestrado
                          const hasExactMatch = rule.specialties.some(rs => rs.toLowerCase().trim() === sName);
                          if (hasExactMatch) return true;

                          // 3. Senão, tenta inclusão mas verifica se outro mestrado não tem esse nome EXATAMENTE ou SIGLA específica
                          const otherMasteryHasExactMatch = MASTERY_RULES.some(r => 
                            !r.isGlobalArea && 
                            r.name !== rule.name && 
                            r.specialties.some(rs => rs.toLowerCase().trim() === sName)
                          );
                          if (otherMasteryHasExactMatch) return false;

                          // Verificação adicional por sigla para evitar que EN (Zoologia) capture HM (Artes) por engano se o nome incluir algo
                          if (s.sigla && !rule.siglas?.includes(s.sigla)) {
                            // Se a especialidade tem uma sigla e ela não pertence a este mestrado, 
                            // e este mestrado NÃO é Vida Campestre (que é exceção), ignoramos
                            if (rule.name !== "Mestrado em Vida Campestre") return false;
                          }

                          return rule.specialties.some(rs => {
                            const rsName = rs.toLowerCase().trim();
                            if (rsName === "fisica" && sName.includes("cultura fisica")) return false;
                            if (rsName.length <= 5) return sName === rsName;
                            return sName.includes(rsName);
                          });
                        });
                      }

                      // Marcar estes itens como atribuídos
                      groupItems.forEach(s => assignedIds.add(s.id.toString()));

                      return {
                        id: mastery.id,
                        mastery,
                        items: groupItems
                      };
                    });

                    // 2. Agrupar o resto por Área (Especialidades sozinhas ou mestrados dinâmicos)
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
                        {/* Render Mastery Groups */}
                        {masteryGroups.map(group => (
                          <div key={group.id} className="space-y-6">
                            <div className="flex flex-col items-center space-y-4">
                              <div className="w-24 h-24 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-[32px] border-2 border-amber-200 dark:border-amber-700/50 p-4 shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform">
                                <img src={group.mastery.logo} className="w-full h-full object-contain" alt={group.mastery.nome} />
                              </div>
                              <span className="mt-2 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight text-center max-w-[120px]">
                                {group.mastery.nome.replace(/campreste/gi, 'Campestre')}
                              </span>
                              <div className="flex items-center space-x-3 w-full px-2">
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">({group.items.length} Especialidades)</span>
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-3 px-2">
                              {group.items.sort((a, b) => a.nome.localeCompare(b.nome)).map(esp => (
                                <div key={esp.id} className="flex flex-col items-center">
                                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center p-2.5 shadow-sm">
                                    <img src={esp.logo} className="w-full h-full object-contain" alt={esp.nome} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Render Remaining Groups */}
                        {remainingGroups.map(group => {
                          const hasDynamicMastery = group.items.length >= 7;
                          return (
                            <div key={group.id} className="space-y-6">
                              <div className="flex items-center space-x-3 px-2">
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                {hasDynamicMastery ? (
                                  <div className="flex items-center space-x-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-900/50 shadow-sm">
                                    <Trophy size={14} className="text-amber-500" />
                                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">
                                      Mestrado em {group.area}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    {group.area} ({group.items.length})
                                  </span>
                                )}
                                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                              </div>
                              <div className="grid grid-cols-4 gap-3 px-2">
                                {group.items.sort((a, b) => a.nome.localeCompare(b.nome)).map(esp => (
                                  <div key={esp.id} className="flex flex-col items-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center p-2.5 shadow-sm">
                                      <img src={esp.logo} className="w-full h-full object-contain" alt={esp.nome} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
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
  </>
);
};

export default Profile;
