
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
    <div className="flex flex-col h-full overflow-y-auto scrollbar-hide animate-slide-up bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-500 justify-between">
      {/* Top Actions - Minimalistas */}
      <div className="pt-3 sm:pt-6 landscape:pt-2 px-5 sm:px-8 landscape:px-6 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <button onClick={onOpenSettings} className="p-2.5 landscape:p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-white dark:border-slate-700 text-slate-400 dark:text-slate-300 active:scale-90 transition-all">
            <Settings size={18} />
          </button>
        </div>
        
        <button onClick={onOpenProfile} className="w-10 h-10 sm:w-11 sm:h-11 landscape:w-9 landscape:h-9 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-white dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 overflow-hidden active:scale-90 transition-all">
          {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <User size={20} />}
        </button>
      </div>

      {/* Conteúdo Central Auto-ajustável */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 landscape:px-4 max-w-4xl mx-auto w-full py-1 -mt-2 sm:-mt-6">
        {/* Hero Branding */}
        <div className="flex flex-col items-center justify-center shrink-0 mb-1 sm:mb-2">
          <div className="relative animate-float">
            <div className="relative w-20 h-20 sm:w-28 sm:h-28 landscape:w-16 landscape:h-16 flex items-center justify-center transform hover:scale-105 transition-transform duration-700">
              <img 
                src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
                className="w-full h-full object-contain drop-shadow-md" 
                alt="DBV Tudo Logo"
              />
            </div>
          </div>
          
          <div className="mt-2 text-center">
            <h1 className="text-xl sm:text-3xl landscape:text-xl font-black text-slate-800 dark:text-white tracking-tighter leading-none mb-1">DBV Tudo</h1>
            <div className="flex items-center justify-center space-x-2">
              <span className="h-[1px] w-3 bg-slate-200 dark:bg-slate-700"></span>
              <p className="text-[7.5px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.4em]">Gestão Digital</p>
              <span className="h-[1px] w-3 bg-slate-200 dark:bg-slate-700"></span>
            </div>
            
            <div className="mt-2 sm:mt-3">
              <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/25 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 font-bold text-[10px] sm:text-xs tracking-wide">
                Esse não é um app oficial da IASD
              </span>
            </div>
          </div>
        </div>

        {/* Título de Instrução com mais espaçamento generoso */}
        <div className="mt-7 sm:mt-12 mb-3 sm:mb-5 landscape:mt-3 landscape:mb-2 text-center shrink-0">
          <h2 className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-[0.25em]">Escolha um ministério</h2>
        </div>

        {/* Seletor de Ministérios (Grid 2 colunas no PC / landscape, 1 coluna no mobile portrait) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 landscape:grid-cols-2 gap-2.5 sm:gap-5 landscape:gap-3 w-full max-w-2xl px-2 sm:px-4">
          
          {/* Card Desbravadores - Borda Vermelha (Logo na Esquerda, Escritas Perfeitamente Centralizadas no Botão) */}
          <button 
            onClick={() => onSelectClub(ClubType.PATHFINDER)}
            className="w-full group relative bg-white dark:bg-slate-800 p-3.5 sm:p-5 landscape:p-3 min-h-[82px] sm:min-h-[92px] rounded-[24px] sm:rounded-[32px] landscape:rounded-[22px] shadow-[0_10px_30px_rgba(220,55,27,0.05)] border-2 border-[#dc371b]/40 flex items-center justify-center active:scale-[0.98] transition-all overflow-hidden hover:border-[#dc371b] hover:shadow-[0_10px_35px_rgba(220,55,27,0.1)]"
          >
            {/* Logo de fundo transparente */}
            <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.03] grayscale pointer-events-none group-hover:scale-125 transition-transform duration-1000">
              <img 
                src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png" 
                alt=""
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              />
            </div>

            {/* Brasão Desbravadores à Esquerda */}
            <div className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 z-10 flex-shrink-0 transition-transform duration-500 group-hover:scale-110">
              <PathfinderLogo />
            </div>

            {/* Textos Perfeitamente Centralizados em relação ao Botão */}
            <div className="flex flex-col items-center justify-center text-center relative z-10 px-16 sm:px-20 w-full">
              <h4 className="text-base sm:text-xl landscape:text-base font-black text-slate-800 dark:text-white leading-tight tracking-tight">Desbravadores</h4>
              <div className="bg-[#dc371b]/5 dark:bg-[#dc371b]/20 px-2 py-0.5 rounded-full border border-[#dc371b]/10 dark:border-[#dc371b]/30 mt-0.5 sm:mt-1 inline-block">
                <span className="text-[#dc371b] dark:text-orange-400 font-black text-[7.5px] sm:text-[8px] uppercase tracking-wider">de 10 a 15 Anos</span>
              </div>
            </div>
          </button>

          {/* Card Aventureiros - Borda Vinho (Escritas Perfeitamente Centralizadas no Botão, Logo na Direita) */}
          <button 
            onClick={() => onSelectClub(ClubType.ADVENTURER)}
            className="w-full group relative bg-white dark:bg-slate-800 p-3.5 sm:p-5 landscape:p-3 min-h-[82px] sm:min-h-[92px] rounded-[24px] sm:rounded-[32px] landscape:rounded-[22px] shadow-[0_10px_30px_rgba(128,0,0,0.05)] border-2 border-[#800000]/40 flex items-center justify-center active:scale-[0.98] transition-all overflow-hidden hover:border-[#800000] hover:shadow-[0_10px_35px_rgba(128,0,0,0.1)]"
          >
            {/* Logo de fundo transparente */}
            <div className="absolute left-[-15px] top-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.03] grayscale pointer-events-none group-hover:scale-125 transition-transform duration-1000">
              <img 
                src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png" 
                alt=""
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              />
            </div>

            {/* Textos Perfeitamente Centralizados em relação ao Botão */}
            <div className="flex flex-col items-center justify-center text-center relative z-10 px-16 sm:px-20 w-full">
              <h4 className="text-base sm:text-xl landscape:text-base font-black text-slate-800 dark:text-white leading-tight tracking-tight">Aventureiros</h4>
              <div className="bg-[#800000]/5 dark:bg-red-950/40 px-2 py-0.5 rounded-full border border-[#800000]/10 dark:border-red-500/30 mt-0.5 sm:mt-1 inline-block">
                <span className="text-[#800000] dark:text-rose-400 font-black text-[7.5px] sm:text-[8px] uppercase tracking-wider">de 6 a 9 Anos</span>
              </div>
            </div>

            {/* Brasão Aventureiros à Direita */}
            <div className="absolute right-3.5 sm:right-5 top-1/2 -translate-y-1/2 z-10 flex-shrink-0 transition-transform duration-500 group-hover:scale-110">
              <AdventurerLogo />
            </div>
          </button>
        </div>
      </div>

      {/* Espaço inferior de respiro */}
      <div className="pb-2 sm:pb-4 landscape:pb-1 shrink-0"></div>
    </div>
  );
};

export default Home;
