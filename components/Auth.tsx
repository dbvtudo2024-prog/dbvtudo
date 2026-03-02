
import React, { useState } from 'react';
import { Mail, Lock, User, Shield, MapPin, Briefcase, Phone, ChevronLeft, Eye, EyeOff, UserCircle } from 'lucide-react';
import { ClubType, UserProfile } from '../types';
import { supabase, updateUserProfile } from '../services/supabaseService';

interface AuthProps {
  onLoginSuccess: (isGuest?: boolean) => void;
  initialView?: 'LOGIN' | 'SIGNUP';
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, initialView = 'LOGIN' }) => {
  const [view, setView] = useState<'LOGIN' | 'SIGNUP'>(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [clubType, setClubType] = useState<ClubType>(ClubType.PATHFINDER);
  
  // Estados para capturar dados
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    clubName: '',
    cargo: '',
    phone: ''
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const cargos = [
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Criar perfil na tabela Usuarios
        const profile: Partial<UserProfile> = {
          user_id: data.user.id,
          nome: formData.name,
          email: formData.email,
          telefone: formData.phone,
          clube: formData.clubName,
          funçao: formData.cargo,
          clubes: clubType === ClubType.PATHFINDER ? "Desbravador" : "Aventureiro",
        };

        const { error: profileError } = await updateUserProfile(profile);
        if (profileError) console.error("Erro ao criar perfil:", profileError);

        // Salvar no localStorage para compatibilidade legada
        localStorage.setItem(`dbv_tudo_global_user_profile`, JSON.stringify({
          name: formData.name,
          email: formData.email,
          tipo: profile.clubes,
          clube: formData.clubName,
          cargo: formData.cargo,
          telefone: formData.phone,
          avatar: ""
        }));

        onLoginSuccess(false);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao cadastrar.");
    } finally {
      setIsLoading(false);
    }
  };

  const InputField = ({ icon: Icon, label, name, type = "text", placeholder, required = false, value, onChange }: any) => (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
          <Icon size={18} />
        </div>
        <input 
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300"
        />
      </div>
    </div>
  );

  const renderSignup = () => (
    <div className="animate-slide-up space-y-6 px-7 pb-20 pt-6">
      <div className="flex items-center space-x-4 mb-4">
        <button onClick={() => setView('LOGIN')} className="p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-2xl font-black text-[#004d40] tracking-tighter uppercase">Criar Nova Conta</h2>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold animate-slide-up">
            {error}
          </div>
        )}
        <InputField name="name" icon={User} label="Nome Completo" placeholder="Seu nome completo" required value={formData.name} onChange={handleInputChange} />
        <InputField name="email" icon={Mail} label="E-mail" placeholder="seu@email.com" required value={formData.email} onChange={handleInputChange} />
        
        <div className="space-y-1.5 w-full">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Senha <span className="text-red-500">*</span></label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
              <Lock size={18} />
            </div>
            <input 
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Sua senha secreta"
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Clube</label>
          <div className="flex space-x-3">
            <button 
              onClick={() => setClubType(ClubType.PATHFINDER)}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex items-center justify-center space-x-2 ${clubType === ClubType.PATHFINDER ? 'border-[#dc371b] bg-[#dc371b]/5 text-[#dc371b]' : 'border-slate-100 bg-white text-slate-400'}`}
            >
              <Shield size={16} />
              <span className="text-xs font-black uppercase">Desbravador</span>
            </button>
            <button 
              onClick={() => setClubType(ClubType.ADVENTURER)}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex items-center justify-center space-x-2 ${clubType === ClubType.ADVENTURER ? 'border-[#800000] bg-[#800000]/5 text-[#800000]' : 'border-slate-100 bg-white text-slate-400'}`}
            >
              <Shield size={16} />
              <span className="text-xs font-black uppercase">Aventureiro</span>
            </button>
          </div>
        </div>

        <InputField name="clubName" icon={MapPin} label="Clube" placeholder="Ex: Sentinelas da Verdade" value={formData.clubName} onChange={handleInputChange} />

        <div className="space-y-1.5 w-full">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cargo/Função</label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Briefcase size={18} />
            </div>
            <select 
              name="cargo"
              value={formData.cargo}
              onChange={handleInputChange}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-10 text-sm shadow-sm focus:outline-none focus:border-emerald-500 appearance-none text-slate-800 font-medium"
            >
              <option value="" className="text-slate-400">Selecione um cargo</option>
              {cargos.map(c => <option key={c} value={c} className="text-slate-800">{c}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <ChevronLeft size={16} className="-rotate-90" />
            </div>
          </div>
        </div>

        <InputField name="phone" icon={Phone} label="Telefone/Whatsapp" placeholder="(00) 00000-0000" value={formData.phone} onChange={handleInputChange} />
      </div>

      <button 
        onClick={handleSignup}
        disabled={isLoading}
        className="w-full py-4 bg-[#004d40] text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10 active:scale-95 transition-all mt-4 disabled:opacity-50"
      >
        {isLoading ? 'Cadastrando...' : 'Cadastrar'}
      </button>

      <p className="text-center text-slate-500 text-[11px] font-medium pt-2 pb-10">
        Já tem uma conta? <button onClick={() => setView('LOGIN')} className="text-[#004d40] font-black underline underline-offset-4">ENTRAR AGORA</button>
      </p>
    </div>
  );

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        // Buscar perfil para atualizar localStorage
        const { data: profile } = await supabase
          .from('Usuarios')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profile) {
          localStorage.setItem(`dbv_tudo_global_user_profile`, JSON.stringify({
            name: profile.nome,
            email: profile.email,
            tipo: profile.clubes,
            clube: profile.clube,
            cargo: profile.funçao,
            telefone: profile.telefone,
            avatar: profile.foto || ""
          }));
        }

        onLoginSuccess(false);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao entrar.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderLogin = () => (
    <div className="animate-slide-up space-y-8 px-7 pt-12">
      <div className="flex flex-col items-center mb-10">
        <div className="w-32 h-32 mb-6 animate-float">
          <img 
            src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
            className="w-full h-full object-contain drop-shadow-xl" 
            alt="Logo" 
          />
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">DBV Tudo</h1>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-3">Sua Gestão Digital</p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold animate-slide-up">
            {error}
          </div>
        )}
        <InputField 
          icon={Mail} 
          label="E-mail" 
          placeholder="seu@email.com" 
          value={loginData.email}
          onChange={(e: any) => setLoginData({...loginData, email: e.target.value})}
        />
        <div className="space-y-1.5 w-full">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Senha</label>
            <button className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Esqueci</button>
          </div>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
              <Lock size={18} />
            </div>
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={loginData.password}
              onChange={(e) => setLoginData({...loginData, password: e.target.value})}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-800 shadow-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full py-4 bg-[#004d40] text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Entrando...' : 'Entrar no Clube'}
        </button>

        <button 
          onClick={() => onLoginSuccess(true)}
          className="w-full py-3.5 bg-white text-slate-500 border border-slate-100 rounded-[24px] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <UserCircle size={16} />
          <span>Entrar sem login</span>
        </button>
      </div>

      <div className="text-center space-y-4 pt-4">
        <p className="text-slate-500 text-[11px] font-medium">
          Ainda não é cadastrado? <br/>
          <button onClick={() => setView('SIGNUP')} className="text-[#004d40] font-black mt-2 text-xs underline underline-offset-4">CRIAR NOVA CONTA</button>
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] overflow-y-auto scrollbar-hide">
      {view === 'LOGIN' ? renderLogin() : renderSignup()}
    </div>
  );
};

export default Auth;
