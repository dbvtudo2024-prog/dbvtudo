
import React, { useState, useEffect } from 'react';
import { ViewState, ClubType } from './types';
import Home from './components/Home';
import ClubManagement, { SubViewType } from './components/ClubManagement';
import LiveSpecialtyExam from './components/LiveSpecialtyExam';
import Auth from './components/Auth';
import Profile from './components/Profile';
import UpdateNotification from './components/UpdateNotification';
import { Settings, X, ChevronLeft, ChevronRight, Search, Moon, Sun, Bell, BellOff, LogOut, LogIn, Sparkles, History, CheckCircle2, RefreshCw, Layers, PanelLeft, Palette, Check } from 'lucide-react';
import { APP_VERSION, APP_BUILD_DATE, VERSION_HISTORY } from './versionConfig';

import { PROFILE_KEY } from './constants';
import { supabase, checkSupabaseHealth, getSupabaseStatus } from './services/supabaseService';
import { initUserCloudSync, syncUserCloudDataNow } from './services/userCloudSync';
import { AlertTriangle, ExternalLink } from 'lucide-react';

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
  @keyframes logoWobble {
    0% {
      transform: scale(1) rotate(0deg);
      filter: drop-shadow(0 0 0px rgba(var(--app-accent-rgb, 220, 160, 72), 0));
    }
    15% {
      transform: scale(0.93) rotate(-8deg);
      filter: drop-shadow(0 0 18px rgba(var(--app-accent-rgb, 220, 160, 72), 0.75));
    }
    32% {
      transform: scale(1.08) rotate(7deg);
      filter: drop-shadow(0 0 28px rgba(var(--app-accent-rgb, 220, 160, 72), 0.95));
    }
    48% {
      transform: scale(1.05) rotate(-5deg);
      filter: drop-shadow(0 0 22px rgba(var(--app-accent-rgb, 220, 160, 72), 0.8));
    }
    64% {
      transform: scale(1.03) rotate(3.5deg);
      filter: drop-shadow(0 0 14px rgba(var(--app-accent-rgb, 220, 160, 72), 0.55));
    }
    80% {
      transform: scale(1.01) rotate(-1.5deg);
      filter: drop-shadow(0 0 6px rgba(var(--app-accent-rgb, 220, 160, 72), 0.3));
    }
    100% {
      transform: scale(1) rotate(0deg);
      filter: drop-shadow(0 0 0px rgba(var(--app-accent-rgb, 220, 160, 72), 0));
    }
  }
  .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-slide-in { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-float { animation: float 5s ease-in-out infinite; }
  .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
  .animate-scale-up { animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-logo-wobble {
    animation: logoWobble 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    transform-origin: center center;
  }
  .app-logo-click-glow {
    background: radial-gradient(
      circle,
      rgba(var(--app-accent-rgb, 220, 160, 72), 0.55) 0%,
      rgba(var(--app-accent-rgb, 220, 160, 72), 0.28) 45%,
      transparent 75%
    );
  }
  html.dark .app-logo-click-glow {
    background: radial-gradient(
      circle,
      rgba(var(--app-accent-rgb, 220, 160, 72), 0.72) 0%,
      rgba(var(--app-accent-rgb, 220, 160, 72), 0.35) 45%,
      transparent 75%
    );
  }

  /* Efeito de fio de luz reto passando por cima de toda a logo (recortado no formato exato da logo) */
  @keyframes logoLightThreadSweep {
    0% {
      transform: translateX(-125%) skewX(-22deg);
      opacity: 0;
    }
    6% {
      opacity: 1;
    }
    38% {
      transform: translateX(125%) skewX(-22deg);
      opacity: 1;
    }
    43%, 100% {
      transform: translateX(125%) skewX(-22deg);
      opacity: 0;
    }
  }

  @keyframes logoLightThreadSweepSm {
    0% {
      transform: translateX(-95%) skewX(-20deg);
      opacity: 0;
    }
    8% {
      opacity: 1;
    }
    52% {
      transform: translateX(95%) skewX(-20deg);
      opacity: 1;
    }
    58%, 100% {
      transform: translateX(95%) skewX(-20deg);
      opacity: 0;
    }
  }

  @keyframes floatLogoSm {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-2.5px);
    }
  }

  .animate-float-sm {
    animation: floatLogoSm 4.2s ease-in-out infinite;
  }

  .app-logo-sheen-mask {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 10;
    -webkit-mask-image: url("https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG");
    mask-image: url("https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG");
    -webkit-mask-size: contain;
    mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
  }

  .app-logo-sheen-mask::after {
    content: "";
    position: absolute;
    top: -20%;
    bottom: -20%;
    left: 0;
    width: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      transparent calc(50% - 14px),
      rgba(253, 224, 71, 0.16) calc(50% - 8px),
      rgba(254, 240, 138, 0.52) calc(50% - 2.5px),
      rgba(255, 255, 255, 0.90) 50%,
      rgba(254, 240, 138, 0.52) calc(50% + 2.5px),
      rgba(253, 224, 71, 0.16) calc(50% + 8px),
      transparent calc(50% + 14px),
      transparent 100%
    );
    animation: logoLightThreadSweep 4.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    will-change: transform, opacity;
  }

  /* Versão calibrada para logos menores (cabeçalho de celular e barra lateral) */
  .app-logo-sheen-mask-sm::after {
    background: linear-gradient(
      90deg,
      transparent 0%,
      transparent calc(50% - 10px),
      rgba(253, 224, 71, 0.28) calc(50% - 6px),
      rgba(254, 240, 138, 0.78) calc(50% - 2px),
      rgba(255, 255, 255, 0.98) 50%,
      rgba(254, 240, 138, 0.78) calc(50% + 2px),
      rgba(253, 224, 71, 0.28) calc(50% + 6px),
      transparent calc(50% + 10px),
      transparent 100%
    );
    animation: logoLightThreadSweepSm 3.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  
  .glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

  .bg-mesh {
    background-color: transparent;
  }

  /* Fundo radial centralizado dissipando até as bordas + quadriculado de fios bem suave */
  .app-radial-canvas {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    transition: background 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    background-color: #f8fafc;
    background-image:
      radial-gradient(
        circle at 50% 50%,
        rgba(var(--app-accent-rgb, 220, 160, 72), 0.30) 0%,
        rgba(var(--app-accent-rgb, 220, 160, 72), 0.16) 28%,
        rgba(var(--app-accent-rgb, 220, 160, 72), 0.06) 56%,
        rgba(248, 250, 252, 0.96) 84%,
        #f8fafc 100%
      );
  }

  html.dark .app-radial-canvas {
    background-color: #07090e;
    background-image:
      radial-gradient(
        circle at 50% 50%,
        rgba(var(--app-accent-rgb, 220, 160, 72), 0.38) 0%,
        rgba(var(--app-accent-rgb, 220, 160, 72), 0.21) 26%,
        rgba(var(--app-accent-rgb, 220, 160, 72), 0.08) 54%,
        rgba(8, 10, 15, 0.95) 82%,
        #06080d 100%
      );
  }

  .app-wireframe-grid {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
      linear-gradient(to right, rgba(var(--app-accent-rgb, 220, 160, 72), 0.18) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(var(--app-accent-rgb, 220, 160, 72), 0.18) 1px, transparent 1px),
      linear-gradient(to right, rgba(15, 23, 42, 0.045) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.045) 1px, transparent 1px);
    background-size: 32px 32px;
    background-position: center center;
    -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.55) 58%, rgba(0, 0, 0, 0.14) 95%);
    mask-image: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.92) 0%, rgba(0, 0, 0, 0.55) 58%, rgba(0, 0, 0, 0.14) 95%);
    transition: all 0.5s ease;
  }

  html.dark .app-wireframe-grid {
    background-image:
      linear-gradient(to right, rgba(var(--app-accent-rgb, 220, 160, 72), 0.075) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(var(--app-accent-rgb, 220, 160, 72), 0.075) 1px, transparent 1px);
    -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.42) 55%, rgba(0, 0, 0, 0.06) 95%);
    mask-image: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.42) 55%, rgba(0, 0, 0, 0.06) 95%);
  }

  /* Textos em destaque de todo o app assumem a Cor de Realce selecionada (preservando faixa e bolso no perfil) */
  html[data-accent] .app-accent-text:not(.no-accent-override, .no-accent-override *),
  html[data-accent] .text-indigo-600:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-indigo-500:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-indigo-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-blue-600:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-blue-500:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-blue-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-amber-600:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-amber-500:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-amber-700:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-red-500:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-red-600:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-fuchsia-600:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-fuchsia-700:not(.text-white, .no-accent-override, .no-accent-override *),
  html[data-accent] .text-emerald-600:not(.text-white, .no-accent-override, .no-accent-override *) {
    color: var(--app-accent-text) !important;
  }

  html.dark[data-accent] .dark\\:text-indigo-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-indigo-300:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-blue-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-blue-300:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-amber-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-amber-300:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-red-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-orange-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-rose-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-fuchsia-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-fuchsia-300:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-emerald-400:not(.text-white, .no-accent-override, .no-accent-override *),
  html.dark[data-accent] .dark\\:text-emerald-300:not(.text-white, .no-accent-override, .no-accent-override *) {
    color: var(--app-accent-text) !important;
  }

  /* Translucidez sutil nos cards no modo escuro para deixar o brilho central e o quadriculado visíveis em todo o app */
  html.dark[data-accent] .dark\\:bg-slate-800:not(.no-accent-override, .no-accent-override *) {
    background-color: rgba(20, 26, 38, 0.76) !important;
    border-color: rgba(var(--app-accent-rgb, 220, 160, 72), 0.16) !important;
  }

  /* Luz sutil girando em volta dos botões (alternando momentos rápidos e devagar) */
  @keyframes ministryOrbitVarSpeed {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    10% {
      transform: translate(-50%, -50%) rotate(65deg);
    }
    23% {
      transform: translate(-50%, -50%) rotate(415deg);
    }
    33.33% {
      transform: translate(-50%, -50%) rotate(480deg);
    }
    43.33% {
      transform: translate(-50%, -50%) rotate(545deg);
    }
    56.33% {
      transform: translate(-50%, -50%) rotate(895deg);
    }
    66.67% {
      transform: translate(-50%, -50%) rotate(960deg);
    }
    76.67% {
      transform: translate(-50%, -50%) rotate(1025deg);
    }
    89.67% {
      transform: translate(-50%, -50%) rotate(1375deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(1440deg);
    }
  }

  .ministry-orbit-ring {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    pointer-events: none;
    z-index: 20;
    overflow: hidden;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  .ministry-orbit-spinner {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 240%;
    aspect-ratio: 1 / 1;
    animation: ministryOrbitVarSpeed 13s cubic-bezier(0.42, 0, 0.58, 1) infinite;
    will-change: transform;
  }

  .ministry-orbit-spinner.orbit-delay-1 {
    animation-duration: 14.5s;
    animation-delay: -4.2s;
  }

  .ministry-orbit-spinner.orbit-delay-2 {
    animation-duration: 15.8s;
    animation-delay: -8.7s;
  }

  /* Desbravadores: Vermelho oficial (#dc371b) com ponta Dourada sutil */
  .ministry-orbit-dbv {
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 255deg,
      rgba(220, 55, 27, 0.16) 278deg,
      rgba(220, 55, 27, 0.62) 308deg,
      rgba(245, 158, 11, 0.85) 328deg,
      rgba(253, 224, 71, 0.92) 338deg,
      rgba(220, 55, 27, 0.65) 350deg,
      transparent 360deg
    );
  }

  /* Aventureiros: Vinho oficial (#800000 / #9f1239) com ponta Dourada sutil */
  .ministry-orbit-avt {
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 255deg,
      rgba(128, 0, 0, 0.20) 278deg,
      rgba(159, 18, 57, 0.68) 308deg,
      rgba(245, 158, 11, 0.85) 328deg,
      rgba(253, 224, 71, 0.92) 338deg,
      rgba(128, 0, 0, 0.70) 350deg,
      transparent 360deg
    );
  }

  /* Menu Lateral Ativo (sobre fundo preenchido #dc371b ou #800000): feixe Dourado + Branco luminoso */
  .ministry-orbit-dbv-active {
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 245deg,
      rgba(251, 146, 60, 0.25) 272deg,
      rgba(245, 158, 11, 0.78) 305deg,
      rgba(253, 224, 71, 0.96) 328deg,
      rgba(255, 255, 255, 0.98) 338deg,
      rgba(251, 191, 36, 0.75) 350deg,
      transparent 360deg
    );
  }

  .ministry-orbit-avt-active {
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 245deg,
      rgba(244, 63, 94, 0.28) 272deg,
      rgba(245, 158, 11, 0.80) 305deg,
      rgba(253, 224, 71, 0.96) 328deg,
      rgba(255, 255, 255, 0.98) 338deg,
      rgba(251, 191, 36, 0.75) 350deg,
      transparent 360deg
    );
  }
`;

export type AccentColorId = 'gold' | 'coral' | 'teal' | 'green';

export interface AccentColorOption {
  id: AccentColorId;
  label: string;
  hex: string;
  rgb: string;
  textDark: string;
  textLight: string;
}

export const ACCENT_COLOR_OPTIONS: AccentColorOption[] = [
  {
    id: 'gold',
    label: 'Âmbar Dourado',
    hex: '#dca048',
    rgb: '220, 160, 72',
    textDark: '#f5b95f',
    textLight: '#b45309'
  },
  {
    id: 'coral',
    label: 'Coral Terracota',
    hex: '#dc8253',
    rgb: '220, 130, 83',
    textDark: '#fb923c',
    textLight: '#c2410c'
  },
  {
    id: 'teal',
    label: 'Turquesa Real',
    hex: '#49b3a8',
    rgb: '73, 179, 168',
    textDark: '#2dd4bf',
    textLight: '#0f766e'
  },
  {
    id: 'green',
    label: 'Verde Sálvia',
    hex: '#6bb07b',
    rgb: '107, 176, 123',
    textDark: '#4ade80',
    textLight: '#15803d'
  }
];

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
  const [isolatedExamPin, setIsolatedExamPin] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const pin = params.get('prova');
      if (pin && pin.trim().length > 0) {
        return pin.trim();
      }
    } catch {}
    return null;
  });
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      if (localStorage.getItem('dbv_is_guest') === 'true') return true;
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed && ((parsed.email && parsed.email !== 'email@exemplo.com') || parsed.name)) {
          return false;
        }
      }
    } catch {}
    return false;
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [versionSearchQuery, setVersionSearchQuery] = useState<string>('');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateCheckMessage, setUpdateCheckMessage] = useState<string | null>(null);

  const isUserLoggedIn = React.useMemo(() => {
    if (isGuest) return false;
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        return Boolean((parsed?.email && parsed.email !== 'email@exemplo.com') || parsed?.name);
      }
    } catch {}
    return false;
  }, [isGuest, currentView, isSettingsModalOpen]);

  const handleOpenVersionHistory = () => {
    setIsSettingsModalOpen(false);
    setShowVersionHistory(false);
    if (!selectedClub) {
      setSelectedClub(ClubType.PATHFINDER);
    }
    setPendingSubView('VERSION_HISTORY');
    setActiveSubView('VERSION_HISTORY');
    setCurrentView('CLUB_LIST');
  };

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

  // Inicializa sincronização em nuvem multi-dispositivo (Celular <-> PC)
  useEffect(() => {
    initUserCloudSync();
    syncUserCloudDataNow().catch(() => {});

    const handleCloudAppliedApp = () => {
      try {
        const savedTheme = localStorage.getItem('dbv_tudo_theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setDarkMode(savedTheme === 'dark');
        }
        const savedAccent = localStorage.getItem('dbv_tudo_accent_color') as AccentColorId | null;
        if (savedAccent && ACCENT_COLOR_OPTIONS.some((o) => o.id === savedAccent)) {
          setAccentColor(savedAccent);
        }
      } catch {}
    };
    window.addEventListener('dbv_cloud_sync_applied', handleCloudAppliedApp);
    return () => {
      window.removeEventListener('dbv_cloud_sync_applied', handleCloudAppliedApp);
    };
  }, []);

  // Verificar se há sessão ativa no Supabase e perfil salvo
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (session?.user && savedProfile && !isGuest) {
        setCurrentView(prev => (prev === 'LOGIN' || prev === 'SIGNUP') ? 'HOME' : prev);
      }
      syncUserCloudDataNow().catch(() => {});
    }).catch(() => {});
  }, [isGuest]);

  // Detecção de restrição de cota do Supabase (HTTP 402 / exceed_cached_egress_quota)
  const [supabaseRestrictedInfo, setSupabaseRestrictedInfo] = useState<{ isRestricted: boolean; message: string } | null>(() => {
    const status = getSupabaseStatus();
    return status.isRestricted ? status : null;
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  useEffect(() => {
    checkSupabaseHealth().then(res => {
      if (!res.ok && (res.message?.includes('exceed_cached_egress_quota') || res.message?.includes('restricted') || res.message?.includes('spend caps'))) {
        setSupabaseRestrictedInfo({ isRestricted: true, message: res.message });
      }
    });

    const handleRestricted = (e: any) => {
      setSupabaseRestrictedInfo({
        isRestricted: true,
        message: e.detail?.message || 'Cota de transferência de dados excedida no Supabase.'
      });
    };

    window.addEventListener('supabase_restricted', handleRestricted as EventListener);
    return () => {
      window.removeEventListener('supabase_restricted', handleRestricted as EventListener);
    };
  }, []);

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

  // Cor de Realce (muda fundo radial do centro para as bordas + quadriculado suave + textos em destaque)
  const [accentColor, setAccentColor] = useState<AccentColorId>(() => {
    try {
      const saved = localStorage.getItem('dbv_tudo_accent_color') as AccentColorId | null;
      if (saved && ACCENT_COLOR_OPTIONS.some((o) => o.id === saved)) {
        return saved;
      }
    } catch {}
    return 'gold';
  });

  const activeAccentOption = React.useMemo(
    () => ACCENT_COLOR_OPTIONS.find((o) => o.id === accentColor) || ACCENT_COLOR_OPTIONS[0],
    [accentColor]
  );

  const handleSelectAccentColor = (id: AccentColorId) => {
    setAccentColor(id);
    try {
      localStorage.setItem('dbv_tudo_accent_color', id);
      window.dispatchEvent(new CustomEvent('dbv_accent_color_changed', { detail: id }));
    } catch {}
  };

  useEffect(() => {
    const onAccentEvent = (e: any) => {
      const nextId = e?.detail as AccentColorId;
      if (nextId && ACCENT_COLOR_OPTIONS.some((o) => o.id === nextId)) {
        setAccentColor(nextId);
      }
    };
    window.addEventListener('dbv_accent_color_changed', onAccentEvent as EventListener);
    return () => window.removeEventListener('dbv_accent_color_changed', onAccentEvent as EventListener);
  }, []);

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

  const [pinSidebar, setPinSidebar] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dbv_pin_sidebar') === 'true';
    } catch {
      return false;
    }
  });

  const handleTogglePinSidebar = () => {
    const next = !pinSidebar;
    setPinSidebar(next);
    try {
      localStorage.setItem('dbv_pin_sidebar', String(next));
    } catch (e) {}
  };

  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>(undefined);
  const [pendingSubView, setPendingSubView] = useState<SubViewType | undefined>(undefined);

  // Limpar qualquer estado salvo legado ao inicializar
  useEffect(() => {
    try {
      localStorage.removeItem('dbv_tudo_app_state');
    } catch (e) {}
  }, []);

  // Sincronizar classe dark para Tailwind e variáveis de Cor de Realce
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
    document.documentElement.setAttribute('data-accent', activeAccentOption.id);
    document.documentElement.style.setProperty('--app-accent', activeAccentOption.hex);
    document.documentElement.style.setProperty('--app-accent-rgb', activeAccentOption.rgb);
    document.documentElement.style.setProperty(
      '--app-accent-text',
      darkMode ? activeAccentOption.textDark : activeAccentOption.textLight
    );
  }, [darkMode, activeAccentOption]);

  const lastBackTimestampRef = React.useRef<number>(0);

  // Função centralizada para voltar páginas/modais (usada pelo botão lateral do mouse e pelo botão Voltar do sistema)
  const triggerAppBackNavigation = React.useCallback((): boolean => {
    if (isSupabaseModalOpen) {
      setIsSupabaseModalOpen(false);
      return true;
    }
    if (showVersionHistory) {
      setShowVersionHistory(false);
      return true;
    }
    if (isSettingsModalOpen) {
      setIsSettingsModalOpen(false);
      return true;
    }

    // Dispara evento cancelável para que componentes filhos (ClubManagement, Profile, LiveSpecialtyExam, etc.) tratem sub-páginas ou modais internos primeiro
    const backEvent = new CustomEvent('dbv_app_back_request', { cancelable: true });
    const notHandledByChild = window.dispatchEvent(backEvent);
    if (!notHandledByChild) {
      return true;
    }

    if (isolatedExamPin !== null) {
      return false;
    }

    if (currentView === 'SIGNUP') {
      setCurrentView('LOGIN');
      return true;
    }

    if (currentView === 'PROFILE') {
      setCurrentView(selectedClub ? 'CLUB_LIST' : 'HOME');
      return true;
    }

    if (currentView === 'CLUB_LIST') {
      if (activeSubView) {
        setActiveSubView(undefined);
      } else {
        setCurrentView('HOME');
      }
      return true;
    }

    if (currentView === 'LOGIN') {
      try {
        if (localStorage.getItem('dbv_is_guest') === 'true') {
          setIsGuest(true);
          setCurrentView('HOME');
          return true;
        }
      } catch {}
    }

    return false;
  }, [
    isSupabaseModalOpen,
    showVersionHistory,
    isSettingsModalOpen,
    isolatedExamPin,
    currentView,
    selectedClub,
    activeSubView
  ]);

  // Suporte ao botão lateral do mouse ("Voltar" - Mouse Button 4 / event.button === 3) e tecla BrowserBack
  useEffect(() => {
    const handleMouseSideButtonDown = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
      }
    };

    const handleMouseSideButtonUp = (e: MouseEvent) => {
      if (e.button === 3) {
        e.preventDefault();
        e.stopPropagation();
        const now = Date.now();
        if (now - lastBackTimestampRef.current > 280) {
          lastBackTimestampRef.current = now;
          triggerAppBackNavigation();
        }
      } else if (e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleAuxClick = (e: MouseEvent) => {
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleBrowserBackKey = (e: KeyboardEvent) => {
      if (e.key === 'BrowserBack') {
        e.preventDefault();
        const now = Date.now();
        if (now - lastBackTimestampRef.current > 280) {
          lastBackTimestampRef.current = now;
          triggerAppBackNavigation();
        }
      }
    };

    window.addEventListener('mousedown', handleMouseSideButtonDown, true);
    window.addEventListener('mouseup', handleMouseSideButtonUp, true);
    window.addEventListener('auxclick', handleAuxClick, true);
    window.addEventListener('keydown', handleBrowserBackKey, true);

    return () => {
      window.removeEventListener('mousedown', handleMouseSideButtonDown, true);
      window.removeEventListener('mouseup', handleMouseSideButtonUp, true);
      window.removeEventListener('auxclick', handleAuxClick, true);
      window.removeEventListener('keydown', handleBrowserBackKey, true);
    };
  }, [triggerAppBackNavigation]);

  // Gerenciar histórico para o botão voltar do Android / Navegador / Mouse
  useEffect(() => {
    const handlePopState = (_event: PopStateEvent) => {
      const now = Date.now();
      // Se o clique do botão lateral do mouse já tratou o retorno há poucos milissegundos, apenas mantém a entrada de histórico ativa
      if (now - lastBackTimestampRef.current <= 280) {
        try {
          window.history.pushState(
            { view: currentView, subView: activeSubView, club: selectedClub, guest: isGuest },
            '',
            ''
          );
        } catch {}
        return;
      }

      lastBackTimestampRef.current = now;
      const handled = triggerAppBackNavigation();
      if (handled) {
        try {
          window.history.pushState(
            { view: currentView, subView: activeSubView, club: selectedClub, guest: isGuest },
            '',
            ''
          );
        } catch {}
      } else if (currentView !== 'LOGIN' && currentView !== 'SIGNUP') {
        setCurrentView('HOME');
        setActiveSubView(undefined);
        try {
          window.history.pushState(
            { view: 'HOME', subView: undefined, club: selectedClub, guest: isGuest },
            '',
            ''
          );
        } catch {}
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Inicializar o estado inicial do histórico com uma entrada sentinela para evitar sair do app ao usar o botão lateral do mouse
    try {
      if (!window.history.state) {
        window.history.replaceState({ view: currentView, subView: activeSubView, club: selectedClub, guest: isGuest, root: true }, '', '');
        window.history.pushState({ view: currentView, subView: activeSubView, club: selectedClub, guest: isGuest }, '', '');
      }
    } catch (e) {}

    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentView, activeSubView, selectedClub, isGuest, triggerAppBackNavigation]);

  // Sincronizar histórico quando a view ou subView muda
  useEffect(() => {
    try {
      const state = window.history.state;
      if (state?.view !== currentView || state?.subView !== activeSubView || state?.club !== selectedClub || state?.guest !== isGuest) {
        window.history.pushState({ view: currentView, subView: activeSubView, club: selectedClub, guest: isGuest }, '', '');
      }
    } catch (e) {}
  }, [currentView, activeSubView, selectedClub, isGuest]);

  const navigateToClub = (club: ClubType) => {
    setSelectedClub(club);
    setCurrentView('CLUB_LIST');
  };

  const handleLoginSuccess = (asGuest: boolean = false) => {
    setIsGuest(asGuest);
    if (asGuest) {
      try {
        localStorage.setItem('dbv_is_guest', 'true');
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem('dbv_tudo_global_user_profile');
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
    } else {
      try {
        localStorage.removeItem('dbv_is_guest');
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
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          if (parsed?.email && parsed.email !== 'email@exemplo.com') {
            const cleanMail = String(parsed.email).trim().toLowerCase();
            localStorage.setItem('dbv_last_login_email', cleanMail);
            localStorage.setItem(`dbv_profile_backup_${cleanMail}`, savedProfile);
          }
        } catch {}
      }
      localStorage.removeItem('dbv_is_guest');
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
    if (isolatedExamPin !== null) {
      return (
        <LiveSpecialtyExam
          club={selectedClub || ClubType.PATHFINDER}
          initialMode="STUDENT"
          initialPin={isolatedExamPin}
          isIsolatedStudentMode={true}
          onExitIsolatedMode={() => {
            setIsolatedExamPin(null);
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('prova');
              window.history.replaceState({}, '', url.toString());
            } catch {}
          }}
        />
      );
    }

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
            pinSidebar={pinSidebar}
            onTogglePinSidebar={handleTogglePinSidebar}
            onBack={() => {
              if (activeSubView) {
                setActiveSubView(undefined);
              } else {
                setCurrentView('HOME');
              }
            }}
            onSwitchClub={(club) => setSelectedClub(club)}
            onOpenProfile={handleOpenProfile}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
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
    <div className={`app-root-wrapper relative h-[100dvh] h-screen w-screen flex flex-col p-0 m-0 overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-slate-950' : 'bg-[#f8fafc]'}`}>
      <style>{styles}</style>
      {/* Fundo Global: Círculo central dissipando até as bordas + Quadriculado de fios bem suave */}
      <div className="app-radial-canvas" aria-hidden="true" />
      <div className="app-wireframe-grid" aria-hidden="true" />
      <UpdateNotification
        onOpenVersionHistory={handleOpenVersionHistory}
      />

      {/* Banner de Restrição do Supabase (Cota de Tráfego HTTP 402) */}
      {supabaseRestrictedInfo?.isRestricted && (
        <aside aria-label="Alerta de Conexão com o Banco de Dados" className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-lg z-50 shrink-0 border-b border-white/10 animate-fade-in">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={14} className="text-white" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 overflow-hidden text-left">
              <span className="font-black uppercase tracking-wider text-[11px] whitespace-nowrap">Supabase Restrito:</span>
              <span className="text-[11px] text-amber-100 truncate">
                Cota de tráfego excedida (HTTP 402). O banco de dados e imagens estão temporariamente pausados.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="ml-3 shrink-0 px-3 py-1 bg-white text-orange-700 hover:bg-orange-50 active:scale-95 transition-all rounded-full font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1 cursor-pointer"
          >
            <span>Como Resolver</span>
            <ExternalLink size={11} />
          </button>
        </aside>
      )}

      <div className="app-card-wrapper h-full w-full max-w-7xl lg:max-w-[1550px] mx-auto relative z-10 overflow-hidden rounded-none border-0 shadow-none flex flex-col flex-1 bg-transparent transition-colors duration-500">
        <main className="flex-1 w-full overflow-hidden flex flex-col bg-transparent transition-colors duration-500">
          {renderContent()}
        </main>

        {/* Rodapé Global (no PC o rodapé está integrado à barra lateral) */}
        <footer className="app-footer py-1.5 sm:py-2 px-4 text-center select-none shrink-0 pointer-events-none z-20 transition-colors duration-500 md:hidden">
          <p className="app-accent-text text-[10px] sm:text-[11px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.25em]">
            DBV TUDO 2024 - 2026
          </p>
        </footer>
      </div>

      {/* Modal de Ajustes */}
      {isSettingsModalOpen && (
        <div 
          className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in"
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
              {/* Container do Modo Escuro + Cores de Realce (idêntico à referência visual) */}
              <div
                className={`p-4 rounded-[26px] border transition-all space-y-3.5 ${
                  darkMode
                    ? 'bg-slate-800/80 border-slate-700/90'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                {/* Linha Superior: Alternador de Modo Escuro */}
                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-full flex items-center justify-between text-left group active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        backgroundColor: `rgba(${activeAccentOption.rgb}, 0.18)`,
                        color: activeAccentOption.hex
                      }}
                    >
                      {darkMode ? <Moon size={19} /> : <Sun size={19} />}
                    </div>
                    <div className="truncate">
                      <span className={`block text-sm font-black truncate ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        Modo Escuro
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400 block truncate">
                        {darkMode ? 'Tema escuro ativado' : 'Tema claro ativado'}
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-11 h-6 rounded-full p-0.5 transition-colors duration-300 shrink-0"
                    style={{
                      backgroundColor: darkMode ? activeAccentOption.hex : undefined
                    }}
                  >
                    <div
                      className={`w-full h-full rounded-full flex items-center ${
                        !darkMode ? 'bg-slate-300 dark:bg-slate-700 p-0.5 -m-0.5' : ''
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                          darkMode ? 'translate-x-5' : ''
                        }`}
                      />
                    </div>
                  </div>
                </button>

                {/* Sub-container interno: Cores de Realce */}
                <div
                  className="rounded-2xl py-2.5 px-3 border transition-all relative overflow-hidden"
                  style={{
                    backgroundColor: darkMode ? '#14161d' : '#ffffff',
                    backgroundImage: darkMode
                      ? `radial-gradient(circle at 18% 50%, rgba(${activeAccentOption.rgb}, 0.20) 0%, rgba(${activeAccentOption.rgb}, 0.05) 48%, transparent 80%)`
                      : `radial-gradient(circle at 18% 50%, rgba(${activeAccentOption.rgb}, 0.16) 0%, rgba(${activeAccentOption.rgb}, 0.04) 50%, transparent 85%)`,
                    borderColor: darkMode
                      ? `rgba(${activeAccentOption.rgb}, 0.28)`
                      : `rgba(${activeAccentOption.rgb}, 0.32)`
                  }}
                >
                  <div className="flex items-center space-x-1.5 mb-2">
                    <Palette
                      size={14}
                      style={{ color: activeAccentOption.hex }}
                      className="shrink-0 transition-colors duration-300"
                    />
                    <span className={`text-[11px] sm:text-xs font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Cores de Realce
                    </span>
                  </div>

                  <div className="flex items-center justify-around px-3 py-0.5">
                    {ACCENT_COLOR_OPTIONS.map((option) => {
                      const isSelected = accentColor === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleSelectAccentColor(option.id)}
                          title={option.label}
                          aria-label={`Cor de realce ${option.label}`}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer relative shrink-0 ${
                            isSelected ? 'scale-110' : 'hover:scale-105 opacity-90 hover:opacity-100 active:scale-95'
                          }`}
                          style={{
                            width: '24px',
                            height: '24px',
                            minWidth: '24px',
                            minHeight: '24px',
                            backgroundColor: option.hex,
                            boxShadow: isSelected
                              ? darkMode
                                ? `0 0 0 2px rgba(255, 255, 255, 0.95), 0 0 10px 2px rgba(${option.rgb}, 0.65)`
                                : `0 0 0 2px #ffffff, 0 0 0 3.5px rgba(${option.rgb}, 0.75), 0 2px 6px rgba(${option.rgb}, 0.35)`
                              : '0 1px 3px rgba(0, 0, 0, 0.25)'
                          }}
                        >
                          {isSelected && (
                            <Check size={12} strokeWidth={3} className="text-white drop-shadow-xs" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botão Notificações */}
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleToggleNotifications}
                  className={`p-3.5 rounded-2xl flex items-center justify-between border transition-all text-left group active:scale-[0.98] ${
                    darkMode 
                      ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600' 
                      : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      notificationsEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                    </div>
                    <div className="truncate">
                      <span className={`block text-xs sm:text-sm font-bold truncate ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        Notificações
                      </span>
                      <span className={`text-[10px] font-medium block truncate ${
                        notificationsEnabled ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : 'text-slate-400'
                      }`}>
                        {notificationsEnabled ? 'Ativadas' : 'Desativadas'}
                      </span>
                    </div>
                  </div>
                  <div className={`w-10 h-5 sm:w-11 sm:h-5.5 rounded-full p-0.5 transition-colors duration-300 shrink-0 ${
                    notificationsEnabled ? 'bg-indigo-500' : (darkMode ? 'bg-slate-700' : 'bg-slate-300')
                  }`}>
                    <div className={`w-4 h-4 sm:w-4.5 sm:h-4.5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                      notificationsEnabled ? 'translate-x-5 sm:translate-x-5.5' : ''
                    }`} />
                  </div>
                </button>
              </div>

              {notificationStatusMsg && (
                <div className={`text-xs px-4 py-2.5 rounded-xl text-center animate-slide-up transition-all ${
                  darkMode ? 'bg-slate-800 text-indigo-300 border border-slate-700' : 'bg-indigo-50 text-indigo-900 border border-indigo-100'
                }`}>
                  {notificationStatusMsg}
                </div>
              )}

              {/* Botão Fixar Menu Lateral (Exclusivo para PC / Desktop) */}
              <button 
                onClick={handleTogglePinSidebar}
                className={`hidden md:flex w-full p-4 rounded-2xl items-center justify-between border transition-all text-left group active:scale-[0.98] ${
                  darkMode 
                    ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600' 
                    : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    pinSidebar ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    <PanelLeft size={18} />
                  </div>
                  <div>
                    <span className={`block text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      Fixar Menu Lateral
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-400">
                      {pinSidebar ? 'Menu fixo sempre aberto no computador' : 'Menu retrátil (abre ao clicar e fecha ao clicar fora)'}
                    </span>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 shrink-0 ${
                  pinSidebar ? 'bg-indigo-500' : (darkMode ? 'bg-slate-700' : 'bg-slate-300')
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                    pinSidebar ? 'translate-x-6' : ''
                  }`} />
                </div>
              </button>

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

                {/* Botão para Abrir a Página Completa de Histórico de Versões */}
                <button
                  onClick={handleOpenVersionHistory}
                  className={`w-full py-3 px-3.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all active:scale-[0.98] cursor-pointer ${
                    darkMode 
                      ? 'bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200' 
                      : 'bg-white hover:bg-indigo-50/60 border border-slate-200/90 text-slate-800 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <History size={15} className="text-indigo-500 shrink-0" />
                    <span>Histórico de Versões & Modificações</span>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                    <span>Ver Página</span>
                    <ChevronRight size={14} />
                  </div>
                </button>
              </div>

              {/* Separador */}
              <div className="pt-1">
                <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
              </div>

              {/* Botão Fazer Login (se estiver sem login) ou Sair da Conta (se estiver logado) */}
              {isUserLoggedIn ? (
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
              ) : (
                <button 
                  onClick={() => {
                    setIsSettingsModalOpen(false);
                    setIsGuest(false);
                    setCurrentView('LOGIN');
                  }}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between border transition-all text-left active:scale-[0.98] ${
                    darkMode 
                      ? 'bg-emerald-500/15 border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300' 
                      : 'bg-emerald-50/80 border-emerald-200/80 hover:bg-emerald-100/70 text-[#004d40]'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-[#004d40]'
                    }`}>
                      <LogIn size={18} />
                    </div>
                    <div>
                      <span className="block text-sm font-bold">
                        Fazer Login
                      </span>
                      <span className="text-[11px] opacity-75">
                        Entrar na sua conta ou criar cadastro
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="rotate-180 opacity-50" size={18} />
                </button>
              )}

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

      {/* Modal Explicativo: Restrição de Cota do Supabase */}
      {isSupabaseModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in"
          onClick={() => setIsSupabaseModalOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight">
                    Restrição de Cota do Supabase
                  </h3>
                  <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    Erro HTTP 402 - exceed_cached_egress_quota
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSupabaseModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-300 text-xs">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-2xl">
                <p className="font-semibold text-amber-900 dark:text-amber-200 leading-relaxed">
                  O projeto Supabase atingiu o limite gratuito de transferência de dados (egress quota). Por isso, o Supabase bloqueou temporariamente as respostas do Banco de Dados e das Imagens/Storage.
                </p>
              </div>

              <div>
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                  Como reativar o serviço no Supabase:
                </h4>
                <ol className="space-y-3 list-decimal list-inside text-slate-600 dark:text-slate-300 font-medium">
                  <li className="leading-relaxed">
                    Acesse o painel do seu projeto no Supabase:
                    <a 
                      href="https://supabase.com/dashboard/project/dembhtmryutggifbpuka" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 dark:text-blue-400 font-bold underline inline-flex items-center gap-1 ml-1"
                    >
                      supabase.com/dashboard <ExternalLink size={11} />
                    </a>
                  </li>
                  <li className="leading-relaxed">
                    No menu lateral esquerdo, vá em <strong>Project Settings</strong> (ícone de engrenagem) e depois em <strong>Billing</strong> (ou <strong>Subscription</strong>).
                  </li>
                  <li className="leading-relaxed">
                    <strong>Opção 1 (Reativação Imediata):</strong> Desative o <em>"Spend Cap"</em> (limite de gastos) ou faça upgrade para o plano <em>Pro</em>. O serviço é restabelecido em segundos.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Opção 2 (Novo Projeto Gratuito):</strong> Crie um novo projeto gratuito no Supabase, transfira o esquema/tabelas e atualize as variáveis de ambiente <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> e <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code>.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Opção 3 (Ciclo Mensal):</strong> Aguardar a virada do ciclo mensal de faturamento/cota do Supabase, quando o limite é renovado automaticamente.
                  </li>
                </ol>
              </div>

              <div className="pt-2">
                <button
                  onClick={async () => {
                    const res = await checkSupabaseHealth();
                    if (res.ok) {
                      setSupabaseRestrictedInfo(null);
                      setIsSupabaseModalOpen(false);
                      window.location.reload();
                    } else {
                      alert("O Supabase ainda continua restrito (" + (res.message || 'HTTP 402') + "). Verifique no painel do Supabase.");
                    }
                  }}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <RefreshCw size={15} />
                  <span>Testar Conexão Novamente</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
