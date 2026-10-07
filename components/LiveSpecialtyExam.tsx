import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { ClubType, Especialidade } from '../types';
import {
  supabaseQfpy,
  QFPY_URL,
  QFPY_KEY,
  fetchEspecialidades,
  fetchEspecialidadeRequisitos,
  resolveGeminiApiKey
} from '../services/supabaseService';

// Cliente Realtime dedicado para o Aluno (evita colisão de tópico WebSocket quando o mesmo aparelho possui salas abertas como Instrutor)
const supabaseStudentRealtime = createClient(QFPY_URL, QFPY_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Faz download de arquivo JSON do bucket público "App DBV Tudo" sem cache de CDN/navegador
async function downloadCloudExamJson<T = any>(filePath: string): Promise<T | null> {
  try {
    const encodedPath = filePath
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/');
    const url = `${QFPY_URL}/storage/v1/object/public/App%20DBV%20Tudo/${encodedPath}?t=${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache'
      }
    });
    if (res.ok) {
      const parsed = await res.json();
      if (parsed) return parsed as T;
    }
  } catch {}

  try {
    const { data: blob } = await supabaseQfpy.storage.from('App DBV Tudo').download(filePath);
    if (blob) {
      const text = await blob.text();
      return JSON.parse(text) as T;
    }
  } catch {}

  return null;
}
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
  Globe,
  PanelLeftClose,
  Camera
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
  resultsReleased?: boolean;
  startedAt: number | null;
  extraSecondsAdded: number;
  questions: LiveExamQuestion[];
  participants: Record<string, LiveExamParticipant>;
  alerts: LiveExamCheatAlert[];
  updatedAt: number;
  creatorKey?: string;
  creatorEmail?: string;
  creatorName?: string;
}

interface LiveSpecialtyExamProps {
  club: ClubType;
  specialties?: Especialidade[];
  preselectedSpecialty?: Especialidade | null;
  initialMode?: 'HOST' | 'STUDENT';
  initialPin?: string;
  isIsolatedStudentMode?: boolean;
  onExitIsolatedMode?: () => void;
  sidebarOverlayTarget?: HTMLElement | null;
  isSidebarOpen?: boolean;
  onToggleSidebar?: (open: boolean) => void;
  onActiveRoomChange?: (hasActiveRoom: boolean) => void;
  currentUserEmail?: string;
  currentUserName?: string;
  currentUserRole?: string;
  canHostLiveExam?: boolean;
  autoOpenQrScanner?: boolean;
  onBack?: () => void;
}

export function isRoleFromCounselorUpwards(roleStr?: string | null): boolean {
  const rawRole = (roleStr || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  if (!rawRole) return false;
  if (rawRole.includes('secretario de unidade')) return false;
  const allowedKeywords = [
    'conselheiro',
    'instrutor',
    'capelao',
    'secretario',
    'tesoureiro',
    'diretor',
    'distrital',
    'regional',
    'coordenador',
    'departamental',
    'pastor',
    'anciao',
    'administrador'
  ];
  return allowedKeywords.some((kw) => rawRole.includes(kw));
}

function extractExamPinFromQrText(rawText: string): string | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  try {
    const url = new URL(trimmed);
    const provaParam = url.searchParams.get('prova') || url.searchParams.get('pin');
    if (provaParam && /^\d{6}$/.test(provaParam.trim())) {
      return provaParam.trim();
    }
  } catch {}
  const paramMatch = trimmed.match(/[?&](?:prova|pin)=(\d{6})\b/i);
  if (paramMatch && paramMatch[1]) return paramMatch[1];
  const sixDigits = trimmed.match(/\b(\d{6})\b/);
  if (sixDigits && sixDigits[1]) return sixDigits[1];
  return null;
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
  sidebarOverlayTarget = null,
  isSidebarOpen = true,
  onToggleSidebar,
  onActiveRoomChange,
  currentUserEmail = '',
  currentUserName = '',
  currentUserRole = '',
  canHostLiveExam,
  autoOpenQrScanner = false,
  onBack
}) => {
  const isPathfinder = club === ClubType.PATHFINDER;

  // Verifica se o usuário tem cargo de Conselheiro para cima (únicos liberados para criar/gerenciar salas de prova)
  const [resolvedRole, setResolvedRole] = useState<string>(() => {
    if (currentUserRole && currentUserRole.trim()) return currentUserRole.trim();
    try {
      const savedProfile = localStorage.getItem('dbv_tudo_global_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        const roleVal = parsed?.role || parsed?.funçao || parsed?.cargo || '';
        if (roleVal) return String(roleVal).trim();
      }
    } catch {}
    return '';
  });

  useEffect(() => {
    if (currentUserRole && currentUserRole.trim()) {
      setResolvedRole(currentUserRole.trim());
    }
  }, [currentUserRole]);

  const hasHostPermission = useMemo<boolean>(() => {
    if (isIsolatedStudentMode) return false;
    try {
      if (localStorage.getItem('dbv_is_guest') === 'true') return false;
    } catch {}
    if (typeof canHostLiveExam === 'boolean') {
      return canHostLiveExam || isRoleFromCounselorUpwards(resolvedRole);
    }
    return isRoleFromCounselorUpwards(resolvedRole);
  }, [isIsolatedStudentMode, canHostLiveExam, resolvedRole]);

  const [roleMode, setRoleMode] = useState<'HOST' | 'STUDENT'>(() => {
    if (isIsolatedStudentMode || initialPin) return 'STUDENT';
    if (typeof canHostLiveExam === 'boolean' && !canHostLiveExam && !isRoleFromCounselorUpwards(resolvedRole)) {
      return 'STUDENT';
    }
    return initialMode;
  });

  // Detecta se está em um aparelho celular (leitor de QR Code e tela inicial de escolha exclusivos para celular)
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    return isMobileUa || window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      const ua = navigator.userAgent || '';
      const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
      setIsMobileDevice(isMobileUa || window.innerWidth < 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Tela Inicial ao entrar pelo App no Celular: "Criar Prova" (vai pra área de criação) e "Escanear QR Code" (vai pra área da prova)
  const [entryScreenConfirmed, setEntryScreenConfirmed] = useState<boolean>(() =>
    Boolean(isIsolatedStudentMode || initialPin || autoOpenQrScanner)
  );
  const [entryPermissionNotice, setEntryPermissionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHostPermission && roleMode === 'HOST') {
      setRoleMode('STUDENT');
    }
  }, [hasHostPermission, roleMode]);

  // ============================================================================
  // DETECÇÃO DO INSTRUTOR LOGADO (PARA SINCRONIZAR PROVAS ENTRE PC E CELULAR)
  // ============================================================================
  const [instructorIdentity, setInstructorIdentity] = useState<{ email: string; name: string }>(() => {
    let email = (currentUserEmail || '').trim().toLowerCase();
    let name = (currentUserName || '').trim();
    try {
      const savedProfile = localStorage.getItem('dbv_tudo_global_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (!email && parsed?.email && parsed.email !== 'email@exemplo.com') {
          email = String(parsed.email).trim().toLowerCase();
        }
        if (!name && parsed?.name) {
          name = String(parsed.name).trim();
        }
      }
      if (!email) {
        const lastEmail = localStorage.getItem('dbv_last_login_email');
        if (lastEmail && lastEmail !== 'email@exemplo.com') {
          email = String(lastEmail).trim().toLowerCase();
        }
      }
    } catch {}
    return { email, name };
  });

  useEffect(() => {
    if (currentUserEmail || currentUserName) {
      setInstructorIdentity((prev) => ({
        email: (currentUserEmail || prev.email || '').trim().toLowerCase(),
        name: (currentUserName || prev.name || '').trim()
      }));
    }
  }, [currentUserEmail, currentUserName]);

  useEffect(() => {
    supabaseQfpy.auth
      .getUser()
      .then(({ data }) => {
        if (data?.user) {
          const uEmail = (data.user.email || '').trim().toLowerCase();
          const uName = (data.user.user_metadata?.nome || data.user.user_metadata?.name || '').trim();
          if (uEmail || uName) {
            setInstructorIdentity((prev) => ({
              email: prev.email || uEmail,
              name: prev.name || uName
            }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const instructorKey = useMemo(() => {
    const raw = (
      instructorIdentity.email && instructorIdentity.email !== 'email@exemplo.com'
        ? instructorIdentity.email
        : instructorIdentity.name || ''
    )
      .trim()
      .toLowerCase();
    if (!raw) return '';
    return raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }, [instructorIdentity.email, instructorIdentity.name]);

  const instructorKeyRef = useRef<string>(instructorKey);
  instructorKeyRef.current = instructorKey;
  const instructorIdentityRef = useRef(instructorIdentity);
  instructorIdentityRef.current = instructorIdentity;
  const instructorSyncChannelRef = useRef<any>(null);
  const closedRoomPinsRef = useRef<Set<string>>(new Set());

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

  // Estado de Múltiplas Salas Ativas do Instrutor (permite abrir várias provas simultâneas)
  const [hostRooms, setHostRooms] = useState<LiveExamRoomState[]>(() => {
    try {
      const savedMulti = localStorage.getItem('dbv_instructor_active_exam_rooms');
      if (savedMulti) {
        const parsedMulti = JSON.parse(savedMulti);
        if (Array.isArray(parsedMulti) && parsedMulti.length > 0) {
          return parsedMulti.filter((r: any) => r && r.pin && Array.isArray(r.questions));
        }
      }
      const savedSingle = localStorage.getItem('dbv_instructor_active_exam_room');
      if (savedSingle) {
        const parsed = JSON.parse(savedSingle);
        if (parsed && parsed.pin && Array.isArray(parsed.questions)) {
          return [parsed];
        }
      }
    } catch {}
    return [];
  });
  const [selectedRoomPin, setSelectedRoomPin] = useState<string | null>(() => {
    try {
      const savedMulti = localStorage.getItem('dbv_instructor_active_exam_rooms');
      if (savedMulti) {
        const parsedMulti = JSON.parse(savedMulti);
        if (Array.isArray(parsedMulti) && parsedMulti[0]?.pin) return String(parsedMulti[0].pin);
      }
      const savedSingle = localStorage.getItem('dbv_instructor_active_exam_room');
      if (savedSingle) {
        const parsed = JSON.parse(savedSingle);
        if (parsed?.pin) return String(parsed.pin);
      }
    } catch {}
    return null;
  });
  const [isCreatingNewRoom, setIsCreatingNewRoom] = useState<boolean>(false);

  const activeRoom = useMemo<LiveExamRoomState | null>(() => {
    if (isCreatingNewRoom || hostRooms.length === 0) return null;
    return hostRooms.find((r) => r.pin === selectedRoomPin) || hostRooms[0] || null;
  }, [hostRooms, selectedRoomPin, isCreatingNewRoom]);

  useEffect(() => {
    const hasActive =
      !isIsolatedStudentMode &&
      (entryScreenConfirmed || !isMobileDevice) &&
      roleMode === 'HOST' &&
      Boolean(activeRoom);
    onActiveRoomChange?.(hasActive);
    return () => {
      onActiveRoomChange?.(false);
    };
  }, [isIsolatedStudentMode, entryScreenConfirmed, isMobileDevice, roleMode, activeRoom, onActiveRoomChange]);

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
      const savedStudentName = localStorage.getItem('dbv_exam_student_name');
      if (savedStudentName && savedStudentName.trim()) return savedStudentName;
      if (currentUserName && currentUserName.trim()) return currentUserName.trim();
      const savedProfile = localStorage.getItem('dbv_tudo_global_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed?.name) return String(parsed.name).trim();
        if (parsed?.nome) return String(parsed.nome).trim();
      }
    } catch {}
    return '';
  });
  const [studentUnit, setStudentUnit] = useState<string>(() => {
    try {
      const savedStudentUnit = localStorage.getItem('dbv_exam_student_unit');
      if (savedStudentUnit && savedStudentUnit.trim()) return savedStudentUnit;
      const savedProfile = localStorage.getItem('dbv_tudo_global_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed?.unit) return String(parsed.unit).trim();
        if (parsed?.unidade) return String(parsed.unidade).trim();
        if (parsed?.clubName) return String(parsed.clubName).trim();
      }
    } catch {}
    return '';
  });
  const [studentId] = useState<string>(() => {
    try {
      const existing =
        sessionStorage.getItem('dbv_exam_student_id') || localStorage.getItem('dbv_exam_student_id');
      if (existing) {
        sessionStorage.setItem('dbv_exam_student_id', existing);
        localStorage.setItem('dbv_exam_student_id', existing);
        return existing;
      }
      const created = `stu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      sessionStorage.setItem('dbv_exam_student_id', created);
      localStorage.setItem('dbv_exam_student_id', created);
      return created;
    } catch {
      return `stu_${Date.now()}`;
    }
  });

  useEffect(() => {
    if (!studentName.trim() && (currentUserName || instructorIdentity.name)) {
      setStudentName((currentUserName || instructorIdentity.name).trim());
    }
  }, [currentUserName, instructorIdentity.name, studentName]);

  // Estados do Leitor de QR Code integrado no App
  const [isQrScannerOpen, setIsQrScannerOpen] = useState<boolean>(Boolean(autoOpenQrScanner));
  const [qrScannerError, setQrScannerError] = useState<string | null>(null);
  const [qrScannerFacingMode, setQrScannerFacingMode] = useState<'environment' | 'user'>('environment');
  const [qrScannedSuccessMsg, setQrScannedSuccessMsg] = useState<string | null>(null);
  const [releaseFeedbackMsg, setReleaseFeedbackMsg] = useState<string | null>(null);
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);

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
  const [studentFinalTimeSpentSec, setStudentFinalTimeSpentSec] = useState<number>(0);
  const [showOpenModeChoiceModal, setShowOpenModeChoiceModal] = useState<boolean>(false);
  const [isRunningInStandaloneApp, setIsRunningInStandaloneApp] = useState<boolean>(false);

  // Refs síncronos para garantir envio imediato de alertas Anti-Cola mesmo ao minimizar/trocar de app no celular
  const studentRoomRef = useRef<LiveExamRoomState | null>(studentRoom);
  studentRoomRef.current = studentRoom;
  const studentPhaseRef = useRef(studentPhase);
  studentPhaseRef.current = studentPhase;
  const studentCheatCountRef = useRef<number>(studentCheatCount);
  const studentLockedRef = useRef<boolean>(studentLocked);
  const studentLastCheatReasonRef = useRef<string>(studentLastCheatReason);
  const studentPendingAlertsRef = useRef<LiveExamCheatAlert[]>([]);

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
  const hostChannelsMapRef = useRef<Map<string, any>>(new Map());
  const studentChannelRef = useRef<any>(null);
  const hostRoomsRef = useRef<LiveExamRoomState[]>(hostRooms);
  hostRoomsRef.current = hostRooms;
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

  // Sincroniza a lista de salas abertas do instrutor logado (Nuvem Supabase + Servidor + Canal Realtime PC <-> Celular)
  const syncInstructorCloudState = useCallback(
    (
      roomsList: LiveExamRoomState[],
      selectedPinValue: string | null,
      closedPinToAdd?: string
    ) => {
      const iKey = instructorKeyRef.current;
      if (!iKey) return;

      if (closedPinToAdd) {
        closedRoomPinsRef.current.add(String(closedPinToAdd));
      }
      const closedPinsArray = Array.from(closedRoomPinsRef.current);
      const statePayload = {
        instructorKey: iKey,
        instructorEmail: instructorIdentityRef.current.email,
        instructorName: instructorIdentityRef.current.name,
        selectedRoomPin: selectedPinValue,
        closedPins: closedPinsArray,
        rooms: roomsList,
        updatedAt: Date.now()
      };

      try {
        fetch('/api/live-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SYNC_INSTRUCTOR_STATE',
            ...statePayload
          })
        }).catch(() => {});
      } catch {}

      try {
        supabaseQfpy.storage
          .from('App DBV Tudo')
          .upload(`provas/instructor_${iKey}.json`, JSON.stringify(statePayload), {
            upsert: true,
            contentType: 'application/json',
            cacheControl: '0'
          })
          .catch(() => {});
      } catch {}

      try {
        instructorSyncChannelRef.current
          ?.send({
            type: 'broadcast',
            event: 'instructor:state_sync',
            payload: statePayload
          })
          .catch(() => {});
      } catch {}
    },
    []
  );

  // Salva uma sala do instrutor na lista de múltiplas salas abertas (localStorage, /api/live-exam e Supabase Storage)
  const persistHostRoom = useCallback(
    (
      room: LiveExamRoomState | null,
      options?: { closePin?: string; selectRoom?: boolean }
    ) => {
      const iKey = instructorKeyRef.current;
      if (room) {
        const enrichedRoom: LiveExamRoomState = {
          ...room,
          creatorKey: room.creatorKey || iKey || undefined,
          creatorEmail: room.creatorEmail || instructorIdentityRef.current.email || undefined,
          creatorName: room.creatorName || instructorIdentityRef.current.name || undefined
        };

        closedRoomPinsRef.current.delete(String(enrichedRoom.pin));

        let nextSelectedPin = activeRoomRef.current?.pin || enrichedRoom.pin;
        if (options?.selectRoom) {
          activeRoomRef.current = enrichedRoom;
          nextSelectedPin = enrichedRoom.pin;
          setSelectedRoomPin(enrichedRoom.pin);
          setIsCreatingNewRoom(false);
        } else if (activeRoomRef.current?.pin === enrichedRoom.pin) {
          activeRoomRef.current = enrichedRoom;
        }

        setHostRooms((prev) => {
          const exists = prev.some((r) => r.pin === enrichedRoom.pin);
          const nextList = exists
            ? prev.map((r) => (r.pin === enrichedRoom.pin ? enrichedRoom : r))
            : [...prev, enrichedRoom];
          hostRoomsRef.current = nextList;
          try {
            localStorage.setItem('dbv_instructor_active_exam_rooms', JSON.stringify(nextList));
            localStorage.setItem('dbv_instructor_active_exam_room', JSON.stringify(enrichedRoom));
          } catch {}
          syncInstructorCloudState(nextList, nextSelectedPin);
          return nextList;
        });

        try {
          fetch('/api/live-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'UPSERT_ROOM',
              instructorKey: iKey,
              selectedRoomPin: nextSelectedPin,
              room: enrichedRoom
            })
          }).catch(() => {});
          supabaseQfpy.storage
            .from('App DBV Tudo')
            .upload(`provas/room_${enrichedRoom.pin}.json`, JSON.stringify(enrichedRoom), {
              upsert: true,
              contentType: 'application/json',
              cacheControl: '0'
            })
            .catch(() => {});
        } catch {}
      } else {
        const targetPin = options?.closePin || activeRoomRef.current?.pin;
        if (targetPin) {
          closedRoomPinsRef.current.add(String(targetPin));
          const ch = hostChannelsMapRef.current.get(targetPin);
          if (ch) {
            supabaseQfpy.removeChannel(ch);
            hostChannelsMapRef.current.delete(targetPin);
          }
          try {
            fetch('/api/live-exam', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'CLOSE_ROOM',
                pin: targetPin,
                instructorKey: iKey
              })
            }).catch(() => {});
          } catch {}
        }
        setHostRooms((prev) => {
          const nextList = targetPin ? prev.filter((r) => r.pin !== targetPin) : [];
          hostRoomsRef.current = nextList;
          const fallbackRoom = nextList[0] || null;
          let nextSelectedPin = activeRoomRef.current?.pin || null;
          if (!targetPin || activeRoomRef.current?.pin === targetPin) {
            activeRoomRef.current = fallbackRoom;
            nextSelectedPin = fallbackRoom ? fallbackRoom.pin : null;
            setSelectedRoomPin(nextSelectedPin);
          }
          if (!fallbackRoom) {
            setIsCreatingNewRoom(false);
          }
          try {
            if (nextList.length > 0) {
              localStorage.setItem('dbv_instructor_active_exam_rooms', JSON.stringify(nextList));
              localStorage.setItem(
                'dbv_instructor_active_exam_room',
                JSON.stringify(activeRoomRef.current || fallbackRoom)
              );
            } else {
              localStorage.removeItem('dbv_instructor_active_exam_rooms');
              localStorage.removeItem('dbv_instructor_active_exam_room');
            }
          } catch {}
          syncInstructorCloudState(nextList, nextSelectedPin, targetPin || undefined);
          return nextList;
        });
      }
    },
    [syncInstructorCloudState]
  );

  // Mescla estado recebido de outro dispositivo (PC <-> Celular) do mesmo instrutor logado
  const applyExternalInstructorState = useCallback(
    (externalState: {
      rooms?: LiveExamRoomState[];
      selectedRoomPin?: string | null;
      closedPins?: string[];
      updatedAt?: number;
    }) => {
      if (!externalState) return;

      if (Array.isArray(externalState.closedPins)) {
        externalState.closedPins.forEach((cp) => {
          if (cp) closedRoomPinsRef.current.add(String(cp));
        });
      }

      const incomingRooms = Array.isArray(externalState.rooms)
        ? externalState.rooms.filter(
            (r) => r && r.pin && Array.isArray(r.questions) && !closedRoomPinsRef.current.has(String(r.pin))
          )
        : [];

      setHostRooms((prev) => {
        const filteredLocal = prev.filter((r) => !closedRoomPinsRef.current.has(String(r.pin)));
        const byPin = new Map<string, LiveExamRoomState>();

        filteredLocal.forEach((r) => {
          byPin.set(String(r.pin), r);
        });

        let hasChanges = filteredLocal.length !== prev.length;

        incomingRooms.forEach((extRoom) => {
          const pin = String(extRoom.pin);
          const locRoom = byPin.get(pin);
          if (!locRoom) {
            byPin.set(pin, extRoom);
            hasChanges = true;
          } else {
            const isExtNewer = (extRoom.updatedAt || 0) >= (locRoom.updatedAt || 0);
            const mergedParticipants: Record<string, LiveExamParticipant> = {
              ...(locRoom.participants || {})
            };

            Object.values(extRoom.participants || {}).forEach((ep) => {
              const lp = mergedParticipants[ep.id];
              if (!lp) {
                mergedParticipants[ep.id] = ep;
                return;
              }
              const eCheat = Number(ep.cheatCount || 0);
              const lCheat = Number(lp.cheatCount || 0);
              const maxCheat = Math.max(eCheat, lCheat);
              const maxAns = Math.max(Number(ep.answeredCount || 0), Number(lp.answeredCount || 0));

              if (eCheat > lCheat && soundEnabledRef.current) {
                playCheatAlertSound();
              }

              const keepLocalLock = lCheat > eCheat ? lp.isLocked : ep.isLocked;
              const nextPStatus: LiveExamParticipant['status'] =
                lp.status === 'DISQUALIFIED' || ep.status === 'DISQUALIFIED'
                  ? 'DISQUALIFIED'
                  : lp.status === 'FINISHED' || ep.status === 'FINISHED'
                  ? 'FINISHED'
                  : keepLocalLock
                  ? 'LOCKED_CHEAT'
                  : (isExtNewer ? ep.status : lp.status) === 'LOCKED_CHEAT'
                  ? 'PLAYING'
                  : (isExtNewer ? ep.status : lp.status) || 'PLAYING';

              mergedParticipants[ep.id] = {
                ...(isExtNewer ? lp : ep),
                ...(isExtNewer ? ep : lp),
                answeredCount: maxAns,
                cheatCount: maxCheat,
                lastCheatReason:
                  eCheat >= lCheat
                    ? ep.lastCheatReason || lp.lastCheatReason
                    : lp.lastCheatReason || ep.lastCheatReason,
                lastCheatTime:
                  eCheat >= lCheat
                    ? ep.lastCheatTime || lp.lastCheatTime
                    : lp.lastCheatTime || ep.lastCheatTime,
                isLocked: keepLocalLock,
                status: nextPStatus,
                answers:
                  Object.keys(ep.answers || {}).length >= Object.keys(lp.answers || {}).length
                    ? ep.answers || lp.answers || {}
                    : lp.answers || {}
              };
            });

            const alertIds = new Set((locRoom.alerts || []).map((a) => a.id));
            const mergedAlerts = [...(locRoom.alerts || [])];
            (extRoom.alerts || []).forEach((ea) => {
              if (!alertIds.has(ea.id)) {
                mergedAlerts.unshift(ea);
              }
            });

            const nextStatus =
              locRoom.status === 'FINISHED' || extRoom.status === 'FINISHED'
                ? 'FINISHED'
                : locRoom.status === 'ACTIVE' || extRoom.status === 'ACTIVE'
                ? 'ACTIVE'
                : 'WAITING';
            const nextStartedAt = extRoom.startedAt || locRoom.startedAt || null;
            const nextExtraSeconds = Math.max(
              locRoom.extraSecondsAdded || 0,
              extRoom.extraSecondsAdded || 0
            );
            const nextResultsReleased = isExtNewer
              ? Boolean(extRoom.resultsReleased ?? locRoom.resultsReleased)
              : Boolean(locRoom.resultsReleased ?? extRoom.resultsReleased);

            if (
              nextStatus !== locRoom.status ||
              nextStartedAt !== locRoom.startedAt ||
              nextExtraSeconds !== locRoom.extraSecondsAdded ||
              nextResultsReleased !== Boolean(locRoom.resultsReleased) ||
              Object.keys(mergedParticipants).length !== Object.keys(locRoom.participants || {}).length ||
              mergedAlerts.length !== (locRoom.alerts || []).length ||
              (extRoom.updatedAt || 0) > (locRoom.updatedAt || 0)
            ) {
              byPin.set(pin, {
                ...(isExtNewer ? extRoom : locRoom),
                status: nextStatus,
                resultsReleased: nextResultsReleased,
                startedAt: nextStartedAt,
                extraSecondsAdded: nextExtraSeconds,
                participants: mergedParticipants,
                alerts: mergedAlerts,
                updatedAt: Math.max(locRoom.updatedAt || 0, extRoom.updatedAt || 0)
              });
              hasChanges = true;
            }
          }
        });

        if (!hasChanges) return prev;

        const nextList = Array.from(byPin.values());
        hostRoomsRef.current = nextList;
        try {
          if (nextList.length > 0) {
            localStorage.setItem('dbv_instructor_active_exam_rooms', JSON.stringify(nextList));
            localStorage.setItem('dbv_instructor_active_exam_room', JSON.stringify(nextList[0]));
          } else {
            localStorage.removeItem('dbv_instructor_active_exam_rooms');
            localStorage.removeItem('dbv_instructor_active_exam_room');
          }
        } catch {}
        return nextList;
      });

      if (externalState.selectedRoomPin && !closedRoomPinsRef.current.has(String(externalState.selectedRoomPin))) {
        setSelectedRoomPin((prevPin) => {
          if (!prevPin || closedRoomPinsRef.current.has(String(prevPin))) {
            return String(externalState.selectedRoomPin);
          }
          return prevPin;
        });
      }
    },
    []
  );

  // Canal e Polling de Sincronização das Salas do Usuário Logado (PC <-> Celular sem mover a tela do outro aparelho)
  useEffect(() => {
    if (isIsolatedStudentMode || roleMode !== 'HOST' || !instructorKey) return;

    const fetchRemoteInstructorRooms = async () => {
      try {
        const res = await fetch(`/api/live-exam?instructor=${encodeURIComponent(instructorKey)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.instructorState) {
            applyExternalInstructorState(data.instructorState);
          }
        }
      } catch {}

      try {
        const parsed = await downloadCloudExamJson<any>(`provas/instructor_${instructorKey}.json`);
        if (parsed && parsed.instructorKey === instructorKey) {
          applyExternalInstructorState(parsed);
        }
      } catch {}
    };

    fetchRemoteInstructorRooms();

    const syncChannel = supabaseQfpy.channel(`dbv_instructor_sync_${instructorKey}`, {
      config: { broadcast: { self: false } }
    });
    instructorSyncChannelRef.current = syncChannel;

    syncChannel
      .on('broadcast', { event: 'instructor:request_sync' }, () => {
        if (hostRoomsRef.current.length > 0 || closedRoomPinsRef.current.size > 0) {
          syncChannel
            .send({
              type: 'broadcast',
              event: 'instructor:state_sync',
              payload: {
                instructorKey,
                instructorEmail: instructorIdentityRef.current.email,
                instructorName: instructorIdentityRef.current.name,
                selectedRoomPin: activeRoomRef.current?.pin || null,
                closedPins: Array.from(closedRoomPinsRef.current),
                rooms: hostRoomsRef.current,
                updatedAt: Date.now()
              }
            })
            .catch(() => {});
        }
      })
      .on('broadcast', { event: 'instructor:state_sync' }, ({ payload }) => {
        if (payload && payload.instructorKey === instructorKey) {
          applyExternalInstructorState(payload);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          syncChannel
            .send({
              type: 'broadcast',
              event: 'instructor:request_sync',
              payload: { instructorKey }
            })
            .catch(() => {});
          if (hostRoomsRef.current.length > 0) {
            syncInstructorCloudState(
              hostRoomsRef.current,
              activeRoomRef.current?.pin || hostRoomsRef.current[0]?.pin || null
            );
          }
        }
      });

    const intervalId = setInterval(fetchRemoteInstructorRooms, 3000);

    return () => {
      clearInterval(intervalId);
      supabaseQfpy.removeChannel(syncChannel);
      if (instructorSyncChannelRef.current === syncChannel) {
        instructorSyncChannelRef.current = null;
      }
    };
  }, [isIsolatedStudentMode, roleMode, instructorKey, applyExternalInstructorState, syncInstructorCloudState]);

  // Mantém referência do canal da sala atualmente selecionada
  useEffect(() => {
    hostChannelRef.current = activeRoom?.pin
      ? hostChannelsMapRef.current.get(activeRoom.pin) || null
      : null;
  }, [activeRoom?.pin]);

  const openRoomPinsKey = useMemo(
    () =>
      hostRooms
        .map((r) => r.pin)
        .sort()
        .join(','),
    [hostRooms]
  );

  // ============================================================================
  // SINCRONIZAÇÃO EM TEMPO REAL DE TODAS AS SALAS ABERTAS PELO INSTRUTOR
  // ============================================================================
  useEffect(() => {
    if (!openRoomPinsKey) return;

    const currentPins = new Set(openRoomPinsKey.split(',').filter(Boolean));

    // Remove canais de salas que foram fechadas
    Array.from(hostChannelsMapRef.current.entries()).forEach(([pin, ch]) => {
      if (!currentPins.has(pin)) {
        supabaseQfpy.removeChannel(ch);
        hostChannelsMapRef.current.delete(pin);
      }
    });

    // Cria canais para novas salas abertas
    currentPins.forEach((pin) => {
      if (hostChannelsMapRef.current.has(pin)) return;

      const channelName = `dbv_live_exam_${pin}`;
      const channel = supabaseQfpy.channel(channelName, {
        config: { broadcast: { self: true } }
      });
      hostChannelsMapRef.current.set(pin, channel);
      if (activeRoomRef.current?.pin === pin) {
        hostChannelRef.current = channel;
      }

      const broadcastRoomSync = (roomToBroadcast: LiveExamRoomState) => {
        channel
          .send({
            type: 'broadcast',
            event: 'host:room_sync',
            payload: { room: roomToBroadcast }
          })
          .catch(() => {});
      };

      const getRoomByPin = () => hostRoomsRef.current.find((r) => r.pin === pin) || null;

      channel
        .on('broadcast', { event: 'host:room_sync' }, ({ payload }) => {
          if (!payload?.room || String(payload.room.pin) !== String(pin)) return;
          applyExternalInstructorState({
            rooms: [payload.room],
            updatedAt: payload.room.updatedAt
          });
        })
        .on('broadcast', { event: 'student:request_sync' }, () => {
          const current = getRoomByPin();
          if (current) {
            broadcastRoomSync(current);
          }
        })
        .on('broadcast', { event: 'student:join' }, ({ payload }) => {
          const current = getRoomByPin();
          if (!payload?.participant || !current) return;
          const p: LiveExamParticipant = payload.participant;
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
          broadcastRoomSync(updated);
        })
        .on('broadcast', { event: 'student:update' }, ({ payload }) => {
          const current = getRoomByPin();
          if (!payload?.participant || !current) return;
          const p: LiveExamParticipant = payload.participant;
          const prevP = current.participants[p.id];
          const prevCheat = Number(prevP?.cheatCount || 0);
          const incomingCheat = Number(p.cheatCount || 0);
          const maxCheat = Math.max(prevCheat, incomingCheat);

          if (incomingCheat > prevCheat && soundEnabledRef.current) {
            playCheatAlertSound();
          }

          const isLocked =
            prevP?.status === 'DISQUALIFIED'
              ? true
              : incomingCheat > prevCheat && current.lockOnCheat
              ? true
              : prevCheat > incomingCheat
              ? Boolean(prevP?.isLocked)
              : Boolean(p.isLocked || prevP?.isLocked);

          const status =
            prevP?.status === 'DISQUALIFIED'
              ? 'DISQUALIFIED'
              : p.status === 'FINISHED' || prevP?.status === 'FINISHED'
              ? 'FINISHED'
              : isLocked
              ? 'LOCKED_CHEAT'
              : p.status;

          const nextAlerts = [...(current.alerts || [])];
          if (
            incomingCheat > prevCheat &&
            !nextAlerts.some((a) => a.studentId === p.id && a.violationNumber === incomingCheat)
          ) {
            nextAlerts.unshift({
              id: `alert_${p.id}_v${incomingCheat}`,
              studentId: p.id,
              studentName: p.name || prevP?.name || 'Aluno',
              studentUnit: p.unit || prevP?.unit || 'Geral',
              reason:
                p.lastCheatReason ||
                prevP?.lastCheatReason ||
                'Mudou de janela ou minimizou o aplicativo no celular',
              timestamp:
                p.lastCheatTime ||
                new Date().toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }),
              violationNumber: incomingCheat
            });
          }

          const updated: LiveExamRoomState = {
            ...current,
            participants: {
              ...current.participants,
              [p.id]: {
                ...prevP,
                ...p,
                cheatCount: maxCheat,
                lastCheatReason:
                  incomingCheat >= prevCheat
                    ? p.lastCheatReason || prevP?.lastCheatReason
                    : prevP?.lastCheatReason || p.lastCheatReason,
                lastCheatTime:
                  incomingCheat >= prevCheat
                    ? p.lastCheatTime || prevP?.lastCheatTime
                    : prevP?.lastCheatTime || p.lastCheatTime,
                isLocked,
                status
              }
            },
            alerts: nextAlerts,
            updatedAt: Date.now()
          };
          persistHostRoom(updated);
          broadcastRoomSync(updated);
        })
        .on('broadcast', { event: 'student:cheat_alert' }, ({ payload }) => {
          const current = getRoomByPin();
          if (!payload?.alert || !payload?.participant || !current) return;
          const alertItem: LiveExamCheatAlert = payload.alert;
          const p: LiveExamParticipant = payload.participant;

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
          broadcastRoomSync(updated);
        })
        .subscribe((status) => {
          const current = getRoomByPin();
          if (status === 'SUBSCRIBED' && current) {
            broadcastRoomSync(current);
          }
        });
    });

    // Sincronização complementar via servidor E nuvem Supabase (sem cache) a cada 2s para todas as salas abertas
    const pollInterval = setInterval(async () => {
      for (const localRoom of hostRoomsRef.current) {
        const pin = localRoom.pin;
        try {
          const [apiRoom, cloudRoom] = await Promise.all([
            fetch(`/api/live-exam?pin=${pin}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => (data?.room && String(data.room.pin) === String(pin) ? (data.room as LiveExamRoomState) : null))
              .catch(() => null),
            downloadCloudExamJson<LiveExamRoomState>(`provas/room_${pin}.json`).then((parsed) =>
              parsed && String(parsed.pin) === String(pin) ? parsed : null
            )
          ]);

          const sources = [apiRoom, cloudRoom].filter(Boolean) as LiveExamRoomState[];
          const latestLocal = hostRoomsRef.current.find((r) => r.pin === pin);

          if (sources.length > 0 && latestLocal) {
            let changed = false;
            const mergedParticipants = { ...latestLocal.participants };
            const existingAlertIds = new Set(latestLocal.alerts.map((a) => a.id));
            const mergedAlerts = [...latestLocal.alerts];
            let nextStatus = latestLocal.status;
            let nextStartedAt = latestLocal.startedAt;
            let nextExtraSeconds = latestLocal.extraSecondsAdded || 0;
            let nextResultsReleased = Boolean(latestLocal.resultsReleased);

            sources.forEach((externalRoom) => {
              Object.values(externalRoom.participants || {}).forEach((sp) => {
                if (!sp?.id) return;
                const lp = mergedParticipants[sp.id];
                const spCheat = Number(sp.cheatCount || 0);
                const lpCheat = Number(lp?.cheatCount || 0);
                if (
                  !lp ||
                  sp.answeredCount > lp.answeredCount ||
                  spCheat > lpCheat ||
                  (sp.isLocked && !lp.isLocked && spCheat >= lpCheat) ||
                  (sp.status === 'FINISHED' && lp.status !== 'FINISHED')
                ) {
                  if (spCheat > lpCheat) {
                    if (soundEnabledRef.current) {
                      playCheatAlertSound();
                    }
                    // Garante que haja um alerta visível no painel mesmo se apenas o participante tiver atualizado
                    const hasMatchingAlert =
                      (externalRoom.alerts || []).some(
                        (a) => a.studentId === sp.id && a.violationNumber === spCheat
                      ) ||
                      mergedAlerts.some(
                        (a) => a.studentId === sp.id && a.violationNumber === spCheat
                      );
                    if (!hasMatchingAlert) {
                      const synthId = `alert_${sp.id}_v${spCheat}`;
                      if (!existingAlertIds.has(synthId)) {
                        existingAlertIds.add(synthId);
                        mergedAlerts.unshift({
                          id: synthId,
                          studentId: sp.id,
                          studentName: sp.name || 'Aluno',
                          studentUnit: sp.unit || 'Geral',
                          reason:
                            sp.lastCheatReason ||
                            'Minimizou o aplicativo ou mudou de janela no celular',
                          timestamp:
                            sp.lastCheatTime ||
                            new Date().toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            }),
                          violationNumber: spCheat
                        });
                      }
                    }
                  }
                  mergedParticipants[sp.id] = {
                    ...lp,
                    ...sp,
                    answeredCount: Math.max(Number(lp?.answeredCount || 0), Number(sp.answeredCount || 0)),
                    cheatCount: Math.max(lpCheat, spCheat),
                    isLocked: spCheat >= lpCheat ? sp.isLocked : Boolean(lp?.isLocked)
                  };
                  changed = true;
                }
              });

              (externalRoom.alerts || []).forEach((sa) => {
                if (sa?.id && !existingAlertIds.has(sa.id)) {
                  existingAlertIds.add(sa.id);
                  mergedAlerts.unshift(sa);
                  changed = true;
                  if (soundEnabledRef.current) {
                    playCheatAlertSound();
                  }
                }
              });

              if (externalRoom.status === 'FINISHED' && nextStatus !== 'FINISHED') {
                nextStatus = 'FINISHED';
              } else if (externalRoom.status === 'ACTIVE' && nextStatus === 'WAITING') {
                nextStatus = 'ACTIVE';
              }
              if (externalRoom.resultsReleased) {
                nextResultsReleased = true;
              }
              if (!nextStartedAt && externalRoom.startedAt) {
                nextStartedAt = externalRoom.startedAt;
              }
              if ((externalRoom.extraSecondsAdded || 0) > nextExtraSeconds) {
                nextExtraSeconds = externalRoom.extraSecondsAdded || 0;
              }
            });

            if (
              nextStatus !== latestLocal.status ||
              nextStartedAt !== latestLocal.startedAt ||
              nextExtraSeconds !== (latestLocal.extraSecondsAdded || 0) ||
              nextResultsReleased !== Boolean(latestLocal.resultsReleased)
            ) {
              changed = true;
            }

            if (changed) {
              const nextRoom: LiveExamRoomState = {
                ...latestLocal,
                status: nextStatus,
                resultsReleased: nextResultsReleased,
                startedAt: nextStartedAt,
                extraSecondsAdded: nextExtraSeconds,
                participants: mergedParticipants,
                alerts: mergedAlerts,
                updatedAt: Date.now()
              };
              persistHostRoom(nextRoom);
              hostChannelsMapRef.current
                .get(pin)
                ?.send({
                  type: 'broadcast',
                  event: 'host:room_sync',
                  payload: { room: nextRoom }
                })
                .catch(() => {});
            }
          }
        } catch {}
      }
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [openRoomPinsKey, persistHostRoom]);

  // Limpa todos os canais ao desmontar o componente
  useEffect(() => {
    return () => {
      Array.from(hostChannelsMapRef.current.values()).forEach((ch) => {
        supabaseQfpy.removeChannel(ch);
      });
      hostChannelsMapRef.current.clear();
      hostChannelRef.current = null;
    };
  }, []);

  // Cronômetro regressivo de todas as salas ativas no painel do Instrutor
  useEffect(() => {
    const updateTimers = () => {
      const currentSelected = activeRoomRef.current;
      if (!currentSelected || currentSelected.status !== 'ACTIVE' || !currentSelected.startedAt) {
        setHostRemainingSeconds(currentSelected ? currentSelected.durationMinutes * 60 : 0);
      } else {
        const totalAllowed =
          currentSelected.durationMinutes * 60 + (currentSelected.extraSecondsAdded || 0);
        const elapsed = Math.floor((Date.now() - (currentSelected.startedAt || Date.now())) / 1000);
        setHostRemainingSeconds(Math.max(0, totalAllowed - elapsed));
      }

      // Verifica se alguma sala aberta esgotou o tempo
      hostRoomsRef.current.forEach((roomItem) => {
        if (roomItem.status === 'ACTIVE' && roomItem.startedAt) {
          const totalAllowed = roomItem.durationMinutes * 60 + (roomItem.extraSecondsAdded || 0);
          const elapsed = Math.floor((Date.now() - roomItem.startedAt) / 1000);
          const remaining = Math.max(0, totalAllowed - elapsed);
          if (remaining <= 0) {
            const finishedRoom: LiveExamRoomState = {
              ...roomItem,
              status: 'FINISHED',
              updatedAt: Date.now()
            };
            persistHostRoom(finishedRoom);
            hostChannelsMapRef.current
              .get(roomItem.pin)
              ?.send({
                type: 'broadcast',
                event: 'host:room_sync',
                payload: { room: finishedRoom }
              })
              .catch(() => {});
          }
        }
      });
    };

    updateTimers();
    const timer = setInterval(updateTimers, 1000);
    return () => clearInterval(timer);
  }, [activeRoom, openRoomPinsKey, persistHostRoom]);

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

  // Cria a Sala da Prova com PIN de 6 dígitos único e QR Code (suporta múltiplas provas abertas)
  const handleCreateLiveExamRoom = () => {
    if (!selectedSpecialty || questions.length === 0) return;
    let pin = String(Math.floor(100000 + Math.random() * 900000));
    const existingPins = new Set(hostRoomsRef.current.map((r) => r.pin));
    while (existingPins.has(pin)) {
      pin = String(Math.floor(100000 + Math.random() * 900000));
    }
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
    persistHostRoom(newRoom, { selectRoom: true });
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
    (hostChannelsMapRef.current.get(activeRoom.pin) || hostChannelRef.current)
      ?.send({
        type: 'broadcast',
        event: 'host:room_sync',
        payload: { room: updated }
      })
      .catch(() => {});
  };

  const handleReleaseResultsForAll = () => {
    if (!activeRoom) return;
    const totalQ = activeRoom.questions.length || 1;
    const finalizedParticipants: Record<string, LiveExamParticipant> = {};
    Object.values(activeRoom.participants || {}).forEach((p) => {
      const ans = p.answers || {};
      let correct = 0;
      Object.entries(ans).forEach(([qIdxStr, chosenOpt]) => {
        const qItem = activeRoom.questions[Number(qIdxStr)];
        if (qItem && qItem.correctIndex === Number(chosenOpt)) {
          correct += 1;
        }
      });
      const answeredCount = Object.keys(ans).length;
      const scorePercent = Math.round((correct / totalQ) * 100);
      const grade10 = Number(((correct / totalQ) * 10).toFixed(1));
      finalizedParticipants[p.id] = {
        ...p,
        answeredCount,
        correctCount: correct,
        scorePercent,
        grade10,
        status: p.status === 'DISQUALIFIED' ? 'DISQUALIFIED' : 'FINISHED',
        finishedAt:
          p.finishedAt ||
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    });

    const updated: LiveExamRoomState = {
      ...activeRoom,
      status: 'FINISHED',
      resultsReleased: true,
      participants: finalizedParticipants,
      updatedAt: Date.now()
    };
    persistHostRoom(updated);
    const ch = hostChannelsMapRef.current.get(activeRoom.pin) || hostChannelRef.current;
    ch?.send({
      type: 'broadcast',
      event: 'host:room_sync',
      payload: { room: updated }
    }).catch(() => {});
    ch?.send({
      type: 'broadcast',
      event: 'host:release_results',
      payload: {
        pin: activeRoom.pin,
        resultsReleased: true,
        room: updated,
        participants: finalizedParticipants
      }
    }).catch(() => {});

    const totalDevices = Object.keys(finalizedParticipants).length;
    setReleaseFeedbackMsg(
      totalDevices > 0
        ? `✅ Resultado individual enviado para o aparelho de cada um dos ${totalDevices} aluno(s)!`
        : '✅ Resultado da sala liberado! Assim que um aluno concluir, verá a nota no aparelho dele.'
    );
    setTimeout(() => setReleaseFeedbackMsg(null), 5000);
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
    fetch('/api/live-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UNLOCK_STUDENT',
        pin: activeRoom.pin,
        studentId: targetStudentId
      })
    }).catch(() => {});
    const ch = hostChannelsMapRef.current.get(activeRoom.pin) || hostChannelRef.current;
    ch?.send({
      type: 'broadcast',
      event: 'host:unlock_student',
      payload: { studentId: targetStudentId, unlockedAtViolation: target.cheatCount || 0 }
    }).catch(() => {});
    ch?.send({
      type: 'broadcast',
      event: 'host:room_sync',
      payload: { room: updated }
    }).catch(() => {});
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

  const handleCloseAndResetRoom = (pinToClose?: string) => {
    persistHostRoom(null, { closePin: pinToClose || activeRoom?.pin });
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

      const effectiveCheatCount = Math.max(studentCheatCount, studentCheatCountRef.current);
      const effectiveLocked = Boolean(studentLocked || studentLockedRef.current);
      const effectiveCheatReason = studentLastCheatReason || studentLastCheatReasonRef.current;

      return {
        id: studentId,
        name: studentName.trim() || 'Desbravador',
        unit: studentUnit.trim() || 'Geral',
        status: effectiveLocked
          ? 'LOCKED_CHEAT'
          : studentPhase === 'FINISHED'
          ? 'FINISHED'
          : studentPhase === 'WAITING_HOST'
          ? 'WAITING'
          : 'PLAYING',
        joinedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        currentQuestionIdx: studentCurrentQ,
        answeredCount,
        correctCount: correct,
        scorePercent,
        grade10,
        cheatCount: effectiveCheatCount,
        lastCheatReason: effectiveCheatReason,
        isLocked: effectiveLocked,
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
    async (
      pin: string,
      participant: LiveExamParticipant,
      newAlert?: LiveExamCheatAlert,
      fallbackRoom?: LiveExamRoomState | null
    ) => {
      try {
        let cloudRoom = await downloadCloudExamJson<LiveExamRoomState>(`provas/room_${pin}.json`);
        if (!cloudRoom || !cloudRoom.pin) {
          cloudRoom = fallbackRoom ? { ...fallbackRoom } : null;
        }
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

        // Se a sala tiver creatorKey, atualiza também o estado em nuvem do instrutor
        if (cloudRoom.creatorKey) {
          try {
            const instState = await downloadCloudExamJson<any>(
              `provas/instructor_${cloudRoom.creatorKey}.json`
            );
            if (instState && Array.isArray(instState.rooms)) {
              const updatedRooms = instState.rooms.map((r: any) =>
                r && String(r.pin) === String(pin) ? cloudRoom : r
              );
              await supabaseQfpy.storage
                .from('App DBV Tudo')
                .upload(
                  `provas/instructor_${cloudRoom.creatorKey}.json`,
                  JSON.stringify({
                    ...instState,
                    rooms: updatedRooms,
                    updatedAt: Date.now()
                  }),
                  {
                    upsert: true,
                    contentType: 'application/json',
                    cacheControl: '0'
                  }
                );
            }
          } catch {}
        }
      } catch {}
    },
    []
  );

  // Conecta o Aluno à Sala pelo PIN (via Servidor + Supabase Realtime Dedicado + Supabase Storage)
  const handleStudentJoinRoom = async (overridePin?: string | React.MouseEvent) => {
    const rawPin = typeof overridePin === 'string' ? overridePin : studentPinInput;
    const cleanPin = rawPin.replace(/\D/g, '').trim();
    if (cleanPin.length !== 6) {
      setStudentError('Digite o código PIN de 6 dígitos da prova ou leia o QR Code.');
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

    // 1. Tenta buscar estado imediato no servidor (/api/live-exam), nuvem Supabase (sem cache) ou localStorage
    try {
      const [apiRoom, cloudRoom] = await Promise.all([
        fetch(`/api/live-exam?pin=${cleanPin}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => (data?.room && String(data.room.pin) === cleanPin ? (data.room as LiveExamRoomState) : null))
          .catch(() => null),
        downloadCloudExamJson<LiveExamRoomState>(`provas/room_${cleanPin}.json`).then((parsed) =>
          parsed && String(parsed.pin) === cleanPin ? parsed : null
        )
      ]);
      resolvedRoom = cloudRoom || apiRoom;
      if (apiRoom && cloudRoom) {
        resolvedRoom = (cloudRoom.updatedAt || 0) >= (apiRoom.updatedAt || 0) ? cloudRoom : apiRoom;
      }
    } catch {}

    if (!resolvedRoom) {
      try {
        const localMulti = localStorage.getItem('dbv_instructor_active_exam_rooms');
        if (localMulti) {
          const parsedMulti = JSON.parse(localMulti);
          if (Array.isArray(parsedMulti)) {
            const matched = parsedMulti.find((r: any) => r && String(r.pin) === cleanPin);
            if (matched) resolvedRoom = matched;
          }
        }
        if (!resolvedRoom) {
          const localSaved = localStorage.getItem('dbv_instructor_active_exam_room');
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            if (parsed && String(parsed.pin) === cleanPin) {
              resolvedRoom = parsed;
            }
          }
        }
      } catch {}
    }

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

    // Registra imediatamente no Servidor, no Supabase Storage e nas salas locais (caso seja o mesmo aparelho)
    fetch('/api/live-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'STUDENT_UPDATE',
        pin: cleanPin,
        participant: initialParticipant
      })
    }).catch(() => {});

    syncStudentToCloudRoom(cleanPin, initialParticipant, undefined, resolvedRoom);

    const matchingLocalHostRoom = hostRoomsRef.current.find((r) => String(r.pin) === cleanPin);
    if (matchingLocalHostRoom) {
      const updatedHostRoom: LiveExamRoomState = {
        ...matchingLocalHostRoom,
        participants: {
          ...matchingLocalHostRoom.participants,
          [initialParticipant.id]: initialParticipant
        },
        updatedAt: Date.now()
      };
      persistHostRoom(updatedHostRoom);
      hostChannelsMapRef.current
        .get(cleanPin)
        ?.send({
          type: 'broadcast',
          event: 'student:join',
          payload: { participant: initialParticipant }
        })
        .catch(() => {});
    }

    // 2. Conecta no canal Supabase Realtime da sala usando o cliente dedicado do Aluno (sem colisão com o Host)
    if (studentChannelRef.current) {
      supabaseStudentRealtime.removeChannel(studentChannelRef.current);
    }

    const channel = supabaseStudentRealtime.channel(`dbv_live_exam_${cleanPin}`, {
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

        const myRecord =
          incomingRoom.participants?.[studentId] ||
          Object.values(incomingRoom.participants || {}).find(
            (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
          );
        if (myRecord) {
          // Só aceita desbloqueio vindo do Host se o Host já tiver registrado a violação atual do aluno
          if ((myRecord.cheatCount || 0) >= studentCheatCountRef.current) {
            studentLockedRef.current = Boolean(myRecord.isLocked);
            setStudentLocked(Boolean(myRecord.isLocked));
            if (!myRecord.isLocked) {
              setStudentWarningModal(null);
            }
          }
          if (myRecord.answers && Object.keys(myRecord.answers).length > 0) {
            setStudentAnswers((prev) =>
              Object.keys(prev).length >= Object.keys(myRecord.answers).length ? prev : myRecord.answers
            );
          }
        }

        if (incomingRoom.status === 'ACTIVE' && !incomingRoom.resultsReleased) {
          setStudentPhase((prev) => (prev === 'FINISHED' ? 'FINISHED' : 'PLAYING'));
          setStudentStartTime((prev) => prev || Date.now());
        } else if (incomingRoom.status === 'FINISHED' || incomingRoom.resultsReleased) {
          setStudentFinalTimeSpentSec((prev) => {
            if (prev > 0) return prev;
            const recSpent = myRecord?.timeSpentSeconds;
            if (recSpent && recSpent > 0) return recSpent;
            const base = studentStartTime || incomingRoom.startedAt || Date.now();
            return Math.max(1, Math.floor((Date.now() - base) / 1000));
          });
          setStudentPhase('FINISHED');
        } else {
          setStudentPhase((prev) => (prev === 'FINISHED' ? 'FINISHED' : 'WAITING_HOST'));
        }
      })
      .on('broadcast', { event: 'host:release_results' }, ({ payload }) => {
        if (!payload?.room) return;
        const incomingRoom: LiveExamRoomState = {
          ...payload.room,
          resultsReleased: true
        };
        didResolveFromHost = true;
        setStudentRoom(incomingRoom);
        setIsConnectingRoom(false);

        const myRecord =
          incomingRoom.participants?.[studentId] ||
          Object.values(incomingRoom.participants || {}).find(
            (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
          );
        if (myRecord?.answers && Object.keys(myRecord.answers).length > 0) {
          setStudentAnswers((prev) =>
            Object.keys(prev).length >= Object.keys(myRecord.answers).length ? prev : myRecord.answers
          );
        }
        if (myRecord?.timeSpentSeconds && myRecord.timeSpentSeconds > 0) {
          setStudentFinalTimeSpentSec((prev) => prev || myRecord.timeSpentSeconds || 1);
        }
        setStudentPhase('FINISHED');
        try {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([80, 50, 140]);
          }
        } catch {}
      })
      .on('broadcast', { event: 'host:unlock_student' }, ({ payload }) => {
        if (payload?.studentId === studentId) {
          studentLockedRef.current = false;
          setStudentLocked(false);
          setStudentWarningModal(null);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
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
        }
      });

    if (resolvedRoom) {
      const roomWithMe: LiveExamRoomState = {
        ...resolvedRoom,
        participants: {
          ...(resolvedRoom.participants || {}),
          [initialParticipant.id]: initialParticipant
        }
      };
      setStudentRoom(roomWithMe);
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

  // Polling complementar do Aluno para sincronizar status da sala / desbloqueio do instrutor + Heartbeat de presença
  useEffect(() => {
    if (roleMode !== 'STUDENT' || studentPhase === 'ENTER_PIN' || !studentRoom?.pin) return;
    const pin = studentRoom.pin;

    const interval = setInterval(async () => {
      try {
        const currentParticipant = buildCurrentParticipantPayload({
          status:
            studentPhase === 'FINISHED'
              ? 'FINISHED'
              : studentLocked
              ? 'LOCKED_CHEAT'
              : studentPhase === 'PLAYING'
              ? 'PLAYING'
              : 'WAITING'
        });

        const alreadyFinishedOnServer =
          studentPhase === 'FINISHED' &&
          studentRoom?.participants?.[studentId]?.status === 'FINISHED' &&
          (studentRoom?.participants?.[studentId]?.answeredCount || 0) >= currentParticipant.answeredCount;

        if (!alreadyFinishedOnServer) {
          studentChannelRef.current
            ?.send({
              type: 'broadcast',
              event: studentPhase === 'WAITING_HOST' ? 'student:join' : 'student:update',
              payload: { participant: currentParticipant }
            })
            .catch(() => {});

          fetch('/api/live-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'STUDENT_UPDATE',
              pin,
              participant: currentParticipant
            })
          }).catch(() => {});
        }

        const [apiRoom, cloudRoom] = await Promise.all([
          fetch(`/api/live-exam?pin=${pin}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => (data?.room && String(data.room.pin) === String(pin) ? (data.room as LiveExamRoomState) : null))
            .catch(() => null),
          downloadCloudExamJson<LiveExamRoomState>(`provas/room_${pin}.json`).then((parsed) =>
            parsed && String(parsed.pin) === String(pin) ? parsed : null
          )
        ]);

        const baseSrv =
          apiRoom && cloudRoom
            ? (cloudRoom.updatedAt || 0) >= (apiRoom.updatedAt || 0)
              ? cloudRoom
              : apiRoom
            : cloudRoom || apiRoom;

        if (baseSrv) {
          const mergedStatus: LiveExamRoomState['status'] =
            cloudRoom?.status === 'FINISHED' || apiRoom?.status === 'FINISHED' || baseSrv.status === 'FINISHED'
              ? 'FINISHED'
              : cloudRoom?.status === 'ACTIVE' || apiRoom?.status === 'ACTIVE' || baseSrv.status === 'ACTIVE'
              ? 'ACTIVE'
              : 'WAITING';
          const mergedResultsReleased = Boolean(
            cloudRoom?.resultsReleased || apiRoom?.resultsReleased || baseSrv.resultsReleased
          );
          const mergedExtraSeconds = Math.max(
            cloudRoom?.extraSecondsAdded || 0,
            apiRoom?.extraSecondsAdded || 0,
            baseSrv.extraSecondsAdded || 0
          );
          const srv: LiveExamRoomState = {
            ...baseSrv,
            status: mergedStatus,
            resultsReleased: mergedResultsReleased,
            extraSecondsAdded: mergedExtraSeconds,
            participants: {
              ...(apiRoom?.participants || {}),
              ...(cloudRoom?.participants || {}),
              ...(baseSrv.participants || {})
            }
          };

          setStudentRoom((prev) => ({
            ...srv,
            resultsReleased: Boolean(srv.resultsReleased || prev?.resultsReleased)
          }));

          const me =
            srv.participants?.[studentId] ||
            Object.values(srv.participants || {}).find(
              (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
            );
          const latestPendingAlert =
            studentPendingAlertsRef.current[studentPendingAlertsRef.current.length - 1];
          const serverMissingCheat =
            studentCheatCountRef.current > (me?.cheatCount || 0) ||
            (latestPendingAlert &&
              !(srv.alerts || []).some((a) => a.id === latestPendingAlert.id));

          if (serverMissingCheat && latestPendingAlert) {
            const cheatParticipantPayload = buildCurrentParticipantPayload({
              cheatCount: studentCheatCountRef.current,
              lastCheatReason: studentLastCheatReasonRef.current || latestPendingAlert.reason,
              lastCheatTime: latestPendingAlert.timestamp,
              isLocked: studentLockedRef.current,
              status: studentLockedRef.current ? 'LOCKED_CHEAT' : currentParticipant.status
            });
            studentChannelRef.current
              ?.send({
                type: 'broadcast',
                event: 'student:cheat_alert',
                payload: { alert: latestPendingAlert, participant: cheatParticipantPayload }
              })
              .catch(() => {});
            fetch('/api/live-exam', {
              method: 'POST',
              keepalive: true,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'CHEAT_ALERT',
                pin,
                alert: latestPendingAlert,
                participant: cheatParticipantPayload
              })
            }).catch(() => {});
            syncStudentToCloudRoom(pin, cheatParticipantPayload, latestPendingAlert, srv);
          } else if (!me || me.answeredCount < currentParticipant.answeredCount) {
            syncStudentToCloudRoom(pin, currentParticipant, undefined, srv);
          } else if (me.answers && Object.keys(me.answers).length > 0) {
            setStudentAnswers((prev) =>
              Object.keys(prev).length >= Object.keys(me.answers).length ? prev : me.answers
            );
          }

          if (me) {
            if (me.status === 'DISQUALIFIED') {
              studentLockedRef.current = true;
              setStudentLocked(true);
            } else if ((me.cheatCount || 0) >= studentCheatCountRef.current) {
              studentLockedRef.current = Boolean(me.isLocked);
              setStudentLocked(Boolean(me.isLocked));
              if (!me.isLocked) setStudentWarningModal(null);
            }
          }
          if (srv.status === 'ACTIVE' && !srv.resultsReleased && studentPhase === 'WAITING_HOST') {
            setStudentPhase('PLAYING');
            setStudentStartTime((prev) => prev || Date.now());
          } else if ((srv.status === 'FINISHED' || srv.resultsReleased) && studentPhase !== 'FINISHED') {
            setStudentFinalTimeSpentSec((prev) => {
              if (prev > 0) return prev;
              const recSpent = me?.timeSpentSeconds;
              if (recSpent && recSpent > 0) return recSpent;
              const base = studentStartTime || srv.startedAt || Date.now();
              return Math.max(1, Math.floor((Date.now() - base) / 1000));
            });
            setStudentPhase('FINISHED');
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(interval);
  }, [roleMode, studentPhase, studentRoom?.pin, studentId, studentLocked, buildCurrentParticipantPayload, syncStudentToCloudRoom]);

  // ============================================================================
  // DETECTOR ANTI-COLA EM TEMPO REAL NO CELULAR/PC DO ALUNO
  // (Minimizar tela, trocar de aba, mudar de janela no celular ou sair da tela cheia)
  // ============================================================================
  const flushPendingStudentCheatAlerts = useCallback(() => {
    const activeStudentRoom = studentRoomRef.current;
    if (!activeStudentRoom?.pin || studentPendingAlertsRef.current.length === 0) return;

    const latestAlert = studentPendingAlertsRef.current[studentPendingAlertsRef.current.length - 1];
    if (!latestAlert) return;

    const updatedParticipant = buildCurrentParticipantPayload({
      cheatCount: studentCheatCountRef.current,
      lastCheatReason: studentLastCheatReasonRef.current || latestAlert.reason,
      lastCheatTime: latestAlert.timestamp,
      isLocked: studentLockedRef.current,
      status: studentLockedRef.current
        ? 'LOCKED_CHEAT'
        : studentPhaseRef.current === 'WAITING_HOST'
        ? 'WAITING'
        : 'PLAYING'
    });

    studentChannelRef.current
      ?.send({
        type: 'broadcast',
        event: 'student:cheat_alert',
        payload: { alert: latestAlert, participant: updatedParticipant }
      })
      .catch(() => {});

    fetch('/api/live-exam', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'CHEAT_ALERT',
        pin: activeStudentRoom.pin,
        alert: latestAlert,
        participant: updatedParticipant
      })
    }).catch(() => {});

    syncStudentToCloudRoom(activeStudentRoom.pin, updatedParticipant, latestAlert, activeStudentRoom);
  }, [buildCurrentParticipantPayload, syncStudentToCloudRoom]);

  const triggerStudentCheatViolation = useCallback(
    (reason: string) => {
      const currentRoom = studentRoomRef.current;
      const currentPhase = studentPhaseRef.current;
      if (
        roleMode !== 'STUDENT' ||
        (currentPhase !== 'PLAYING' && currentPhase !== 'WAITING_HOST') ||
        !currentRoom ||
        currentRoom.status === 'FINISHED' ||
        isQrScannerOpen
      ) {
        return;
      }

      const now = Date.now();
      // Evita disparo duplicado no mesmo segundo quando blur + visibilitychange + pagehide ocorrem juntos
      if (now - lastCheatTimestampRef.current < 1200) return;
      lastCheatTimestampRef.current = now;

      const nextCount = studentCheatCountRef.current + 1;
      studentCheatCountRef.current = nextCount;

      const timeStr = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const shouldLock = Boolean(currentRoom.lockOnCheat);
      studentLockedRef.current = shouldLock;
      studentLastCheatReasonRef.current = reason;

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

      studentPendingAlertsRef.current = [...studentPendingAlertsRef.current, alertEvent];

      const updatedParticipant = buildCurrentParticipantPayload({
        cheatCount: nextCount,
        lastCheatReason: reason,
        lastCheatTime: timeStr,
        isLocked: shouldLock,
        status: shouldLock
          ? 'LOCKED_CHEAT'
          : currentPhase === 'WAITING_HOST'
          ? 'WAITING'
          : 'PLAYING'
      });

      const bodyStr = JSON.stringify({
        action: 'CHEAT_ALERT',
        pin: currentRoom.pin,
        alert: alertEvent,
        participant: updatedParticipant
      });

      // 1. Envia via WebSocket Realtime imediatamente
      studentChannelRef.current
        ?.send({
          type: 'broadcast',
          event: 'student:cheat_alert',
          payload: { alert: alertEvent, participant: updatedParticipant }
        })
        .catch(() => {});

      // 2. Envia via sendBeacon + fetch keepalive para o navegador mobile não cancelar ao trocar de janela
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([bodyStr], { type: 'application/json' });
          navigator.sendBeacon('/api/live-exam', blob);
        }
      } catch {}

      fetch('/api/live-exam', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      }).catch(() => {});

      // 3. Upload direto de 1 passo para o Supabase Storage (sem esperar GET antes de congelar a aba no celular)
      try {
        const fastCloudRoom: LiveExamRoomState = {
          ...currentRoom,
          participants: {
            ...(currentRoom.participants || {}),
            [updatedParticipant.id]: updatedParticipant
          },
          alerts: [
            alertEvent,
            ...(currentRoom.alerts || []).filter((a) => a.id !== alertEvent.id)
          ],
          updatedAt: now
        };
        studentRoomRef.current = fastCloudRoom;
        supabaseQfpy.storage
          .from('App DBV Tudo')
          .upload(`provas/room_${currentRoom.pin}.json`, JSON.stringify(fastCloudRoom), {
            upsert: true,
            contentType: 'application/json',
            cacheControl: '0'
          })
          .catch(() => {});
      } catch {}

      // 4. Sincronização complementar completa com merge
      syncStudentToCloudRoom(currentRoom.pin, updatedParticipant, alertEvent, currentRoom);
    },
    [
      roleMode,
      isQrScannerOpen,
      studentId,
      studentName,
      studentUnit,
      buildCurrentParticipantPayload,
      syncStudentToCloudRoom
    ]
  );

  useEffect(() => {
    if (
      roleMode !== 'STUDENT' ||
      (studentPhase !== 'PLAYING' && studentPhase !== 'WAITING_HOST') ||
      !studentRoom
    ) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerStudentCheatViolation('Mudou de janela ou minimizou o aplicativo no celular');
      } else {
        // Quando o aluno volta para a tela no celular, garante o reenvio imediato caso o SO tenha pausado a rede
        flushPendingStudentCheatAlerts();
      }
    };

    const handlePageHide = () => {
      triggerStudentCheatViolation('Saiu da tela da prova ou alternou de aplicativo');
    };

    const handleWindowBlur = () => {
      triggerStudentCheatViolation('Mudou de janela, abriu outro app ou barra do sistema');
    };

    const handleWindowFocus = () => {
      flushPendingStudentCheatAlerts();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && studentPhaseRef.current === 'PLAYING') {
        triggerStudentCheatViolation('Saiu do modo Tela Cheia obrigatório durante a prova');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [roleMode, studentPhase, studentRoom, triggerStudentCheatViolation, flushPendingStudentCheatAlerts]);

  // Cronômetro regressivo do Aluno durante a Prova
  const handleStudentSubmitExam = useCallback(() => {
    if (!studentRoom) return;
    const baseStart = studentStartTime || studentRoom.startedAt || Date.now();
    const spent = Math.max(1, Math.floor((Date.now() - baseStart) / 1000));
    setStudentFinalTimeSpentSec(spent);
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

  const formatDurationDetailed = (totalSec: number) => {
    const safe = Math.max(1, Math.floor(totalSec || 0));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    if (mins <= 0) return `${secs} seg`;
    return `${mins} min e ${String(secs).padStart(2, '0')} seg`;
  };

  const handleCloseProjectionWindow = useCallback(() => {
    try {
      if (projectorWindowRef.current && !projectorWindowRef.current.closed) {
        projectorWindowRef.current.close();
      }
    } catch {}
    projectorWindowRef.current = null;
    setIsSecondScreenActive(false);
  }, []);

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
      position: relative;
      overflow: hidden;
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
    .qr-finished-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      background: rgba(9, 13, 22, 0.9);
      backdrop-filter: blur(4px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      text-align: center;
    }
    .qr-finished-overlay .flag {
      font-size: clamp(36px, 5vw, 56px);
      line-height: 1;
      margin-bottom: 10px;
    }
    .qr-finished-overlay .txt {
      font-size: clamp(28px, 4vw, 46px);
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #f87171;
      line-height: 1.08;
      text-shadow: 0 6px 20px rgba(0,0,0,0.6);
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
        <div id="telao-qr-finished" class="qr-finished-overlay" style="display:${activeRoom.status === 'FINISHED' ? 'flex' : 'none'};">
          <div class="flag">🏁</div>
          <div class="txt">PROVA ENCERRADA</div>
        </div>
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
      const logoEl = doc.getElementById('telao-logo') as HTMLImageElement | null;
      if (logoEl && activeRoom.specialtyLogo) {
        logoEl.src = activeRoom.specialtyLogo;
      }
      const titleEl = doc.getElementById('telao-title');
      if (titleEl) titleEl.textContent = activeRoom.specialtyName;

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
      const qrFinishedEl = doc.getElementById('telao-qr-finished');
      if (qrFinishedEl) {
        qrFinishedEl.style.display = activeRoom.status === 'FINISHED' ? 'flex' : 'none';
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
  // LEITOR DE QR CODE COM A CÂMERA DENTRO DO APP
  // ============================================================================
  const stopQrScannerStream = useCallback(() => {
    try {
      if (scannerStreamRef.current) {
        scannerStreamRef.current.getTracks().forEach((track) => track.stop());
        scannerStreamRef.current = null;
      }
      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = null;
      }
    } catch {}
  }, []);

  const handleQrCodeDecoded = useCallback(
    (rawText: string) => {
      const pinFound = extractExamPinFromQrText(rawText);
      if (!pinFound) {
        setQrScannerError('QR Code lido, mas não contém um PIN de 6 dígitos válido de Prova Ao Vivo.');
        return;
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(100);
        }
      } catch {}
      stopQrScannerStream();
      setIsQrScannerOpen(false);
      setQrScannerError(null);
      setEntryScreenConfirmed(true);
      setRoleMode('STUDENT');
      setStudentPhase('ENTER_PIN');
      setStudentPinInput(pinFound);
      setStudentError(null);
      setQrScannedSuccessMsg(`✅ QR Code lido! Sala #${pinFound} identificada.`);
      if (studentName.trim().length >= 2) {
        setTimeout(() => {
          handleStudentJoinRoom(pinFound);
        }, 120);
      }
    },
    [stopQrScannerStream, studentName]
  );

  useEffect(() => {
    if (!isQrScannerOpen) {
      stopQrScannerStream();
      return;
    }

    let cancelled = false;
    let scanTimer: any = null;
    setQrScannerError(null);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setQrScannerError(
            'A câmera ao vivo não está disponível neste navegador. Use o botão abaixo para tirar foto do QR Code.'
          );
          return;
        }
        stopQrScannerStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: qrScannerFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        scannerStreamRef.current = stream;
        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = stream;
          await scannerVideoRef.current.play().catch(() => {});
        }

        let nativeDetector: any = null;
        try {
          if ('BarcodeDetector' in window) {
            nativeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          }
        } catch {}

        scanTimer = setInterval(async () => {
          if (cancelled || !scannerVideoRef.current) return;
          const video = scannerVideoRef.current;
          if (video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) return;

          if (nativeDetector) {
            try {
              const codes = await nativeDetector.detect(video);
              if (Array.isArray(codes) && codes.length > 0 && codes[0]?.rawValue) {
                handleQrCodeDecoded(String(codes[0].rawValue));
                return;
              }
            } catch {}
          }

          const canvas = scannerCanvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth'
          });
          if (code && code.data) {
            handleQrCodeDecoded(code.data);
          }
        }, 160);
      } catch {
        if (!cancelled) {
          setQrScannerError(
            'Não foi possível acessar a câmera automaticamente. Permita o uso da câmera ou use o botão abaixo para ler por foto.'
          );
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (scanTimer) clearInterval(scanTimer);
      stopQrScannerStream();
    };
  }, [isQrScannerOpen, qrScannerFacingMode, stopQrScannerStream, handleQrCodeDecoded]);

  const handleScanQrFromImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrScannerError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = scannerCanvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth'
        });
        if (code && code.data) {
          handleQrCodeDecoded(code.data);
        } else {
          setQrScannerError('Não foi possível identificar um QR Code nesta imagem. Tente aproximar mais do QR Code.');
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const renderQrScannerModal = () => {
    if (!isQrScannerOpen || typeof document === 'undefined') return null;
    return createPortal(
      <div
        className="fixed inset-0 z-[100005] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setIsQrScannerOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-[28px] p-4 sm:p-5 text-white shadow-2xl space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/25 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
                <Camera size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-white">
                  Ler QR Code da Prova
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  Aponte a câmera para o QR Code da sala
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="relative w-full aspect-square max-h-[300px] mx-auto rounded-2xl overflow-hidden bg-slate-950 border-2 border-indigo-500/40 flex items-center justify-center">
            <video
              ref={scannerVideoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            <canvas ref={scannerCanvasRef} className="hidden" />
            {/* Moldura de Foco do QR Code */}
            <div className="absolute inset-8 border-2 border-amber-400/80 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(2,6,23,0.45)] flex items-center justify-center">
              <div className="w-full h-0.5 bg-amber-400/90 shadow-[0_0_12px_#fbbf24] animate-pulse" />
            </div>
          </div>

          {qrScannerError && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px] font-bold text-center">
              {qrScannerError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setQrScannerFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
              }
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Trocar Câmera</span>
            </button>

            <label className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer text-center">
              <QrCode size={13} />
              <span>Ler por Foto</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleScanQrFromImageFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ============================================================================
  // TELA INICIAL AO ENTRAR NA ÁREA DE PROVA AO VIVO PELO APLICATIVO (NO CELULAR):
  // Botões: 1. "Criar Prova" (vai pra área de criação) | 2. "Escanear QR Code" (vai pra área da prova — apenas para celular)
  // ============================================================================
  if (!isIsolatedStudentMode && !initialPin && !entryScreenConfirmed && isMobileDevice) {
    return (
      <div className="w-full max-w-2xl mx-auto py-4 sm:py-8 px-2 animate-fade-in">
        {renderQrScannerModal()}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-white/10 rounded-[28px] p-5 sm:p-7 text-white shadow-2xl space-y-5">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/25 border border-indigo-400/40 text-indigo-300 flex items-center justify-center mx-auto shadow-lg">
              <QrCode size={32} />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/35 text-amber-300 text-[10px] font-black uppercase tracking-widest">
              Prova Ao Vivo • {isPathfinder ? 'Desbravadores' : 'Aventureiros'}
            </span>
            <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
              Prova Ao Vivo
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto">
              Selecione uma opção abaixo para criar uma prova ou escanear o QR Code da sala:
            </p>
          </div>

          {entryPermissionNotice && (
            <div className="p-3 rounded-2xl bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-bold text-center">
              {entryPermissionNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {/* Botão 1: Criar Prova (vai para a área de criação — Conselheiro+) */}
            <button
              type="button"
              onClick={() => {
                if (!hasHostPermission) {
                  setEntryPermissionNotice(
                    '🔒 O recurso de Criar Prova é liberado apenas de Conselheiro para cima.'
                  );
                  return;
                }
                setEntryPermissionNotice(null);
                setRoleMode('HOST');
                setIsCreatingNewRoom(true);
                setEntryScreenConfirmed(true);
              }}
              className={`group relative overflow-hidden rounded-[24px] p-5 text-left border transition-all flex flex-col justify-between gap-4 cursor-pointer active:scale-[0.98] ${
                hasHostPermission
                  ? 'bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-600 border-indigo-400/40 shadow-xl shadow-indigo-600/20'
                  : 'bg-slate-800/80 border-slate-700 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                  <Plus size={24} />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-black/25 text-amber-300 text-[9px] font-black uppercase tracking-wider">
                  Conselheiro+
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  Criar Prova
                </h3>
                <p className="text-[11px] text-indigo-100/90 font-medium leading-relaxed">
                  Ir para a área de criação para escolher a especialidade e abrir sala com QR Code.
                </p>
              </div>
            </button>

            {/* Botão 2: Escanear QR Code (vai para a área da prova — exclusivo para celular) */}
            <button
              type="button"
              onClick={() => {
                setEntryPermissionNotice(null);
                setRoleMode('STUDENT');
                setEntryScreenConfirmed(true);
                setIsQrScannerOpen(true);
              }}
              className="group relative overflow-hidden rounded-[24px] p-5 text-left bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-400/40 shadow-xl shadow-emerald-600/20 transition-all flex flex-col justify-between gap-4 cursor-pointer active:scale-[0.98]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                  <Camera size={24} />
                </div>
                <span className="px-2.5 py-1 rounded-full bg-black/25 text-emerald-200 text-[9px] font-black uppercase tracking-wider">
                  Área da Prova
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  Escanear QR Code
                </h3>
                <p className="text-[11px] text-emerald-100/90 font-medium leading-relaxed">
                  Ir para a área da prova e abrir a câmera do celular para ler o QR Code da sala.
                </p>
              </div>
            </button>
          </div>

          {hasHostPermission && hostRooms.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEntryPermissionNotice(null);
                setRoleMode('HOST');
                setIsCreatingNewRoom(false);
                setEntryScreenConfirmed(true);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <QrCode size={16} />
              <span>
                Acessar Sala(s) Aberta(s) Sincronizada(s) ({hostRooms.length})
              </span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDERIZAÇÃO: MODO ALUNO (ÁREA SEPARADA E ISOLADA DE PROVA)
  // ============================================================================
  if (roleMode === 'STUDENT') {
    const myServerRecord = studentRoom?.participants
      ? studentRoom.participants[studentId] ||
        Object.values(studentRoom.participants).find(
          (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
        ) ||
        null
      : null;
    const effectiveStudentAnswers =
      Object.keys(studentAnswers).length > 0
        ? studentAnswers
        : myServerRecord?.answers && Object.keys(myServerRecord.answers).length > 0
        ? myServerRecord.answers
        : studentAnswers;
    const studentPayloadPreview = buildCurrentParticipantPayload(
      undefined,
      effectiveStudentAnswers,
      studentRoom
    );
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
        {renderQrScannerModal()}
        {/* Topbar Exclusiva da Área Isolada de Prova (Com recuo superior de segurança para câmeras centrais / notch no celular) */}
        <div className="shrink-0 bg-slate-900/95 border-b border-slate-800 px-4 pt-[max(calc(env(safe-area-inset-top,0px)+14px),2.5rem)] sm:pt-3 pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">
                {hasHostPermission
                  ? 'Ambiente Isolado de Prova • Anti-Cola Ativo'
                  : 'Modo Aluno • Criar Sala: Exclusivo Conselheiro+'}
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
            <div className="flex items-center gap-1.5 shrink-0">
              {studentPhase === 'ENTER_PIN' && isMobileDevice && (
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="md:hidden px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Camera size={13} />
                  <span>Ler QR Code</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onExitIsolatedMode) {
                    onExitIsolatedMode();
                  } else if (!isIsolatedStudentMode && !initialPin && isMobileDevice) {
                    setEntryScreenConfirmed(false);
                  } else if (hasHostPermission) {
                    setRoleMode('HOST');
                  } else if (onBack) {
                    onBack();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={13} />
                <span>
                  {!isIsolatedStudentMode && !initialPin && isMobileDevice
                    ? 'Voltar'
                    : hasHostPermission
                    ? activeRoom
                      ? 'Voltar ao Painel'
                      : 'Modo Instrutor'
                    : 'Sair da Prova'}
                </span>
              </button>
            </div>
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
                  {isMobileDevice
                    ? 'Escaneie o QR Code da sala pelo celular ou digite o código PIN de 6 dígitos abaixo.'
                    : 'Digite o código PIN de 6 dígitos da sala abaixo para iniciar sua prova.'}
                </p>
              </div>

              {/* Botão Principal de Ler QR Code pelo Aplicativo (Exclusivo para Celular) */}
              {isMobileDevice && (
                <button
                  type="button"
                  onClick={() => setIsQrScannerOpen(true)}
                  className="md:hidden w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera size={18} />
                  <span>Escanear QR Code da Prova</span>
                </button>
              )}

              {qrScannedSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                  {qrScannedSuccessMsg}
                </div>
              )}

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

          {/* 4. TELA DE CONCLUSÃO / ENTREGA DA PROVA PELO ALUNO (Exibe o tempo gasto; quando o instrutor clicar em "Liberar Resultado", exibe a nota e o gabarito) */}
          {studentPhase === 'FINISHED' && studentRoom && (
            <div className="w-full max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-[28px] p-5 sm:p-6 text-center space-y-4 shadow-2xl">
              {studentRoom.resultsReleased ? (
                <>
                  <div
                    className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${
                      studentPayloadPreview.scorePercent >= studentRoom.passingScorePercent
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    }`}
                  >
                    <Award size={36} />
                  </div>

                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest inline-block">
                      Resultado Individual Recebido no Seu Aparelho
                    </span>
                    <p className="text-[11px] font-black uppercase tracking-wider text-indigo-300 pt-1">
                      {studentPayloadPreview.name} • {studentPayloadPreview.unit}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-white pt-0.5">
                      Nota Final: {studentPayloadPreview.grade10.toFixed(1)} / 10
                    </h3>
                    <p className="text-xs font-bold text-slate-300">
                      Você acertou{' '}
                      <strong className="text-emerald-400">
                        {studentPayloadPreview.correctCount} de {studentRoom.questions.length} questões
                      </strong>{' '}
                      ({studentPayloadPreview.scorePercent}%)
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-indigo-950/50 border border-indigo-500/35 rounded-2xl p-3 space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 block">
                        Tempo de Conclusão
                      </span>
                      <p className="text-lg sm:text-xl font-black text-amber-300 tabular-nums">
                        {formatTimeMMSS(
                          studentFinalTimeSpentSec ||
                            myServerRecord?.timeSpentSeconds ||
                            1
                        )}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-3 border space-y-0.5 ${
                        studentPayloadPreview.scorePercent >= studentRoom.passingScorePercent
                          ? 'bg-emerald-950/45 border-emerald-500/40'
                          : 'bg-amber-950/45 border-amber-500/40'
                      }`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 block">
                        Desempenho
                      </span>
                      <p
                        className={`text-sm sm:text-base font-black uppercase ${
                          studentPayloadPreview.scorePercent >= studentRoom.passingScorePercent
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {studentPayloadPreview.scorePercent >= studentRoom.passingScorePercent
                          ? '✅ Aprovado'
                          : '📚 Revisar'}
                      </p>
                    </div>
                  </div>

                  {/* Revisão de Questões da Prova */}
                  <div className="text-left space-y-2 pt-2 border-t border-slate-800 max-h-80 overflow-y-auto pr-1 scrollbar-hide">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 block">
                      Gabarito Individual da Sua Prova:
                    </span>
                    {studentRoom.questions.map((q, idx) => {
                      const chosen = effectiveStudentAnswers[idx];
                      const isCorrect = chosen === q.correctIndex;
                      return (
                        <div
                          key={q.id}
                          className={`p-3 rounded-2xl border text-xs space-y-1 ${
                            isCorrect
                              ? 'bg-emerald-950/35 border-emerald-700/60'
                              : 'bg-red-950/35 border-red-800/60'
                          }`}
                        >
                          <p className="font-black text-white">
                            {idx + 1}. {q.question}
                          </p>
                          <p className={isCorrect ? 'text-emerald-300 font-bold' : 'text-red-300 font-bold'}>
                            Sua resposta:{' '}
                            {chosen !== undefined
                              ? `${String.fromCharCode(65 + chosen)}) ${q.options[chosen]}`
                              : 'Não respondida'}{' '}
                            {isCorrect ? '✅' : '❌'}
                          </p>
                          {!isCorrect && (
                            <p className="text-emerald-400 font-bold">
                              Correta: {String.fromCharCode(65 + q.correctIndex)}) {q.options[q.correctIndex]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
                    <Clock size={34} />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Prova Entregue com Sucesso
                    </span>
                    <h3 className="text-xl font-black uppercase text-white">
                      Avaliação Finalizada!
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Suas respostas foram enviadas. Aguarde o instrutor liberar o resultado da prova.
                    </p>
                  </div>

                  {/* Destaque do Tempo que o Aluno Levou para Terminar a Prova */}
                  <div className="bg-indigo-950/50 border border-indigo-500/35 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 block">
                      Tempo que você levou para terminar a prova
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums">
                      {formatDurationDetailed(
                        studentFinalTimeSpentSec ||
                          studentRoom.participants?.[studentId]?.timeSpentSeconds ||
                          1
                      )}
                    </p>
                    <span className="text-[11px] font-bold text-slate-400 block tabular-nums">
                      Cronômetro registrado: {formatTimeMMSS(
                        studentFinalTimeSpentSec ||
                          studentRoom.participants?.[studentId]?.timeSpentSeconds ||
                          1
                      )}
                    </span>
                  </div>
                </>
              )}

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs space-y-1.5">
                <p className="font-bold text-slate-300">
                  Aluno: <span className="text-white">{studentName}</span>
                </p>
                <p className="font-bold text-slate-300">
                  Questões respondidas:{' '}
                  <span className="text-white">
                    {Object.keys(studentAnswers).length} de {studentRoom.questions.length}
                  </span>
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

        {/* OVERLAY DE BLOQUEIO ANTI-COLA QUANDO O ALUNO MINIMIZA A TELA OU MUDA DE JANELA */}
        {(studentLocked || studentWarningModal) &&
          (studentPhase === 'PLAYING' || studentPhase === 'WAITING_HOST') && (
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
    <div className="w-full max-w-6xl mx-auto space-y-2.5 pb-4 animate-fade-in">
      {renderQrScannerModal()}
      {/* Barra Superior Compacta + Alternador de Múltiplas Provas */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[20px] p-3 sm:px-4 sm:py-3 text-white shadow-md border border-white/10 space-y-2.5 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-base font-black uppercase tracking-tight leading-snug break-words sm:truncate">
              {activeRoom
                ? `Sala #${activeRoom.pin} — ${activeRoom.specialtyName}`
                : hostRooms.length > 0
                ? 'Abrir Nova Prova'
                : 'Criar Nova Prova'}
            </h3>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto shrink-0">
            {hostRooms.length > 0 && !isCreatingNewRoom && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewRoom(true);
                  setSelectedSpecialty(null);
                  setQuestions([]);
                }}
                className="flex-1 sm:flex-initial justify-center min-w-0 px-2.5 py-2 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                title="Abrir mais uma prova ao mesmo tempo sem fechar a sala atual"
              >
                <Plus size={13} className="shrink-0" />
                <span className="truncate">Abrir Nova Prova</span>
              </button>
            )}

            {hostRooms.length > 0 && isCreatingNewRoom && (
              <button
                type="button"
                onClick={() => setIsCreatingNewRoom(false)}
                className="flex-1 sm:flex-initial justify-center min-w-0 px-2.5 py-2 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
              >
                <ChevronLeft size={13} className="shrink-0" />
                <span className="truncate">Voltar às Provas ({hostRooms.length})</span>
              </button>
            )}

            {isMobileDevice && (
              <button
                type="button"
                onClick={() => {
                  setRoleMode('STUDENT');
                  setEntryScreenConfirmed(true);
                  setIsQrScannerOpen(true);
                }}
                className="md:hidden flex-1 sm:flex-initial justify-center min-w-0 px-2.5 py-2 sm:py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                title="Escanear QR Code de uma sala de prova com a câmera do celular"
              >
                <Camera size={12} className="shrink-0" />
                <span className="truncate">Escanear QR Code</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (activeRoom?.pin) {
                  setStudentPinInput(activeRoom.pin);
                }
                setRoleMode('STUDENT');
              }}
              className="flex-1 sm:flex-initial justify-center min-w-0 px-2.5 py-2 sm:py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode size={12} className="shrink-0" />
              <span className="truncate">{activeRoom ? 'Testar como Aluno' : 'Entrar como Aluno'}</span>
            </button>
          </div>
        </div>

        {/* BARRA DE ABAS DE MÚLTIPLAS PROVAS ABERTAS SIMULTANEAMENTE (No celular: título em cima e provas abertas abaixo) */}
        {hostRooms.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 pt-2 border-t border-white/10">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 shrink-0 sm:mr-1">
              Provas Abertas ({hostRooms.length}):
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide w-full sm:w-auto pb-0.5 sm:pb-0">
              {hostRooms.map((roomTab) => {
                const isSelectedTab = !isCreatingNewRoom && activeRoom?.pin === roomTab.pin;
                const pCount = Object.keys(roomTab.participants || {}).length;
                const aCount = (roomTab.alerts || []).length;

                return (
                  <div
                    key={roomTab.pin}
                    onClick={() => {
                      setSelectedRoomPin(roomTab.pin);
                      setIsCreatingNewRoom(false);
                    }}
                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                      isSelectedTab
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-white/10 text-slate-300'
                    }`}
                  >
                    {roomTab.specialtyLogo && (
                      <img
                        src={roomTab.specialtyLogo}
                        alt={roomTab.specialtyName}
                        className="w-5 h-5 object-contain shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase truncate max-w-[120px] sm:max-w-[160px]">
                          {roomTab.specialtyName}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                            isSelectedTab ? 'bg-black/25 text-amber-300' : 'bg-slate-800 text-amber-400'
                          }`}
                        >
                          #{roomTab.pin}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-black flex items-center gap-1">
                      {roomTab.status === 'ACTIVE' ? '🟢' : roomTab.status === 'FINISHED' ? '🏁' : '⏳'}
                      <span>{pCount}</span>
                    </span>

                    {aCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black animate-pulse">
                        🚨 {aCount}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseAndResetRoom(roomTab.pin);
                      }}
                      title={`Fechar sala #${roomTab.pin}`}
                      className="p-0.5 rounded-md hover:bg-red-500/30 text-slate-300 hover:text-red-200 transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
              <span>Abrir Sala</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODO 2 DO INSTRUTOR: SALA AO VIVO (LISTA DE QUEM ESTÁ FAZENDO A PROVA SOBRE O MENU LATERAL NO PC + PAINEL ESPAÇOSO)
         ======================================================================== */}
      {activeRoom && (
        <div className="space-y-3">
          {/* PAINEL PRINCIPAL DA SALA ATIVA (COM ESPAÇO AMPLO PARA NÃO CORTAR EM TELAS DE PC MENORES) */}
          <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4 overflow-hidden">
            {/* Cabeçalho da Especialidade + Status + Indicadores Rápidos */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5 min-w-0">
                {activeRoom.specialtyLogo && (
                  <img
                    src={activeRoom.specialtyLogo}
                    alt={activeRoom.specialtyName}
                    className="w-10 h-10 object-contain shrink-0"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="min-w-0">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                    Especialidade em Avaliação • {activeRoom.questions.length} Questões
                  </span>
                  <h4 className="text-sm sm:text-base font-black uppercase text-slate-800 dark:text-white leading-tight break-words">
                    {activeRoom.specialtyName}
                  </h4>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700 text-[10px] font-black uppercase text-slate-700 dark:text-slate-200">
                  Na Sala: <strong className="text-indigo-600 dark:text-indigo-400">{participantsList.length}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/50 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                  Entregaram: <strong>{participantsList.filter((p) => p.status === 'FINISHED').length}</strong>
                </span>
                <span
                  className={`px-2.5 py-1 rounded-xl border text-[10px] font-black uppercase ${
                    activeRoom.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                      : activeRoom.status === 'FINISHED'
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                  }`}
                >
                  {activeRoom.status === 'ACTIVE'
                    ? '🟢 Ativa'
                    : activeRoom.status === 'FINISHED'
                    ? '🏁 Encerrada'
                    : '⏳ Aguardando'}
                </span>
              </div>
            </div>

            {/* Corpo do Painel da Sala em 2 Colunas Equilibradas no PC */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
              {/* Lado Esquerdo (6 Colunas): QR Code Grande Acima do PIN + Cronômetro + Projeção */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-3">
                <div className="flex flex-col items-center gap-3 w-full min-w-0">
                  {qrCodeDataUrl && (
                    <div
                      onClick={() => setIsQrFullscreenModalOpen(true)}
                      className="relative overflow-hidden w-48 h-48 sm:w-52 sm:h-52 shrink-0 aspect-square p-3 bg-white rounded-3xl border-2 border-indigo-500/35 shadow-md cursor-pointer hover:scale-[1.02] transition-transform flex items-center justify-center mx-auto"
                      title="Clique para ampliar o QR Code"
                    >
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code da Prova"
                        className="w-full h-full object-contain block"
                      />
                      {activeRoom.status === 'FINISHED' && (
                        <div className="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center select-none">
                          <span className="text-3xl leading-none mb-1.5">🏁</span>
                          <span className="text-lg sm:text-xl font-black uppercase tracking-wider text-red-400 leading-tight drop-shadow-md">
                            PROVA ENCERRADA
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="w-full min-w-0 flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="w-full overflow-hidden bg-slate-900 text-white rounded-xl py-2.5 px-3 text-center border border-slate-800">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                          PIN da Sala
                        </span>
                        <p className="text-lg sm:text-xl font-black tracking-[0.14em] text-amber-400 leading-tight truncate">
                          {activeRoom.pin}
                        </p>
                      </div>

                      <div className="w-full overflow-hidden bg-slate-900 text-white rounded-xl py-2.5 px-3 text-center border border-slate-800">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                          Tempo Restante
                        </span>
                        <div className="text-lg sm:text-xl font-black text-sky-400 tabular-nums leading-tight flex items-center justify-center gap-1">
                          <Timer size={14} className="shrink-0" />
                          <span>{formatTimeMMSS(hostRemainingSeconds)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSoundAlertsEnabled((prev) => !prev)}
                      className={`w-full py-2 px-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 border cursor-pointer whitespace-nowrap truncate ${
                        soundAlertsEnabled
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {soundAlertsEnabled ? <Volume2 size={12} className="shrink-0" /> : <VolumeX size={12} className="shrink-0" />}
                      <span className="truncate">{soundAlertsEnabled ? 'Som Anti-Cola: Ativado' : 'Som Anti-Cola: Mudo'}</span>
                    </button>
                  </div>
                </div>

                {/* Botões de QR Code e Projeção no Telão (Transforma em Fechar Projeção quando projetado) */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQrFullscreenModalOpen(true)}
                      className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Maximize2 size={13} className="shrink-0" />
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
                      className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {copiedLink ? <Check size={13} className="text-emerald-500 shrink-0" /> : <Copy size={13} className="shrink-0" />}
                      <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                    </button>
                  </div>

                  {isSecondScreenActive ? (
                    <button
                      type="button"
                      onClick={handleCloseProjectionWindow}
                      className="hidden md:flex w-full py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-300 border border-red-500/40 text-[10px] sm:text-[11px] font-black uppercase tracking-wider items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <X size={14} className="shrink-0" />
                      <span>Fechar Projeção</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProjectQrToAnotherScreen}
                      className="hidden md:flex w-full py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] sm:text-[11px] font-black uppercase tracking-wider items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Monitor size={14} className="shrink-0" />
                      <span>Projetar em Outra Tela (Telão)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Lado Direito (6 Colunas): Comandos da Sala + Monitoramento Anti-Cola */}
              <div className="lg:col-span-6 flex flex-col justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-700/70">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <ShieldAlert size={14} className="text-red-500 shrink-0" />
                      <span>Monitoramento Anti-Cola ({activeRoom.alerts.length})</span>
                    </span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/20">
                      {activeRoom.lockOnCheat ? '🔒 Bloqueio Ativo' : '⚠️ Alerta Ativo'}
                    </span>
                  </div>

                  {activeRoom.alerts.length === 0 ? (
                    <div className="px-3 py-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                      <ShieldCheck size={16} className="shrink-0" />
                      <span>Nenhuma saída de tela detectada até o momento.</span>
                    </div>
                  ) : (
                    <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 scrollbar-hide">
                      {activeRoom.alerts.map((al) => {
                        const stu = activeRoom.participants[al.studentId];
                        return (
                          <div
                            key={al.id}
                            className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-red-800 dark:text-red-200 truncate">
                                🚨 {al.studentName} ({al.studentUnit}) — {al.violationNumber}ª saída às {al.timestamp}
                              </p>
                            </div>
                            {stu?.isLocked && (
                              <button
                                type="button"
                                onClick={() => handleUnlockStudent(al.studentId)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase shrink-0 cursor-pointer"
                              >
                                Liberar
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {sidebarOverlayTarget && isSidebarOpen && (
                    <div className="hidden md:flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                      <span>👈 A lista de quem está fazendo a prova está visível sobre o menu lateral à esquerda.</span>
                    </div>
                  )}
                </div>

                {/* Botões de Controle da Sala (Iniciar / +Tempo / Encerrar / Fechar) */}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                  {activeRoom.status === 'WAITING' && (
                    <button
                      type="button"
                      onClick={handleStartExamForAll}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play size={15} fill="currentColor" className="shrink-0" />
                      <span>Iniciar Prova ({participantsList.length} na sala)</span>
                    </button>
                  )}

                  {activeRoom.status === 'ACTIVE' && (
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => handleAddExtraTime(5)}
                        className="py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] sm:text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Clock size={13} className="shrink-0" />
                        <span>+5 Minutos</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleFinishExamForAll}
                        className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] sm:text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Square size={13} fill="currentColor" className="shrink-0" />
                        <span>Encerrar Prova</span>
                      </button>
                    </div>
                  )}

                  {activeRoom.status === 'FINISHED' && (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={handleReleaseResultsForAll}
                        className={`w-full py-3 px-4 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                          activeRoom.resultsReleased
                            ? 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <Award size={16} className="shrink-0" />
                        <span>
                          {activeRoom.resultsReleased
                            ? '✅ Resultado Enviado p/ Aparelho de Cada Aluno'
                            : 'Liberar Resultado p/ Aparelhos'}
                        </span>
                      </button>
                      {releaseFeedbackMsg && (
                        <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center">
                          {releaseFeedbackMsg}
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCloseAndResetRoom(activeRoom.pin)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 text-slate-600 dark:text-slate-300 hover:text-red-600 text-[10px] font-black uppercase cursor-pointer transition-colors"
                  >
                    Fechar Sala
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DE QUEM ESTÁ FAZENDO A PROVA NO CELULAR (OU NO PC SE O MENU LATERAL ESTIVER RECOLHIDO) */}
          <div className={`${sidebarOverlayTarget && isSidebarOpen ? 'md:hidden' : ''} bg-white dark:bg-slate-800 rounded-[22px] p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col gap-2.5`}>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Users size={17} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-white">
                  Quem Está Fazendo a Prova ({participantsList.length})
                </h4>
              </div>
              {sidebarOverlayTarget && !isSidebarOpen && (
                <button
                  type="button"
                  onClick={() => onToggleSidebar?.(true)}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase cursor-pointer"
                >
                  <span>Fixar sobre o Menu Lateral</span>
                </button>
              )}
            </div>

            {participantsList.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-1.5">
                <QrCode size={26} className="text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Aguardando os alunos escanearem o QR Code ou digitarem o PIN{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400">{activeRoom.pin}</strong>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-hide content-start">
                {participantsList.map((p) => {
                  const totalQ = activeRoom.questions.length || 1;
                  const progressPct = Math.round((p.answeredCount / totalQ) * 100);
                  const isApproved = p.scorePercent >= activeRoom.passingScorePercent;
                  const canViewStudentResult = activeRoom.status !== 'WAITING';

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (canViewStudentResult) setInspectingStudent(p);
                      }}
                      title={canViewStudentResult ? 'Clique para abrir o resultado da prova' : undefined}
                      className={`p-3 rounded-2xl border transition-all space-y-2 ${
                        canViewStudentResult ? 'cursor-pointer hover:brightness-105 active:scale-[0.99]' : ''
                      } ${
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
                            <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                              {p.name}
                            </h5>
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[8px] font-black uppercase">
                              {p.unit}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            Questão {Math.min(totalQ, p.currentQuestionIdx + 1)}/{totalQ} • Respondidas: {p.answeredCount}/{totalQ}
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase shrink-0 ${
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
                            ? '🚨 Bloqueado'
                            : p.status === 'FINISHED'
                            ? `✅ Nota ${p.grade10.toFixed(1)}`
                            : p.status === 'DISQUALIFIED'
                            ? '⛔ Desclassificado'
                            : p.status === 'PLAYING'
                            ? '🟢 Respondendo'
                            : '⏳ Na Sala'}
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
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

                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 text-[9px] font-black flex-wrap">
                          <span className={isApproved ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                            {p.correctCount}/{totalQ} ({p.scorePercent}%)
                          </span>
                          {p.timeSpentSeconds !== undefined && p.timeSpentSeconds > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300">
                              ⏱️ {formatTimeMMSS(p.timeSpentSeconds)}
                            </span>
                          )}
                          {p.cheatCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200">
                              ⚠️ {p.cheatCount} {p.cheatCount === 1 ? 'saída' : 'saídas'}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">🛡️ 0 saídas</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {p.isLocked ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlockStudent(p.id);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <Unlock size={10} />
                              <span>Liberar</span>
                            </button>
                          ) : (
                            p.status === 'PLAYING' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockOrDisqualifyStudent(p.id, false);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-300 text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                              >
                                <Lock size={10} />
                                <span>Bloquear</span>
                              </button>
                            )
                          )}
                          {canViewStudentResult && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingStudent(p);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={10} />
                              <span>Ver Resultado</span>
                            </button>
                          )}
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

      {/* OVERLAY SOBRE O MENU LATERAL ESQUERDO DO PC COM A LISTA DE QUEM ESTÁ FAZENDO A PROVA */}
      {!isIsolatedStudentMode &&
        roleMode === 'HOST' &&
        activeRoom &&
        sidebarOverlayTarget &&
        createPortal(
          <div
            className="absolute inset-0 z-40 bg-slate-950/88 dark:bg-slate-950/92 backdrop-blur-xl flex flex-col justify-between p-3.5 lg:p-4 animate-fade-in text-white cursor-default select-none shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {isSidebarOpen ? (
              <>
                {/* Topo do Overlay sobre o Menu Lateral */}
                <div className="w-full space-y-2.5 pb-2.5 border-b border-white/10 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/20 border border-indigo-400/35 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-200">
                        Fazendo a Prova ({participantsList.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleSidebar?.(false)}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      title="Recolher lista lateral"
                    >
                      <PanelLeftClose size={15} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {activeRoom.specialtyLogo && (
                      <img
                        src={activeRoom.specialtyLogo}
                        alt={activeRoom.specialtyName}
                        className="w-7 h-7 object-contain shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black uppercase text-white truncate">
                        {activeRoom.specialtyName}
                      </h4>
                      <span className="text-[9px] font-black text-amber-400 tracking-wider block">
                        PIN #{activeRoom.pin} • {participantsList.filter((p) => p.status === 'FINISHED').length} entregaram
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista ao Vivo de Quem Está Fazendo a Prova sobre o Menu Lateral */}
                <div className="flex-1 overflow-y-auto space-y-2 my-2.5 pr-1 scrollbar-hide">
                  {participantsList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/15 rounded-2xl space-y-2">
                      <Users size={24} className="text-indigo-400/80 mx-auto" />
                      <p className="text-xs font-black uppercase text-white/90">
                        Nenhum aluno na sala ainda
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                        Assim que escanearem o QR Code ou digitarem o PIN <strong className="text-amber-400">#{activeRoom.pin}</strong>, aparecerão listados aqui.
                      </p>
                    </div>
                  ) : (
                    participantsList.map((p) => {
                      const totalQ = activeRoom.questions.length || 1;
                      const progressPct = Math.round((p.answeredCount / totalQ) * 100);
                      const isApproved = p.scorePercent >= activeRoom.passingScorePercent;
                      const canViewStudentResult = activeRoom.status !== 'WAITING';

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (canViewStudentResult) setInspectingStudent(p);
                          }}
                          title={canViewStudentResult ? 'Clique para abrir o resultado da prova' : undefined}
                          className={`p-2.5 rounded-2xl border transition-all space-y-1.5 ${
                            canViewStudentResult ? 'cursor-pointer hover:brightness-110 active:scale-[0.99]' : ''
                          } ${
                            p.status === 'LOCKED_CHEAT'
                              ? 'bg-red-950/75 border-red-500 ring-1 ring-red-500/40'
                              : p.status === 'FINISHED'
                              ? 'bg-emerald-950/45 border-emerald-500/40'
                              : 'bg-slate-900/90 border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <h5 className="text-xs font-black text-white truncate">
                                  {p.name}
                                </h5>
                                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[8px] font-black uppercase shrink-0">
                                  {p.unit}
                                </span>
                              </div>
                              <p className="text-[9px] font-bold text-slate-400">
                                Q. {Math.min(totalQ, p.currentQuestionIdx + 1)}/{totalQ} • Resp: {p.answeredCount}/{totalQ}
                              </p>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase shrink-0 ${
                                p.status === 'LOCKED_CHEAT'
                                  ? 'bg-red-600 text-white animate-pulse'
                                  : p.status === 'FINISHED'
                                  ? 'bg-emerald-600 text-white'
                                  : p.status === 'DISQUALIFIED'
                                  ? 'bg-slate-800 text-red-400'
                                  : p.status === 'PLAYING'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-amber-500/25 text-amber-300'
                              }`}
                            >
                              {p.status === 'LOCKED_CHEAT'
                                ? '🚨 Bloqueado'
                                : p.status === 'FINISHED'
                                ? `✅ Nota ${p.grade10.toFixed(1)}`
                                : p.status === 'DISQUALIFIED'
                                ? '⛔ Desclass.'
                                : p.status === 'PLAYING'
                                ? '🟢 Fazendo'
                                : '⏳ Na Sala'}
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                p.status === 'LOCKED_CHEAT'
                                  ? 'bg-red-500'
                                  : p.status === 'FINISHED'
                                  ? 'bg-emerald-400'
                                  : 'bg-indigo-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            <div className="flex items-center gap-1 text-[8.5px] font-black flex-wrap">
                              <span className={isApproved ? 'text-emerald-400' : 'text-slate-400'}>
                                {p.correctCount}/{totalQ} ({p.scorePercent}%)
                              </span>
                              {p.timeSpentSeconds !== undefined && p.timeSpentSeconds > 0 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                                  ⏱️ {formatTimeMMSS(p.timeSpentSeconds)}
                                </span>
                              )}
                              {p.cheatCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-red-500/25 text-red-300">
                                  ⚠️ {p.cheatCount}x
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {p.isLocked ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnlockStudent(p.id);
                                  }}
                                  className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[8.5px] font-black uppercase flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Unlock size={9} />
                                  <span>Liberar</span>
                                </button>
                              ) : (
                                p.status === 'PLAYING' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLockOrDisqualifyStudent(p.id, false);
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-red-500/20 hover:bg-red-500/35 text-red-300 text-[8.5px] font-black uppercase flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <Lock size={9} />
                                    <span>Bloquear</span>
                                  </button>
                                )
                              )}
                              {canViewStudentResult && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectingStudent(p);
                                  }}
                                  className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[8.5px] font-black uppercase flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Eye size={9} />
                                  <span>Ver Resultado</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Rodapé do Overlay sobre o Menu Lateral */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">
                  <span>Na Sala: {participantsList.length}</span>
                  <span className={activeRoom.alerts.length > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}>
                    Alertas: {activeRoom.alerts.length}
                  </span>
                </div>
              </>
            ) : (
              /* Modo Compacto quando a barra lateral está recolhida */
              <div
                onClick={() => onToggleSidebar?.(true)}
                className="h-full w-full flex flex-col items-center justify-between py-2 cursor-pointer"
                title="Clique para abrir a lista de quem está fazendo a prova"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-wider text-indigo-300">
                    Prova
                  </span>
                </div>

                <div className="flex flex-col items-center gap-2">
                  {activeRoom.specialtyLogo && (
                    <img
                      src={activeRoom.specialtyLogo}
                      alt={activeRoom.specialtyName}
                      className="w-10 h-10 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="px-2 py-1 rounded-xl bg-indigo-600 text-white text-[10px] font-black flex items-center gap-1">
                    <Users size={11} />
                    <span>{participantsList.length}</span>
                  </div>
                  {activeRoom.alerts.length > 0 && (
                    <div className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black animate-pulse">
                      🚨 {activeRoom.alerts.length}
                    </div>
                  )}
                </div>

                <span className="text-[9px] font-black uppercase text-white/80 hover:text-white">
                  Abrir
                </span>
              </div>
            )}
          </div>,
          sidebarOverlayTarget
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
                  {isSecondScreenActive ? (
                    <button
                      type="button"
                      onClick={handleCloseProjectionWindow}
                      className="hidden md:flex px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[11px] font-black uppercase tracking-wider items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/25 transition-all"
                      title="Fechar a janela de projeção do Telão"
                    >
                      <X size={14} />
                      <span>Fechar Projeção</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProjectQrToAnotherScreen}
                      className="hidden md:flex px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/25 transition-all"
                      title="Abre uma janela exclusiva para projetar no Telão da Igreja (2ª Tela / HDMI) mantendo seu painel no PC"
                    >
                      <Monitor size={14} />
                      <span>Projetar em Outra Tela (Telão)</span>
                    </button>
                  )}

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
                    className="hidden md:flex px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-white/20 text-white text-[11px] font-black uppercase tracking-wider items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
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
                    title="Fechar"
                    aria-label="Fechar"
                    className="p-2 md:px-3 md:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <X size={16} />
                    <span className="hidden md:inline">Fechar</span>
                  </button>
                </div>
              </div>

              {/* Conteúdo do Modal em 2 Colunas no mesmo padrão do Projetar */}
              <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center my-auto">
                {/* Coluna Esquerda: QR Code */}
                <div className="md:col-span-5 bg-slate-900/80 border-2 border-indigo-500/35 rounded-[26px] p-4 sm:p-5 shadow-xl flex flex-col items-center justify-center text-center">
                  {qrCodeDataUrl && (
                    <div className="relative overflow-hidden bg-white p-3.5 rounded-2xl shadow-lg mb-3">
                      <img
                        src={qrCodeDataUrl}
                        alt="QR Code da Prova"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain block mx-auto"
                      />
                      {activeRoom.status === 'FINISHED' && (
                        <div className="absolute inset-0 z-10 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center select-none">
                          <span className="text-3xl sm:text-4xl leading-none mb-2">🏁</span>
                          <span className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-red-400 leading-tight drop-shadow-lg">
                            PROVA ENCERRADA
                          </span>
                        </div>
                      )}
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
