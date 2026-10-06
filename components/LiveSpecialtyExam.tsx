import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { ClubType, Especialidade } from '../types';
import {
  supabaseQfpy,
  fetchEspecialidades,
  fetchEspecialidadeRequisitos,
  resolveGeminiApiKey
} from '../services/supabaseService';
import {
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Users,
  Timer,
  Play,
  Square,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Maximize2,
  Volume2,
  VolumeX,
  Eye,
  Plus,
  Trash2,
  Award,
  ChevronRight,
  ChevronLeft,
  Clock,
  X,
  LogOut,
  BookOpen,
  Edit3,
  Monitor,
  Minimize2,
  Smartphone,
  Globe
} from 'lucide-react';

export interface LiveExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface LiveExamCheatAlert {
  id: string;
  studentId: string;
  studentName: string;
  studentUnit: string;
  reason: string;
  timestamp: string;
  violationNumber: number;
}

export interface LiveExamParticipant {
  id: string;
  name: string;
  unit: string;
  status: 'WAITING' | 'PLAYING' | 'LOCKED_CHEAT' | 'FINISHED' | 'DISQUALIFIED';
  joinedAt: string;
  currentQuestionIdx: number;
  answeredCount: number;
  correctCount: number;
  scorePercent: number;
  grade10: number;
  cheatCount: number;
  lastCheatReason?: string;
  lastCheatTime?: string;
  isLocked: boolean;
  answers: Record<number, number>;
  finishedAt?: string;
  timeSpentSeconds?: number;
}

export interface LiveExamRoomState {
  pin: string;
  club: ClubType;
  specialtyId: number;
  specialtyName: string;
  specialtyArea: string;
  specialtyLogo: string;
  specialtyCode: string;
  durationMinutes: number;
  passingScorePercent: number;
  lockOnCheat: boolean;
  status: 'WAITING' | 'ACTIVE' | 'FINISHED';
  startedAt: number | null;
  extraSecondsAdded: number;
  questions: LiveExamQuestion[];
  participants: Record<string, LiveExamParticipant>;
  alerts: LiveExamCheatAlert[];
  updatedAt: number;
}

interface LiveSpecialtyExamProps {
  club: ClubType;
  specialties?: Especialidade[];
  preselectedSpecialty?: Especialidade | null;
  initialMode?: 'HOST' | 'STUDENT';
  initialPin?: string;
  isIsolatedStudentMode?: boolean;
  onExitIsolatedMode?: () => void;
  onBack?: () => void;
}

const getImageUrl = (url: string | undefined | null) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `https://mda.wiki.br${trimmed}`;
  if (trimmed.includes('drive.google.com')) {
    const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return trimmed;
};

// Gerador sonoro via Web Audio API para alertar o instrutor quando alguém minimizar a tela
function playCheatAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    [0, 0.18, 0.36].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(idx % 2 === 0 ? 880 : 620, now + offset);
      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.15);
    });
  } catch {}
}

// Construtor inteligente de questões baseado nos requisitos oficiais da especialidade (fallback instantâneo)
function buildFallbackSpecialtyQuestions(
  specialty: Especialidade,
  requirements: string[],
  count: number
): LiveExamQuestion[] {
  const cleanReqs = (requirements || [])
    .map((r) => r.replace(/^\s*\d+[\.\)\-]\s*/, '').trim())
    .filter((r) => r.length > 12);

  const areaName = specialty.area || 'Especialidades';
  const codeName = specialty.codigo || specialty.sigla || 'ESP';

  const generated: LiveExamQuestion[] = [];

  // Questão 1: Identificação e Área Oficial da Especialidade
  const allAreas = [
    'Estudos da Natureza',
    'Artes e Habilidades Manuais',
    'Atividades Recreativas',
    'Atividades Missionárias e Comunitárias',
    'Ciência e Saúde',
    'Habilidades Domésticas',
    'Atividades Profissionais',
    'Atividades Agrícolas'
  ];
  const wrongAreas = allAreas.filter((a) => a.toLowerCase() !== areaName.toLowerCase()).slice(0, 3);
  generated.push({
    id: `q_spec_area_${Date.now()}_0`,
    question: `A qual área oficial do Manual de Especialidades pertence a especialidade de "${specialty.nome}"?`,
    options: [areaName, ...(wrongAreas.length >= 3 ? wrongAreas : ['Ciência e Saúde', 'Estudos da Natureza', 'Atividades Recreativas'])].slice(0, 4),
    correctIndex: 0,
    explanation: `A especialidade "${specialty.nome}" (${codeName}) integra oficialmente a área de ${areaName}.`
  });

  // Questões baseadas nos requisitos reais da especialidade
  cleanReqs.forEach((reqText, idx) => {
    if (generated.length >= count) return;
    const shortReq = reqText.length > 170 ? reqText.slice(0, 167) + '...' : reqText;
    const options = [
      shortReq,
      'Realizar apenas leitura livre sem cumprimento prático ou avaliação do instrutor.',
      'Substituir os requisitos técnicos da especialidade por atividades recreativas gerais.',
      'Dispensa de apresentação prática ou teórica ao instrutor credenciado do clube.'
    ];
    // Rotaciona a posição correta para ficar equilibrado
    const targetCorrect = (idx + 1) % 4;
    const reordered = [...options];
    const temp = reordered[targetCorrect];
    reordered[targetCorrect] = reordered[0];
    reordered[0] = temp;

    generated.push({
      id: `q_spec_req_${Date.now()}_${idx + 1}`,
      question: `De acordo com os requisitos oficiais da especialidade de "${specialty.nome}", qual das alternativas abaixo corresponde a uma exigência autêntica desta especialidade?`,
      options: reordered,
      correctIndex: targetCorrect,
      explanation: `Requisito oficial da especialidade ${specialty.nome}: "${shortReq}"`
    });
  });

  // Completa caso a especialidade tenha poucos requisitos cadastrados
  while (generated.length < count) {
    const n = generated.length + 1;
    generated.push({
      id: `q_spec_extra_${Date.now()}_${n}`,
      question: `Na avaliação oficial da especialidade "${specialty.nome}", qual é o critério exigido pelo Manual Administrativo para aprovação e direito ao emblema?`,
      options: [
        'Cumprir integralmente os requisitos teóricos e práticos sob avaliação de um instrutor habilitado.',
        'Cumprir apenas metade dos requisitos sem necessidade de comprovação prática.',
        'Apenas assistir a uma palestra rápida sem realizar a avaliação.',
        'Decorar somente o código da especialidade sem estudar o conteúdo.'
      ],
      correctIndex: 0,
      explanation: 'Toda especialidade exige o cumprimento integral de seus requisitos com aprovação do instrutor.'
    });
  }

  return generated.slice(0, count);
}

const EMPTY_SPECIALTIES: Especialidade[] = [];

const LiveSpecialtyExam: React.FC<LiveSpecialtyExamProps> = ({
  club,
  specialties = EMPTY_SPECIALTIES,
  preselectedSpecialty = null,
  initialMode = 'HOST',
  initialPin = '',
  isIsolatedStudentMode = false,
  onExitIsolatedMode,
  onBack
}) => {
  const isPathfinder = club === ClubType.PATHFINDER;
  const [roleMode, setRoleMode] = useState<'HOST' | 'STUDENT'>(
    isIsolatedStudentMode || initialPin ? 'STUDENT' : initialMode
  );

  // ============================================================================
  // ESTADOS DO INSTRUTOR (HOST)
  // ============================================================================
  const [catalog, setCatalog] = useState<Especialidade[]>(specialties);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('TODAS');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Especialidade | null>(preselectedSpecialty);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [passingScorePercent, setPassingScorePercent] = useState<number>(70);
  const [lockOnCheat, setLockOnCheat] = useState<boolean>(true);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(true);
  const [questions, setQuestions] = useState<LiveExamQuestion[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(null);

  // Estado da Sala Ativa do Instrutor
  const [activeRoom, setActiveRoom] = useState<LiveExamRoomState | null>(() => {
    try {
      const saved = localStorage.getItem('dbv_instructor_active_exam_room');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.pin && Array.isArray(parsed.questions)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isQrFullscreenModalOpen, setIsQrFullscreenModalOpen] = useState<boolean>(false);
  const [isQrTelaoExpanded, setIsQrTelaoExpanded] = useState<boolean>(false);
  const [isSecondScreenActive, setIsSecondScreenActive] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [inspectingStudent, setInspectingStudent] = useState<LiveExamParticipant | null>(null);
  const [hostRemainingSeconds, setHostRemainingSeconds] = useState<number>(0);
  const projectorWindowRef = useRef<Window | null>(null);
  const qrModalRef = useRef<HTMLDivElement | null>(null);

  // ============================================================================
  // ESTADOS DO ALUNO (STUDENT - ÁREA ISOLADA DE PROVA)
  // ============================================================================
  const [studentPinInput, setStudentPinInput] = useState<string>(initialPin.replace(/\D/g, '').slice(0, 6));
  const [studentName, setStudentName] = useState<string>(() => {
    try {
      return localStorage.getItem('dbv_exam_student_name') || '';
    } catch {
      return '';
    }
  });
  const [studentUnit, setStudentUnit] = useState<string>(() => {
    try {
      return localStorage.getItem('dbv_exam_student_unit') || '';
    } catch {
      return '';
    }
  });
  const [studentId] = useState<string>(() => {
    try {
      const existing = sessionStorage.getItem('dbv_exam_student_id');
      if (existing) return existing;
      const created = `stu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem('dbv_exam_student_id', created);
      return created;
    } catch {
      return `stu_${Date.now()}`;
    }
  });

  const [studentRoom, setStudentRoom] = useState<LiveExamRoomState | null>(null);
  const [studentPhase, setStudentPhase] = useState<'ENTER_PIN' | 'WAITING_HOST' | 'PLAYING' | 'FINISHED'>('ENTER_PIN');
  const [isConnectingRoom, setIsConnectingRoom] = useState<boolean>(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentCurrentQ, setStudentCurrentQ] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<number, number>>({});
  const [studentCheatCount, setStudentCheatCount] = useState<number>(0);
  const [studentLocked, setStudentLocked] = useState<boolean>(false);
  const [studentWarningModal, setStudentWarningModal] = useState<string | null>(null);
  const [studentLastCheatReason, setStudentLastCheatReason] = useState<string>('');
  const [studentRemainingSeconds, setStudentRemainingSeconds] = useState<number>(900);
  const [studentStartTime, setStudentStartTime] = useState<number | null>(null);
  const [showOpenModeChoiceModal, setShowOpenModeChoiceModal] = useState<boolean>(false);
  const [isRunningInStandaloneApp, setIsRunningInStandaloneApp] = useState<boolean>(false);

  // Ao escanear o QR Code (isIsolatedStudentMode):
  // - Se a pessoa possuir o App instalado, exibe a opção de abrir no App ou no Navegador.
  // - Se NÃO tiver o App instalado, abre direto no navegador padrão sem exibir o modal.
  useEffect(() => {
    if (!isIsolatedStudentMode || typeof window === 'undefined') return;

    const pinCode = (studentPinInput || initialPin || '').replace(/\D/g, '');
    const params = new URLSearchParams(window.location.search);
    const openModeParam = params.get('open_mode');
    const sessionChoiceKey = `dbv_qr_open_choice_${pinCode || 'active'}`;

    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as any).standalone === true;
    setIsRunningInStandaloneApp(standalone);

    if (standalone) {
      try {
        localStorage.setItem('dbv_tudo_app_installed', 'true');
      } catch {}
    }

    // Se já escolheu (via parâmetro de URL ou sessão atual), segue direto para a prova
    try {
      if (openModeParam === 'app' || openModeParam === 'browser' || sessionStorage.getItem(sessionChoiceKey)) {
        setShowOpenModeChoiceModal(false);
        return;
      }
    } catch {}

    let cancelled = false;

    const detectInstalledAppOrRedirectToBrowser = async () => {
      const ua = navigator.userAgent || '';
      const isAndroid = /\bAndroid\b/i.test(ua);
      const isInAppWebView = /; wv\)|Instagram|FBAN|FBAV|Line\/|MicroMessenger/i.test(ua);

      // 1. Se o QR Code já abriu dentro do App standalone (e ainda não escolheu), oferece continuar no App ou ir p/ Navegador
      if (standalone) {
        if (!cancelled) setShowOpenModeChoiceModal(true);
        return;
      }

      // 2. Aguarda brevemente para permitir que beforeinstallprompt ou getInstalledRelatedApps respondam
      await new Promise((r) => setTimeout(r, 320));
      if (cancelled) return;

      const bipFired = Boolean((window as any).__dbvBeforeInstallPromptFired);
      let installedViaRelatedApps = false;

      try {
        if (typeof (navigator as any).getInstalledRelatedApps === 'function') {
          const related = await (navigator as any).getInstalledRelatedApps();
          if (Array.isArray(related) && related.length > 0) {
            installedViaRelatedApps = true;
            try {
              localStorage.setItem('dbv_tudo_app_installed', 'true');
            } catch {}
          }
        }
      } catch {}

      let storedInstalledFlag = false;
      let hasExistingAppDataOnDevice = false;
      try {
        storedInstalledFlag = localStorage.getItem('dbv_tudo_app_installed') === 'true';
        hasExistingAppDataOnDevice = Boolean(
          localStorage.getItem('dbv_tudo_user_profile') ||
            localStorage.getItem('dbv_tudo_global_user_profile') ||
            localStorage.getItem('dbv_is_guest')
        );
      } catch {}

      const isAndroidChrome = isAndroid && /\bChrome\//i.test(ua) && !isInAppWebView;
      const hasActiveSwController = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);

      // Se beforeinstallprompt disparou, o navegador confirmou que o PWA NÃO está instalado
      const isAppInstalled =
        !bipFired &&
        (installedViaRelatedApps ||
          storedInstalledFlag ||
          (isAndroidChrome && (hasActiveSwController || hasExistingAppDataOnDevice)));

      if (isAppInstalled) {
        if (!cancelled) setShowOpenModeChoiceModal(true);
      } else {
        // Pessoa NÃO possui o app instalado: abre direto no navegador padrão
        if (!cancelled) setShowOpenModeChoiceModal(false);

        // Caso o leitor de QR Code tenha aberto uma WebView interna restrita no Android, redireciona direto para o navegador padrão
        if (isAndroid && isInAppWebView && pinCode) {
          try {
            sessionStorage.setItem(sessionChoiceKey, 'browser');
            const targetHost = window.location.host;
            const intentUrl = `intent://${targetHost}/?prova=${pinCode}&open_mode=browser#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
            window.location.replace(intentUrl);
          } catch {}
        }
      }
    };

    detectInstalledAppOrRedirectToBrowser();

    return () => {
      cancelled = true;
    };
  }, [isIsolatedStudentMode, initialPin, studentPinInput]);

  const hostChannelRef = useRef<any>(null);
  const studentChannelRef = useRef<any>(null);
  const activeRoomRef = useRef<LiveExamRoomState | null>(activeRoom);
  activeRoomRef.current = activeRoom;
  const soundEnabledRef = useRef<boolean>(soundAlertsEnabled);
  soundEnabledRef.current = soundAlertsEnabled;
  const lastCheatTimestampRef = useRef<number>(0);

  // Carrega catálogo de especialidades apenas quando necessário no modo Instrutor
  useEffect(() => {
    if (specialties && specialties.length > 0) {
      setCatalog(specialties.filter((s) => !s.nome?.toLowerCase().includes('mestrado')));
      return;
    }
    if (roleMode !== 'HOST') return;
    let mounted = true;
    setIsLoadingCatalog(true);
    fetchEspecialidades(club, undefined, { excludeQuestions: false })
      .then((list) => {
        if (!mounted) return;
        setCatalog((list || []).filter((s) => !s.nome?.toLowerCase().includes('mestrado')));
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingCatalog(false);
      });
    return () => {
      mounted = false;
    };
  }, [club, specialties, roleMode]);

  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((s) => {
      if (s.area && !s.area.startsWith('http')) set.add(s.area);
    });
    return Array.from(set).sort();
  }, [catalog]);

  const filteredSpecialties = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((s) => {
      const matchArea = selectedAreaFilter === 'TODAS' || s.area === selectedAreaFilter;
      if (!matchArea) return false;
      if (!q) return true;
      return (
        s.nome?.toLowerCase().includes(q) ||
        s.codigo?.toLowerCase().includes(q) ||
        s.area?.toLowerCase().includes(q)
      );
    });
  }, [catalog, searchQuery, selectedAreaFilter]);

  // Gera o link direto da prova e o QR Code quando houver sala ativa
  // Quando aberto dentro do AI Studio (.run.app ou localhost), usa https://dbvtudo.vercel.app para que o celular consiga abrir o QR Code sem bloqueio
  const examShareUrl = useMemo(() => {
    if (!activeRoom?.pin || typeof window === 'undefined') return '';
    let origin = window.location.origin;
    if (origin.includes('.run.app') || origin.includes('localhost')) {
      origin = 'https://dbvtudo.vercel.app';
    }
    const base = origin.replace(/\/$/, '') + '/';
    return `${base}?prova=${activeRoom.pin}`;
  }, [activeRoom?.pin]);

  useEffect(() => {
    if (!examShareUrl) {
      setQrCodeDataUrl('');
      return;
    }
    QRCode.toDataURL(examShareUrl, {
      width: 560,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [examShareUrl]);

  // Salva a sala ativa do instrutor no localStorage, no servidor (/api/live-exam) e no Supabase Storage (nuvem)
  const persistHostRoom = useCallback((room: LiveExamRoomState | null) => {
    setActiveRoom(room);
    activeRoomRef.current = room;
    try {
      if (room) {
        localStorage.setItem('dbv_instructor_active_exam_room', JSON.stringify(room));
        fetch('/api/live-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'UPSERT_ROOM', room })
        }).catch(() => {});
        supabaseQfpy.storage
          .from('App DBV Tudo')
          .upload(`provas/room_${room.pin}.json`, JSON.stringify(room), {
            upsert: true,
            contentType: 'application/json',
            cacheControl: '0'
          })
          .catch(() => {});
      } else {
        localStorage.removeItem('dbv_instructor_active_exam_room');
      }
    } catch {}
  }, []);

  // ============================================================================
  // SINCRONIZAÇÃO EM TEMPO REAL DO INSTRUTOR (SUPABASE REALTIME + NUVEM + SERVER POLL)
  // ============================================================================
  useEffect(() => {
    if (!activeRoom?.pin) return;

    const pin = activeRoom.pin;
    const channelName = `dbv_live_exam_${pin}`;
    const channel = supabaseQfpy.channel(channelName, {
      config: { broadcast: { self: true } }
    });
    hostChannelRef.current = channel;

    const broadcastFullRoomSync = (roomToBroadcast: LiveExamRoomState) => {
      channel
        .send({
          type: 'broadcast',
          event: 'host:room_sync',
          payload: { room: roomToBroadcast }
        })
        .catch(() => {});
    };

    channel
      .on('broadcast', { event: 'student:request_sync' }, () => {
        if (activeRoomRef.current) {
          broadcastFullRoomSync(activeRoomRef.current);
        }
      })
      .on('broadcast', { event: 'student:join' }, ({ payload }) => {
        if (!payload?.participant || !activeRoomRef.current) return;
        const p: LiveExamParticipant = payload.participant;
        const current = activeRoomRef.current;
        const existing = current.participants[p.id];
        const mergedParticipant: LiveExamParticipant = existing
          ? {
              ...existing,
              name: p.name || existing.name,
              unit: p.unit || existing.unit,
              status:
                existing.status === 'FINISHED' || existing.status === 'DISQUALIFIED'
                  ? existing.status
                  : existing.isLocked
                  ? 'LOCKED_CHEAT'
                  : current.status === 'ACTIVE'
                  ? 'PLAYING'
                  : 'WAITING'
            }
          : {
              ...p,
              status: current.status === 'ACTIVE' ? 'PLAYING' : 'WAITING'
            };

        const updated: LiveExamRoomState = {
          ...current,
          participants: {
            ...current.participants,
            [p.id]: mergedParticipant
          },
          updatedAt: Date.now()
        };
        persistHostRoom(updated);
        broadcastFullRoomSync(updated);
      })
      .on('broadcast', { event: 'student:update' }, ({ payload }) => {
        if (!payload?.participant || !activeRoomRef.current) return;
        const p: LiveExamParticipant = payload.participant;
        const current = activeRoomRef.current;
        const prevP = current.participants[p.id];
        // Preserva bloqueio ou desclassificação decidida pelo instrutor
        const isLocked = prevP?.status === 'DISQUALIFIED' ? true : p.isLocked;
        const status =
          prevP?.status === 'DISQUALIFIED'
            ? 'DISQUALIFIED'
            : p.status === 'FINISHED'
            ? 'FINISHED'
            : isLocked
            ? 'LOCKED_CHEAT'
            : p.status;

        const updated: LiveExamRoomState = {
          ...current,
          participants: {
            ...current.participants,
            [p.id]: {
              ...prevP,
              ...p,
              isLocked,
              status
            }
          },
          updatedAt: Date.now()
        };
        persistHostRoom(updated);
        broadcastFullRoomSync(updated);
      })
      .on('broadcast', { event: 'student:cheat_alert' }, ({ payload }) => {
        if (!payload?.alert || !payload?.participant || !activeRoomRef.current) return;
        const alertItem: LiveExamCheatAlert = payload.alert;
        const p: LiveExamParticipant = payload.participant;
        const current = activeRoomRef.current;

        if (soundEnabledRef.current) {
          playCheatAlertSound();
        }

        const shouldLock = current.lockOnCheat;
        const updatedParticipant: LiveExamParticipant = {
          ...(current.participants[p.id] || p),
          ...p,
          isLocked: shouldLock,
          status: shouldLock ? 'LOCKED_CHEAT' : p.status
        };

        const alreadyHasAlert = current.alerts.some((a) => a.id === alertItem.id);
        const updated: LiveExamRoomState = {
          ...current,
          participants: {
            ...current.participants,
            [p.id]: updatedParticipant
          },
          alerts: alreadyHasAlert ? current.alerts : [alertItem, ...current.alerts],
          updatedAt: Date.now()
        };
        persistHostRoom(updated);
        broadcastFullRoomSync(updated);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && activeRoomRef.current) {
          broadcastFullRoomSync(activeRoomRef.current);
        }
      });

    // Sincronização complementar via servidor e nuvem Supabase a cada 2,5s (permite testar no AI Studio com celular lendo QR Code no Vercel)
    const pollInterval = setInterval(async () => {
      try {
        let externalRoom: LiveExamRoomState | null = null;
        try {
          const res = await fetch(`/api/live-exam?pin=${pin}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.room) externalRoom = data.room;
          }
        } catch {}

        if (!externalRoom) {
          try {
            const { data: blob } = await supabaseQfpy.storage
              .from('App DBV Tudo')
              .download(`provas/room_${pin}.json`);
            if (blob) {
              const text = await blob.text();
              const parsed = JSON.parse(text);
              if (parsed && String(parsed.pin) === String(pin)) {
                externalRoom = parsed;
              }
            }
          } catch {}
        }

        if (externalRoom && activeRoomRef.current) {
          const localRoom = activeRoomRef.current;
          let changed = false;
          const mergedParticipants = { ...localRoom.participants };

          Object.values(externalRoom.participants || {}).forEach((sp) => {
            const lp = mergedParticipants[sp.id];
            if (
              !lp ||
              sp.answeredCount > lp.answeredCount ||
              sp.cheatCount > lp.cheatCount ||
              (sp.status === 'FINISHED' && lp.status !== 'FINISHED')
            ) {
              if (sp.cheatCount > (lp?.cheatCount || 0) && soundEnabledRef.current) {
                playCheatAlertSound();
              }
              mergedParticipants[sp.id] = sp;
              changed = true;
            }
          });

          const existingAlertIds = new Set(localRoom.alerts.map((a) => a.id));
          const mergedAlerts = [...localRoom.alerts];
          (externalRoom.alerts || []).forEach((sa) => {
            if (!existingAlertIds.has(sa.id)) {
              mergedAlerts.unshift(sa);
              changed = true;
            }
          });

          if (changed) {
            const nextRoom: LiveExamRoomState = {
              ...localRoom,
              participants: mergedParticipants,
              alerts: mergedAlerts,
              updatedAt: Date.now()
            };
            persistHostRoom(nextRoom);
            broadcastFullRoomSync(nextRoom);
          }
        }
      } catch {}
    }, 2500);

    return () => {
      clearInterval(pollInterval);
      supabaseQfpy.removeChannel(channel);
      hostChannelRef.current = null;
    };
  }, [activeRoom?.pin, persistHostRoom]);

  // Cronômetro regressivo da sala ativa no painel do Instrutor
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'ACTIVE' || !activeRoom.startedAt) {
      setHostRemainingSeconds(activeRoom ? activeRoom.durationMinutes * 60 : 0);
      return;
    }

    const updateTimer = () => {
      const totalAllowed = activeRoom.durationMinutes * 60 + (activeRoom.extraSecondsAdded || 0);
      const elapsed = Math.floor((Date.now() - (activeRoom.startedAt || Date.now())) / 1000);
      const remaining = Math.max(0, totalAllowed - elapsed);
      setHostRemainingSeconds(remaining);

      if (remaining <= 0 && activeRoomRef.current && activeRoomRef.current.status === 'ACTIVE') {
        const finishedRoom: LiveExamRoomState = {
          ...activeRoomRef.current,
          status: 'FINISHED',
          updatedAt: Date.now()
        };
        persistHostRoom(finishedRoom);
        hostChannelRef.current
          ?.send({
            type: 'broadcast',
            event: 'host:room_sync',
            payload: { room: finishedRoom }
          })
          .catch(() => {});
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeRoom, persistHostRoom]);

  // ============================================================================
  // GERAÇÃO DE QUESTÕES DA ESPECIALIDADE (IA + REQUISITOS OFICIAIS)
  // ============================================================================
  const handleSelectSpecialtyForExam = async (spec: Especialidade) => {
    setSelectedSpecialty(spec);
    setIsGeneratingQuestions(true);

    try {
      let reqs = spec.requisitos || [];
      if (reqs.length === 0) {
        reqs = await fetchEspecialidadeRequisitos(club, spec.id);
      }

      const clubLabel = isPathfinder ? 'Clube de Desbravadores' : 'Clube de Aventureiros';
      const reqsContext =
        reqs.length > 0
          ? `Requisitos oficiais cadastrados para a especialidade "${spec.nome}":\n${reqs
              .map((r, i) => `${i + 1}. ${r}`)
              .join('\n')}`
          : `Especialidade oficial "${spec.nome}" da área "${spec.area}" do ${clubLabel}.`;

      const prompt = `Você é um Instrutor Oficial de Especialidades do ${clubLabel} (Divisão Sul-Americana da IASD).
Elabore uma prova oficial com exatamente ${questionCount} questões de múltipla escolha para avaliar a especialidade "${spec.nome}" (Área: ${spec.area}).

${reqsContext}

REGRAS OBRIGATÓRIAS:
1. Cada questão deve avaliar conhecimentos reais e técnicos exigidos nos requisitos desta especialidade.
2. Cada questão deve conter exatamente 4 alternativas ("options": array de 4 strings sem letras A/B/C/D no início) e apenas 1 correta ("correctIndex": 0, 1, 2 ou 3).
3. Retorne EXCLUSIVAMENTE um JSON array válido no formato:
[
  {
    "question": "Pergunta clara e objetiva sobre a especialidade?",
    "options": ["Alternativa 1", "Alternativa 2", "Alternativa 3", "Alternativa 4"],
    "correctIndex": 0,
    "explanation": "Resumo curto explicando a resposta correta."
  }
]`;

      let parsedQuestions: any[] = [];

      // 1. Tenta via rota server-side (/api/gemini/generate-didactic)
      try {
        const res = await fetch('/api/gemini/generate-didactic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            responseMimeType: 'application/json',
            temperature: 0.45
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.text) {
            const clean = data.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
            const first = clean.indexOf('[');
            const last = clean.lastIndexOf(']');
            if (first !== -1 && last > first) {
              parsedQuestions = JSON.parse(clean.substring(first, last + 1));
            }
          }
        }
      } catch {}

      // 2. Tenta direto via chave Gemini se necessário
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        try {
          const apiKey = await resolveGeminiApiKey();
          if (apiKey) {
            const res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: { responseMimeType: 'application/json', temperature: 0.45 }
                })
              }
            );
            if (res.ok) {
              const data = await res.json();
              const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const clean = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
              const first = clean.indexOf('[');
              const last = clean.lastIndexOf(']');
              if (first !== -1 && last > first) {
                parsedQuestions = JSON.parse(clean.substring(first, last + 1));
              }
            }
          }
        } catch {}
      }

      if (Array.isArray(parsedQuestions) && parsedQuestions.length >= 3) {
        const formatted: LiveExamQuestion[] = parsedQuestions.slice(0, questionCount).map((q, idx) => {
          const rawOpts =
            Array.isArray(q.options) && q.options.length >= 4
              ? q.options.slice(0, 4).map((o: any) => String(o).replace(/^[A-Da-d][\)\.\-]\s*/, '').trim())
              : ['Opção A', 'Opção B', 'Opção C', 'Opção D'];
          const safeCorrect =
            typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4 ? q.correctIndex : 0;
          // Equilibra posição da alternativa correta
          const targetSlot = idx % 4;
          const reordered = [...rawOpts];
          const correctText = reordered[safeCorrect];
          reordered[safeCorrect] = reordered[targetSlot];
          reordered[targetSlot] = correctText;

          return {
            id: `live_q_${Date.now()}_${idx}`,
            question: String(q.question || `Questão ${idx + 1} - ${spec.nome}`),
            options: reordered,
            correctIndex: targetSlot,
            explanation: String(q.explanation || '')
          };
        });
        setQuestions(formatted);
      } else {
        setQuestions(buildFallbackSpecialtyQuestions(spec, reqs, questionCount));
      }
    } catch {
      setQuestions(buildFallbackSpecialtyQuestions(spec, spec.requisitos || [], questionCount));
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  useEffect(() => {
    if (preselectedSpecialty && questions.length === 0 && !isGeneratingQuestions) {
      handleSelectSpecialtyForExam(preselectedSpecialty);
    }
  }, [preselectedSpecialty]);

  // Cria a Sala da Prova com PIN de 6 dígitos e QR Code
  const handleCreateLiveExamRoom = () => {
    if (!selectedSpecialty || questions.length === 0) return;
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const newRoom: LiveExamRoomState = {
      pin,
      club,
      specialtyId: selectedSpecialty.id,
      specialtyName: selectedSpecialty.nome,
      specialtyArea: selectedSpecialty.area || 'Especialidades',
      specialtyLogo: getImageUrl(selectedSpecialty.logo),
      specialtyCode: selectedSpecialty.codigo || selectedSpecialty.sigla || `ESP-${selectedSpecialty.id}`,
      durationMinutes,
      passingScorePercent,
      lockOnCheat,
      status: 'WAITING',
      startedAt: null,
      extraSecondsAdded: 0,
      questions,
      participants: {},
      alerts: [],
      updatedAt: Date.now()
    };
    persistHostRoom(newRoom);
  };

  // Comandos do Instrutor na Sala Ao Vivo
  const handleStartExamForAll = () => {
    if (!activeRoom) return;
    const updatedParticipants: Record<string, LiveExamParticipant> = {};
    Object.values(activeRoom.participants).forEach((p) => {
      updatedParticipants[p.id] = {
        ...p,
        status: p.isLocked ? 'LOCKED_CHEAT' : p.status === 'FINISHED' ? 'FINISHED' : 'PLAYING'
      };
    });

    const updated: LiveExamRoomState = {
      ...activeRoom,
      status: 'ACTIVE',
      startedAt: Date.now(),
      participants: updatedParticipants,
      updatedAt: Date.now()
    };
    persistHostRoom(updated);
    hostChannelRef.current
      ?.send({
        type: 'broadcast',
        event: 'host:room_sync',
        payload: { room: updated }
      })
      .catch(() => {});
  };

  const handleAddExtraTime = (minutesToAdd: number) => {
    if (!activeRoom) return;
    const updated: LiveExamRoomState = {
      ...activeRoom,
      extraSecondsAdded: (activeRoom.extraSecondsAdded || 0) + minutesToAdd * 60,
      updatedAt: Date.now()
    };
    persistHostRoom(updated);
    hostChannelRef.current
      ?.send({
        type: 'broadcast',
        event: 'host:room_sync',
        payload: { room: updated }
      })
      .catch(() => {});
  };

  const handleFinishExamForAll = () => {
    if (!activeRoom) return;
    const updated: LiveExamRoomState = {
      ...activeRoom,
      status: 'FINISHED',
      updatedAt: Date.now()
    };
    persistHostRoom(updated);
    hostChannelRef.current
      ?.send({
        type: 'broadcast',
        event: 'host:room_sync',
        payload: { room: updated }
      })
      .catch(() => {});
  };

  const handleUnlockStudent = (targetStudentId: string) => {
    if (!activeRoom) return;
    const target = activeRoom.participants[targetStudentId];
    if (!target) return;

    const updated: LiveExamRoomState = {
      ...activeRoom,
      participants: {
        ...activeRoom.participants,
        [targetStudentId]: {
          ...target,
          isLocked: false,
          status: activeRoom.status === 'ACTIVE' ? 'PLAYING' : 'WAITING'
        }
      },
      updatedAt: Date.now()
    };
    persistHostRoom(updated);
    hostChannelRef.current
      ?.send({
        type: 'broadcast',
        event: 'host:unlock_student',
        payload: { studentId: targetStudentId }
      })
      .catch(() => {});
    hostChannelRef.current
      ?.send({
        type: 'broadcast',
        event: 'host:room_sync',
        payload: { room: updated }
      })
      .catch(() => {});
  };

  const handleLockOrDisqualifyStudent = (targetStudentId: string, disqualify = false) => {
    if (!activeRoom) return;
    const target = activeRoom.participants[targetStudentId];
    if (!target) return;

    const updated: LiveExamRoomState = {
      ...activeRoom,
      participants: {
        ...activeRoom.participants,
        [targetStudentId]: {
          ...target,
          isLocked: true,
          status: disqualify ? 'DISQUALIFIED' : 'LOCKED_CHEAT'
        }
      },
      updatedAt: Date.now()
    };
    persistHostRoom(updated);
    hostChannelRef.current
      ?.send({
        type: 'broadcast',
        event: 'host:room_sync',
        payload: { room: updated }
      })
      .catch(() => {});
  };

  const handleCloseAndResetRoom = () => {
    persistHostRoom(null);
    setIsQrFullscreenModalOpen(false);
    setInspectingStudent(null);
  };

  // ============================================================================
  // LÓGICA DO ALUNO (CONEXÃO NA SALA + SISTEMA ANTI-COLA + SUBMISSÃO)
  // ============================================================================
  const requestExamFullscreen = async () => {
    try {
      const elem = document.documentElement as any;
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
      }
    } catch {}
    try {
      if ('wakeLock' in navigator) {
        await (navigator as any).wakeLock.request('screen');
      }
    } catch {}
  };

  const buildCurrentParticipantPayload = useCallback(
    (
      overrides?: Partial<LiveExamParticipant>,
      customAnswers?: Record<number, number>,
      customRoom?: LiveExamRoomState | null
    ): LiveExamParticipant => {
      const roomObj = customRoom || studentRoom;
      const ans = customAnswers || studentAnswers;
      const qList = roomObj?.questions || [];
      const totalQ = qList.length || 1;
      let correct = 0;
      Object.entries(ans).forEach(([qIdxStr, chosenOpt]) => {
        const qItem = qList[Number(qIdxStr)];
        if (qItem && qItem.correctIndex === chosenOpt) {
          correct += 1;
        }
      });
      const answeredCount = Object.keys(ans).length;
      const scorePercent = Math.round((correct / totalQ) * 100);
      const grade10 = Number(((correct / totalQ) * 10).toFixed(1));

      return {
        id: studentId,
        name: studentName.trim() || 'Desbravador',
        unit: studentUnit.trim() || 'Geral',
        status: studentLocked ? 'LOCKED_CHEAT' : studentPhase === 'FINISHED' ? 'FINISHED' : 'PLAYING',
        joinedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        currentQuestionIdx: studentCurrentQ,
        answeredCount,
        correctCount: correct,
        scorePercent,
        grade10,
        cheatCount: studentCheatCount,
        lastCheatReason: studentLastCheatReason,
        isLocked: studentLocked,
        answers: ans,
        ...overrides
      };
    },
    [
      studentRoom,
      studentAnswers,
      studentId,
      studentName,
      studentUnit,
      studentLocked,
      studentPhase,
      studentCurrentQ,
      studentCheatCount,
      studentLastCheatReason
    ]
  );

  // Auxiliar para sincronizar dados do aluno também no arquivo da sala no Supabase Storage
  const syncStudentToCloudRoom = useCallback(
    async (pin: string, participant: LiveExamParticipant, newAlert?: LiveExamCheatAlert) => {
      try {
        const { data: blob } = await supabaseQfpy.storage
          .from('App DBV Tudo')
          .download(`provas/room_${pin}.json`);
        if (!blob) return;
        const text = await blob.text();
        const cloudRoom: LiveExamRoomState = JSON.parse(text);
        if (!cloudRoom || !cloudRoom.pin) return;

        const prevP = cloudRoom.participants?.[participant.id];
        const isLocked =
          prevP?.status === 'DISQUALIFIED'
            ? true
            : newAlert && cloudRoom.lockOnCheat
            ? true
            : participant.isLocked;
        const nextStatus =
          prevP?.status === 'DISQUALIFIED'
            ? 'DISQUALIFIED'
            : isLocked
            ? 'LOCKED_CHEAT'
            : participant.status;

        cloudRoom.participants = {
          ...(cloudRoom.participants || {}),
          [participant.id]: {
            ...prevP,
            ...participant,
            isLocked,
            status: nextStatus
          }
        };

        if (newAlert) {
          const alertsList = Array.isArray(cloudRoom.alerts) ? cloudRoom.alerts : [];
          if (!alertsList.some((a) => a.id === newAlert.id)) {
            cloudRoom.alerts = [newAlert, ...alertsList];
          }
        }
        cloudRoom.updatedAt = Date.now();

        await supabaseQfpy.storage
          .from('App DBV Tudo')
          .upload(`provas/room_${pin}.json`, JSON.stringify(cloudRoom), {
            upsert: true,
            contentType: 'application/json',
            cacheControl: '0'
          });
      } catch {}
    },
    []
  );

  // Conecta o Aluno à Sala pelo PIN (via Servidor + Supabase Realtime + Supabase Storage)
  const handleStudentJoinRoom = async () => {
    const cleanPin = studentPinInput.replace(/\D/g, '').trim();
    if (cleanPin.length !== 6) {
      setStudentError('Digite o código PIN de 6 dígitos da prova.');
      return;
    }
    if (!studentName.trim()) {
      setStudentError('Informe seu Nome Completo para entrar na prova.');
      return;
    }

    setStudentError(null);
    setIsConnectingRoom(true);

    try {
      localStorage.setItem('dbv_exam_student_name', studentName.trim());
      localStorage.setItem('dbv_exam_student_unit', studentUnit.trim());
    } catch {}

    await requestExamFullscreen();

    let resolvedRoom: LiveExamRoomState | null = null;

    // 1. Tenta buscar estado imediato no servidor (/api/live-exam), localStorage ou nuvem Supabase
    try {
      const res = await fetch(`/api/live-exam?pin=${cleanPin}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.room) {
          resolvedRoom = data.room;
        }
      }
    } catch {}

    if (!resolvedRoom) {
      try {
        const localSaved = localStorage.getItem('dbv_instructor_active_exam_room');
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          if (parsed && String(parsed.pin) === cleanPin) {
            resolvedRoom = parsed;
          }
        }
      } catch {}
    }

    if (!resolvedRoom) {
      try {
        const { data: blob } = await supabaseQfpy.storage
          .from('App DBV Tudo')
          .download(`provas/room_${cleanPin}.json`);
        if (blob) {
          const text = await blob.text();
          const parsed = JSON.parse(text);
          if (parsed && String(parsed.pin) === cleanPin) {
            resolvedRoom = parsed;
          }
        }
      } catch {}
    }

    // 2. Conecta no canal Supabase Realtime da sala
    if (studentChannelRef.current) {
      supabaseQfpy.removeChannel(studentChannelRef.current);
    }

    const channel = supabaseQfpy.channel(`dbv_live_exam_${cleanPin}`, {
      config: { broadcast: { self: true } }
    });
    studentChannelRef.current = channel;

    let didResolveFromHost = false;

    channel
      .on('broadcast', { event: 'host:room_sync' }, ({ payload }) => {
        if (!payload?.room) return;
        const incomingRoom: LiveExamRoomState = payload.room;
        didResolveFromHost = true;
        setStudentRoom(incomingRoom);
        setIsConnectingRoom(false);

        const myRecord = incomingRoom.participants?.[studentId];
        if (myRecord) {
          setStudentLocked(myRecord.isLocked);
          if (!myRecord.isLocked) {
            setStudentWarningModal(null);
          }
        }

        if (incomingRoom.status === 'ACTIVE') {
          setStudentPhase((prev) => (prev === 'FINISHED' ? 'FINISHED' : 'PLAYING'));
          setStudentStartTime((prev) => prev || Date.now());
        } else if (incomingRoom.status === 'FINISHED') {
          setStudentPhase('FINISHED');
        } else {
          setStudentPhase((prev) => (prev === 'FINISHED' ? 'FINISHED' : 'WAITING_HOST'));
        }
      })
      .on('broadcast', { event: 'host:unlock_student' }, ({ payload }) => {
        if (payload?.studentId === studentId) {
          setStudentLocked(false);
          setStudentWarningModal(null);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const initialParticipant: LiveExamParticipant = {
            id: studentId,
            name: studentName.trim(),
            unit: studentUnit.trim() || 'Sem Unidade',
            status: resolvedRoom?.status === 'ACTIVE' ? 'PLAYING' : 'WAITING',
            joinedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            currentQuestionIdx: 0,
            answeredCount: 0,
            correctCount: 0,
            scorePercent: 0,
            grade10: 0,
            cheatCount: 0,
            isLocked: false,
            answers: {}
          };

          await channel.send({
            type: 'broadcast',
            event: 'student:join',
            payload: { participant: initialParticipant }
          });
          await channel.send({
            type: 'broadcast',
            event: 'student:request_sync',
            payload: { pin: cleanPin, studentId }
          });

          fetch('/api/live-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'STUDENT_UPDATE',
              pin: cleanPin,
              participant: initialParticipant
            })
          }).catch(() => {});

          syncStudentToCloudRoom(cleanPin, initialParticipant);
        }
      });

    if (resolvedRoom) {
      setStudentRoom(resolvedRoom);
      setIsConnectingRoom(false);
      if (resolvedRoom.status === 'ACTIVE') {
        setStudentPhase('PLAYING');
        setStudentStartTime(Date.now());
      } else if (resolvedRoom.status === 'FINISHED') {
        setStudentPhase('FINISHED');
      } else {
        setStudentPhase('WAITING_HOST');
      }
      return;
    }

    // Aguarda até 4s pela resposta WebSocket caso não estivesse no cache HTTP
    setTimeout(() => {
      if (!didResolveFromHost && !studentRoom) {
        setIsConnectingRoom(false);
        setStudentError(
          'Sala não encontrada ou o instrutor ainda não abriu esta sala. Confira o PIN de 6 dígitos.'
        );
      }
    }, 4000);
  };

  // Polling complementar do Aluno para sincronizar status da sala / desbloqueio do instrutor (Servidor + Supabase Nuvem)
  useEffect(() => {
    if (roleMode !== 'STUDENT' || studentPhase === 'ENTER_PIN' || !studentRoom?.pin) return;
    const pin = studentRoom.pin;

    const interval = setInterval(async () => {
      try {
        let srv: LiveExamRoomState | null = null;
        try {
          const res = await fetch(`/api/live-exam?pin=${pin}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.room) srv = data.room;
          }
        } catch {}

        if (!srv) {
          try {
            const { data: blob } = await supabaseQfpy.storage
              .from('App DBV Tudo')
              .download(`provas/room_${pin}.json`);
            if (blob) {
              const text = await blob.text();
              const parsed = JSON.parse(text);
              if (parsed && String(parsed.pin) === String(pin)) {
                srv = parsed;
              }
            }
          } catch {}
        }

        if (srv) {
          setStudentRoom(srv);
          const me = srv.participants?.[studentId];
          if (me) {
            setStudentLocked(me.isLocked);
            if (!me.isLocked) setStudentWarningModal(null);
            if (me.status === 'DISQUALIFIED') {
              setStudentLocked(true);
            }
          }
          if (srv.status === 'ACTIVE' && studentPhase === 'WAITING_HOST') {
            setStudentPhase('PLAYING');
            setStudentStartTime((prev) => prev || Date.now());
          } else if (srv.status === 'FINISHED' && studentPhase !== 'FINISHED') {
            setStudentPhase('FINISHED');
          }
        }
      } catch {}
    }, 2500);

    return () => clearInterval(interval);
  }, [roleMode, studentPhase, studentRoom?.pin, studentId]);

  // ============================================================================
  // DETECTOR ANTI-COLA EM TEMPO REAL NO CELULAR/PC DO ALUNO
  // (Minimizar tela, trocar de aba, perder foco da janela ou sair da tela cheia)
  // ============================================================================
  const triggerStudentCheatViolation = useCallback(
    (reason: string) => {
      if (roleMode !== 'STUDENT' || studentPhase !== 'PLAYING' || !studentRoom) return;

      const now = Date.now();
      // Evita disparo duplicado no mesmo segundo quando blur + visibilitychange ocorrem juntos
      if (now - lastCheatTimestampRef.current < 1200) return;
      lastCheatTimestampRef.current = now;

      const nextCount = studentCheatCount + 1;
      const timeStr = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const shouldLock = studentRoom.lockOnCheat;
      setStudentCheatCount(nextCount);
      setStudentLastCheatReason(reason);
      if (shouldLock) {
        setStudentLocked(true);
      } else {
        setStudentWarningModal(reason);
      }

      const alertEvent: LiveExamCheatAlert = {
        id: `alert_${studentId}_${now}`,
        studentId,
        studentName: studentName.trim() || 'Aluno',
        studentUnit: studentUnit.trim() || 'Sem Unidade',
        reason,
        timestamp: timeStr,
        violationNumber: nextCount
      };

      const updatedParticipant = buildCurrentParticipantPayload({
        cheatCount: nextCount,
        lastCheatReason: reason,
        lastCheatTime: timeStr,
        isLocked: shouldLock,
        status: shouldLock ? 'LOCKED_CHEAT' : 'PLAYING'
      });

      studentChannelRef.current
        ?.send({
          type: 'broadcast',
          event: 'student:cheat_alert',
          payload: { alert: alertEvent, participant: updatedParticipant }
        })
        .catch(() => {});

      fetch('/api/live-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHEAT_ALERT',
          pin: studentRoom.pin,
          alert: alertEvent,
          participant: updatedParticipant
        })
      }).catch(() => {});

      syncStudentToCloudRoom(studentRoom.pin, updatedParticipant, alertEvent);
    },
    [
      roleMode,
      studentPhase,
      studentRoom,
      studentCheatCount,
      studentId,
      studentName,
      studentUnit,
      buildCurrentParticipantPayload,
      syncStudentToCloudRoom
    ]
  );

  useEffect(() => {
    if (roleMode !== 'STUDENT' || studentPhase !== 'PLAYING') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerStudentCheatViolation('Minimizou o aplicativo ou trocou de aba do navegador');
      }
    };

    const handleWindowBlur = () => {
      triggerStudentCheatViolation('Saiu da janela da prova (abriu outro app, notificação ou tela dividida)');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerStudentCheatViolation('Saiu do modo Tela Cheia obrigatório durante a prova');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [roleMode, studentPhase, triggerStudentCheatViolation]);

  // Cronômetro regressivo do Aluno durante a Prova
  const handleStudentSubmitExam = useCallback(() => {
    if (!studentRoom) return;
    const spent = studentStartTime ? Math.max(1, Math.floor((Date.now() - studentStartTime) / 1000)) : 0;
    const finalParticipant = buildCurrentParticipantPayload({
      status: 'FINISHED',
      isLocked: false,
      finishedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timeSpentSeconds: spent
    });

    setStudentPhase('FINISHED');
    studentChannelRef.current
      ?.send({
        type: 'broadcast',
        event: 'student:update',
        payload: { participant: finalParticipant }
      })
      .catch(() => {});

    fetch('/api/live-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'STUDENT_UPDATE',
        pin: studentRoom.pin,
        participant: finalParticipant
      })
    }).catch(() => {});

    syncStudentToCloudRoom(studentRoom.pin, finalParticipant);
  }, [studentRoom, studentStartTime, buildCurrentParticipantPayload, syncStudentToCloudRoom]);

  useEffect(() => {
    if (roleMode !== 'STUDENT' || studentPhase !== 'PLAYING' || !studentRoom) return;

    const updateStudentTimer = () => {
      const totalAllowed = studentRoom.durationMinutes * 60 + (studentRoom.extraSecondsAdded || 0);
      const baseStart = studentRoom.startedAt || studentStartTime || Date.now();
      const elapsed = Math.floor((Date.now() - baseStart) / 1000);
      const remaining = Math.max(0, totalAllowed - elapsed);
      setStudentRemainingSeconds(remaining);

      if (remaining <= 0) {
        handleStudentSubmitExam();
      }
    };

    updateStudentTimer();
    const t = setInterval(updateStudentTimer, 1000);
    return () => clearInterval(t);
  }, [roleMode, studentPhase, studentRoom, studentStartTime, handleStudentSubmitExam]);

  // Quando o Aluno seleciona uma alternativa na prova
  const handleStudentSelectOption = (questionIndex: number, optionIndex: number) => {
    if (studentLocked || studentPhase !== 'PLAYING' || !studentRoom) return;
    const nextAnswers = {
      ...studentAnswers,
      [questionIndex]: optionIndex
    };
    setStudentAnswers(nextAnswers);

    const updatedParticipant = buildCurrentParticipantPayload(
      {
        currentQuestionIdx: questionIndex,
        status: 'PLAYING'
      },
      nextAnswers
    );

    studentChannelRef.current
      ?.send({
        type: 'broadcast',
        event: 'student:update',
        payload: { participant: updatedParticipant }
      })
      .catch(() => {});

    fetch('/api/live-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'STUDENT_UPDATE',
        pin: studentRoom.pin,
        participant: updatedParticipant
      })
    }).catch(() => {});

    syncStudentToCloudRoom(studentRoom.pin, updatedParticipant);
  };

  const formatTimeMMSS = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ============================================================================
  // PROJEÇÃO DO QR CODE EM OUTRA TELA / TELÃO DA IGREJA (PC / 2ª TELA HDMI)
  // ============================================================================
  const handleProjectQrToAnotherScreen = useCallback(async () => {
    if (!activeRoom || typeof window === 'undefined') return;

    let windowFeatures = 'popup=yes,width=1280,height=720,menubar=no,toolbar=no,location=no,status=no';
    try {
      const anyWin = window as any;
      if (typeof anyWin.getScreenDetails === 'function') {
        const screenDetails = await anyWin.getScreenDetails();
        if (screenDetails?.screens?.length > 1) {
          const externalScreen =
            screenDetails.screens.find((s: any) => s !== screenDetails.currentScreen) ||
            screenDetails.screens[1];
          if (externalScreen) {
            windowFeatures = `popup=yes,left=${externalScreen.availLeft},top=${externalScreen.availTop},width=${externalScreen.availWidth},height=${externalScreen.availHeight},menubar=no,toolbar=no,location=no,status=no`;
          }
        }
      }
    } catch {}

    let projWin = projectorWindowRef.current;
    if (!projWin || projWin.closed) {
      projWin = window.open('', 'DBVTudoTelaoProva', windowFeatures);
      projectorWindowRef.current = projWin;
    } else {
      projWin.focus();
    }

    if (!projWin) return;
    setIsSecondScreenActive(true);

    const pList = Object.values(activeRoom.participants || {}) as LiveExamParticipant[];
    const statusLabel =
      activeRoom.status === 'ACTIVE'
        ? '🟢 PROVA EM ANDAMENTO'
        : activeRoom.status === 'FINISHED'
        ? '🏁 PROVA ENCERRADA'
        : '⏳ AGUARDANDO ALUNOS ESCANEAREM O QR CODE';

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Telão da Prova Ao Vivo — ${activeRoom.specialtyName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: radial-gradient(circle at top, #1e1b4b 0%, #090d16 70%);
      color: #ffffff;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 28px 40px;
      user-select: none;
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 16px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(245, 158, 11, 0.18);
      border: 1px solid rgba(251, 191, 36, 0.35);
      color: #fcd34d;
      padding: 8px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .top-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .hint-text {
      font-size: 12px;
      font-weight: 700;
      color: #94a3b8;
    }
    .fs-btn {
      background: #4f46e5;
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.2);
      padding: 10px 20px;
      border-radius: 14px;
      font-weight: 900;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(79, 70, 229, 0.35);
    }
    .fs-btn:hover { background: #6366f1; }
    .main-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1.25fr;
      gap: 44px;
      align-items: center;
      max-width: 1500px;
      width: 100%;
      margin: 0 auto;
    }
    .qr-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.75);
      border: 2px solid rgba(99, 102, 241, 0.35);
      border-radius: 36px;
      padding: 32px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
      text-align: center;
    }
    .qr-box {
      background: #ffffff;
      padding: 20px;
      border-radius: 28px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.35);
      margin-bottom: 18px;
    }
    .qr-box img {
      width: min(46vh, 380px);
      height: min(46vh, 380px);
      display: block;
    }
    .qr-caption {
      font-size: 15px;
      font-weight: 800;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .info-column {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .spec-header {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .spec-header img {
      width: 84px;
      height: 84px;
      object-fit: contain;
      filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
    }
    .spec-title {
      font-size: clamp(28px, 4vw, 52px);
      font-weight: 900;
      text-transform: uppercase;
      line-height: 1.08;
      letter-spacing: -0.02em;
    }
    .cards-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .stat-card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 28px;
      padding: 24px 28px;
    }
    .stat-label {
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #94a3b8;
      margin-bottom: 6px;
      display: block;
    }
    .pin-value {
      font-size: clamp(36px, 4.5vw, 60px);
      font-weight: 900;
      color: #fbbf24;
      letter-spacing: 0.22em;
    }
    .timer-value {
      font-size: clamp(36px, 4.5vw, 60px);
      font-weight: 900;
      color: #38bdf8;
      font-variant-numeric: tabular-nums;
    }
    .status-banner {
      background: rgba(16, 185, 129, 0.14);
      border: 1px solid rgba(16, 185, 129, 0.35);
      border-radius: 22px;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .status-text {
      font-size: 16px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6ee7b7;
    }
    .count-text {
      font-size: 18px;
      font-weight: 900;
      color: #ffffff;
    }
    .participants-wrap {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 22px;
      padding: 16px 20px;
      min-height: 92px;
      max-height: 150px;
      overflow: hidden;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }
    .chip {
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid rgba(129, 140, 248, 0.4);
      color: #e0e7ff;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 800;
    }
    :fullscreen .top-actions .hint-text { display: none; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="badge">PROVA AO VIVO</div>
    <div class="top-actions">
      <span class="hint-text">Arraste esta janela para o Telão / 2ª Tela e clique ao lado:</span>
      <button class="fs-btn" onclick="if(!document.fullscreenElement){document.documentElement.requestFullscreen().catch(()=>{});}else{document.exitFullscreen().catch(()=>{});}">
        ⛶ Tela Cheia no Telão (F11)
      </button>
    </div>
  </div>
  <div class="main-grid">
    <div class="qr-column">
      <div class="qr-box">
        <img id="telao-qr" src="${qrCodeDataUrl}" alt="QR Code da Prova" />
      </div>
      <div class="qr-caption">Aponte a Câmera do Celular para Entrar na Prova</div>
    </div>
    <div class="info-column">
      <div class="spec-header">
        ${activeRoom.specialtyLogo ? `<img id="telao-logo" src="${activeRoom.specialtyLogo}" referrerpolicy="no-referrer" />` : ''}
        <div>
          <span class="stat-label" style="color:#818cf8;">ESPECIALIDADE EM AVALIAÇÃO</span>
          <h1 id="telao-title" class="spec-title">${activeRoom.specialtyName}</h1>
        </div>
      </div>
      <div class="cards-row">
        <div class="stat-card">
          <span class="stat-label">CÓDIGO PIN DA SALA</span>
          <div id="telao-pin" class="pin-value">${activeRoom.pin}</div>
        </div>
        <div class="stat-card">
          <span class="stat-label">TEMPO RESTANTE</span>
          <div id="telao-timer" class="timer-value">${formatTimeMMSS(hostRemainingSeconds)}</div>
        </div>
      </div>
      <div class="status-banner">
        <span id="telao-status" class="status-text">${statusLabel}</span>
        <span id="telao-count" class="count-text">${pList.length} participante(s) na sala</span>
      </div>
      <div class="participants-wrap">
        <span class="stat-label">PARTICIPANTES CONECTADOS AO VIVO</span>
        <div id="telao-chips" class="chips">
          ${
            pList.length === 0
              ? '<span style="color:#64748b;font-size:13px;font-weight:700;">Aguardando os alunos escanearem o QR Code...</span>'
              : pList
                  .map((p) => `<span class="chip">${p.name} (${p.unit})</span>`)
                  .join('')
          }
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    projWin.document.open();
    projWin.document.write(htmlContent);
    projWin.document.close();

    const checkClosed = setInterval(() => {
      if (!projectorWindowRef.current || projectorWindowRef.current.closed) {
        setIsSecondScreenActive(false);
        clearInterval(checkClosed);
      }
    }, 1500);
  }, [activeRoom, qrCodeDataUrl, hostRemainingSeconds]);

  // Atualiza automaticamente os dados na janela projetada no Telão em tempo real
  useEffect(() => {
    const projWin = projectorWindowRef.current;
    if (!projWin || projWin.closed || !activeRoom) return;
    try {
      const doc = projWin.document;
      const qrEl = doc.getElementById('telao-qr') as HTMLImageElement | null;
      if (qrEl && qrCodeDataUrl && qrEl.src !== qrCodeDataUrl) {
        qrEl.src = qrCodeDataUrl;
      }
      const pinEl = doc.getElementById('telao-pin');
      if (pinEl) pinEl.textContent = activeRoom.pin;

      const timerEl = doc.getElementById('telao-timer');
      if (timerEl) timerEl.textContent = formatTimeMMSS(hostRemainingSeconds);

      const statusEl = doc.getElementById('telao-status');
      if (statusEl) {
        statusEl.textContent =
          activeRoom.status === 'ACTIVE'
            ? '🟢 PROVA EM ANDAMENTO'
            : activeRoom.status === 'FINISHED'
            ? '🏁 PROVA ENCERRADA'
            : '⏳ AGUARDANDO ALUNOS ESCANEAREM O QR CODE';
      }

      const pList = Object.values(activeRoom.participants || {}) as LiveExamParticipant[];
      const countEl = doc.getElementById('telao-count');
      if (countEl) countEl.textContent = `${pList.length} participante(s) na sala`;

      const chipsEl = doc.getElementById('telao-chips');
      if (chipsEl) {
        chipsEl.innerHTML =
          pList.length === 0
            ? '<span style="color:#64748b;font-size:13px;font-weight:700;">Aguardando os alunos escanearem o QR Code...</span>'
            : pList.map((p) => `<span class="chip">${p.name} (${p.unit})</span>`).join('');
      }
    } catch {}
  }, [activeRoom, qrCodeDataUrl, hostRemainingSeconds]);

  // ============================================================================
  // RENDERIZAÇÃO: MODO ALUNO (ÁREA SEPARADA E ISOLADA DE PROVA)
  // ============================================================================
  if (roleMode === 'STUDENT') {
    const mySummary = buildCurrentParticipantPayload();
    const totalQuestions = studentRoom?.questions.length || 1;
    const activeQuestion = studentRoom?.questions[studentCurrentQ];
    const resetMobileViewportScroll = () => {
      try {
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 60);
      } catch {}
    };

    return (
      <div
        className={`h-full w-full bg-slate-950 text-white flex flex-col overflow-hidden ${
          studentPhase === 'PLAYING' ? 'select-none' : ''
        }`}
        onCopy={studentPhase === 'PLAYING' ? (e) => e.preventDefault() : undefined}
        onCut={studentPhase === 'PLAYING' ? (e) => e.preventDefault() : undefined}
        onContextMenu={studentPhase === 'PLAYING' ? (e) => e.preventDefault() : undefined}
      >
        {/* Topbar Exclusiva da Área Isolada de Prova */}
        <div className="shrink-0 bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">
                Ambiente Isolado de Prova • Anti-Cola Ativo
              </span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight text-white truncate">
                {studentRoom ? `Especialidade: ${studentRoom.specialtyName}` : 'Acesso à Prova Oficial por QR Code / PIN'}
              </h2>
            </div>
          </div>

          {studentPhase === 'PLAYING' ? (
            <div className="flex items-center gap-2 shrink-0">
              {studentCheatCount > 0 && (
                <span className="px-2.5 py-1 rounded-xl bg-red-600/25 border border-red-500/50 text-red-300 text-[10px] font-black uppercase">
                  ⚠️ {studentCheatCount} {studentCheatCount === 1 ? 'Alerta' : 'Alertas'}
                </span>
              )}
              <div
                className={`px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm tabular-nums flex items-center gap-1.5 border ${
                  studentRemainingSeconds <= 60
                    ? 'bg-red-600 text-white border-red-500 animate-pulse'
                    : 'bg-slate-800 text-amber-300 border-slate-700'
                }`}
              >
                <Timer size={15} />
                <span>{formatTimeMMSS(studentRemainingSeconds)}</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (onExitIsolatedMode) {
                  onExitIsolatedMode();
                } else {
                  setRoleMode('HOST');
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut size={13} />
              <span>{activeRoom ? 'Voltar ao Painel' : 'Sair da Prova'}</span>
            </button>
          )}
        </div>

        {/* CONTEÚDO PRINCIPAL DO ALUNO (Scroll Fluido sem Travar com Teclado Mobile) */}
        <div className="flex-1 w-full overflow-y-auto overscroll-contain px-4 py-4 sm:py-8 pb-28 scrollbar-hide">
          {/* MODAL DE ESCOLHA: ABRIR NO APP INSTALADO OU NO NAVEGADOR PADRÃO (Exibido apenas se possuir o App instalado) */}
          {showOpenModeChoiceModal && studentPhase === 'ENTER_PIN' && (
            <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-[28px] p-5 sm:p-6 shadow-2xl space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto">
                  <Smartphone size={28} />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                    App DBV Tudo Detectado
                  </span>
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                    Onde deseja abrir a Prova?
                  </h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Identificamos que você possui o aplicativo <strong>DBV Tudo</strong> instalado neste aparelho. Escolha como prefere responder à prova da sala{' '}
                    <strong className="text-amber-300">{studentPinInput || initialPin}</strong>:
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {isRunningInStandaloneApp ? (
                    <button
                      type="button"
                      onClick={() => {
                        const pinCode = (studentPinInput || initialPin || '').replace(/\D/g, '');
                        try {
                          sessionStorage.setItem(`dbv_qr_open_choice_${pinCode || 'active'}`, 'app');
                        } catch {}
                        setShowOpenModeChoiceModal(false);
                      }}
                      className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Smartphone size={17} />
                      <span>Abrir no Aplicativo DBV Tudo</span>
                    </button>
                  ) : (
                    <a
                      href={`${window.location.origin}/?prova=${(studentPinInput || initialPin || '').replace(/\D/g, '')}&open_mode=app`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        const pinCode = (studentPinInput || initialPin || '').replace(/\D/g, '');
                        try {
                          sessionStorage.setItem(`dbv_qr_open_choice_${pinCode || 'active'}`, 'app');
                        } catch {}
                        setTimeout(() => {
                          setShowOpenModeChoiceModal(false);
                        }, 400);
                      }}
                      className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer no-underline"
                    >
                      <Smartphone size={17} />
                      <span>Abrir no Aplicativo DBV Tudo</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const pinCode = (studentPinInput || initialPin || '').replace(/\D/g, '');
                      try {
                        sessionStorage.setItem(`dbv_qr_open_choice_${pinCode || 'active'}`, 'browser');
                      } catch {}
                      setShowOpenModeChoiceModal(false);

                      const ua = navigator.userAgent || '';
                      const isAndroid = /\bAndroid\b/i.test(ua);
                      const isInAppWebView = /; wv\)|Instagram|FBAN|FBAV|Line\/|MicroMessenger/i.test(ua);

                      if (isRunningInStandaloneApp && isAndroid && pinCode) {
                        // Se estava dentro do App instalado e escolheu abrir no navegador padrão
                        const intentUrl = `intent://${window.location.host}/?prova=${pinCode}&open_mode=browser#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
                        window.location.href = intentUrl;
                      } else if (isAndroid && isInAppWebView && pinCode) {
                        const intentUrl = `intent://${window.location.host}/?prova=${pinCode}&open_mode=browser#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
                        window.location.href = intentUrl;
                      }
                    }}
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Globe size={17} />
                    <span>Abrir no Navegador Padrão</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. TELA DE ENTRADA COM PIN E IDENTIFICAÇÃO DO ALUNO */}
          {studentPhase === 'ENTER_PIN' && (
            <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[28px] p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto mb-2">
                  <QrCode size={28} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Sala de Avaliação • {isPathfinder ? 'Desbravadores' : 'Aventureiros'}
                </span>
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                  Entrar na Prova da Especialidade
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Confirme o código PIN da sala e identifique-se para iniciar em modo de tela bloqueada.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Código PIN da Sala (6 dígitos)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={studentPinInput}
                    onChange={(e) => setStudentPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onBlur={resetMobileViewportScroll}
                    placeholder="Ex: 482915"
                    style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                    className="w-full select-text bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-3 text-center text-xl font-black tracking-[0.35em] text-amber-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="studentFullName"
                    autoComplete="name"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck={false}
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    onBlur={resetMobileViewportScroll}
                    placeholder="Digite seu nome e sobrenome"
                    style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                    className="w-full select-text bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-base font-bold text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    Sua Unidade / Clube
                  </label>
                  <input
                    type="text"
                    name="studentUnitName"
                    autoComplete="organization"
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck={false}
                    value={studentUnit}
                    onChange={(e) => setStudentUnit(e.target.value)}
                    onBlur={resetMobileViewportScroll}
                    placeholder="Ex: Unidade Águia / Clube Orion"
                    style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
                    className="w-full select-text bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-base font-bold text-white placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Aviso das Regras Anti-Cola */}
              <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-red-400 font-black text-[11px] uppercase tracking-wider">
                  <ShieldAlert size={16} className="shrink-0" />
                  <span>Sistema Anti-Cola Ativado</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  Durante a prova, <strong>não minimize a tela</strong>, não troque de aba e não abra outros aplicativos. Caso a tela seja minimizada, <strong>o instrutor recebe um alerta imediato</strong> com seu nome e sua prova é bloqueada.
                </p>
              </div>

              {studentError && (
                <div className="p-3 rounded-xl bg-red-600/20 border border-red-500 text-red-200 text-xs font-bold text-center">
                  {studentError}
                </div>
              )}

              <button
                type="button"
                disabled={isConnectingRoom}
                onClick={handleStudentJoinRoom}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isConnectingRoom ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Conectando à Sala...</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={16} />
                    <span>Entrar na Prova em Tela Cheia</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 2. SALA DE ESPERA DO ALUNO (AGUARDANDO O INSTRUTOR INICIAR) */}
          {studentPhase === 'WAITING_HOST' && studentRoom && (
            <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[28px] p-6 text-center space-y-4 shadow-2xl">
              {studentRoom.specialtyLogo && (
                <img
                  src={studentRoom.specialtyLogo}
                  alt={studentRoom.specialtyName}
                  className="w-24 h-24 object-contain mx-auto drop-shadow-xl"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest inline-block">
                  Conectado na Sala #{studentRoom.pin}
                </span>
                <h3 className="text-lg sm:text-xl font-black uppercase text-white mt-2">
                  {studentRoom.specialtyName}
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  {studentRoom.questions.length} Questões • Tempo Limite: {studentRoom.durationMinutes} min
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-black text-indigo-300 uppercase">
                  Participante: {studentName} ({studentUnit || 'Geral'})
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Aguarde o instrutor clicar em <strong>"Iniciar Prova"</strong>. Não minimize esta tela!
                </p>
              </div>
            </div>
          )}

          {/* 3. REALIZAÇÃO DA PROVA PELO ALUNO */}
          {studentPhase === 'PLAYING' && studentRoom && activeQuestion && (
            <div className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-[28px] p-4 sm:p-6 shadow-2xl space-y-4 relative">
              {/* Navegador de Questões em Pílulas */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                  Questão {studentCurrentQ + 1} de {totalQuestions}
                </span>
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5">
                  {studentRoom.questions.map((_, idx) => {
                    const isAnswered = studentAnswers[idx] !== undefined;
                    const isCurrent = idx === studentCurrentQ;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setStudentCurrentQ(idx)}
                        className={`w-7 h-7 rounded-lg text-[11px] font-black transition-all shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                            : isAnswered
                            ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Enunciado da Questão */}
              <div className="py-2">
                <h4 className="text-sm sm:text-base md:text-lg font-black text-white leading-relaxed">
                  {activeQuestion.question}
                </h4>
              </div>

              {/* Alternativas A, B, C, D */}
              <div className="space-y-2.5">
                {activeQuestion.options.map((opt, optIdx) => {
                  const isSelected = studentAnswers[studentCurrentQ] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleStudentSelectOption(studentCurrentQ, optIdx)}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-400'
                          : 'bg-slate-950/90 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-xs sm:text-sm font-bold leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Botões Anterior / Próxima / Entregar Prova */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={studentCurrentQ === 0}
                  onClick={() => setStudentCurrentQ((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft size={15} />
                  <span>Anterior</span>
                </button>

                {studentCurrentQ + 1 < totalQuestions ? (
                  <button
                    type="button"
                    onClick={() => setStudentCurrentQ((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Próxima</span>
                    <ChevronRight size={15} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStudentSubmitExam}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-emerald-600/25 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>Finalizar e Entregar Prova</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. TELA DE CONCLUSÃO / ENTREGA DA PROVA PELO ALUNO */}
          {studentPhase === 'FINISHED' && studentRoom && (
            <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-[28px] p-6 text-center space-y-4 shadow-2xl">
              <div
                className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${
                  mySummary.scorePercent >= studentRoom.passingScorePercent
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                }`}
              >
                <Award size={34} />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  Prova Entregue ao Instrutor
                </span>
                <h3 className="text-xl font-black uppercase text-white">
                  Nota: {mySummary.grade10.toFixed(1)} ({mySummary.scorePercent}%)
                </h3>
                <p className="text-xs text-slate-300 font-bold">
                  Acertos: {mySummary.correctCount} de {studentRoom.questions.length} questões
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-1">
                <p className="font-bold text-slate-300">
                  Aluno: <span className="text-white">{studentName}</span>
                </p>
                <p className="font-bold text-slate-300">
                  Status Anti-Cola:{' '}
                  {studentCheatCount === 0 ? (
                    <span className="text-emerald-400 font-black">0 saídas de tela (Prova Íntegra)</span>
                  ) : (
                    <span className="text-red-400 font-black">
                      {studentCheatCount} {studentCheatCount === 1 ? 'saída registrada' : 'saídas registradas'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* OVERLAY DE BLOQUEIO ANTI-COLA QUANDO O ALUNO MINIMIZA A TELA OU TROCA DE ABA */}
        {(studentLocked || studentWarningModal) && studentPhase === 'PLAYING' && (
          <div className="fixed inset-0 z-[100000] bg-red-950/95 backdrop-blur-md flex items-center justify-center p-5 text-center animate-fade-in">
            <div className="w-full max-w-md bg-slate-950 border-2 border-red-500 rounded-[28px] p-6 shadow-2xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto animate-bounce">
                <ShieldAlert size={36} />
              </div>

              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-red-600/30 border border-red-500 text-red-200 text-[10px] font-black uppercase tracking-widest">
                  Alerta Anti-Cola #{studentCheatCount} Enviado ao Instrutor
                </span>
                <h3 className="text-xl font-black uppercase text-white">
                  {studentLocked ? 'Sua Prova Foi Bloqueada!' : 'Atenção: Saída de Tela Detectada!'}
                </h3>
                <p className="text-xs text-red-200 font-bold">
                  Motivo detectado: {studentLastCheatReason || studentWarningModal}
                </p>
              </div>

              {studentLocked ? (
                <div className="bg-red-900/40 border border-red-500/50 rounded-2xl p-4 space-y-2">
                  <Lock size={22} className="text-red-300 mx-auto" />
                  <p className="text-xs text-white font-bold leading-relaxed">
                    O instrutor recebeu um alerta imediato na tela dele informando que você minimizou ou saiu da prova.
                  </p>
                  <p className="text-[11px] text-red-200 font-medium">
                    Aguarde o instrutor clicar em <strong>"Liberar Aluno"</strong> no painel dele para você poder continuar.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    await requestExamFullscreen();
                    setStudentWarningModal(null);
                  }}
                  className="w-full py-3.5 px-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase tracking-wider text-xs cursor-pointer"
                >
                  Voltar Imediatamente para a Prova em Tela Cheia
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDERIZAÇÃO: PAINEL DO INSTRUTOR (CRIAR PROVA + QR CODE + MONITOR AO VIVO)
  // ============================================================================
  const participantsList = activeRoom ? (Object.values(activeRoom.participants) as LiveExamParticipant[]) : [];
  const activeCheatCount = participantsList.filter((p) => p.status === 'LOCKED_CHEAT' || p.cheatCount > 0).length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 pb-24 animate-fade-in">
      {/* Barra Superior: Alternar entre Painel do Instrutor e Área do Aluno (PIN) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[24px] p-4 sm:p-5 text-white shadow-md border border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
            <QrCode size={12} />
            <span>Prova de Especialidade Ao Vivo</span>
          </div>
          <h3 className="text-base sm:text-xl font-black uppercase tracking-tight">
            {activeRoom
              ? `Sala Ativa #${activeRoom.pin} — ${activeRoom.specialtyName}`
              : 'Criar Prova de Especialidade com QR Code'}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-300 font-medium">
            Gere um QR Code para a turma responder em área isolada com tempo limite e receba alertas em tempo real se alguém minimizar a tela.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              if (activeRoom?.pin) {
                setStudentPinInput(activeRoom.pin);
              }
              setRoleMode('STUDENT');
            }}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode size={14} />
            <span>{activeRoom ? 'Testar como Aluno' : 'Entrar como Aluno (PIN)'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================
          MODO 1 DO INSTRUTOR: CONFIGURAR ESPECIALIDADE E QUESTÕES ANTES DE ABRIR SALA
         ======================================================================== */}
      {!activeRoom && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Coluna Esquerda: Escolher Especialidade e Regras da Sala */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              1. Escolha a Especialidade e o Tempo Limite
            </h4>

            {/* Busca e Filtro de Área */}
            <div className="space-y-2">
              <div className="relative">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar especialidade pelo nome..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                />
              </div>

              <select
                value={selectedAreaFilter}
                onChange={(e) => setSelectedAreaFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="TODAS">Todas as Áreas ({catalog.length})</option>
                {availableAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de Especialidades */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-hide border border-slate-100 dark:border-slate-700/60 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/40">
              {isLoadingCatalog ? (
                <div className="py-8 text-center text-xs font-bold text-slate-400">
                  Carregando especialidades...
                </div>
              ) : filteredSpecialties.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-slate-400">
                  Nenhuma especialidade encontrada.
                </div>
              ) : (
                filteredSpecialties.slice(0, 80).map((spec) => {
                  const isSelected = selectedSpecialty?.id === spec.id;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => handleSelectSpecialtyForExam(spec)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 hover:bg-indigo-50/60 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700'
                      }`}
                    >
                      {spec.logo && (
                        <img
                          src={getImageUrl(spec.logo)}
                          alt={spec.nome}
                          className="w-9 h-9 object-contain shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black truncate">{spec.nome}</p>
                        <p
                          className={`text-[10px] font-bold truncate ${
                            isSelected ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {spec.area} {spec.codigo ? `• ${spec.codigo}` : ''}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Configurações de Tempo, Quantidade de Questões e Anti-Cola */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Nº de Questões
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-1.5 rounded-lg text-xs font-black cursor-pointer ${
                        questionCount === cnt
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Tempo Limite
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  {[10, 15, 25].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-1.5 rounded-lg text-xs font-black cursor-pointer ${
                        durationMinutes === mins
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Opção de Bloqueio Anti-Cola */}
            <div className="bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-700 dark:text-red-300 flex items-center gap-1.5">
                  <ShieldAlert size={14} />
                  <span>Ação Anti-Cola ao Minimizar a Tela</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLockOnCheat(true)}
                  className={`py-2 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                    lockOnCheat
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  🔒 Bloquear + Alerta
                </button>
                <button
                  type="button"
                  onClick={() => setLockOnCheat(false)}
                  className={`py-2 px-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                    !lockOnCheat
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  ⚠️ Apenas Alertar
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Questões da Prova + Botão de Gerar QR Code */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    2. Questões da Prova ({questions.length})
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {selectedSpecialty
                      ? `Especialidade selecionada: ${selectedSpecialty.nome}`
                      : 'Selecione uma especialidade ao lado para gerar as questões automaticamente.'}
                  </p>
                </div>

                {selectedSpecialty && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isGeneratingQuestions}
                      onClick={() => handleSelectSpecialtyForExam(selectedSpecialty)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>Regerar com IA</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setQuestions((prev) => [
                          ...prev,
                          {
                            id: `custom_q_${Date.now()}`,
                            question: 'Nova pergunta da especialidade?',
                            options: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'],
                            correctIndex: 0
                          }
                        ]);
                        setEditingQuestionIdx(questions.length);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                )}
              </div>

              {isGeneratingQuestions ? (
                <div className="py-16 text-center space-y-2">
                  <RefreshCw size={28} className="animate-spin text-indigo-500 mx-auto" />
                  <p className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                    Elaborando questões oficiais da especialidade {selectedSpecialty?.nome}...
                  </p>
                </div>
              ) : questions.length === 0 ? (
                <div className="py-14 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 space-y-2">
                  <BookOpen size={28} className="text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Clique em uma especialidade na lista ao lado para montar as questões da prova e gerar o QR Code.
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1 scrollbar-hide">
                  {questions.map((q, qIdx) => {
                    const isEditing = editingQuestionIdx === qIdx;
                    return (
                      <div
                        key={q.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            Questão {qIdx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingQuestionIdx(isEditing ? null : qIdx)}
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                              title="Editar questão"
                            >
                              <Edit3 size={13} />
                            </button>
                            {questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qIdx))}
                                className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/60 text-red-500 cursor-pointer"
                                title="Remover questão"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) => {
                                const val = e.target.value;
                                setQuestions((prev) =>
                                  prev.map((item, i) => (i === qIdx ? { ...item, question: val } : item))
                                );
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-white"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuestions((prev) =>
                                        prev.map((item, i) =>
                                          i === qIdx ? { ...item, correctIndex: oIdx } : item
                                        )
                                      );
                                    }}
                                    className={`w-6 h-6 rounded-lg text-[10px] font-black shrink-0 cursor-pointer ${
                                      q.correctIndex === oIdx
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}
                                    title="Marcar como correta"
                                  >
                                    {String.fromCharCode(65 + oIdx)}
                                  </button>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setQuestions((prev) =>
                                        prev.map((item, i) => {
                                          if (i !== qIdx) return item;
                                          const nextOpts = [...item.options];
                                          nextOpts[oIdx] = val;
                                          return { ...item, options: nextOpts };
                                        })
                                      );
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-white"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-black text-slate-800 dark:text-white leading-snug">
                              {q.question}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={oIdx}
                                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 ${
                                    q.correctIndex === oIdx
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                      : 'bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  <span className="font-black">{String.fromCharCode(65 + oIdx)})</span>
                                  <span className="truncate">{opt}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!selectedSpecialty || questions.length === 0 || isGeneratingQuestions}
              onClick={handleCreateLiveExamRoom}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode size={18} />
              <span>Abrir Sala da Prova & Gerar QR Code</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODO 2 DO INSTRUTOR: SALA AO VIVO COM QR CODE, CONTROLE DE TEMPO E ANTI-COLA
         ======================================================================== */}
      {activeRoom && (
        <div className="space-y-4">
          {/* Card Principal da Sala: QR Code + PIN + Cronômetro + Comandos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Cartão do QR Code e PIN */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col items-center text-center space-y-3">
              <div className="flex items-center gap-2">
                {activeRoom.specialtyLogo && (
                  <img
                    src={activeRoom.specialtyLogo}
                    alt={activeRoom.specialtyName}
                    className="w-10 h-10 object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="text-left">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                    Escaneie para Entrar na Área de Prova
                  </span>
                  <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white">
                    {activeRoom.specialtyName}
                  </h4>
                </div>
              </div>

              {qrCodeDataUrl && (
                <div
                  onClick={() => setIsQrFullscreenModalOpen(true)}
                  className="p-3 bg-white rounded-2xl border-2 border-indigo-500/30 shadow-md cursor-pointer hover:scale-[1.02] transition-transform"
                  title="Clique para ampliar o QR Code na tela inteira"
                >
                  <img src={qrCodeDataUrl} alt="QR Code da Prova" className="w-48 h-48 sm:w-52 sm:h-52 mx-auto" />
                </div>
              )}

              <div className="w-full bg-slate-900 text-white rounded-2xl p-3 space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                  Código PIN da Sala
                </span>
                <p className="text-2xl sm:text-3xl font-black tracking-[0.28em] text-amber-400">
                  {activeRoom.pin}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsQrFullscreenModalOpen(true)}
                  className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 size={13} />
                  <span>Ampliar QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!examShareUrl) return;
                    navigator.clipboard?.writeText(examShareUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={handleProjectQrToAnotherScreen}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Monitor size={14} />
                <span>{isSecondScreenActive ? 'Atualizar / Focar Janela do Telão' : 'Projetar em Outra Tela (Telão)'}</span>
              </button>
            </div>

            {/* Painel de Controle Ao Vivo e Feed de Alertas Anti-Cola */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Status + Cronômetro Geral + Som */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        activeRoom.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                          : activeRoom.status === 'FINISHED'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {activeRoom.status === 'ACTIVE'
                        ? '🟢 Prova em Andamento'
                        : activeRoom.status === 'FINISHED'
                        ? '🏁 Prova Encerrada'
                        : '⏳ Aguardando Alunos Escanearem'}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSoundAlertsEnabled((prev) => !prev)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 border cursor-pointer ${
                        soundAlertsEnabled
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                      title="Ativar/Desativar som quando alguém minimizar a tela"
                    >
                      {soundAlertsEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                      <span>{soundAlertsEnabled ? 'Som Anti-Cola ON' : 'Mudo'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-amber-300 font-black text-sm tabular-nums flex items-center gap-1.5">
                      <Timer size={15} />
                      <span>{formatTimeMMSS(hostRemainingSeconds)}</span>
                    </div>
                  </div>
                </div>

                {/* Resumo Rápido de Participantes e Alertas */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 text-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                      Na Prova
                    </span>
                    <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">
                      {participantsList.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 text-center">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                      Entregaram
                    </span>
                    <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-300">
                      {participantsList.filter((p) => p.status === 'FINISHED').length}
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-2xl border text-center ${
                      activeRoom.alerts.length > 0
                        ? 'bg-red-50 dark:bg-red-950/50 border-red-400 animate-pulse'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200/70 dark:border-slate-700'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 block">
                      Alertas de Cola
                    </span>
                    <span className="text-lg sm:text-xl font-black text-red-600 dark:text-red-400">
                      {activeRoom.alerts.length}
                    </span>
                  </div>
                </div>

                {/* Central de Alertas Anti-Cola Ao Vivo */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <ShieldAlert size={14} />
                    <span>Monitoramento Anti-Cola em Tempo Real</span>
                  </span>

                  {activeRoom.alerts.length === 0 ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <ShieldCheck size={18} className="shrink-0" />
                      <span>Nenhuma saída de tela ou tentativa de cola detectada até o momento.</span>
                    </div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-hide">
                      {activeRoom.alerts.map((al) => {
                        const stu = activeRoom.participants[al.studentId];
                        return (
                          <div
                            key={al.id}
                            className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-black text-red-800 dark:text-red-200 truncate">
                                🚨 {al.studentName} ({al.studentUnit}) — {al.violationNumber}ª saída às {al.timestamp}
                              </p>
                              <p className="text-[10px] font-bold text-red-600 dark:text-red-300 truncate">
                                {al.reason}
                              </p>
                            </div>
                            {stu?.isLocked && (
                              <button
                                type="button"
                                onClick={() => handleUnlockStudent(al.studentId)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase shrink-0 cursor-pointer"
                              >
                                Liberar
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Botões de Ação da Sala (Iniciar / +Tempo / Encerrar / Nova Prova) */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {activeRoom.status === 'WAITING' && (
                  <button
                    type="button"
                    onClick={handleStartExamForAll}
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-wider text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Iniciar Prova Agora ({participantsList.length} na sala)</span>
                  </button>
                )}

                {activeRoom.status === 'ACTIVE' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAddExtraTime(5)}
                      className="py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock size={14} />
                      <span>+5 Minutos</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleFinishExamForAll}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Square size={14} fill="currentColor" />
                      <span>Encerrar Prova</span>
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleCloseAndResetRoom}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-600 dark:text-slate-300 hover:text-red-600 text-xs font-black uppercase cursor-pointer"
                >
                  Fechar Sala
                </button>
              </div>
            </div>
          </div>

          {/* LISTA AO VIVO DE QUEM ESTÁ FAZENDO A PROVA */}
          <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                  Lista ao Vivo de Quem Está Fazendo a Prova ({participantsList.length})
                </h4>
              </div>
              {activeCheatCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-[10px] font-black uppercase">
                  ⚠️ {activeCheatCount} com Alerta Anti-Cola
                </span>
              )}
            </div>

            {participantsList.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl space-y-1.5">
                <QrCode size={28} className="text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Aguardando os desbravadores/aventureiros escanearem o QR Code ou digitarem o PIN{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400">{activeRoom.pin}</strong>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {participantsList.map((p) => {
                  const totalQ = activeRoom.questions.length || 1;
                  const progressPct = Math.round((p.answeredCount / totalQ) * 100);
                  const isApproved = p.scorePercent >= activeRoom.passingScorePercent;

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                        p.status === 'LOCKED_CHEAT'
                          ? 'bg-red-50/90 dark:bg-red-950/50 border-red-500 ring-1 ring-red-500/40'
                          : p.status === 'FINISHED'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/70 dark:border-emerald-800/60'
                          : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                              {p.name}
                            </h5>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase">
                              {p.unit}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            Questão atual: {Math.min(totalQ, p.currentQuestionIdx + 1)}/{totalQ} • Respondidas:{' '}
                            {p.answeredCount}/{totalQ}
                          </p>
                        </div>

                        {/* Badge de Status ao Vivo */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase shrink-0 ${
                            p.status === 'LOCKED_CHEAT'
                              ? 'bg-red-600 text-white animate-pulse'
                              : p.status === 'FINISHED'
                              ? 'bg-emerald-600 text-white'
                              : p.status === 'DISQUALIFIED'
                              ? 'bg-slate-800 text-red-400'
                              : p.status === 'PLAYING'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {p.status === 'LOCKED_CHEAT'
                            ? '🚨 Bloqueado (Cola)'
                            : p.status === 'FINISHED'
                            ? `✅ Nota ${p.grade10.toFixed(1)}`
                            : p.status === 'DISQUALIFIED'
                            ? '⛔ Desclassificado'
                            : p.status === 'PLAYING'
                            ? '🟢 Respondendo'
                            : '⏳ Aguardando'}
                        </span>
                      </div>

                      {/* Barra de Progresso do Aluno */}
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            p.status === 'LOCKED_CHEAT'
                              ? 'bg-red-600'
                              : p.status === 'FINISHED'
                              ? 'bg-emerald-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      {/* Rodapé do Card do Aluno: Nota Parcial/Final + Alertas + Botões do Instrutor */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-2 text-[10px] font-black">
                          <span className={isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                            Acertos: {p.correctCount}/{totalQ} ({p.scorePercent}%)
                          </span>
                          {p.cheatCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200">
                              ⚠️ {p.cheatCount} {p.cheatCount === 1 ? 'saída de tela' : 'saídas de tela'}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">🛡️ 0 saídas</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {p.isLocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnlockStudent(p.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <Unlock size={11} />
                              <span>Liberar</span>
                            </button>
                          ) : (
                            p.status === 'PLAYING' && (
                              <button
                                type="button"
                                onClick={() => handleLockOrDisqualifyStudent(p.id, false)}
                                className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-300 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <Lock size={11} />
                                <span>Bloquear</span>
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => setInspectingStudent(p)}
                            className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={11} />
                            <span>Respostas</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DO QR CODE AMPLIADO (MANTENDO O MODAL CENTRALIZADO NO PADRÃO DO PROJETAR) */}
      {isQrFullscreenModalOpen &&
        activeRoom &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              setIsQrTelaoExpanded(false);
              setIsQrFullscreenModalOpen(false);
            }}
          >
            <div
              ref={qrModalRef}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'radial-gradient(circle at top, #1e1b4b 0%, #090d16 70%)'
              }}
              className={`text-white flex flex-col justify-between transition-all overflow-y-auto scrollbar-hide ${
                isQrTelaoExpanded
                  ? 'w-full h-full p-6 sm:p-10'
                  : 'w-full max-w-4xl max-h-[92vh] rounded-[32px] border border-indigo-500/35 shadow-2xl p-5 sm:p-7 gap-5'
              }`}
            >
              {/* Barra Superior do Modal no padrão do Projetar */}
              <div className="w-full flex flex-wrap items-center justify-between gap-2.5 pb-3.5 border-b border-white/10 shrink-0">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/35 text-amber-300 text-[11px] font-black uppercase tracking-[0.14em]">
                  <QrCode size={14} />
                  <span>PROVA AO VIVO</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleProjectQrToAnotherScreen}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/25 transition-all"
                    title="Abre uma janela exclusiva para projetar no Telão da Igreja (2ª Tela / HDMI) mantendo seu painel no PC"
                  >
                    <Monitor size={14} />
                    <span>Projetar em Outra Tela (Telão)</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (!document.fullscreenElement && qrModalRef.current) {
                          await qrModalRef.current.requestFullscreen();
                          setIsQrTelaoExpanded(true);
                        } else if (document.fullscreenElement) {
                          await document.exitFullscreen();
                          setIsQrTelaoExpanded(false);
                        }
                      } catch {}
                    }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {isQrTelaoExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    <span>{isQrTelaoExpanded ? 'Sair da Tela Cheia' : 'Tela Cheia (F11)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (document.fullscreenElement) {
                        document.exitFullscreen().catch(() => {});
                      }
                      setIsQrTelaoExpanded(false);
                      setIsQrFullscreenModalOpen(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <X size={14} />
                    <span>Fechar</span>
                  </button>
                </div>
              </div>

              {/* Conteúdo do Modal em 2 Colunas no mesmo padrão do Projetar */}
              <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center my-auto">
                {/* Coluna Esquerda: QR Code */}
                <div className="md:col-span-5 bg-slate-900/80 border-2 border-indigo-500/35 rounded-[26px] p-4 sm:p-5 shadow-xl flex flex-col items-center justify-center text-center">
                  {qrCodeDataUrl && (
                    <div className="bg-white p-3.5 rounded-2xl shadow-lg mb-3">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code da Prova"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain block mx-auto"
                      />
                    </div>
                  )}
                  <p className="text-[11px] sm:text-xs font-extrabold text-slate-300 uppercase tracking-wider leading-snug">
                    Aponte a Câmera do Celular para Entrar na Prova
                  </p>
                </div>

                {/* Coluna Direita: Especialidade, PIN, Cronômetro, Status e Conectados */}
                <div className="md:col-span-7 flex flex-col gap-3.5 text-left">
                  <div className="flex items-center gap-3.5">
                    {activeRoom.specialtyLogo && (
                      <img
                        src={activeRoom.specialtyLogo}
                        alt={activeRoom.specialtyName}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-lg"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em] text-indigo-400 block mb-0.5">
                        ESPECIALIDADE EM AVALIAÇÃO
                      </span>
                      <h2 className="text-xl sm:text-3xl font-black uppercase tracking-tight leading-tight text-white break-words">
                        {activeRoom.specialtyName}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/85 border border-white/12 rounded-2xl p-3.5 sm:p-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block mb-1">
                        CÓDIGO PIN DA SALA
                      </span>
                      <div className="text-2xl sm:text-4xl font-black text-amber-400 tracking-[0.2em]">
                        {activeRoom.pin}
                      </div>
                    </div>

                    <div className="bg-slate-900/85 border border-white/12 rounded-2xl p-3.5 sm:p-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block mb-1">
                        TEMPO RESTANTE
                      </span>
                      <div className="text-2xl sm:text-4xl font-black text-sky-400 tabular-nums">
                        {formatTimeMMSS(hostRemainingSeconds)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-500/15 border border-emerald-500/35 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-300">
                      {activeRoom.status === 'ACTIVE'
                        ? '🟢 PROVA EM ANDAMENTO'
                        : activeRoom.status === 'FINISHED'
                        ? '🏁 PROVA ENCERRADA'
                        : '⏳ AGUARDANDO ALUNOS ESCANEAREM O QR CODE'}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-white">
                      {participantsList.length} participante(s) na sala
                    </span>
                  </div>

                  <div className="bg-slate-900/65 border border-white/10 rounded-2xl p-3.5 min-h-[76px] max-h-[115px] overflow-y-auto scrollbar-hide">
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 block mb-1.5">
                      PARTICIPANTES CONECTADOS AO VIVO
                    </span>
                    {participantsList.length === 0 ? (
                      <span className="text-xs font-bold text-slate-500">
                        Aguardando os alunos escanearem o QR Code...
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {participantsList.map((p) => (
                          <span
                            key={p.id}
                            className="px-3 py-1 rounded-full bg-indigo-500/25 border border-indigo-400/40 text-indigo-100 text-[11px] font-extrabold"
                          >
                            {p.name} ({p.unit})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* MODAL PARA INSPECIONAR RESPOSTAS INDIVIDUAIS DO ALUNO */}
      {inspectingStudent &&
        activeRoom &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setInspectingStudent(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-[28px] p-5 text-white space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-sm sm:text-base font-black uppercase">{inspectingStudent.name}</h4>
                  <p className="text-xs text-slate-400 font-bold">
                    {inspectingStudent.unit} • Nota: {inspectingStudent.grade10.toFixed(1)} ({inspectingStudent.scorePercent}%) • Alertas: {inspectingStudent.cheatCount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingStudent(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {activeRoom.questions.map((q, idx) => {
                  const chosen = inspectingStudent.answers?.[idx];
                  const isCorrect = chosen === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        chosen === undefined
                          ? 'bg-slate-950 border-slate-800 text-slate-400'
                          : isCorrect
                          ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                          : 'bg-red-950/40 border-red-700/60 text-red-200'
                      }`}
                    >
                      <p className="font-black text-white">
                        Q{idx + 1}. {q.question}
                      </p>
                      <p className="font-bold">
                        Resposta do aluno:{' '}
                        {chosen !== undefined ? q.options[chosen] : 'Ainda não respondeu'}
                      </p>
                      {!isCorrect && (
                        <p className="text-emerald-400 font-bold">
                          Correta: {q.options[q.correctIndex]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default LiveSpecialtyExam;
