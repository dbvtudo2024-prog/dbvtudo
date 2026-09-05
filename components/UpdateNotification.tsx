import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, RefreshCw, X, Bell, BellRing } from 'lucide-react';

declare const __APP_BUILD_TIME__: number | string | undefined;

export const UpdateNotification: React.FC = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const notifiedRef = useRef(false);

  // Carrega ou inicializa a versão de build atual
  const currentBuildTimeRef = useRef<number>(0);

  useEffect(() => {
    let version = 0;
    if (typeof __APP_BUILD_TIME__ !== 'undefined' && __APP_BUILD_TIME__) {
      const parsed = Number(__APP_BUILD_TIME__);
      if (!isNaN(parsed) && parsed > 0) version = parsed;
    }
    if (!version) {
      const stored = sessionStorage.getItem('dbv_current_build_time');
      if (stored) {
        version = Number(stored);
      } else {
        version = Date.now();
        sessionStorage.setItem('dbv_current_build_time', String(version));
      }
    }
    currentBuildTimeRef.current = version;
  }, []);

  const getInitialVersion = (): number => {
    return currentBuildTimeRef.current || Date.now();
  };

  // Disparar notificação nativa no celular/computador
  const triggerNativeNotification = useCallback(async () => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;

    // Vibração no celular
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch {
      // Ignora erro de vibração
    }

    // Notificação nativa via Service Worker ou Notification API
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const title = '✨ Nova Atualização Disponível!';
        const options: NotificationOptions & { renotify?: boolean } = {
          body: 'Uma nova versão do DBV Tudo foi publicada. Toque para atualizar.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'dbv-tudo-update',
          renotify: true,
          requireInteraction: true
        };

        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.showNotification) {
            await registration.showNotification(title, options);
            return;
          }
        }

        new Notification(title, options);
      }
    } catch (e) {
      console.warn('Erro ao exibir notificação nativa:', e);
    }
  }, []);

  const triggerUpdateFound = useCallback(() => {
    setHasUpdate(true);
    setIsDismissed(false);
    triggerNativeNotification();
  }, [triggerNativeNotification]);

  // Verificar atualizações via arquivo version.json
  const checkForUpdates = useCallback(async () => {
    try {
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
      const localVersion = getInitialVersion();

      if (serverVersion && localVersion && serverVersion > localVersion) {
        triggerUpdateFound();
      }
    } catch {
      // Falha silenciosa
    }
  }, [triggerUpdateFound]);

  // Monitoramento de Service Worker e Polling contínuo
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        const hasPrompted = localStorage.getItem('dbv_notification_prompted');
        if (!hasPrompted) {
          // Exibe convite sutil após 10 segundos para ativar notificações de updates
          const promptTimer = setTimeout(() => {
            setShowPermissionPrompt(true);
          }, 10000);
          return () => clearTimeout(promptTimer);
        }
      }
    }
  }, []);

  useEffect(() => {
    // 1. Ouvir atualizações do Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                triggerUpdateFound();
              }
            });
          }
        });
      }).catch(() => {});

      // Forçar verificação no Service Worker
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.update().catch(() => {});
        }
      });
    }

    // 2. Verificação inicial e polling a cada 20 segundos
    const initialTimer = setTimeout(checkForUpdates, 2000);
    const interval = setInterval(checkForUpdates, 20000);

    // 3. Verificação ao focar a tela ou mudar visibilidade
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };

    const handleFocus = () => checkForUpdates();
    const handleOnline = () => checkForUpdates();

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
  }, [checkForUpdates, triggerUpdateFound]);

  // Solicitar permissão de notificação nativa do navegador/celular
  const requestNotificationPermission = async () => {
    setShowPermissionPrompt(false);
    localStorage.setItem('dbv_notification_prompted', 'true');
    if ('Notification' in window && Notification.requestPermission) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          // Feedback tátil e mensagem de teste
          if ('vibrate' in navigator) navigator.vibrate(100);
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            reg?.showNotification('✅ Notificações Ativadas!', {
              body: 'Você será avisado sempre que uma nova versão do app for lançada.',
              icon: '/favicon.ico'
            });
          }
        }
      } catch (e) {
        console.warn('Erro ao solicitar permissão:', e);
      }
    }
  };

  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      // Notifica o Service Worker para ativar imediatamente
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }

      // Limpa caches
      if ('caches' in window && window.caches && window.caches.keys) {
        const names = await window.caches.keys();
        await Promise.all(names.map(name => window.caches.delete(name)));
      }
    } catch {
      // Ignora erro
    }
    // Força recarregamento da página do servidor
    window.location.reload();
  };

  return (
    <>
      {/* Banner Sutil para Habilitar Notificações no Celular */}
      {showPermissionPrompt && notificationPermission === 'default' && !hasUpdate && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] animate-slide-up pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-100 dark:border-slate-700 p-3.5 text-slate-800 dark:text-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Bell size={18} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 dark:text-white">Avisos de Novas Versões</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Receber notificação no celular quando houver atualização?</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setShowPermissionPrompt(false);
                  localStorage.setItem('dbv_notification_prompted', 'true');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                <X size={16} />
              </button>
              <button
                onClick={requestNotificationPermission}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-sm active:scale-95"
              >
                Ativar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Nova Versão Disponível */}
      {hasUpdate && !isDismissed && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[9999] animate-slide-up pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-indigo-500/30 dark:border-indigo-500/40 p-4 text-slate-800 dark:text-slate-100 flex flex-col gap-3">
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
                    Uma nova versão acabou de ser publicada. Atualize agora para carregar as alterações mais recentes.
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

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
              {notificationPermission === 'default' ? (
                <button
                  onClick={requestNotificationPermission}
                  className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  <BellRing size={13} />
                  Ativar no celular
                </button>
              ) : (
                <span className="text-[10px] text-slate-400">Pronto para atualizar</span>
              )}

              <div className="flex items-center gap-2">
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
        </div>
      )}
    </>
  );
};

export default UpdateNotification;
