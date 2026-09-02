
import React, { useState, useEffect } from 'react';
import { ViewState, ClubType } from './types';
import Home from './components/Home';
import ClubManagement, { SubViewType } from './components/ClubManagement';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { Settings, X, ChevronLeft } from 'lucide-react';
import { PROFILE_KEY } from './constants';
import { supabase } from './services/supabaseService';

const styles = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-slide-in { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-float { animation: float 5s ease-in-out infinite; }
  
  .glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .bg-mesh {
    background-color: #f8fafc;
    background-image: 
      radial-gradient(at 0% 0%, rgba(220, 55, 27, 0.05) 0px, transparent 50%),
      radial-gradient(at 100% 0%, rgba(128, 0, 0, 0.05) 0px, transparent 50%);
  }
`;

const App: React.FC = () => {
  // Se o usuário estiver logado, inicia na tela inicial (HOME); caso contrário, na tela de LOGIN
  const [currentView, setCurrentView] = useState<ViewState>(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed && (parsed.email || parsed.name)) {
          return 'HOME';
        }
      }
    } catch (e) {
      console.error("Erro ao carregar sessão inicial:", e);
    }
    return 'LOGIN';
  });

  const [activeSubView, setActiveSubView] = useState<SubViewType | undefined>(undefined);
  const [selectedClub, setSelectedClub] = useState<ClubType | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Verificar se há sessão ativa no Supabase e perfil salvo
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (session?.user && savedProfile && !isGuest) {
        setCurrentView(prev => (prev === 'LOGIN' || prev === 'SIGNUP') ? 'HOME' : prev);
      }
    }).catch(() => {});
  }, [isGuest]);

  // Manter apenas a preferência de Tema Escuro salva no dispositivo
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('dbv_tudo_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
    } catch (e) {
      console.error("Erro ao carregar tema inicial:", e);
    }
    return false;
  });

  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);
  const [pendingSubView, setPendingSubView] = useState<SubViewType | undefined>(undefined);

  // Limpar qualquer estado salvo legado ao inicializar
  useEffect(() => {
    try {
      localStorage.removeItem('dbv_tudo_app_state');
    } catch (e) {}
  }, []);

  // Sincronizar classe dark para Tailwind e salvar preferência de tema
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('dbv_tudo_theme', 'dark');
      } catch (e) {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('dbv_tudo_theme', 'light');
      } catch (e) {}
    }
  }, [darkMode]);

  // Gerenciar histórico para o botão voltar do Android
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        if (event.state.view) setCurrentView(event.state.view);
        if (event.state.subView !== undefined) {
          setActiveSubView(event.state.subView);
        } else {
          setActiveSubView(undefined);
        }
        if (event.state.club) setSelectedClub(event.state.club);
      } else {
        // Se não houver estado e não for LOGIN, tentamos manter ou ir para HOME
        if (currentView !== 'LOGIN' && currentView !== 'SIGNUP') {
          setCurrentView('HOME');
          setActiveSubView(undefined);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Inicializar o estado inicial do histórico
    try {
      if (!window.history.state) {
        window.history.replaceState({ view: currentView, subView: activeSubView, club: selectedClub }, '', '');
      }
    } catch (e) {}

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, activeSubView, selectedClub]);

  // Sincronizar histórico quando a view ou subView muda
  useEffect(() => {
    try {
      const state = window.history.state;
      if (state?.view !== currentView || state?.subView !== activeSubView || state?.club !== selectedClub) {
        window.history.pushState({ view: currentView, subView: activeSubView, club: selectedClub }, '', '');
      }
    } catch (e) {}
  }, [currentView, activeSubView, selectedClub]);

  const navigateToClub = (club: ClubType) => {
    setSelectedClub(club);
    setCurrentView('CLUB_LIST');
  };

  const handleLoginSuccess = (asGuest: boolean = false) => {
    setIsGuest(asGuest);
    if (asGuest) {
      try {
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem('dbv_tudo_global_user_profile');
        supabase.auth.signOut().catch(() => {});
      } catch (e) {}
    }
    // Use replaceState ao fazer login para que o botão voltar não retorne à tela de login
    try {
      window.history.replaceState({ view: 'HOME', subView: undefined, club: selectedClub, guest: asGuest }, '', '');
    } catch (e) {}
    setCurrentView('HOME');
  };

  const handleOpenProfile = () => {
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    if (isGuest || !savedProfile) {
      // Se estiver sem conta logada / modo visitante, leva para o LOGIN
      setCurrentView('LOGIN');
    } else {
      setCurrentView('PROFILE');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem('dbv_tudo_global_user_profile');
      localStorage.removeItem('dbv_tudo_app_state');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });
      supabase.auth.signOut().catch(() => {});
    } catch (e) {}
    setIsGuest(false);
    setSelectedClub(null);
    setActiveSubView(undefined);
    setCurrentView('LOGIN');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'LOGIN':
        return <Auth onLoginSuccess={(guest) => handleLoginSuccess(guest)} view="LOGIN" onViewChange={setCurrentView} />;
      case 'SIGNUP':
        return <Auth onLoginSuccess={() => handleLoginSuccess(false)} view="SIGNUP" onViewChange={setCurrentView} />;
      case 'HOME':
        return <Home 
          onSelectClub={navigateToClub} 
          onOpenSettings={() => setCurrentView('SETTINGS')} 
          onOpenProfile={handleOpenProfile}
          isGuest={isGuest}
        />;
      case 'CLUB_LIST':
        return (
          <ClubManagement 
            club={selectedClub || ClubType.PATHFINDER} 
            onBack={() => {
              if (activeSubView) {
                setActiveSubView(undefined);
              } else {
                setCurrentView('HOME');
              }
            }}
            onSwitchClub={(club) => setSelectedClub(club)}
            onOpenProfile={handleOpenProfile}
            isGuest={isGuest}
            initialSubView={pendingSubView || activeSubView}
            onSubViewChange={(sub) => {
              setActiveSubView(sub);
              if (pendingSubView) setPendingSubView(undefined);
            }}
            onClearSubView={() => {
              setPendingSubView(undefined);
              setActiveSubView(undefined);
            }}
          />
        );
      case 'PROFILE':
        return (
          <Profile 
            club={selectedClub || ClubType.PATHFINDER} 
            onBack={(newClub) => {
              if (newClub) setSelectedClub(newClub);
              setCurrentView('CLUB_LIST');
            }} 
            onLogout={handleLogout}
            onOpenAdmin={() => {
              if (!selectedClub) setSelectedClub(ClubType.PATHFINDER);
              setPendingSubView('BIBLE_ADMIN');
              setCurrentView('CLUB_LIST');
            }}
          />
        );
      case 'SETTINGS':
        return (
          <div className={`p-8 animate-slide-up h-full flex flex-col relative transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <button 
              onClick={() => setCurrentView('HOME')}
              className={`absolute top-6 right-6 p-2 rounded-full shadow-md transition-colors ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-400'}`}
            >
              <X size={20} />
            </button>
            <div className="mt-12">
              <h2 className={`text-3xl font-black mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Ajustes</h2>
              <p className={`mb-10 text-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Personalize sua experiência.</p>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-full p-5 rounded-3xl flex justify-between items-center shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                >
                  <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Tema Escuro</span>
                  <div className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-7' : ''}`}></div>
                  </div>
                </button>

                <button 
                  onClick={handleLogout}
                  className={`w-full p-5 rounded-3xl flex justify-between items-center shadow-sm border transition-colors ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
                >
                  <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Sair da Conta</span>
                  <ChevronLeft className="rotate-180 text-slate-300" size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <Home onSelectClub={navigateToClub} onOpenSettings={() => setCurrentView('SETTINGS')} onOpenProfile={handleOpenProfile} isGuest={isGuest} />;
    }
  };

  return (
    <div className={`h-screen w-screen flex items-center justify-center p-0 sm:p-4 md:p-8 overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <style>{styles}</style>
      <div className={`h-full w-full max-w-7xl shadow-2xl relative overflow-hidden sm:rounded-[48px] sm:border-[8px] flex flex-col transition-colors duration-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <main className={`flex-1 w-full overflow-hidden flex flex-col transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-mesh'}`}>
          {renderContent()}
        </main>

        {/* Rodapé Global */}
        <footer className="py-2.5 px-4 text-center select-none shrink-0 pointer-events-none z-20 transition-colors duration-500">
          <p className="text-[10px] sm:text-[11px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.25em]">
            DBV TUDO 2024 - 2026
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
