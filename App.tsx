
import React, { useState, useEffect } from 'react';
import { ViewState, ClubType } from './types';
import Home from './components/Home';
import ClubManagement from './components/ClubManagement';
import AiAssistant from './components/AiAssistant';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { Settings, X, ChevronLeft } from 'lucide-react';

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
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [selectedClub, setSelectedClub] = useState<ClubType | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);
  const [pendingSubView, setPendingSubView] = useState<string | undefined>(undefined);

  // Carregar estado inicial apenas uma vez na montagem
  useEffect(() => {
    const savedState = localStorage.getItem('dbv_tudo_app_state');
    if (savedState) {
      try {
        const { view, club, guest } = JSON.parse(savedState);
        if (view) setCurrentView(view);
        if (club) setSelectedClub(club);
        if (guest !== undefined) setIsGuest(guest);
      } catch (e) {
        console.error("Erro ao restaurar estado:", e);
      }
    }
    // Marcar como inicializado após a tentativa de carregamento
    setIsInitialized(true);
  }, []);

  // Salvar estado apenas se já foi inicializado
  useEffect(() => {
    if (isInitialized) {
      const stateToSave = {
        view: currentView,
        club: selectedClub,
        guest: isGuest
      };
      localStorage.setItem('dbv_tudo_app_state', JSON.stringify(stateToSave));
    }
  }, [currentView, selectedClub, isGuest, isInitialized]);

  const navigateToClub = (club: ClubType) => {
    setSelectedClub(club);
    setCurrentView('CLUB_LIST');
  };

  const handleLoginSuccess = (asGuest: boolean = false) => {
    setIsGuest(asGuest);
    setCurrentView('HOME');
  };

  const handleOpenProfile = () => {
    setCurrentView('PROFILE');
  };

  const handleLogout = () => {
    localStorage.removeItem('dbv_tudo_app_state');
    // Não removemos o perfil global para o usuário não ter que digitar tudo de novo se voltar
    setIsGuest(false);
    setSelectedClub(null);
    setCurrentView('LOGIN');
  };

  if (!isInitialized) return null;

  const renderContent = () => {
    switch (currentView) {
      case 'LOGIN':
        return <Auth onLoginSuccess={(guest) => handleLoginSuccess(guest)} initialView="LOGIN" />;
      case 'SIGNUP':
        return <Auth onLoginSuccess={() => handleLoginSuccess(false)} initialView="SIGNUP" />;
      case 'HOME':
        return <Home 
          onSelectClub={navigateToClub} 
          onOpenSettings={() => setCurrentView('SETTINGS')} 
          onOpenAdvisor={() => setCurrentView('AI_ADVISOR')} 
        />;
      case 'CLUB_LIST':
        return (
          <ClubManagement 
            club={selectedClub || ClubType.PATHFINDER} 
            onBack={() => setCurrentView('HOME')}
            onSwitchClub={(club) => setSelectedClub(club)}
            onOpenProfile={handleOpenProfile}
            onOpenAdvisor={(prompt) => {
              setPendingPrompt(prompt);
              setCurrentView('AI_ADVISOR');
            }}
            isGuest={isGuest}
            initialSubView={pendingSubView as any}
            onClearSubView={() => setPendingSubView(undefined)}
          />
        );
      case 'AI_ADVISOR':
        return <AiAssistant 
          onBack={() => {
            setPendingPrompt(undefined);
            setCurrentView('HOME');
          }} 
          initialPrompt={pendingPrompt} 
        />;
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
          <div className="p-8 animate-slide-up h-full flex flex-col bg-slate-50 relative">
            <button 
              onClick={() => setCurrentView('HOME')}
              className="absolute top-6 right-6 p-2 bg-white rounded-full shadow-md text-slate-400"
            >
              <X size={20} />
            </button>
            <div className="mt-12">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Ajustes</h2>
              <p className="text-slate-500 mb-10 text-lg">Personalize sua experiência.</p>
              
              <div className="space-y-4">
                {[
                  { label: 'Notificações Push', enabled: true },
                  { label: 'Sincronizar SGC', enabled: true },
                  { label: 'Sair da Conta', enabled: false, action: handleLogout }
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={item.action}
                    className="w-full bg-white p-5 rounded-3xl flex justify-between items-center shadow-sm border border-slate-100"
                  >
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    {item.action ? (
                      <ChevronLeft className="rotate-180 text-slate-300" size={18} />
                    ) : (
                      <div className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${item.enabled ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${item.enabled ? 'translate-x-7' : ''}`}></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return <Home onSelectClub={navigateToClub} onOpenSettings={() => setCurrentView('SETTINGS')} onOpenAdvisor={() => setCurrentView('AI_ADVISOR')} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <style>{styles}</style>
      <div className="h-full w-full max-w-[440px] bg-white shadow-2xl relative overflow-hidden sm:rounded-[48px] border-[8px] border-slate-900">
        <main className="h-full w-full bg-mesh overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
