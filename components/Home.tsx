
import React from 'react';
import { ClubType } from '../types';
import { PathfinderLogo, AdventurerLogo, PROFILE_KEY } from '../constants';
import { Settings, Sparkles, User } from 'lucide-react';

interface HomeProps {
  onSelectClub: (club: ClubType) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  isGuest?: boolean;
}

const Home: React.FC<HomeProps> = ({ onSelectClub, onOpenSettings, onOpenProfile, isGuest = false }) => {
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isGuest) {
      setUserAvatar(null);
      return;
    }
    const loadProfile = () => {
      try {
        const saved = localStorage.getItem(PROFILE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setUserAvatar(parsed.avatar || null);
        } else {
          setUserAvatar(null);
        }
      } catch { 
        setUserAvatar(null);
      }
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, [isGuest]);

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide animate-slide-up bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-500">
      {/* Top Header Fixo no Topo: Ações (Ajustes e Perfil) + Hero Branding Aumentado */}
      <header className="sticky top-0 z-20 w-full bg-[#F8FAFC]/95 dark:bg-slate-900/95 backdrop-blur-md pt-3 sm:pt-6 pb-3 sm:pb-4 px-4 sm:px-8 shrink-0 transition-colors border-b border-slate-200/40 dark:border-slate-800/40">
        <div className="max-w-4xl mx-auto w-full relative flex flex-col items-center">
          {/* Botões de Ação nas Laterais do Topo */}
          <button 
            onClick={onOpenSettings} 
            title="Configurações"
            aria-label="Configurações"
            className="absolute left-0 top-0 p-2.5 sm:p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white active:scale-90 transition-all z-10"
          >
            <Settings size={20} />
          </button>
          
          <button 
            onClick={onOpenProfile} 
            title="Perfil"
            aria-label="Perfil"
            className="absolute right-0 top-0 w-10 h-10 sm:w-12 sm:h-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white overflow-hidden active:scale-90 transition-all z-10"
          >
            {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" alt="Perfil" /> : <User size={22} />}
          </button>

          {/* Hero Branding com Logo e Nome Aumentados */}
          <div className="flex flex-col items-center justify-center shrink-0 pt-1 sm:pt-0">
            <div className="relative animate-float">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 landscape:w-20 landscape:h-20 flex items-center justify-center transform hover:scale-105 transition-transform duration-700">
                <img 
                  src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
                  className="w-full h-full object-contain drop-shadow-lg" 
                  alt="DBV Tudo Logo"
                />
              </div>
            </div>
            
            <div className="mt-2 text-center">
              <h1 className="text-2xl sm:text-4xl md:text-5xl landscape:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">
                DBV Tudo
              </h1>
              <div className="flex items-center justify-center space-x-2">
                <span className="h-[1px] w-4 bg-slate-300 dark:bg-slate-700"></span>
                <p className="text-[8px] sm:text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-[0.4em]">
                  Gestão Digital
                </p>
                <span className="h-[1px] w-4 bg-slate-300 dark:bg-slate-700"></span>
              </div>
              
              <div className="mt-2 sm:mt-2.5">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/25 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 font-bold text-[10px] sm:text-xs tracking-wide">
                  Esse não é um app oficial da IASD
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Central com Seletor de Ministérios */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 landscape:px-4 max-w-4xl mx-auto w-full py-6 sm:py-10">
        {/* Título de Instrução */}
        <div className="mb-4 sm:mb-6 landscape:mb-2 text-center shrink-0">
          <h2 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-[0.25em]">
            Escolha um ministério
          </h2>
        </div>

        {/* Seletor de Ministérios com Altura Aumentada */}
        <div className="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 gap-4 sm:gap-6 landscape:gap-3 w-full max-w-2xl px-2 sm:px-4">
          
          {/* Card Desbravadores - Borda Vermelha com Altura Aumentada */}
          <button 
            onClick={() => onSelectClub(ClubType.PATHFINDER)}
            className="w-full group relative bg-white dark:bg-slate-800 p-5 sm:p-7 landscape:p-4 min-h-[110px] sm:min-h-[135px] md:min-h-[145px] landscape:min-h-[96px] rounded-[28px] sm:rounded-[36px] landscape:rounded-[24px] shadow-[0_10px_30px_rgba(220,55,27,0.06)] border-2 border-[#dc371b]/40 flex items-center justify-center active:scale-[0.98] transition-all overflow-hidden hover:border-[#dc371b] hover:shadow-[0_12px_35px_rgba(220,55,27,0.15)]"
          >
            {/* Logo de fundo transparente */}
            <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.03] grayscale pointer-events-none group-hover:scale-125 transition-transform duration-1000">
              <img 
                src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png" 
                alt=""
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
              />
            </div>

            {/* Brasão Desbravadores à Esquerda */}
            <div className="absolute left-4 sm:left-6 md:left-7 top-1/2 -translate-y-1/2 z-10 flex-shrink-0 transition-transform duration-500 group-hover:scale-110">
              <div className="transform scale-105 sm:scale-120">
                <PathfinderLogo />
              </div>
            </div>

            {/* Textos Perfeitamente Centralizados em relação ao Botão */}
            <div className="flex flex-col items-center justify-center text-center relative z-10 px-16 sm:px-24 w-full">
              <h4 className="text-lg sm:text-2xl md:text-3xl landscape:text-lg font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                Desbravadores
              </h4>
              <div className="bg-[#dc371b]/10 dark:bg-[#dc371b]/20 px-3 py-1 rounded-full border border-[#dc371b]/20 dark:border-[#dc371b]/40 mt-1 sm:mt-2 inline-block">
                <span className="text-[#dc371b] dark:text-orange-400 font-black text-[8px] sm:text-[9.5px] uppercase tracking-wider">
                  de 10 a 15 Anos
                </span>
              </div>
            </div>
          </button>

          {/* Card Aventureiros - Borda Vinho com Altura Aumentada */}
          <button 
            onClick={() => onSelectClub(ClubType.ADVENTURER)}
            className="w-full group relative bg-white dark:bg-slate-800 p-5 sm:p-7 landscape:p-4 min-h-[110px] sm:min-h-[135px] md:min-h-[145px] landscape:min-h-[96px] rounded-[28px] sm:rounded-[36px] landscape:rounded-[24px] shadow-[0_10px_30px_rgba(128,0,0,0.06)] border-2 border-[#800000]/40 flex items-center justify-center active:scale-[0.98] transition-all overflow-hidden hover:border-[#800000] hover:shadow-[0_12px_35px_rgba(128,0,0,0.15)]"
          >
            {/* Logo de fundo transparente */}
            <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.03] grayscale pointer-events-none group-hover:scale-125 transition-transform duration-1000">
              <img 
                src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png" 
                alt=""
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
              />
            </div>

            {/* Textos Perfeitamente Centralizados em relação ao Botão */}
            <div className="flex flex-col items-center justify-center text-center relative z-10 px-16 sm:px-24 w-full">
              <h4 className="text-lg sm:text-2xl md:text-3xl landscape:text-lg font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                Aventureiros
              </h4>
              <div className="bg-[#800000]/10 dark:bg-red-950/40 px-3 py-1 rounded-full border border-[#800000]/20 dark:border-red-500/40 mt-1 sm:mt-2 inline-block">
                <span className="text-[#800000] dark:text-rose-400 font-black text-[8px] sm:text-[9.5px] uppercase tracking-wider">
                  de 6 a 9 Anos
                </span>
              </div>
            </div>

            {/* Brasão Aventureiros à Direita */}
            <div className="absolute right-4 sm:right-6 md:right-7 top-1/2 -translate-y-1/2 z-10 flex-shrink-0 transition-transform duration-500 group-hover:scale-110">
              <div className="transform scale-105 sm:scale-120">
                <AdventurerLogo />
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Espaço inferior de respiro */}
      <div className="pb-4 sm:pb-6 landscape:pb-2 shrink-0"></div>
    </div>
  );
};

export default Home;
