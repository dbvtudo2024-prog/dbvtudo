
import React from 'react';
import { ClubType } from '../types';
import { PathfinderLogo, AdventurerLogo, PROFILE_KEY } from '../constants';
import { Settings, Sparkles, User } from 'lucide-react';

interface HomeProps {
  onSelectClub: (club: ClubType) => void;
  onOpenSettings: () => void;
  onOpenAdvisor: () => void;
  onOpenProfile: () => void;
}

const Home: React.FC<HomeProps> = ({ onSelectClub, onOpenSettings, onOpenAdvisor, onOpenProfile }) => {
  const [userAvatar, setUserAvatar] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadProfile = () => {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setUserAvatar(parsed.avatar || null);
        } catch { }
      }
    };

    loadProfile();
    window.addEventListener('storage', loadProfile);
    return () => window.removeEventListener('storage', loadProfile);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-slide-up bg-[#F8FAFC]">
      {/* Top Actions - Minimalistas */}
      <div className="pt-7 px-8 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <button onClick={onOpenSettings} className="p-2.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white text-slate-400 active:scale-90 transition-all">
            <Settings size={18} />
          </button>
          <button onClick={onOpenAdvisor} className="p-2.5 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white text-amber-500 active:scale-90 transition-all">
            <Sparkles size={18} />
          </button>
        </div>
        
        <button onClick={onOpenProfile} className="w-11 h-11 bg-white rounded-2xl shadow-sm border border-white flex items-center justify-center text-slate-300 overflow-hidden active:scale-90 transition-all">
          {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" /> : <User size={20} />}
        </button>
      </div>

      {/* Hero Branding */}
      <div className="pt-4 pb-6 flex flex-col items-center justify-center">
        <div className="relative animate-float">
          <div className="absolute inset-0 bg-red-500/5 blur-[40px] rounded-full scale-150"></div>
          <div className="relative w-28 h-28 flex items-center justify-center transform hover:scale-105 transition-transform duration-700">
            <img 
              src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
              className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.08)]" 
              alt="DBV Tudo Logo"
            />
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none mb-1">DBV Tudo</h1>
          <div className="flex items-center justify-center space-x-2">
            <span className="h-[1px] w-3 bg-slate-200"></span>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.4em]">Gestão Digital</p>
            <span className="h-[1px] w-3 bg-slate-200"></span>
          </div>
        </div>
      </div>

      {/* Título de Instrução com maior espaçamento superior */}
      <div className="mt-12 mb-4 text-center">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Escolha um ministério</h2>
      </div>

      {/* Seletor de Ministérios */}
      <div className="flex-grow px-8 pb-10 space-y-4 overflow-y-auto scrollbar-hide">
        
        {/* Card Desbravadores - Borda Vermelha */}
        <button 
          onClick={() => onSelectClub(ClubType.PATHFINDER)}
          className="w-full group relative bg-white p-5 rounded-[32px] shadow-[0_10px_30px_rgba(220,55,27,0.05)] border-2 border-[#dc371b]/40 flex items-center justify-center active:scale-[0.98] transition-all overflow-hidden hover:border-[#dc371b] hover:shadow-[0_10px_35px_rgba(220,55,27,0.1)]"
        >
          {/* Logo de fundo transparente */}
          <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 opacity-[0.06] grayscale pointer-events-none group-hover:scale-125 transition-transform duration-1000">
            <img 
              src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png" 
              alt=""
              className="w-32 h-32 object-contain"
            />
          </div>

          <div className="flex items-center space-x-6 relative z-10 w-full max-w-[280px]">
            <div className="flex-shrink-0 transition-transform duration-500 group-hover:scale-110">
              <PathfinderLogo />
            </div>
            <div className="text-left">
              <h4 className="text-xl font-black text-slate-800 leading-tight tracking-tight">Desbravadores</h4>
              <div className="bg-[#dc371b]/5 px-3 py-1 rounded-full border border-[#dc371b]/10 mt-1 inline-block">
                <span className="text-[#dc371b] font-black text-[8px] uppercase tracking-wider">de 10 a 15 Anos</span>
              </div>
            </div>
          </div>
        </button>

        {/* Card Aventureiros - Borda Vinho */}
        <button 
          onClick={() => onSelectClub(ClubType.ADVENTURER)}
          className="w-full group relative bg-white p-5 rounded-[32px] shadow-[0_10px_30px_rgba(128,0,0,0.05)] border-2 border-[#800000]/40 flex items-center justify-center active:scale-[0.98] transition-all overflow-hidden hover:border-[#800000] hover:shadow-[0_10px_35px_rgba(128,0,0,0.1)]"
        >
          {/* Logo de fundo transparente */}
          <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 opacity-[0.06] grayscale pointer-events-none group-hover:scale-125 transition-transform duration-1000">
            <img 
              src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png" 
              alt=""
              className="w-32 h-32 object-contain"
            />
          </div>

          <div className="flex items-center space-x-6 relative z-10 w-full max-w-[280px]">
            <div className="flex-shrink-0 transition-transform duration-500 group-hover:scale-110">
              <AdventurerLogo />
            </div>
            <div className="text-left">
              <h4 className="text-xl font-black text-slate-800 leading-tight tracking-tight">Aventureiros</h4>
              <div className="bg-[#800000]/5 px-3 py-1 rounded-full border border-[#800000]/10 mt-1 inline-block">
                <span className="text-[#800000] font-black text-[8px] uppercase tracking-wider">de 6 a 9 Anos</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Footer Info */}
      <div className="pb-8 text-center px-12">
        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-[0.4em] leading-relaxed">
          DBV Tudo 2024 - 2026
        </p>
      </div>
    </div>
  );
};

export default Home;
