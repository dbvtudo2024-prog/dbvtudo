
import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Lock, User, Shield, MapPin, Briefcase, Phone, ChevronLeft, Eye, EyeOff, UserCircle } from 'lucide-react';
import { ClubType, UserProfile } from '../types';
import { supabase, supabaseQfpy, setActiveSupabaseProject, authenticateUserMultiProject, resetPasswordMultiProject, updateUserProfile, fetchFuncoes, DEFAULT_CARGOS, getCachedFuncoes, saveLocalFaixaSpecialties } from '../services/supabaseService';

interface AuthProps {
  onLoginSuccess: (isGuest?: boolean) => void;
  view: 'LOGIN' | 'SIGNUP';
  onViewChange: (view: 'LOGIN' | 'SIGNUP') => void;
}

const InputField = ({ icon: Icon, label, name, type = "text", placeholder, required = false, value, onChange, autoCapitalize, autoCorrect, spellCheck, inputMode, autoComplete }: any) => (
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
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        spellCheck={spellCheck}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-slate-800 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
      />
    </div>
  </div>
);

const Auth: React.FC<AuthProps> = ({ onLoginSuccess, view, onViewChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [clubType, setClubType] = useState<ClubType>(ClubType.PATHFINDER);
  const [isLogoWobbling, setIsLogoWobbling] = useState(false);

  const handleLogoClick = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {}
    setIsLogoWobbling(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsLogoWobbling(true);
      });
    });
  };
  
  // Estados para capturar dados
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    clubName: '',
    cargo: '',
    phone: ''
  });

  const [loginData, setLoginData] = useState(() => {
    let savedEmail = '';
    try {
      savedEmail = localStorage.getItem('dbv_last_login_email') || '';
    } catch {}
    return {
      email: savedEmail,
      password: ''
    };
  });

  const [cargos, setCargos] = useState<string[]>(() => getCachedFuncoes());

  useEffect(() => {
    fetchFuncoes().then(loadedCargos => {
      if (loadedCargos && loadedCargos.length > 0) {
        setCargos(loadedCargos);
      }
    });
  }, []);

  const availableCargos = useMemo(() => {
    if (formData.cargo && !cargos.includes(formData.cargo)) {
      return [formData.cargo, ...cargos];
    }
    return cargos;
  }, [cargos, formData.cargo]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async () => {
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    if (!cleanEmail || !cleanPassword || !formData.name.trim()) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResetMessage(null);

    try {
      setActiveSupabaseProject('qfpy');
      const { data, error: authError } = await supabaseQfpy.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) throw authError;

      if (data.user) {
        // Criar perfil na tabela Usuarios
        const profile: Partial<UserProfile> = {
          user_id: data.user.id,
          nome: formData.name.trim(),
          telefone: formData.phone.trim(),
          clube: formData.clubName.trim(),
          funçao: formData.cargo,
          clubes: clubType === ClubType.PATHFINDER ? "Desbravador" : "Aventureiro",
        };

        const { error: profileError } = await updateUserProfile(profile);
        if (profileError) console.error("Erro ao criar perfil:", profileError);

        try {
          localStorage.setItem('dbv_last_login_email', cleanEmail);
        } catch {}

        const newProfileObj = {
          name: formData.name.trim(),
          email: cleanEmail,
          tipo: profile.clubes,
          clube: formData.clubName.trim(),
          cargo: formData.cargo,
          telefone: formData.phone.trim(),
          avatar: "",
          isAdmin: cleanEmail === 'ronaldosonic@gmail.com' || cleanEmail === 'dbvtudo2024@gmail.com'
        };

        // Salvar no localStorage para compatibilidade legada
        localStorage.setItem(`dbv_tudo_global_user_profile`, JSON.stringify(newProfileObj));
        try {
          localStorage.setItem(`dbv_profile_backup_${cleanEmail}`, JSON.stringify(newProfileObj));
        } catch {}

        onLoginSuccess(false);
      }
    } catch (err: any) {
      if (err?.message === 'Failed to fetch' || err?.name === 'AuthRetryableFetchError' || err?.message?.includes('Failed to fetch')) {
        setError("Não foi possível conectar ao servidor. Verifique sua conexão com a internet.");
      } else {
        setError(err.message || "Erro ao cadastrar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderSignup = () => (
    <div className="animate-slide-up space-y-6 px-7 pb-20 pt-2">
      <div className="sticky top-0 z-30 flex items-center space-x-4 py-3 -mx-7 px-7 bg-[#F8FAFC]/90 dark:bg-slate-900/90 backdrop-blur-md transition-all">
        <button onClick={() => onViewChange('LOGIN')} className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-slate-400 active:scale-90 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-black text-[#004d40] dark:text-emerald-500 tracking-tighter uppercase">Criar Nova Conta</h2>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold animate-slide-up">
            {error}
          </div>
        )}
        <InputField name="name" icon={User} label="Nome Completo" placeholder="Seu nome completo" required value={formData.name} onChange={handleInputChange} />
        <InputField 
          name="email" 
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="email"
          icon={Mail} 
          label="E-mail" 
          placeholder="seu@email.com" 
          required 
          value={formData.email} 
          onChange={handleInputChange} 
        />
        
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
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="new-password"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-slate-800 dark:text-slate-200 shadow-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
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
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex items-center justify-center space-x-2 ${clubType === ClubType.PATHFINDER ? 'border-[#dc371b] bg-[#dc371b]/5 text-[#dc371b]' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'}`}
            >
              <Shield size={16} />
              <span className="text-xs font-black uppercase">Desbravador</span>
            </button>
            <button 
              onClick={() => setClubType(ClubType.ADVENTURER)}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex items-center justify-center space-x-2 ${clubType === ClubType.ADVENTURER ? 'border-[#800000] bg-[#800000]/5 text-[#800000]' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400'}`}
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
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-10 text-sm shadow-sm focus:outline-none focus:border-emerald-500 appearance-none text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="" className="text-slate-400">Selecione um cargo</option>
              {availableCargos.map(c => <option key={c} value={c} className="text-slate-800">{c}</option>)}
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
        Já tem uma conta? <button onClick={() => onViewChange('LOGIN')} className="text-[#004d40] font-black underline underline-offset-4">ENTRAR AGORA</button>
      </p>
    </div>
  );

  const handleForgotPassword = async () => {
    const cleanEmail = loginData.email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Digite seu e-mail no campo acima antes de tocar em 'Esqueci'.");
      setResetMessage(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setResetMessage(null);
    try {
      const { error: resetErr } = await resetPasswordMultiProject(cleanEmail, window.location.origin);
      if (resetErr) throw resetErr;
      setResetMessage(`Enviamos um link de redefinição de senha para ${cleanEmail}. Verifique sua caixa de entrada e spam.`);
    } catch (err: any) {
      setError(err?.message || "Não foi possível enviar o e-mail de recuperação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    const cleanEmail = loginData.email.trim().toLowerCase();
    const rawPassword = loginData.password;

    if (!cleanEmail || !rawPassword) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResetMessage(null);

    try {
      const { user, profile, error: authError } = await authenticateUserMultiProject(cleanEmail, rawPassword);

      if (authError || !user) {
        throw authError || new Error("Invalid login credentials");
      }

      try {
        localStorage.setItem('dbv_last_login_email', cleanEmail);
      } catch {}

      let localBackup: any = null;
      try {
        const rawBackup = localStorage.getItem(`dbv_profile_backup_${cleanEmail}`);
        if (rawBackup) localBackup = JSON.parse(rawBackup);
      } catch {}

      const isSuperAdminEmail = cleanEmail === 'ronaldosonic@gmail.com' || cleanEmail === 'dbvtudo2024@gmail.com';

      if (profile) {
        const uClub = profile.clubes === "Aventureiro" ? ClubType.ADVENTURER : ClubType.PATHFINDER;
        const uEmail = profile.email || (profile as any)['e - mail'] || user.email || cleanEmail;
        let birthDate = profile.data_nascimento || (profile as any)['data de nascimento'] || user.user_metadata?.data_nascimento || localBackup?.data_nascimento || "";
        let cargoFromFundo = "";
        let bloodType = profile.tipo_sanguineo || localBackup?.tipo_sanguineo || "";
        let rhFactor = profile.fator_rh || localBackup?.fator_rh || "";
        if (profile.fundo) {
          try {
            const pf = JSON.parse(profile.fundo);
            if (!birthDate && pf?.data_nascimento) birthDate = pf.data_nascimento;
            if (pf?.cargo) cargoFromFundo = pf.cargo;
            if (!bloodType && pf?.tipo_sanguineo) bloodType = pf.tipo_sanguineo;
            if (!rhFactor && pf?.fator_rh) rhFactor = pf.fator_rh;
          } catch {
            if (!birthDate && /^\d{4}-\d{2}-\d{2}$/.test(profile.fundo)) birthDate = profile.fundo;
          }
        }

        const profileObj = {
          name: profile.nome || user.user_metadata?.nome || localBackup?.name || cleanEmail.split('@')[0],
          email: uEmail,
          tipo: profile.clubes || localBackup?.tipo || "Desbravador",
          clube: profile.clube || profile.clube_de || (profile as any)['clube de'] || localBackup?.clube || "",
          cargo: profile.funçao || (profile as any).cargo || cargoFromFundo || user.user_metadata?.cargo || localBackup?.cargo || "",
          telefone: profile.telefone || localBackup?.telefone || "",
          avatar: profile.foto || localBackup?.avatar || "",
          cidade: profile.cidade || localBackup?.cidade || "",
          estado: profile.estado || localBackup?.estado || "",
          data_nascimento: birthDate,
          tipo_sanguineo: bloodType,
          fator_rh: rhFactor,
          isAdmin: Boolean(profile.ADM || isSuperAdminEmail || localBackup?.isAdmin)
        };

        localStorage.setItem(`dbv_tudo_global_user_profile`, JSON.stringify(profileObj));
        try {
          localStorage.setItem(`dbv_profile_backup_${cleanEmail}`, JSON.stringify(profileObj));
        } catch {}

        const rawEsp = profile.Especialidades !== undefined ? profile.Especialidades : (profile as any).especialidades;
        if (rawEsp) {
          let parsedIds: string[] = [];
          if (typeof rawEsp === 'string') {
            parsedIds = rawEsp.split(',').map((id: string) => id.trim()).filter((id: string) => id.length > 0);
          } else if (Array.isArray(rawEsp)) {
            parsedIds = rawEsp.map((id: any) => String(id).trim()).filter((id: string) => id.length > 0);
          }
          if (parsedIds.length > 0) {
            saveLocalFaixaSpecialties(parsedIds, uEmail, uClub);
          }
        }
      } else {
        // Garantir perfil salvo no localStorage mesmo se a linha na tabela Usuarios ainda não existir
        const fallbackProfileObj = {
          name: user.user_metadata?.nome || localBackup?.name || cleanEmail.split('@')[0],
          email: user.email || cleanEmail,
          tipo: localBackup?.tipo || "Desbravador",
          clube: localBackup?.clube || "",
          cargo: user.user_metadata?.cargo || localBackup?.cargo || "",
          telefone: localBackup?.telefone || "",
          avatar: localBackup?.avatar || "",
          cidade: localBackup?.cidade || "",
          estado: localBackup?.estado || "",
          data_nascimento: user.user_metadata?.data_nascimento || localBackup?.data_nascimento || "",
          tipo_sanguineo: localBackup?.tipo_sanguineo || "",
          fator_rh: localBackup?.fator_rh || "",
          isAdmin: Boolean(isSuperAdminEmail || localBackup?.isAdmin)
        };
        localStorage.setItem(`dbv_tudo_global_user_profile`, JSON.stringify(fallbackProfileObj));
        try {
          localStorage.setItem(`dbv_profile_backup_${cleanEmail}`, JSON.stringify(fallbackProfileObj));
        } catch {}
      }

      onLoginSuccess(false);
    } catch (err: any) {
      if (err?.message === 'Failed to fetch' || err?.name === 'AuthRetryableFetchError' || err?.message?.includes('Failed to fetch')) {
        setError("Não foi possível conectar ao servidor. Verifique sua conexão com a internet.");
      } else if (err?.message?.toLowerCase().includes('invalid login credentials') || err?.message?.toLowerCase().includes('invalid_credentials')) {
        setError("E-mail ou senha incorretos. Use o ícone de olho no campo de senha para conferir o que foi digitado ou toque em 'Esqueci' para redefinir.");
      } else {
        setError(err.message || "Erro ao entrar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderLogin = () => (
    <div className="animate-slide-up space-y-8 px-7 pt-12">
      <div className="flex flex-col items-center mb-10">
        <div 
          onClick={handleLogoClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLogoClick();
            }
          }}
          aria-label="Logo DBV Tudo"
          className="relative w-32 h-32 mb-6 animate-float cursor-pointer select-none group focus:outline-none"
        >
          <div 
            className={`absolute inset-2 rounded-full app-logo-click-glow blur-2xl pointer-events-none transition-all duration-500 ${
              isLogoWobbling ? 'opacity-100 scale-115' : 'opacity-0 scale-90 group-hover:opacity-60 group-hover:scale-105'
            }`}
          />
          <div 
            onAnimationEnd={() => setIsLogoWobbling(false)}
            className={`w-full h-full flex items-center justify-center transform transition-transform duration-500 group-hover:scale-105 ${
              isLogoWobbling ? 'animate-logo-wobble' : ''
            }`}
          >
            <img 
              src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
              draggable={false}
              className="w-full h-full object-contain drop-shadow-xl select-none" 
              alt="Logo" 
            />
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase leading-none">DBV Tudo</h1>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-3">Sua Gestão Digital</p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-bold animate-slide-up">
            {error}
          </div>
        )}
        {resetMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl text-xs font-bold animate-slide-up">
            {resetMessage}
          </div>
        )}
        <InputField 
          icon={Mail} 
          type="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="email"
          label="E-mail" 
          placeholder="seu@email.com" 
          value={loginData.email}
          onChange={(e: any) => setLoginData({...loginData, email: e.target.value})}
        />
        <div className="space-y-1.5 w-full">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Senha</label>
            <button 
              type="button"
              onClick={handleForgotPassword}
              className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline active:scale-95 transition-all"
            >
              Esqueci
            </button>
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
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin();
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-12 text-sm text-slate-800 dark:text-slate-200 shadow-sm focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
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
          className="w-full py-3.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700 rounded-[24px] font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          <UserCircle size={16} />
          <span>Entrar sem login</span>
        </button>
      </div>

      <div className="text-center space-y-4 pt-4">
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
          Ainda não é cadastrado? <br/>
          <button onClick={() => onViewChange('SIGNUP')} className="text-[#004d40] dark:text-emerald-500 font-black mt-2 text-xs underline underline-offset-4">CRIAR NOVA CONTA</button>
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-transparent transition-colors duration-500 overflow-y-auto scrollbar-hide">
      {view === 'LOGIN' ? renderLogin() : renderSignup()}
    </div>
  );
};

export default Auth;
