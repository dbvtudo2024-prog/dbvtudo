import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, RefreshCw, X, Bell, BellRing, CheckCircle2 } from 'lucide-react';
import { getLocalUserSpecialties, saveLocalUserSpecialties } from '../services/supabaseService';
import { APP_VERSION } from '../versionConfig';

declare const __APP_BUILD_TIME__: number | string | undefined;

interface UpdateNotificationProps {
  onOpenVersionHistory?: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onOpenVersionHistory }) => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [newVersionName, setNewVersionName] = useState<string>('');
  const [updateHighlights, setUpdateHighlights] = useState<string[]>([]);
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
  const triggerNativeNotification = useCallback(async (versionLabel?: string) => {
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
      if (localStorage.getItem('dbv_notifications_enabled') === 'false') {
        return;
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        const vText = versionLabel ? ` v${versionLabel}` : '';
        const title = `✨ Nova Versão${vText} Disponível!`;
        const options: NotificationOptions & { renotify?: boolean } = {
          body: `A versão${vText} do DBV Tudo foi publicada com novas melhorias. Toque para atualizar.`,
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

  const triggerUpdateFound = useCallback((versionLabel?: string, highlights?: string[]) => {
    setHasUpdate(true);
    if (versionLabel) setNewVersionName(versionLabel);
    if (highlights && highlights.length > 0) setUpdateHighlights(highlights);
    setIsDismissed(false);
    triggerNativeNotification(versionLabel);
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
      const serverVersionName = data?.versionName || '';
      const highlights = Array.isArray(data?.highlights) ? data.highlights : [];
      const localVersion = getInitialVersion();

      if (serverVersion && localVersion && serverVersion > localVersion) {
        triggerUpdateFound(serverVersionName, highlights);
      }
    } catch {
      // Falha silenciosa
    }
  }, [triggerUpdateFound]);

  // Monitoramento de Service Worker e Polling contínuo
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      const isExplicitlyDisabled = localStorage.getItem('dbv_notifications_enabled') === 'false';
      if (Notification.permission === 'default' && !isExplicitlyDisabled) {
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
          localStorage.setItem('dbv_notifications_enabled', 'true');
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
      // Garante persistência das especialidades antes de recarregar a página
      const globalProfile = localStorage.getItem('dbv_tudo_global_user_profile');
      let userEmail = null;
      if (globalProfile) {
        try {
          const parsed = JSON.parse(globalProfile);
          userEmail = parsed.email;
        } catch {}
      }
      const currentSpecialties = getLocalUserSpecialties(userEmail);
      if (currentSpecialties.length > 0) {
        saveLocalUserSpecialties(currentSpecialties, userEmail);
      }

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

      {/* Alerta Compacto de Nova Versão Disponível */}
      {hasUpdate && !isDismissed && (
        <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-sm z-[9999] animate-slide-up pointer-events-auto">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-indigo-500/40 dark:border-indigo-500/50 p-3.5 text-slate-800 dark:text-slate-100 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <Sparkles size={17} className="animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                      {newVersionName ? `Nova versão v${newVersionName}` : 'Nova versão disponível'}
                    </h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      v{newVersionName || 'NOVA'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Novidades em{' '}
                    {onOpenVersionHistory ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDismissed(true);
                          onOpenVersionHistory();
                        }}
                        className="font-bold text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-500"
                      >
                        Ajustes &gt; Histórico de Versões
                      </button>
                    ) : (
                      <strong className="text-slate-700 dark:text-slate-200">Ajustes &gt; Histórico de Versões</strong>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDismissed(true)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors shrink-0"
                title="Fechar"
                aria-label="Fechar aviso de atualização"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsDismissed(true)}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                Depois
              </button>
              <button
                onClick={handleUpdateNow}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-75"
              >
                <RefreshCw size={13} className={isUpdating ? "animate-spin" : ""} />
                <span>{isUpdating ? "Atualizando..." : "Atualizar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UpdateNotification;
