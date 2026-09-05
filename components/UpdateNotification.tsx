import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';

declare const __APP_BUILD_TIME__: number | string | undefined;

export const UpdateNotification: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Versão embutida no build atual do cliente
  const currentBuildTime = typeof __APP_BUILD_TIME__ !== 'undefined' 
    ? Number(__APP_BUILD_TIME__) 
    : null;

  const checkForUpdates = useCallback(async () => {
    try {
      // Adiciona timestamp para evitar qualquer cache do navegador/CDN
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      const serverVersion = Number(data?.version || data?.timestamp);

      if (serverVersion && currentBuildTime && serverVersion > currentBuildTime) {
        setHasUpdate(true);
      }
    } catch {
      // Falha silenciosa em caso de offline
    }
  }, [currentBuildTime]);

  useEffect(() => {
    // 1. Verificação inicial após 5 segundos
    const initialTimer = setTimeout(checkForUpdates, 5000);

    // 2. Intervalo regular de verificação (a cada 60 segundos)
    const interval = setInterval(checkForUpdates, 60000);

    // 3. Verificação ao focar a aba ou voltar para o aplicativo no celular
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    const handleFocus = () => {
      checkForUpdates();
    };

    const handleOnline = () => {
      checkForUpdates();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkForUpdates]);

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      // Limpa caches de service worker caso existam
      if ('caches' in window && window.caches && window.caches.keys) {
        const names = await window.caches.keys();
        await Promise.all(names.map(name => window.caches.delete(name)));
      }
    } catch {
      // Ignora erro
    }
    // Força recarregamento sem cache
    window.location.reload();
  };

  if (!hasUpdate || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] animate-slide-up pointer-events-auto">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-indigo-100 dark:border-slate-700 p-4 text-slate-800 dark:text-slate-100 transition-all flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Nova versão disponível!
                </h4>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  Update
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                Uma atualização com novidades e correções foi publicada. Atualize agora para receber.
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors shrink-0"
            title="Lembrar mais tarde"
            aria-label="Fechar aviso de atualização"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
          <button
            onClick={() => setIsDismissed(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Depois
          </button>
          <button
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-75"
          >
            <RefreshCw size={14} className={isUpdating ? "animate-spin" : ""} />
            {isUpdating ? "Atualizando..." : "Atualizar Agora"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
