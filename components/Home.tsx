
import React from 'react';
import { ClubType } from '../types';
import { PathfinderLogo, AdventurerLogo, PROFILE_KEY } from '../constants';
import { Settings, Sparkles, User } from 'lucide-react';
import { APP_VERSION } from '../versionConfig';

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
    <div className="flex h-full w-full overflow-hidden bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-500">
      {/* Menu Lateral exclusivo para PC (desktop/notebook): apenas foto de perfil no topo e ajustes + versão e ano embaixo */}
      <aside className="hidden md:flex flex-col justify-between items-center w-20 lg:w-22 py-6 px-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-slate-200/70 dark:border-slate-800/80 shrink-0 z-30 select-none">
        {/* Topo do Menu Lateral: Apenas a Foto de Perfil */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <button
              onClick={onOpenProfile}
              title="Meu Perfil"
              aria-label="Meu Perfil"
              className="w-12 h-12 lg:w-13 lg:h-13 rounded-full overflow-hidden ring-2 ring-indigo-500/20 hover:ring-indigo-500/70 shadow-sm flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400 active:scale-95 transition-all group"
            >
              {userAvatar ? (
                <img src={userAvatar} className="w-full h-full object-cover" alt="Perfil" />
              ) : (
                <User size={22} className="text-slate-400 dark:text-slate-300" />
              )}
            </button>
            <div 
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 pointer-events-none z-10 shadow-xs" 
              title="Conectado"
            />
          </div>
        </div>

        {/* Rodapé do Menu Lateral: Ajustes em baixo + Versão do App e Ano */}
        <div className="flex flex-col items-center w-full pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
          <button
            onClick={onOpenSettings}
            title="Ajustes"
            aria-label="Ajustes"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95 group shadow-xs"
          >
            <Settings size={18} className="group-hover:rotate-45 transition-transform duration-300" />
          </button>

          <div className="flex flex-col items-center text-center mt-3 select-none text-slate-400 dark:text-slate-500 leading-tight">
            <span className="text-[10px] font-black tracking-wider text-slate-500 dark:text-slate-400">
              v{APP_VERSION}
            </span>
            <span className="text-[8px] font-extrabold uppercase tracking-wider mt-0.5">
              2024 - 2026
            </span>
          </div>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <div className="flex flex-col flex-1 h-full overflow-y-auto scrollbar-hide min-w-0">
        {/* Top Header Móvel (visível apenas em telas menores / mobile) */}
        <header className="md:hidden sticky top-0 z-20 w-full bg-[#F8FAFC]/95 dark:bg-slate-900/95 backdrop-blur-md py-3 px-4 shrink-0 transition-colors border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="w-full flex justify-between items-center">
            <button 
              onClick={onOpenSettings} 
              title="Configurações"
              aria-label="Configurações"
              className="p-2.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white active:scale-90 transition-all shrink-0"
            >
              <Settings size={20} />
            </button>

            <button 
              onClick={onOpenProfile} 
              title="Perfil"
              aria-label="Perfil"
              className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white overflow-hidden active:scale-90 transition-all shrink-0"
            >
              {userAvatar ? <img src={userAvatar} className="w-full h-full object-cover" alt="Perfil" /> : <User size={20} />}
            </button>
          </div>
        </header>

        {/* Conteúdo Central no Corpo: Layout balanceado e centralizado */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-6xl mx-auto w-full">
          <div className="w-full flex flex-col md:flex-row items-center justify-center md:justify-around gap-8 md:gap-12 lg:gap-16">
            
            {/* Lado Esquerdo no PC: Logo e Escritas perfeitamente centralizadas */}
            <div className="flex flex-col items-center justify-center text-center shrink-0 md:w-[380px] lg:w-[420px]">
              <div className="relative animate-float">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 flex items-center justify-center transform hover:scale-105 transition-transform duration-700">
                  <img 
                    src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG" 
                    className="w-full h-full object-contain drop-shadow-2xl" 
                    alt="DBV Tudo Logo"
                  />
                </div>
              </div>
              
              <div className="mt-4 sm:mt-5 text-center flex flex-col items-center justify-center">
                <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-2">
                  DBV Tudo
                </h1>
                <div className="flex items-center justify-center space-x-2">
                  <span className="h-[1px] w-4 bg-slate-300 dark:bg-slate-700"></span>
                  <p className="text-[9px] sm:text-[11px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-[0.4em]">
                    Gestão Digital
                  </p>
                  <span className="h-[1px] w-4 bg-slate-300 dark:bg-slate-700"></span>
                </div>
                
                <div className="mt-3 sm:mt-4">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-amber-500/10 dark:bg-amber-400/15 border border-amber-500/25 dark:border-amber-400/30 text-amber-700 dark:text-amber-300 font-bold text-[10px] sm:text-xs tracking-wide">
                    Esse não é um app oficial da IASD
                  </span>
                </div>
              </div>
            </div>

            {/* Lado Direito no PC: Escolha um Ministério e Botões Um Sobre o Outro centralizados */}
            <div className="w-full md:w-[380px] lg:w-[440px] shrink-0 flex flex-col items-center justify-center">
              {/* Título de Instrução Centralizado */}
              <div className="mb-4 sm:mb-5 text-center w-full">
                <h2 className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.25em]">
                  Escolha um ministério
                </h2>
              </div>

              {/* Botões Um Sobre o Outro (com simetria e alinhamento idênticos entre si) */}
              <div className="flex flex-col gap-4 sm:gap-5 w-full items-center">
                {/* Card Desbravadores - Borda Vermelha */}
                <button 
                  onClick={() => onSelectClub(ClubType.PATHFINDER)}
                  className="w-full group relative bg-white dark:bg-slate-800 p-5 sm:p-6 min-h-[110px] sm:min-h-[125px] rounded-[28px] sm:rounded-[32px] shadow-[0_10px_30px_rgba(220,55,27,0.06)] border-2 border-[#dc371b]/40 flex items-center justify-center active:scale-[0.98] transition-all overflow-hidden hover:border-[#dc371b] hover:shadow-[0_12px_35px_rgba(220,55,27,0.15)]"
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

                  {/* Textos Centralizados em relação ao Botão */}
                  <div className="flex flex-col items-center justify-center text-center relative z-10 px-16 sm:px-20 w-full">
                    <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                      Desbravadores
                    </h4>
                    <div className="bg-[#dc371b]/10 dark:bg-[#dc371b]/20 px-3 py-1 rounded-full border border-[#dc371b]/20 dark:border-[#dc371b]/40 mt-1.5 inline-block">
                      <span className="text-[#dc371b] dark:text-orange-400 font-black text-[8.5px] sm:text-[10px] uppercase tracking-wider">
                        de 10 a 15 Anos
                      </span>
                    </div>
                  </div>
                </button>

                {/* Card Aventureiros - Borda Vinho */}
                <button 
                  onClick={() => onSelectClub(ClubType.ADVENTURER)}
                  className="w-full group relative bg-white dark:bg-slate-800 p-5 sm:p-6 min-h-[110px] sm:min-h-[125px] rounded-[28px] sm:rounded-[32px] shadow-[0_10px_30px_rgba(128,0,0,0.06)] border-2 border-[#800000]/40 flex items-center justify-center active:scale-[0.98] transition-all overflow-hidden hover:border-[#800000] hover:shadow-[0_12px_35px_rgba(128,0,0,0.15)]"
                >
                  {/* Logo de fundo transparente */}
                  <div className="absolute right-[-15px] top-1/2 -translate-y-1/2 opacity-[0.06] dark:opacity-[0.03] grayscale pointer-events-none group-hover:scale-125 transition-transform duration-1000">
                    <img 
                      src="https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png" 
                      alt=""
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
                    />
                  </div>

                  {/* Brasão Aventureiros à Esquerda (perfeitamente alinhado e simétrico com o de Desbravadores) */}
                  <div className="absolute left-4 sm:left-6 md:left-7 top-1/2 -translate-y-1/2 z-10 flex-shrink-0 transition-transform duration-500 group-hover:scale-110">
                    <div className="transform scale-105 sm:scale-120">
                      <AdventurerLogo />
                    </div>
                  </div>

                  {/* Textos Centralizados em relação ao Botão */}
                  <div className="flex flex-col items-center justify-center text-center relative z-10 px-16 sm:px-20 w-full">
                    <h4 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                      Aventureiros
                    </h4>
                    <div className="bg-[#800000]/10 dark:bg-red-950/40 px-3 py-1 rounded-full border border-[#800000]/20 dark:border-red-500/40 mt-1.5 inline-block">
                      <span className="text-[#800000] dark:text-rose-400 font-black text-[8.5px] sm:text-[10px] uppercase tracking-wider">
                        de 6 a 9 Anos
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* Espaço inferior de respiro */}
        <div className="pb-4 sm:pb-6 shrink-0"></div>
      </div>
    </div>
  );
};

export default Home;
