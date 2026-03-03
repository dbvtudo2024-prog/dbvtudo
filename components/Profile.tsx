
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, LogOut, Shield, MapPin, Briefcase, Award, Camera, Check, X, User, Mail, Phone, ChevronDown, Heart, Search } from 'lucide-react';
import { ClubType, Especialidade, UserProfile } from '../types';
import { fetchEspecialidades, updateUserSpecialties, fetchUserSpecialties, fetchUserProfile, updateUserProfile, supabase } from '../services/supabaseService';

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
  <div className="space-y-1 text-left">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      value={value}
      name={name}
      onChange={onChange}
      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition-all shadow-sm font-medium"
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
  <div className="space-y-1 text-left">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <select 
        value={value}
        name={name}
        onChange={onChange}
        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition-all shadow-sm font-medium appearance-none"
      >
        <option value="">Selecione...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const storageKey = `dbv_tudo_global_user_profile`;
  
  // Função para ler o estado inicial síncronamente do localStorage
  const getInitialData = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      name: "Seu Nome Aqui",
      email: "email@exemplo.com",
      tipo: club === ClubType.PATHFINDER ? "Desbravador" : "Aventureiro",
      clube: "Nome do Clube",
      cargo: "Diretor(a)",
      telefone: "(00) 00000-0000",
      avatar: "" 
    };
  };

  const [userData, setUserData] = useState(getInitialData);
  const [userId, setUserId] = useState<string | null>(null);
  const isAdmin = userData.email === 'ronaldosonic@gmail.com' || userData.email === 'dbvtudo2024@gmail.com';
  const userClubType = userData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
  const likedKey = `dbv_tudo_liked_specialties_${userClubType}`;

  // State para especialidades curtidas - Inicializa do localStorage para evitar sobrescrever no mount
  // Carregar dados do Supabase se houver usuário logado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const profile = await fetchUserProfile(user.id);
        if (profile) {
          const mappedData = {
            name: profile.nome || userData.name,
            email: profile.email || userData.email,
            tipo: profile.clubes === "Aventureiro" ? "Aventureiro" : "Desbravador",
            clube: profile.clube || userData.clube,
            cargo: profile.funçao || userData.cargo,
            telefone: profile.telefone || userData.telefone,
            avatar: profile.foto || userData.avatar,
            cidade: profile.cidade || "",
            estado: profile.estado || ""
          };
          setUserData(mappedData);
          localStorage.setItem(storageKey, JSON.stringify(mappedData));
        }
      }
    };
    checkUser();
  }, []);

  const [likedIds, setLikedIds] = useState<string[]>(() => {
    const initialData = getInitialData();
    const initialClubType = initialData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
    const initialKey = `dbv_tudo_liked_specialties_${initialClubType}`;
    const saved = localStorage.getItem(initialKey);
    return saved ? JSON.parse(saved) : [];
  });

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
    if (isSashView || (likedIds.length > 0 && allSpecialties.length === 0)) {
      setIsLoading(true);
      fetchEspecialidades(userClubType).then(data => {
        // Ordenar alfabeticamente
        const sorted = [...data].sort((a, b) => a.nome.localeCompare(b.nome));
        setAllSpecialties(sorted);
      }).finally(() => setIsLoading(false));
    }
  }, [isSashView, userClubType, likedIds.length, allSpecialties.length]);

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
      
      // Salvar no Supabase se tiver userId
      if (userId) {
        const profile: Partial<UserProfile> = {
          user_id: userId,
          nome: userData.name,
          email: userData.email,
          telefone: userData.telefone,
          foto: userData.avatar,
          clube: userData.clube,
          funçao: userData.cargo,
          clubes: userData.tipo,
          cidade: userData.cidade || "",
          estado: userData.estado || ""
        };
        await updateUserProfile(profile);
      }
      
      setIsEditing(false);
      // Disparar evento de storage para outros componentes (como o dashboard) saberem que mudou
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackNavigation = () => {
    if (isSashView) {
      setIsSashView(false);
      return;
    }
    const clubToNavigate = userData.tipo === "Desbravador" ? ClubType.PATHFINDER : ClubType.ADVENTURER;
    onBack(clubToNavigate);
  };

  const renderSashView = () => (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-slide-in">
      <div className="px-8 pt-6 pb-4 space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
            <Search size={18} />
          </div>
          <input 
            type="text"
            placeholder="Buscar especialidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:outline-none shadow-sm placeholder:text-slate-200"
          />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto px-8 pb-24 space-y-3 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-slate-100 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredSpecialties.length > 0 ? (
          filteredSpecialties.map((esp) => (
            <div key={esp.id} className="bg-white border border-slate-100 rounded-[24px] p-4 flex items-center space-x-4 shadow-sm">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
                {esp.logo ? (
                  <img src={esp.logo} className="w-10 h-10 object-contain" alt={esp.nome} />
                ) : (
                  <Award size={24} className="text-slate-200" />
                )}
              </div>
              <div className="flex-grow text-left">
                <h4 className="font-black text-slate-700 text-[12px] uppercase tracking-tight leading-tight">
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
                    ? 'bg-rose-50 text-rose-500' 
                    : 'bg-slate-50 text-slate-300'
                }`}
              >
                <Heart size={20} fill={likedIds.includes(esp.id.toString()) ? "currentColor" : "none"} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400 font-bold text-sm">Nenhuma especialidade encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isSashView) {
    return (
      <div className="flex flex-col h-full bg-[#F8FAFC]">
        <div 
          style={{ backgroundColor: currentThemeColor }} 
          className="relative h-32 w-full flex flex-col items-center justify-start pt-8 px-6 rounded-b-[40px] shadow-lg flex-shrink-0"
        >
          <div className="w-full grid grid-cols-3 items-center text-white">
            <div className="flex justify-start">
              <button 
                onClick={() => setIsSashView(false)} 
                className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 active:scale-90 transition-all"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
            </div>
            <div className="flex justify-center">
              <h1 className="font-black uppercase tracking-widest text-[11px]">Minha Faixa</h1>
            </div>
            <div className="flex justify-end w-10"></div>
          </div>
        </div>
        <div className="flex-grow overflow-hidden">
          {renderSashView()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-slide-in overflow-y-auto scrollbar-hide pb-12">
      <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

      {/* Header */}
      <div 
        style={{ backgroundColor: currentThemeColor }} 
        className="relative h-44 w-full flex flex-col items-center justify-start pt-8 px-6 rounded-b-[40px] shadow-lg transition-all duration-500 flex-shrink-0"
      >
        <div className="w-full grid grid-cols-3 items-center text-white">
          <div className="flex justify-start">
            <button 
              onClick={handleBackNavigation} 
              className="flex items-center space-x-1 font-black text-[10px] uppercase tracking-widest active:scale-90 transition-all bg-white/10 py-2 px-3 rounded-full border border-white/20"
            >
              <ChevronLeft size={16} strokeWidth={3} />
              <span>Voltar</span>
            </button>
          </div>
          
          <div className="flex justify-center">
            <h1 className="font-black uppercase tracking-tighter text-[11px] whitespace-nowrap opacity-90">
              {isEditing ? 'Edição' : 'Perfil'}
            </h1>
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={onLogout}
              className="bg-black/20 backdrop-blur-md px-3 py-2 rounded-full flex items-center space-x-2 border border-white/10 active:scale-90 transition-all"
            >
              <LogOut size={14} className="text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
            </button>
          </div>
        </div>

        {/* Foto de Perfil */}
        <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-20">
          <div className="relative group">
            <div className={`w-28 h-28 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-slate-100 transition-all flex items-center justify-center ${isEditing ? 'ring-4 ring-emerald-500/20' : ''}`}>
              {userData.avatar ? (
                <img src={userData.avatar} className="w-full h-full object-cover" alt="Avatar" />
              ) : (
                <User size={48} className="text-slate-300" />
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`absolute inset-0 flex items-center justify-center bg-black/40 rounded-full transition-opacity z-10 ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <Camera size={28} className="text-white drop-shadow-md" />
            </button>
            <div className={`absolute bottom-1 right-1 w-7 h-7 rounded-full border-4 border-white shadow-md transition-colors ${isEditing ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
          </div>
        </div>
      </div>

      <div className="mt-20 text-center px-8">
        {!isEditing ? (
          <div className="animate-slide-up">
            <h2 style={{ color: currentThemeColor }} className="text-2xl font-black tracking-tight">{userData.name}</h2>
            <p className="text-slate-400 font-medium text-xs mt-1">{userData.email}</p>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Ministério</label>
              <div className="flex p-1 bg-slate-100 rounded-2xl space-x-1">
                <button onClick={() => handleClubToggle("Desbravador")} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${userData.tipo === "Desbravador" ? 'bg-[#dc371b] text-white shadow-sm' : 'text-slate-400'}`}>Desbravador</button>
                <button onClick={() => handleClubToggle("Aventureiro")} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${userData.tipo === "Aventureiro" ? 'bg-[#800000] text-white shadow-sm' : 'text-slate-400'}`}>Aventureiro</button>
              </div>
            </div>
            <EditInput label="Nome Completo" value={userData.name} name="name" onChange={handleInputChange} />
            <EditInput label="E-mail" value={userData.email} name="email" type="email" onChange={handleInputChange} />
          </div>
        )}
      </div>

      <div className={`px-8 ${isEditing ? 'mt-4 border-none pt-0' : 'mt-10 border-t border-slate-100 pt-8'}`}>
        {!isEditing ? (
          <div className="grid grid-cols-2 gap-y-8 gap-x-4">
            <div className="text-center"><p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Tipo</p><p className="text-[13px] font-bold text-slate-700">{userData.tipo}</p></div>
            <div className="text-center"><p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Clube</p><p className="text-[13px] font-bold text-slate-700">{userData.clube}</p></div>
            <div className="text-center"><p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Cargo/Função</p><p className="text-[13px] font-bold text-slate-700">{userData.cargo}</p></div>
            <div className="text-center"><p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Telefone</p><p className="text-[13px] font-bold text-slate-700">{userData.telefone}</p></div>
            <div className="text-center"><p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Cidade</p><p className="text-[13px] font-bold text-slate-700">{userData.cidade || '-'}</p></div>
            <div className="text-center"><p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1">Estado</p><p className="text-[13px] font-bold text-slate-700">{userData.estado || '-'}</p></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 animate-slide-up">
            <EditInput label="Nome do Clube" value={userData.clube} name="clube" onChange={handleInputChange} />
            <EditSelect label="Cargo / Função" value={userData.cargo} name="cargo" options={CARGOS} onChange={handleInputChange} />
            <EditInput label="Telefone" value={userData.telefone} name="telefone" onChange={handleInputChange} />
            <div className="grid grid-cols-2 gap-4">
              <EditInput label="Cidade" value={userData.cidade || ""} name="cidade" onChange={handleInputChange} />
              <EditInput label="Estado" value={userData.estado || ""} name="estado" onChange={handleInputChange} />
            </div>
          </div>
        )}
      </div>

      <div className="px-8 mt-10 flex flex-col space-y-4">
        {!isEditing ? (
          <>
            <div className="flex space-x-4">
              <button onClick={() => setIsEditing(true)} style={{ backgroundColor: currentThemeColor }} className="flex-1 py-4 rounded-2xl text-white font-black uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"><span>Editar Perfil</span></button>
              <button 
                onClick={() => setIsSashView(true)}
                className="flex-1 py-4 bg-[#2e7d32] rounded-2xl text-white font-black uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Minha Faixa
              </button>
            </div>
            
            {isAdmin && onOpenAdmin && (
              <button 
                onClick={onOpenAdmin}
                className="w-full py-4 bg-indigo-600 rounded-2xl text-white font-black uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Shield size={16} />
                <span>Painel Administrativo</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button 
              onClick={handleSave} 
              disabled={isLoading}
              className="flex-1 py-4 bg-emerald-600 rounded-2xl text-white font-black uppercase text-[11px] tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Check size={16} />
              )}
              <span>{isLoading ? 'Salvando...' : 'Salvar'}</span>
            </button>
            <button 
              onClick={() => { setIsEditing(false); }} 
              disabled={isLoading}
              className="flex-1 py-4 bg-slate-200 rounded-2xl text-slate-500 font-black uppercase text-[11px] tracking-widest shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <X size={16} />
              <span>Cancelar</span>
            </button>
          </>
        )}
      </div>

      {!isEditing ? (
        <div className="mt-12 px-8 pb-20 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <div className="h-[1px] flex-grow bg-slate-100"></div>
            <h3 style={{ color: currentThemeColor }} className="px-4 font-black uppercase text-sm tracking-widest">Conquistas</h3>
            <div className="h-[1px] flex-grow bg-slate-100"></div>
          </div>
          <div className="flex flex-col items-center space-y-6">
            <div className="grid grid-cols-1 gap-3 w-full max-w-[280px]">
              <div className="h-6 w-full rounded-sm shadow-sm flex overflow-hidden border border-slate-100">
                <div className="w-1/4 bg-[#1a237e]"></div><div className="w-2/4 bg-[#fbc02d]"></div><div className="w-1/4 bg-[#1a237e]"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-6 rounded-sm shadow-sm flex overflow-hidden border border-slate-100"><div className="w-1/3 bg-[#1a237e]"></div><div className="w-1/3 bg-[#fbc02d]"></div><div className="w-1/3 bg-[#1a237e]"></div></div>
                <div className="h-6 rounded-sm shadow-sm flex overflow-hidden border border-slate-100"><div className="w-1/3 bg-[#c62828]"></div><div className="w-1/3 bg-[#fbc02d]"></div><div className="w-1/3 bg-[#c62828]"></div></div>
                <div className="h-6 rounded-sm shadow-sm flex overflow-hidden border border-slate-100"><div className="w-full bg-[#757575]"></div></div>
                <div className="h-6 rounded-sm shadow-sm flex overflow-hidden border border-slate-100"><div className="w-full bg-[#4a148c]"></div></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="w-12 h-12 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center p-2 opacity-60"><Shield size={24} className="text-slate-400" /></div>
              <div className="w-12 h-12 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center p-2 opacity-60"><Award size={24} className="text-slate-400" /></div>
              <div className="w-12 h-12 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center p-2 opacity-60"><MapPin size={24} className="text-slate-400" /></div>
            </div>
          </div>

          {/* Especialidades Curtidas (Minha Faixa) */}
          {likedIds.length > 0 && (
            <div className="mt-10 w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="h-[1px] flex-grow bg-slate-100"></div>
                <h3 className="px-4 font-black uppercase text-[10px] text-slate-400 tracking-[0.2em]">Minha Faixa</h3>
                <div className="h-[1px] flex-grow bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {allSpecialties.length === 0 && likedIds.length > 0 ? (
                  // Se ainda não carregou as especialidades mas tem IDs, mostra placeholders ou carrega
                  <div className="col-span-4 py-4 text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                    Carregando especialidades...
                  </div>
                ) : (
                  allSpecialties
                    .filter(s => likedIds.includes(s.id.toString()))
                    .map(esp => (
                      <div key={esp.id} className="flex flex-col items-center space-y-2 group">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                          <img src={esp.logo} className="w-full h-full object-contain" alt={esp.nome} title={esp.nome} />
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center line-clamp-1 w-full">
                          {esp.codigo || esp.id}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-24 w-full"></div>
      )}
    </div>
  );
};

export default Profile;
