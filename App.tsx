
import React, { useState, useEffect } from 'react';
import { ViewState, ClubType } from './types';
import Home from './components/Home';
import ClubManagement, { SubViewType } from './components/ClubManagement';
import Auth from './components/Auth';
import Profile from './components/Profile';
import UpdateNotification from './components/UpdateNotification';
import { Settings, X, ChevronLeft, Moon, Sun, Bell, BellOff, LogOut, Sparkles, History, ChevronDown, ChevronUp, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import { APP_VERSION, APP_BUILD_DATE, VERSION_HISTORY } from './versionConfig';

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
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleUp {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-slide-in { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-float { animation: float 5s ease-in-out infinite; }
  .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
  .animate-scale-up { animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  
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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateCheckMessage, setUpdateCheckMessage] = useState<string | null>(null);

  const handleManualCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateCheckMessage(null);
    try {
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const serverVersion = Number(data?.version || data?.timestamp);
        const storedTime = Number(sessionStorage.getItem('dbv_current_build_time') || 0);

        if (serverVersion && storedTime && serverVersion > storedTime) {
          setUpdateCheckMessage(`Nova versão v${data?.versionName || ''} encontrada! Recarregando...`);
          setTimeout(() => {
            window.location.reload();
          }, 1200);
          return;
        }
      }
      setUpdateCheckMessage(`Você já está na versão mais recente (v${APP_VERSION})!`);
    } catch {
      setUpdateCheckMessage(`Versão instalada: v${APP_VERSION}. Aplicativo atualizado.`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // Verificar se há sessão ativa no Supabase e perfil salvo
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (session?.user && savedProfile && !isGuest) {
        setCurrentView(prev => (prev === 'LOGIN' || prev === 'SIGNUP') ? 'HOME' : prev);
      }
    }).catch(() => {});
  }, [isGuest]);

  // Se por acaso a rota for 'SETTINGS', abre o modal e mantém na HOME
  useEffect(() => {
    if (currentView === 'SETTINGS') {
      setIsSettingsModalOpen(true);
      setCurrentView('HOME');
    }
  }, [currentView]);

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsModalOpen) {
        setIsSettingsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsModalOpen]);

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

  // Notificações: preferência salva no dispositivo e verificação de suporte/permissão
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dbv_notifications_enabled');
      if (saved !== null) {
        return saved === 'true';
      }
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission === 'granted';
      }
    } catch (e) {}
    return false;
  });
  const [notificationStatusMsg, setNotificationStatusMsg] = useState<string | null>(null);

  // Sincronizar estado de notificações com as permissões do navegador ao abrir Ajustes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const saved = localStorage.getItem('dbv_notifications_enabled');
      if (saved === 'false') {
        setNotificationsEnabled(false);
      } else if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
      } else if (Notification.permission === 'denied') {
        setNotificationsEnabled(false);
      }
    }
  }, [currentView, isSettingsModalOpen]);

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      try {
        localStorage.setItem('dbv_notifications_enabled', 'false');
      } catch (e) {}
      setNotificationStatusMsg('Notificações desativadas.');
      setTimeout(() => setNotificationStatusMsg(null), 3000);
    } else {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        setNotificationStatusMsg('Seu dispositivo ou navegador não suporta notificações web.');
        setTimeout(() => setNotificationStatusMsg(null), 3500);
        return;
      }

      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
        try {
          localStorage.setItem('dbv_notifications_enabled', 'true');
          localStorage.setItem('dbv_notification_prompted', 'true');
        } catch (e) {}
        setNotificationStatusMsg('Notificações ativadas com sucesso!');
        setTimeout(() => setNotificationStatusMsg(null), 3000);

        try {
          if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
            navigator.vibrate(100);
          }
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              reg.showNotification('✅ Notificações Ativadas!', {
                body: 'Você receberá avisos e novidades do DBV Tudo.',
                icon: '/favicon.ico'
              });
              return;
            }
          }
          new Notification('✅ Notificações Ativadas!', {
            body: 'Você receberá avisos e novidades do DBV Tudo.',
            icon: '/favicon.ico'
          });
        } catch (e) {}
      } else if (Notification.permission === 'denied') {
        setNotificationStatusMsg('As notificações estão bloqueadas nas configurações do seu navegador. Habilite o envio para este site para ativá-las.');
        setTimeout(() => setNotificationStatusMsg(null), 5000);
      } else {
        try {
          const perm = await Notification.requestPermission();
          if (perm === 'granted') {
            setNotificationsEnabled(true);
            try {
              localStorage.setItem('dbv_notifications_enabled', 'true');
              localStorage.setItem('dbv_notification_prompted', 'true');
            } catch (e) {}
            setNotificationStatusMsg('Notificações ativadas com sucesso!');
            setTimeout(() => setNotificationStatusMsg(null), 3000);

            try {
              if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
                navigator.vibrate(100);
              }
              if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.ready;
                if (reg && reg.showNotification) {
                  reg.showNotification('✅ Notificações Ativadas!', {
                    body: 'Você receberá avisos e novidades do DBV Tudo.',
                    icon: '/favicon.ico'
                  });
                  return;
                }
              }
              new Notification('✅ Notificações Ativadas!', {
                body: 'Você receberá avisos e novidades do DBV Tudo.',
                icon: '/favicon.ico'
              });
            } catch (e) {}
          } else {
            setNotificationsEnabled(false);
            try {
              localStorage.setItem('dbv_notifications_enabled', 'false');
            } catch (e) {}
            setNotificationStatusMsg('Permissão de notificações não foi concedida.');
            setTimeout(() => setNotificationStatusMsg(null), 3000);
          }
        } catch (e) {
          console.error('Erro ao solicitar permissão de notificações:', e);
        }
      }
    }
  };

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
          onOpenSettings={() => setIsSettingsModalOpen(true)} 
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
        return <Home 
          onSelectClub={navigateToClub} 
          onOpenSettings={() => setIsSettingsModalOpen(true)} 
          onOpenProfile={handleOpenProfile} 
          isGuest={isGuest} 
        />;
      default:
        return <Home 
          onSelectClub={navigateToClub} 
          onOpenSettings={() => setIsSettingsModalOpen(true)} 
          onOpenProfile={handleOpenProfile} 
          isGuest={isGuest} 
        />;
    }
  };

  return (
    <div className={`app-root-wrapper h-[100dvh] h-screen w-screen flex flex-col p-0 m-0 overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <style>{styles}</style>
      <UpdateNotification />
      <div className={`app-card-wrapper h-full w-full max-w-7xl mx-auto relative overflow-hidden rounded-none border-0 shadow-none flex flex-col flex-1 transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
        <main className={`flex-1 w-full overflow-hidden flex flex-col transition-colors duration-500 ${darkMode ? 'bg-slate-900' : 'bg-mesh'}`}>
          {renderContent()}
        </main>

        {/* Rodapé Global */}
        <footer className="app-footer py-1.5 sm:py-2 px-4 text-center select-none shrink-0 pointer-events-none z-20 transition-colors duration-500">
          <p className="text-[10px] sm:text-[11px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.25em]">
            DBV TUDO 2024 - 2026
          </p>
        </footer>
      </div>

      {/* Modal de Ajustes */}
      {isSettingsModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] landscape:max-h-[88vh] animate-scale-up transition-colors duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Modal */}
            <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Settings size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight">
                    Ajustes
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">
                    Personalize sua experiência
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all active:scale-90"
                title="Fechar"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corpo do Modal com Opções */}
            <div className="p-6 space-y-3.5 overflow-y-auto scrollbar-hide flex-1">
              {/* Botão Tema Escuro */}
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left group active:scale-[0.98] ${
                  darkMode 
                    ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600' 
                    : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <div>
                    <span className={`block text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      Tema Escuro
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      {darkMode ? 'Modo escuro ativado' : 'Modo claro ativado'}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 shrink-0 ${
                  darkMode ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                    darkMode ? 'translate-x-6' : ''
                  }`} />
                </div>
              </button>

              {/* Botão Notificações */}
              <button 
                onClick={handleToggleNotifications}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left group active:scale-[0.98] ${
                  darkMode 
                    ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600' 
                    : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    notificationsEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                  </div>
                  <div>
                    <span className={`block text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      Notificações
                    </span>
                    <span className={`text-[11px] font-medium ${
                      notificationsEnabled ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : 'text-slate-400'
                    }`}>
                      {notificationsEnabled ? 'Ativadas no dispositivo' : 'Desativadas'}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 shrink-0 ${
                  notificationsEnabled ? 'bg-indigo-500' : (darkMode ? 'bg-slate-700' : 'bg-slate-300')
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                    notificationsEnabled ? 'translate-x-6' : ''
                  }`} />
                </div>
              </button>

              {notificationStatusMsg && (
                <div className={`text-xs px-4 py-2.5 rounded-xl text-center animate-slide-up transition-all ${
                  darkMode ? 'bg-slate-800 text-indigo-300 border border-slate-700' : 'bg-indigo-50 text-indigo-900 border border-indigo-100'
                }`}>
                  {notificationStatusMsg}
                </div>
              )}

              {/* Seção de Versão do Aplicativo */}
              <div className={`rounded-2xl border p-4 transition-all ${
                darkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                    }`}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                          Versão do App
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          v{APP_VERSION}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400">
                        {APP_BUILD_DATE}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleManualCheckUpdate}
                    disabled={isCheckingUpdate}
                    className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all active:scale-95 shrink-0"
                    title="Verificar se há atualizações"
                  >
                    <RefreshCw size={15} className={isCheckingUpdate ? "animate-spin text-indigo-500" : ""} />
                  </button>
                </div>

                {updateCheckMessage && (
                  <div className={`mb-3 text-[11px] font-medium p-2.5 rounded-xl flex items-center gap-2 animate-fade-in ${
                    updateCheckMessage.includes('recuperando') || updateCheckMessage.includes('encontrada')
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}>
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{updateCheckMessage}</span>
                  </div>
                )}

                {/* Botão de Expansão do Histórico de Versões */}
                <button
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between text-xs font-bold transition-all ${
                    darkMode 
                      ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-300' 
                      : 'bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <History size={14} className="text-indigo-500" />
                    <span>Histórico de Versões & Modificações</span>
                  </div>
                  {showVersionHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {/* Lista Expansível de Changelog */}
                {showVersionHistory && (
                  <div className="mt-3 space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 animate-fade-in max-h-56 overflow-y-auto pr-1">
                    {VERSION_HISTORY.map((rel, i) => (
                      <div 
                        key={rel.version}
                        className={`p-3 rounded-xl border text-left text-xs ${
                          i === 0 
                            ? (darkMode ? 'bg-indigo-950/30 border-indigo-500/40' : 'bg-indigo-50/70 border-indigo-200')
                            : (darkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-slate-100')
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-xs">
                              v{rel.version}
                            </span>
                            {rel.tag && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                                {rel.tag}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {rel.date}
                          </span>
                        </div>
                        <p className={`font-semibold mb-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {rel.title}
                        </p>
                        <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                          {rel.changes.map((change, cIdx) => (
                            <li key={cIdx} className="flex items-start gap-1.5 leading-relaxed">
                              <span className="text-indigo-500 font-bold">•</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Separador */}
              <div className="pt-1">
                <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
              </div>

              {/* Botão Sair da Conta */}
              <button 
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  handleLogout();
                }}
                className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left active:scale-[0.98] ${
                  darkMode 
                    ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/15 text-red-300' 
                    : 'bg-red-50/70 border-red-100 hover:bg-red-50 text-red-600'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                  }`}>
                    <LogOut size={18} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold">
                      Sair da Conta
                    </span>
                    <span className="text-[11px] opacity-75">
                      Desconectar usuário deste dispositivo
                    </span>
                  </div>
                </div>
                <ChevronLeft className="rotate-180 opacity-50" size={18} />
              </button>

              {/* Identificação de Rodapé do Modal */}
              <div className="text-center pt-2 pb-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                  DBV Tudo • v{APP_VERSION} (2024 - 2026)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
