import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { GoogleGenAI } from '@google/genai';
import { ClubType, Especialidade } from '../types';
import {
  supabaseQfpy,
  QFPY_URL,
  QFPY_KEY,
  fetchEspecialidades,
  fetchEspecialidadeRequisitos,
  fetchLivrosClasses,
  fetchLivrosAno,
  fetchOutrosLivros,
  fetchLivrosAVT,
  fetchManuaisDBV,
  fetchManuaisAVT,
  resolveGeminiApiKey
} from '../services/supabaseService';
import { generateExamQuestionsWithAi, buildSmartFallbackQuestions } from '../services/examAiService';
import {
  NISTO_CREMOS_1_10_QUESTIONS,
  NISTO_CREMOS_11_20_QUESTIONS,
  NISTO_CREMOS_21_28_QUESTIONS,
  MANUAL_ADMINISTRATIVO_DBV_QUESTIONS,
  DESBRAVADORES_IDEALS_MANUAL_QUESTIONS,
  AVENTUREIROS_IDEALS_MANUAL_QUESTIONS
} from '../services/quizQuestionsData';

export interface LiveExamBookItem {
  uid: string;
  id: number;
  title: string;
  cover: string;
  summary: string;
  content: string;
  category: 'CLASSES' | 'ANO_DBV' | 'OUTROS_DBV' | 'MANUAIS_DBV' | 'AVT' | 'MANUAIS_AVT';
  categoryLabel: string;
  badgeText: string;
  club: ClubType;
}

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
  joinedAtMs?: number;
  currentQuestionIdx: number;
  answeredCount: number;
  correctCount: number;
  scorePercent: number;
  grade10: number;
  cheatCount: number;
  unlockedCheatCount?: number;
  lastCheatReason?: string;
  lastCheatTime?: string;
  isLocked: boolean;
  answers: Record<number, number>;
  finishedAt?: string;
  timeSpentSeconds?: number;
}

function parseParticipantJoinScore(p: LiveExamParticipant, fallbackIdx: number): number {
  if (typeof p.joinedAtMs === 'number' && Number.isFinite(p.joinedAtMs) && p.joinedAtMs > 0) {
    return p.joinedAtMs;
  }
  if (typeof p.joinedAt === 'string' && p.joinedAt.includes(':')) {
    const parts = p.joinedAt.split(':').map((n) => parseInt(n, 10));
    if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      const sec = parts[2] && !Number.isNaN(parts[2]) ? parts[2] : 0;
      return parts[0] * 3600 + parts[1] * 60 + sec;
    }
  }
  return fallbackIdx + 1;
}

function getParticipantDeterministicScale(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 1000;
  }
  // Tamanhos aleatórios entre 0.80 e 1.18
  const scales = [0.8, 0.88, 0.95, 1.04, 1.12, 1.18, 0.84, 1.08];
  return scales[Math.abs(hash) % scales.length];
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
  unlimitedTime?: boolean;
  manuallyFinished?: boolean;
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
  createdAt?: number;
  creatorKey?: string;
  creatorEmail?: string;
  creatorName?: string;
}

const UNLIMITED_DURATION_MINUTES = 0;

export function isUnlimitedRoomDuration(
  durationMinutes?: number | null,
  unlimitedTime?: boolean | null
): boolean {
  if (unlimitedTime === true) return true;
  const n = Number(durationMinutes);
  return Number.isNaN(n) || n <= 0 || n > 300;
}

export interface LiveExamStudentHistoryEntry {
  id: string;
  pin: string;
  club: ClubType;
  specialtyId: number;
  specialtyName: string;
  specialtyArea: string;
  specialtyLogo: string;
  specialtyCode: string;
  studentName: string;
  studentUnit: string;
  dateStr: string;
  completedAt: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercent: number;
  grade10: number;
  passingScorePercent: number;
  cheatCount: number;
  timeSpentSeconds: number;
  resultsReleased: boolean;
  questions?: LiveExamQuestion[];
  answers?: Record<number, number>;
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
  onRegisterBackHandler?: (handler: (() => boolean) | null) => void;
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

  // Completa caso a especialidade tenha poucos requisitos cadastrados (suporta provas com mais de 15 questões)
  const extraTemplates = [
    {
      q: `Na avaliação oficial da especialidade "${specialty.nome}", qual é o critério exigido pelo Manual Administrativo para aprovação e direito ao emblema?`,
      opts: [
        'Cumprir integralmente os requisitos teóricos e práticos sob avaliação de um instrutor habilitado.',
        'Cumprir apenas metade dos requisitos sem necessidade de comprovação prática.',
        'Apenas assistir a uma palestra rápida sem realizar a avaliação.',
        'Decorar somente o código da especialidade sem estudar o conteúdo.'
      ]
    },
    {
      q: `Qual é a finalidade prática do estudo da especialidade "${specialty.nome}" (${areaName}) dentro do programa oficial do clube?`,
      opts: [
        `Desenvolver habilidades práticas, conhecimento técnico e serviço útil na área de ${areaName}.`,
        'Acumular insígnias apenas para fins decorativos sem aprendizado real.',
        'Substituir o cumprimento do cartão de classes regulares.',
        'Isentar o membro de participar das atividades da unidade.'
      ]
    },
    {
      q: `Sobre o registro e investidura da especialidade "${specialty.nome}", o que deve ocorrer após a aprovação na prova e nos requisitos?`,
      opts: [
        'A aprovação deve ser registrada pela secretaria do clube para entrega oficial da insígnia na faixa.',
        'O próprio aluno compra e costura o emblema sem autorização da direção.',
        'Não há necessidade de comprovação junto ao instrutor ou conselheiro.',
        'A especialidade perde a validade após trinta dias.'
      ]
    },
    {
      q: `Durante as atividades práticas relacionadas à especialidade "${specialty.nome}", qual princípio deve ser sempre priorizado pelos membros?`,
      opts: [
        'Segurança, responsabilidade, ética cristã e fidelidade às orientações técnicas do manual.',
        'Improvisação sem observar normas de segurança ou instruções do instrutor.',
        'Execução rápida mesmo descumprindo as etapas obrigatórias.',
        'Realização individual secreta sem acompanhamento da liderança.'
      ]
    }
  ];

  while (generated.length < count) {
    const n = generated.length + 1;
    const tpl = extraTemplates[(n - 1) % extraTemplates.length];
    const reqRef = cleanReqs.length > 0 ? cleanReqs[(n - 1) % cleanReqs.length] : '';
    const targetSlot = n % 4;
    const baseOpts = reqRef && n % 2 === 0
      ? [
          reqRef.length > 170 ? reqRef.slice(0, 167) + '...' : reqRef,
          'Executar a tarefa sem seguir o padrão técnico exigido pela Divisão Sul-Americana.',
          'Ignorar a etapa prática prevista no requisito oficial.',
          'Entregar apenas o título da especialidade sem demonstrar o conteúdo.'
        ]
      : [...tpl.opts];
    const reordered = [...baseOpts];
    const temp = reordered[targetSlot];
    reordered[targetSlot] = reordered[0];
    reordered[0] = temp;

    generated.push({
      id: `q_spec_extra_${Date.now()}_${n}`,
      question:
        reqRef && n % 2 === 0
          ? `Questão complementar (${n}) sobre os requisitos de "${specialty.nome}": qual item abaixo faz parte do estudo desta especialidade?`
          : tpl.q,
      options: reordered,
      correctIndex: targetSlot,
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
  onBack,
  onRegisterBackHandler
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

  // Tela Inicial ao entrar pelo App (Celular e PC): "Criar Prova de Especialidade", "Criar Prova (Manual ou IA)" e "Escanear QR Code / Entrar em Sala"
  const [entryScreenConfirmed, setEntryScreenConfirmed] = useState<boolean>(() =>
    Boolean(isIsolatedStudentMode || initialPin || autoOpenQrScanner || preselectedSpecialty)
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
        if (!name && (parsed?.name || parsed?.nome)) {
          name = String(parsed.name || parsed.nome).trim();
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

  // Verifica se o usuário está logado no aplicativo (não é visitante anônimo)
  const isLoggedInUser = useMemo<boolean>(() => {
    try {
      if (localStorage.getItem('dbv_is_guest') === 'true') return false;
    } catch {}
    return Boolean(
      (instructorIdentity.email && instructorIdentity.email !== 'email@exemplo.com') ||
        instructorIdentity.name ||
        (currentUserEmail && currentUserEmail !== 'email@exemplo.com') ||
        currentUserName
    );
  }, [instructorIdentity.email, instructorIdentity.name, currentUserEmail, currentUserName]);

  // Lista de PINs excluídos manualmente pelo usuário (Histórico Pessoal e Provas Aplicadas)
  const [deletedStudentHistoryPins, setDeletedStudentHistoryPins] = useState<string[]>(() => {
    try {
      const key = instructorKey
        ? `dbv_deleted_student_history_${instructorKey}`
        : 'dbv_deleted_student_history_global';
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {}
    return [];
  });
  const deletedStudentHistoryPinsRef = useRef<Set<string>>(new Set(deletedStudentHistoryPins));
  deletedStudentHistoryPinsRef.current = new Set(deletedStudentHistoryPins);

  const [deletedAppliedExamPins, setDeletedAppliedExamPins] = useState<string[]>(() => {
    try {
      const key = instructorKey
        ? `dbv_deleted_applied_exams_${instructorKey}`
        : 'dbv_deleted_applied_exams_global';
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.map(String);
      }
    } catch {}
    return [];
  });
  const deletedAppliedExamPinsRef = useRef<Set<string>>(new Set(deletedAppliedExamPins));
  deletedAppliedExamPinsRef.current = new Set(deletedAppliedExamPins);

  // Histórico de Provas Aplicadas pelo usuário (salas criadas pelo instrutor ou respondidas por outros alunos)
  const [appliedExamsHistory, setAppliedExamsHistory] = useState<LiveExamRoomState[]>(() => {
    try {
      const key = instructorKey
        ? `dbv_applied_exams_history_${instructorKey}`
        : 'dbv_applied_exams_history_global';
      const raw = localStorage.getItem(key) || localStorage.getItem('dbv_applied_exams_history_global');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (r: any) =>
              r &&
              r.pin &&
              Array.isArray(r.questions) &&
              !deletedAppliedExamPinsRef.current.has(String(r.pin))
          );
        }
      }
    } catch {}
    return [];
  });
  const appliedExamsHistoryRef = useRef<LiveExamRoomState[]>(appliedExamsHistory);
  appliedExamsHistoryRef.current = appliedExamsHistory;
  const [selectedAppliedExam, setSelectedAppliedExam] = useState<LiveExamRoomState | null>(null);
  const [inspectingAppliedStudent, setInspectingAppliedStudent] = useState<LiveExamParticipant | null>(null);
  const [confirmDeleteAppliedPin, setConfirmDeleteAppliedPin] = useState<string | null>(null);
  const [confirmDeleteHistoryPin, setConfirmDeleteHistoryPin] = useState<string | null>(null);

  // Histórico de Provas Feitas pelo usuário logado no aplicativo (apenas provas respondidas pelo próprio usuário)
  const [studentExamHistory, setStudentExamHistory] = useState<LiveExamStudentHistoryEntry[]>(() => {
    try {
      const key = instructorKey
        ? `dbv_student_exam_history_${instructorKey}`
        : 'dbv_student_exam_history_global';
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: any) => {
            if (!item || !item.pin || deletedStudentHistoryPinsRef.current.has(String(item.pin))) return false;
            const totalQ = Number(item.totalQuestions || (Array.isArray(item.questions) ? item.questions.length : 0) || 0);
            if (totalQ <= 0) return false;
            const ansFromMap = item.answers && typeof item.answers === 'object' ? Object.keys(item.answers).length : 0;
            const ansCount = Math.max(Number(item.answeredCount || 0), ansFromMap);
            return ansCount >= totalQ;
          });
        }
      }
    } catch {}
    return [];
  });
  const [selectedHistoryExam, setSelectedHistoryExam] = useState<LiveExamStudentHistoryEntry | null>(null);
  const [isRefreshingHistoryPin, setIsRefreshingHistoryPin] = useState<string | null>(null);

  // ============================================================================
  // ESTADOS DO INSTRUTOR (HOST)
  // ============================================================================
  const [catalog, setCatalog] = useState<Especialidade[]>(() => {
    const valid = (specialties || []).filter((s) => !s.nome?.toLowerCase().includes('mestrado'));
    const areas = new Set(valid.map((s) => s.area).filter(Boolean));
    return areas.size > 1 ? valid : [];
  });
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('TODAS');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Especialidade | null>(preselectedSpecialty);
  const [examCreationMode, setExamCreationMode] = useState<'SPECIALTY' | 'CUSTOM' | 'BOOKS'>('SPECIALTY');
  const [customExamTitle, setCustomExamTitle] = useState<string>('');
  const [customExamTopicDetails, setCustomExamTopicDetails] = useState<string>('');
  const [customThemeNotice, setCustomThemeNotice] = useState<string | null>(null);
  const [passingScorePercent, setPassingScorePercent] = useState<number>(70);
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(true);

  // Estados independentes para "Criar Prova de Especialidade" (SPECIALTY)
  const [specialtyQuestionCount, setSpecialtyQuestionCount] = useState<number>(10);
  const [specialtyDurationMinutes, setSpecialtyDurationMinutes] = useState<number>(15);
  const [specialtyLockOnCheat, setSpecialtyLockOnCheat] = useState<boolean>(true);
  const [specialtyQuestions, setSpecialtyQuestions] = useState<LiveExamQuestion[]>([]);
  const [isGeneratingSpecialtyQuestions, setIsGeneratingSpecialtyQuestions] = useState<boolean>(false);
  const [specialtyEditingQuestionIdx, setSpecialtyEditingQuestionIdx] = useState<number | null>(null);

  // Estados independentes para "Criar Prova (Manual ou IA)" (CUSTOM)
  const [customQuestionCount, setCustomQuestionCount] = useState<number>(10);
  const [customDurationMinutes, setCustomDurationMinutes] = useState<number>(15);
  const [customLockOnCheat, setCustomLockOnCheat] = useState<boolean>(true);
  const [customQuestions, setCustomQuestions] = useState<LiveExamQuestion[]>([]);
  const [isGeneratingCustomQuestions, setIsGeneratingCustomQuestions] = useState<boolean>(false);
  const [customEditingQuestionIdx, setCustomEditingQuestionIdx] = useState<number | null>(null);

  // Estados independentes para "Prova dos Livros e Manuais" (BOOKS)
  const [booksCatalog, setBooksCatalog] = useState<LiveExamBookItem[]>(() => {
    try {
      const cached = localStorage.getItem('dbv_cached_all_exam_books_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [isLoadingBooksCatalog, setIsLoadingBooksCatalog] = useState<boolean>(false);
  const [bookCategoryFilter, setBookCategoryFilter] = useState<
    'TODOS' | 'CLASSES' | 'ANO_DBV' | 'OUTROS_DBV' | 'MANUAIS_DBV' | 'AVT' | 'MANUAIS_AVT'
  >('TODOS');
  const [bookSearchQuery, setBookSearchQuery] = useState<string>('');
  const [selectedBookForExam, setSelectedBookForExam] = useState<LiveExamBookItem | null>(null);
  const [nistoCremosCategory, setNistoCremosCategory] = useState<'ALL' | '1_10' | '11_20' | '21_28'>('1_10');
  const [bookChapterFocus, setBookChapterFocus] = useState<string>('');
  const [bookExamNotice, setBookExamNotice] = useState<string | null>(null);
  const [bookQuestionCount, setBookQuestionCount] = useState<number>(10);
  const [bookDurationMinutes, setBookDurationMinutes] = useState<number>(15);
  const [bookLockOnCheat, setBookLockOnCheat] = useState<boolean>(true);
  const [bookQuestions, setBookQuestions] = useState<LiveExamQuestion[]>([]);
  const [isGeneratingBookQuestions, setIsGeneratingBookQuestions] = useState<boolean>(false);
  const [bookEditingQuestionIdx, setBookEditingQuestionIdx] = useState<number | null>(null);

  // Referências ativas conforme a aba selecionada (garante isolamento total entre Especialidade, Livros e Personalizada)
  const isCustomMode = examCreationMode === 'CUSTOM';
  const isBooksMode = examCreationMode === 'BOOKS';
  const questions = isCustomMode
    ? customQuestions
    : isBooksMode
    ? bookQuestions
    : specialtyQuestions;
  const setQuestions = isCustomMode
    ? setCustomQuestions
    : isBooksMode
    ? setBookQuestions
    : setSpecialtyQuestions;
  const questionCount = isCustomMode
    ? customQuestionCount
    : isBooksMode
    ? bookQuestionCount
    : specialtyQuestionCount;
  const setQuestionCount = isCustomMode
    ? setCustomQuestionCount
    : isBooksMode
    ? setBookQuestionCount
    : setSpecialtyQuestionCount;
  const durationMinutes = isCustomMode
    ? customDurationMinutes
    : isBooksMode
    ? bookDurationMinutes
    : specialtyDurationMinutes;
  const setDurationMinutes = isCustomMode
    ? setCustomDurationMinutes
    : isBooksMode
    ? setBookDurationMinutes
    : setSpecialtyDurationMinutes;
  const lockOnCheat = isCustomMode
    ? customLockOnCheat
    : isBooksMode
    ? bookLockOnCheat
    : specialtyLockOnCheat;
  const setLockOnCheat = isCustomMode
    ? setCustomLockOnCheat
    : isBooksMode
    ? setBookLockOnCheat
    : setSpecialtyLockOnCheat;
  const isGeneratingQuestions = isCustomMode
    ? isGeneratingCustomQuestions
    : isBooksMode
    ? isGeneratingBookQuestions
    : isGeneratingSpecialtyQuestions;
  const editingQuestionIdx = isCustomMode
    ? customEditingQuestionIdx
    : isBooksMode
    ? bookEditingQuestionIdx
    : specialtyEditingQuestionIdx;
  const setEditingQuestionIdx = isCustomMode
    ? setCustomEditingQuestionIdx
    : isBooksMode
    ? setBookEditingQuestionIdx
    : setSpecialtyEditingQuestionIdx;

  // Estado de Múltiplas Salas Ativas do Instrutor (permite abrir várias provas simultâneas)
  const [hostRooms, setHostRooms] = useState<LiveExamRoomState[]>(() => {
    const sanitizeLoadedRoom = (r: any): LiveExamRoomState => {
      const unlim = isUnlimitedRoomDuration(r?.durationMinutes, r?.unlimitedTime);
      const manFin = Boolean(r?.manuallyFinished || r?.resultsReleased);
      return {
        ...r,
        durationMinutes: unlim ? UNLIMITED_DURATION_MINUTES : Number(r?.durationMinutes || 15),
        unlimitedTime: unlim,
        manuallyFinished: manFin,
        status:
          unlim && r?.status === 'FINISHED' && !manFin
            ? r?.startedAt
              ? 'ACTIVE'
              : 'WAITING'
            : r?.status || 'WAITING'
      };
    };
    try {
      const savedMulti = localStorage.getItem('dbv_instructor_active_exam_rooms');
      if (savedMulti) {
        const parsedMulti = JSON.parse(savedMulti);
        if (Array.isArray(parsedMulti) && parsedMulti.length > 0) {
          return parsedMulti
            .filter((r: any) => r && r.pin && Array.isArray(r.questions))
            .map(sanitizeLoadedRoom);
        }
      }
      const savedSingle = localStorage.getItem('dbv_instructor_active_exam_room');
      if (savedSingle) {
        const parsed = JSON.parse(savedSingle);
        if (parsed && parsed.pin && Array.isArray(parsed.questions)) {
          return [sanitizeLoadedRoom(parsed)];
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
      entryScreenConfirmed &&
      roleMode === 'HOST' &&
      Boolean(activeRoom);
    onActiveRoomChange?.(hasActive);
    return () => {
      onActiveRoomChange?.(false);
    };
  }, [isIsolatedStudentMode, entryScreenConfirmed, roleMode, activeRoom, onActiveRoomChange]);

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isQrFullscreenModalOpen, setIsQrFullscreenModalOpen] = useState<boolean>(false);
  const [isQrTelaoExpanded, setIsQrTelaoExpanded] = useState<boolean>(false);
  const [isSecondScreenActive, setIsSecondScreenActive] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [inspectingStudent, setInspectingStudent] = useState<LiveExamParticipant | null>(null);
  const [hostRemainingSeconds, setHostRemainingSeconds] = useState<number>(0);
  const projectorWindowRef = useRef<Window | null>(null);
  const qrModalRef = useRef<HTMLDivElement | null>(null);
  const activeRoomQrSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToQrCodeSection = useCallback(() => {
    [80, 240, 450].forEach((delay) => {
      setTimeout(() => {
        try {
          if (activeRoomQrSectionRef.current) {
            activeRoomQrSectionRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        } catch {}
      }, delay);
    });
  }, []);

  useEffect(() => {
    if (
      !isIsolatedStudentMode &&
      entryScreenConfirmed &&
      roleMode === 'HOST' &&
      !isCreatingNewRoom &&
      activeRoom?.pin
    ) {
      scrollToQrCodeSection();
    }
  }, [
    isIsolatedStudentMode,
    entryScreenConfirmed,
    roleMode,
    isCreatingNewRoom,
    activeRoom?.pin,
    scrollToQrCodeSection
  ]);

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
  const [studentExamAlreadyClosed, setStudentExamAlreadyClosed] = useState<boolean>(false);
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

  // Suporte ao botão "Voltar" do topo do app e botão lateral do mouse para recuar etapas internas da Prova Ao Vivo antes de voltar para Treinamento em Campo
  const handleInternalBackStep = useCallback((): boolean => {
    if (isQrFullscreenModalOpen) {
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsQrTelaoExpanded(false);
      setIsQrFullscreenModalOpen(false);
      return true;
    }
    if (isQrTelaoExpanded) {
      setIsQrTelaoExpanded(false);
      return true;
    }
    if (inspectingStudent) {
      setInspectingStudent(null);
      return true;
    }
    if (selectedHistoryExam) {
      setSelectedHistoryExam(null);
      return true;
    }
    if (isQrScannerOpen) {
      setIsQrScannerOpen(false);
      return true;
    }
    if (isCreatingNewRoom && hostRooms.length > 0) {
      setIsCreatingNewRoom(false);
      return true;
    }
    if (!isIsolatedStudentMode && !initialPin && entryScreenConfirmed) {
      if (roleMode === 'STUDENT' && (studentPhase === 'WAITING_HOST' || studentPhase === 'PLAYING')) {
        return true;
      }
      if (roleMode === 'STUDENT' && studentPhase === 'FINISHED') {
        studentAnswersPinRef.current = '';
        setStudentAnswers({});
        setStudentStartTime(null);
        setStudentFinalTimeSpentSec(0);
        setStudentPhase('ENTER_PIN');
        setStudentRoom(null);
        setStudentExamAlreadyClosed(false);
      }
      setEntryScreenConfirmed(false);
      return true;
    }
    return false;
  }, [
    isQrFullscreenModalOpen,
    isQrTelaoExpanded,
    inspectingStudent,
    selectedHistoryExam,
    isQrScannerOpen,
    isCreatingNewRoom,
    hostRooms.length,
    isIsolatedStudentMode,
    initialPin,
    entryScreenConfirmed,
    roleMode,
    studentPhase
  ]);

  useEffect(() => {
    onRegisterBackHandler?.(handleInternalBackStep);
    return () => {
      onRegisterBackHandler?.(null);
    };
  }, [onRegisterBackHandler, handleInternalBackStep]);

  useEffect(() => {
    const handleInternalBack = (e: Event) => {
      if (handleInternalBackStep()) {
        e.preventDefault();
      }
    };

    window.addEventListener('dbv_subcomponent_back_request', handleInternalBack);
    return () => {
      window.removeEventListener('dbv_subcomponent_back_request', handleInternalBack);
    };
  }, [handleInternalBackStep]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleFsChange = () => {
      setIsQrTelaoExpanded(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Refs síncronos para garantir envio imediato de alertas Anti-Cola mesmo ao minimizar/trocar de app no celular
  const studentRoomRef = useRef<LiveExamRoomState | null>(studentRoom);
  studentRoomRef.current = studentRoom;
  const studentPhaseRef = useRef(studentPhase);
  studentPhaseRef.current = studentPhase;
  const studentAnswersRef = useRef<Record<number, number>>(studentAnswers);
  studentAnswersRef.current = studentAnswers;
  const studentAnswersPinRef = useRef<string>('');
  const studentExamAlreadyClosedRef = useRef<boolean>(studentExamAlreadyClosed);
  studentExamAlreadyClosedRef.current = studentExamAlreadyClosed;
  const studentCheatCountRef = useRef<number>(studentCheatCount);
  const studentUnlockedCheatCountRef = useRef<number>(0);
  const studentLockedRef = useRef<boolean>(studentLocked);
  const studentLastCheatReasonRef = useRef<string>(studentLastCheatReason);
  const studentPendingAlertsRef = useRef<LiveExamCheatAlert[]>([]);
  const isStudentAwayRef = useRef<boolean>(false);
  const studentGraceUntilRef = useRef<number>(0);
  const wakeLockSentinelRef = useRef<any>(null);

  const acquireExamWakeLock = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
        if (!wakeLockSentinelRef.current) {
          wakeLockSentinelRef.current = await (navigator as any).wakeLock.request('screen');
          wakeLockSentinelRef.current.addEventListener('release', () => {
            wakeLockSentinelRef.current = null;
          });
        }
      }
    } catch {}
  }, []);

  const releaseExamWakeLock = useCallback(() => {
    try {
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release().catch(() => {});
        wakeLockSentinelRef.current = null;
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (studentPhase === 'FINISHED') {
      releaseExamWakeLock();
    }
  }, [studentPhase, releaseExamWakeLock]);

  // Detecta automaticamente ao abrir o link de uma prova (ou digitar o PIN de 6 dígitos) se a prova já foi encerrada,
  // exibindo a mensagem de "Prova Encerrada" sem adicionar o nome à lista de participantes nem gerar nota zero.
  useEffect(() => {
    if (roleMode !== 'STUDENT' || studentPhase !== 'ENTER_PIN') return;
    const cleanPin = (studentPinInput || initialPin || '').replace(/\D/g, '').trim();
    if (cleanPin.length !== 6) return;

    let cancelled = false;

    const checkIfExamAlreadyClosedOnEntry = async () => {
      try {
        const [apiRoom, cloudRoom] = await Promise.all([
          fetch(`/api/live-exam?pin=${cleanPin}&t=${Date.now()}`, { cache: 'no-store' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) =>
              data?.room && String(data.room.pin) === cleanPin
                ? (data.room as LiveExamRoomState)
                : null
            )
            .catch(() => null),
          downloadCloudExamJson<LiveExamRoomState>(`provas/room_${cleanPin}.json`).then((parsed) =>
            parsed && String(parsed.pin) === cleanPin ? parsed : null
          )
        ]);

        if (cancelled) return;

        let resolved: LiveExamRoomState | null = cloudRoom || apiRoom;
        if (apiRoom && cloudRoom) {
          resolved =
            (cloudRoom.updatedAt || 0) >= (apiRoom.updatedAt || 0) ? cloudRoom : apiRoom;
        }

        if (!resolved) {
          try {
            const localMulti = localStorage.getItem('dbv_instructor_active_exam_rooms');
            if (localMulti) {
              const parsedMulti = JSON.parse(localMulti);
              if (Array.isArray(parsedMulti)) {
                const matched = parsedMulti.find((r: any) => r && String(r.pin) === cleanPin);
                if (matched) resolved = matched;
              }
            }
            if (!resolved) {
              const localSaved = localStorage.getItem('dbv_instructor_active_exam_room');
              if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (parsed && String(parsed.pin) === cleanPin) {
                  resolved = parsed;
                }
              }
            }
          } catch {}
        }

        if (!resolved || cancelled) return;

        const isResUnlimited = isUnlimitedRoomDuration(
          resolved.durationMinutes,
          resolved.unlimitedTime
        );
        const isResManuallyFinished = Boolean(
          resolved.manuallyFinished || resolved.resultsReleased
        );
        const effectiveStatus: LiveExamRoomState['status'] =
          isResUnlimited && resolved.status === 'FINISHED' && !isResManuallyFinished
            ? resolved.startedAt
              ? 'ACTIVE'
              : 'WAITING'
            : resolved.status;

        if (effectiveStatus === 'FINISHED') {
          const existingMe =
            resolved.participants?.[studentId] ||
            (studentName.trim()
              ? Object.values(resolved.participants || {}).find(
                  (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
                )
              : undefined);
          const hasExistingAnswers = Boolean(
            existingMe &&
              (Number(existingMe.answeredCount || 0) > 0 ||
                Object.keys(existingMe.answers || {}).length > 0)
          );

          if (!hasExistingAnswers) {
            setStudentExamAlreadyClosed(true);
            studentExamAlreadyClosedRef.current = true;
            setStudentRoom({
              ...resolved,
              status: 'FINISHED'
            });
            setShowOpenModeChoiceModal(false);
            setIsConnectingRoom(false);
            setStudentPhase('FINISHED');
          }
        }
      } catch {}
    };

    checkIfExamAlreadyClosedOnEntry();

    return () => {
      cancelled = true;
    };
  }, [roleMode, studentPhase, studentPinInput, initialPin, studentId, studentName]);

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

  // Carrega catálogo completo de todas as especialidades no modo Instrutor
  useEffect(() => {
    const validPassed = (specialties || []).filter((s) => !s.nome?.toLowerCase().includes('mestrado'));
    const passedAreas = new Set(validPassed.map((s) => s.area).filter(Boolean));
    if (validPassed.length > 0 && passedAreas.size > 1) {
      setCatalog(validPassed);
    }
    if (roleMode !== 'HOST') return;
    let mounted = true;
    if (validPassed.length === 0 || passedAreas.size <= 1) {
      setIsLoadingCatalog(true);
    }
    fetchEspecialidades(club, undefined, { excludeQuestions: false })
      .then((list) => {
        if (!mounted) return;
        const fullValid = (list || []).filter((s) => !s.nome?.toLowerCase().includes('mestrado'));
        if (fullValid.length > 0) {
          setCatalog(fullValid);
        }
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
      options?: { closePin?: string; selectRoom?: boolean; isNewRoom?: boolean }
    ) => {
      const iKey = instructorKeyRef.current;
      if (room) {
        const isUnlimited = isUnlimitedRoomDuration(room.durationMinutes, room.unlimitedTime);
        const enrichedRoom: LiveExamRoomState = {
          ...room,
          durationMinutes: isUnlimited ? UNLIMITED_DURATION_MINUTES : Number(room.durationMinutes || 15),
          unlimitedTime: isUnlimited,
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
              isNewRoom: Boolean(options?.isNewRoom),
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
              const eUnlocked = Number(ep.unlockedCheatCount || 0);
              const lUnlocked = Number(lp.unlockedCheatCount || 0);
              const maxUnlocked = Math.max(eUnlocked, lUnlocked);
              const maxAns = Math.max(Number(ep.answeredCount || 0), Number(lp.answeredCount || 0));

              if (eCheat > lCheat && soundEnabledRef.current) {
                playCheatAlertSound();
              }

              const keepLocalLock =
                lp.status === 'DISQUALIFIED' || ep.status === 'DISQUALIFIED'
                  ? true
                  : maxUnlocked >= maxCheat && maxUnlocked > 0
                  ? false
                  : lCheat > eCheat
                  ? lp.isLocked
                  : ep.isLocked;
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
                unlockedCheatCount: maxUnlocked,
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

            const alertKeys = new Set<string>();
            const mergedAlerts: LiveExamCheatAlert[] = [];
            [...(locRoom.alerts || []), ...(extRoom.alerts || [])].forEach((a) => {
              if (!a?.id) return;
              const vKey = a.studentId && a.violationNumber ? `${a.studentId}_v${a.violationNumber}` : a.id;
              if (!alertKeys.has(a.id) && !alertKeys.has(vKey)) {
                alertKeys.add(a.id);
                alertKeys.add(vKey);
                mergedAlerts.push(a);
              }
            });

            const nextResultsReleased = isExtNewer
              ? Boolean(extRoom.resultsReleased ?? locRoom.resultsReleased)
              : Boolean(locRoom.resultsReleased ?? extRoom.resultsReleased);
            const effDuration = Number(
              (isExtNewer ? extRoom.durationMinutes : locRoom.durationMinutes) ??
                extRoom.durationMinutes ??
                locRoom.durationMinutes ??
                15
            );
            const isUnlimited = isUnlimitedRoomDuration(
              effDuration,
              Boolean(extRoom.unlimitedTime ?? locRoom.unlimitedTime)
            );
            const manuallyFinished = Boolean(
              locRoom.manuallyFinished || extRoom.manuallyFinished || nextResultsReleased
            );
            let nextStatus: LiveExamRoomState['status'] =
              locRoom.status === 'FINISHED' || extRoom.status === 'FINISHED'
                ? 'FINISHED'
                : locRoom.status === 'ACTIVE' || extRoom.status === 'ACTIVE'
                ? 'ACTIVE'
                : 'WAITING';
            if (isUnlimited && nextStatus === 'FINISHED' && !manuallyFinished) {
              nextStatus =
                locRoom.status === 'ACTIVE' || extRoom.status === 'ACTIVE' || locRoom.startedAt || extRoom.startedAt
                  ? 'ACTIVE'
                  : 'WAITING';
            }
            const nextStartedAt = extRoom.startedAt || locRoom.startedAt || null;
            const nextExtraSeconds = Math.max(
              locRoom.extraSecondsAdded || 0,
              extRoom.extraSecondsAdded || 0
            );

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
                durationMinutes: isUnlimited ? UNLIMITED_DURATION_MINUTES : effDuration,
                unlimitedTime: isUnlimited,
                manuallyFinished,
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
          if (current.status === 'FINISHED' && !existing) {
            broadcastRoomSync(current);
            return;
          }
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
          if (current.status === 'FINISHED' && !prevP) {
            broadcastRoomSync(current);
            return;
          }
          const prevCheat = Number(prevP?.cheatCount || 0);
          const incomingCheat = Number(p.cheatCount || 0);
          const maxCheat = Math.max(prevCheat, incomingCheat);
          const prevUnlocked = Number(prevP?.unlockedCheatCount || 0);
          const incomingUnlocked = Number(p.unlockedCheatCount || 0);
          const maxUnlocked = Math.max(prevUnlocked, incomingUnlocked);

          if (incomingCheat > prevCheat && soundEnabledRef.current) {
            playCheatAlertSound();
          }

          const isLocked =
            prevP?.status === 'DISQUALIFIED'
              ? true
              : maxUnlocked >= maxCheat && maxUnlocked > 0
              ? false
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
              : p.status === 'LOCKED_CHEAT'
              ? 'PLAYING'
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
                unlockedCheatCount: maxUnlocked,
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
          const prevP = current.participants[p.id];
          const maxCheat = Math.max(Number(prevP?.cheatCount || 0), Number(p.cheatCount || 0));
          const maxUnlocked = Math.max(
            Number(prevP?.unlockedCheatCount || 0),
            Number(p.unlockedCheatCount || 0)
          );
          const alreadyUnlocked = maxUnlocked >= maxCheat && maxUnlocked > 0;
          const alreadyHasAlert = current.alerts.some(
            (a) =>
              a.id === alertItem.id ||
              (a.studentId === alertItem.studentId && a.violationNumber === alertItem.violationNumber)
          );

          if (!alreadyHasAlert && soundEnabledRef.current) {
            playCheatAlertSound();
          }

          const shouldLock = current.lockOnCheat && !alreadyUnlocked;
          const updatedParticipant: LiveExamParticipant = {
            ...(prevP || p),
            ...p,
            cheatCount: maxCheat,
            unlockedCheatCount: maxUnlocked,
            isLocked: shouldLock,
            status: shouldLock
              ? 'LOCKED_CHEAT'
              : p.status === 'LOCKED_CHEAT'
              ? 'PLAYING'
              : p.status
          };

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
                if (
                  latestLocal.status === 'FINISHED' &&
                  !lp &&
                  Number(sp.answeredCount || 0) === 0 &&
                  Object.keys(sp.answers || {}).length === 0
                ) {
                  return;
                }
                const spCheat = Number(sp.cheatCount || 0);
                const lpCheat = Number(lp?.cheatCount || 0);
                const spUnlocked = Number(sp.unlockedCheatCount || 0);
                const lpUnlocked = Number(lp?.unlockedCheatCount || 0);
                const maxCheat = Math.max(spCheat, lpCheat);
                const maxUnlocked = Math.max(spUnlocked, lpUnlocked);
                if (
                  !lp ||
                  sp.answeredCount > lp.answeredCount ||
                  spCheat > lpCheat ||
                  spUnlocked > lpUnlocked ||
                  (sp.isLocked && !lp.isLocked && spCheat > maxUnlocked) ||
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
                  const nextLocked =
                    lp?.status === 'DISQUALIFIED' || sp.status === 'DISQUALIFIED'
                      ? true
                      : maxUnlocked >= maxCheat && maxUnlocked > 0
                      ? false
                      : spCheat >= lpCheat
                      ? Boolean(sp.isLocked)
                      : Boolean(lp?.isLocked);
                  mergedParticipants[sp.id] = {
                    ...lp,
                    ...sp,
                    answeredCount: Math.max(Number(lp?.answeredCount || 0), Number(sp.answeredCount || 0)),
                    cheatCount: maxCheat,
                    unlockedCheatCount: maxUnlocked,
                    isLocked: nextLocked,
                    status:
                      lp?.status === 'DISQUALIFIED' || sp.status === 'DISQUALIFIED'
                        ? 'DISQUALIFIED'
                        : lp?.status === 'FINISHED' || sp.status === 'FINISHED'
                        ? 'FINISHED'
                        : nextLocked
                        ? 'LOCKED_CHEAT'
                        : sp.status === 'LOCKED_CHEAT'
                        ? 'PLAYING'
                        : sp.status
                  };
                  changed = true;
                }
              });

              (externalRoom.alerts || []).forEach((sa) => {
                const vKey = sa?.studentId && sa?.violationNumber ? `alert_${sa.studentId}_v${sa.violationNumber}` : sa?.id;
                const alreadyExists =
                  !sa?.id ||
                  existingAlertIds.has(sa.id) ||
                  (vKey && existingAlertIds.has(vKey)) ||
                  mergedAlerts.some(
                    (a) => a.id === sa.id || (a.studentId === sa.studentId && a.violationNumber === sa.violationNumber)
                  );
                if (!alreadyExists) {
                  existingAlertIds.add(sa.id);
                  if (vKey) existingAlertIds.add(vKey);
                  mergedAlerts.unshift(sa);
                  changed = true;
                  if (soundEnabledRef.current) {
                    playCheatAlertSound();
                  }
                }
              });

              const isExtUnlimited = isUnlimitedRoomDuration(
                externalRoom.durationMinutes ?? latestLocal.durationMinutes,
                externalRoom.unlimitedTime ?? latestLocal.unlimitedTime
              );
              const isExtNewer = (externalRoom.updatedAt || 0) > (latestLocal.updatedAt || 0);
              if (isExtNewer && typeof externalRoom.resultsReleased === 'boolean') {
                nextResultsReleased = externalRoom.resultsReleased;
              }
              const isExtManuallyFinished = Boolean(
                externalRoom.manuallyFinished || latestLocal.manuallyFinished || nextResultsReleased
              );
              if (
                externalRoom.status === 'FINISHED' &&
                nextStatus !== 'FINISHED' &&
                (!isExtUnlimited || isExtManuallyFinished)
              ) {
                nextStatus = 'FINISHED';
              } else if (externalRoom.status === 'ACTIVE' && nextStatus === 'WAITING') {
                nextStatus = 'ACTIVE';
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

  // Cronômetro regressivo de todas as salas ativas no painel do Instrutor (com Web Worker anti-throttling para funcionar mesmo com navegador minimizado)
  useEffect(() => {
    const updateTimers = () => {
      const currentSelected = activeRoomRef.current;
      let calculatedRemaining = 0;
      const isUnlimitedSelected = Boolean(
        currentSelected &&
          isUnlimitedRoomDuration(currentSelected.durationMinutes, currentSelected.unlimitedTime)
      );
      if (!currentSelected || currentSelected.status === 'FINISHED') {
        calculatedRemaining = 0;
        setHostRemainingSeconds(0);
      } else if (isUnlimitedSelected) {
        if (currentSelected.status === 'ACTIVE' && currentSelected.startedAt) {
          calculatedRemaining = Math.max(0, Math.floor((Date.now() - currentSelected.startedAt) / 1000));
        } else {
          calculatedRemaining = 0;
        }
        setHostRemainingSeconds(calculatedRemaining);
      } else if (currentSelected.status !== 'ACTIVE' || !currentSelected.startedAt) {
        calculatedRemaining = currentSelected.durationMinutes * 60;
        setHostRemainingSeconds(calculatedRemaining);
      } else {
        const totalAllowed =
          currentSelected.durationMinutes * 60 + (currentSelected.extraSecondsAdded || 0);
        const elapsed = Math.floor((Date.now() - (currentSelected.startedAt || Date.now())) / 1000);
        calculatedRemaining = Math.max(0, totalAllowed - elapsed);
        setHostRemainingSeconds(calculatedRemaining);
      }

      // Atualiza diretamente o DOM da janela de projeção (Telão) mesmo se a janela principal estiver minimizada e o React adiar re-renderizações
      try {
        const projWin = projectorWindowRef.current as any;
        if (projWin && !projWin.closed && currentSelected) {
          projWin.__telaoRoomState = currentSelected;
          const doc = projWin.document;
          if (doc) {
            const mins = Math.floor(calculatedRemaining / 60);
            const secs = calculatedRemaining % 60;
            const mmss = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            const isFinishedRoom = currentSelected.status === 'FINISHED';
            const formatted = isFinishedRoom
              ? 'PROVA ENCERRADA'
              : isUnlimitedSelected
              ? '∞ SEM LIMITE'
              : mmss;
            const timerEl = doc.getElementById('telao-v3-timer');
            if (timerEl) {
              if (timerEl.textContent !== formatted) {
                timerEl.textContent = formatted;
              }
              timerEl.classList.toggle('timer-finished-text', isFinishedRoom);
            }
            const timerLabelEl = doc.getElementById('telao-v3-timer-label');
            if (timerLabelEl) {
              const nextLabel = isFinishedRoom
                ? 'STATUS DA AVALIAÇÃO'
                : isUnlimitedSelected
                ? 'TEMPO DE PROVA'
                : 'TEMPO RESTANTE';
              if (timerLabelEl.textContent !== nextLabel) {
                timerLabelEl.textContent = nextLabel;
              }
            }
            const timerCardEl = doc.getElementById('telao-v3-timer-card');
            if (timerCardEl) {
              timerCardEl.classList.toggle('timer-featured', currentSelected.status !== 'WAITING');
              timerCardEl.classList.toggle(
                'timer-urgent',
                isFinishedRoom ||
                  (!isUnlimitedSelected && currentSelected.status === 'ACTIVE' && calculatedRemaining <= 60)
              );
            }
          }
        }
      } catch {}

      // Verifica se alguma sala aberta (com tempo limite definido) esgotou o tempo
      hostRoomsRef.current.forEach((roomItem) => {
        if (
          roomItem.status === 'ACTIVE' &&
          roomItem.startedAt &&
          !isUnlimitedRoomDuration(roomItem.durationMinutes, roomItem.unlimitedTime)
        ) {
          const totalAllowed = roomItem.durationMinutes * 60 + (roomItem.extraSecondsAdded || 0);
          const elapsed = Math.floor((Date.now() - roomItem.startedAt) / 1000);
          const remaining = Math.max(0, totalAllowed - elapsed);
          if (remaining <= 0) {
            const finishedRoom: LiveExamRoomState = {
              ...roomItem,
              status: 'FINISHED',
              manuallyFinished: true,
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

    // Web Worker não sofre throttling de 1min quando a janela principal do navegador é minimizada
    let worker: Worker | null = null;
    let workerUrl: string | null = null;
    try {
      const blob = new Blob(
        ['setInterval(function(){ postMessage("tick"); }, 500);'],
        { type: 'application/javascript' }
      );
      workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);
      worker.onmessage = () => {
        updateTimers();
      };
    } catch {}

    return () => {
      clearInterval(timer);
      if (worker) {
        try {
          worker.terminate();
        } catch {}
      }
      if (workerUrl) {
        try {
          URL.revokeObjectURL(workerUrl);
        } catch {}
      }
    };
  }, [activeRoom, openRoomPinsKey, persistHostRoom]);

  // ============================================================================
  // GERAÇÃO DE QUESTÕES DA ESPECIALIDADE (IA + REQUISITOS OFICIAIS)
  // ============================================================================
  const handleSelectSpecialtyForExam = async (spec: Especialidade, customCountOverride?: number) => {
    setSelectedSpecialty(spec);
    setSpecialtyEditingQuestionIdx(null);
    setIsGeneratingSpecialtyQuestions(true);
    const targetCount = Math.max(1, Math.min(100, Number(customCountOverride ?? specialtyQuestionCount) || 10));

    try {
      let reqs = spec.requisitos || [];
      if (reqs.length === 0) {
        reqs = await fetchEspecialidadeRequisitos(club, spec.id);
      }

      const generated = await generateExamQuestionsWithAi({
        subject: spec.nome,
        areaOrCategory: spec.area,
        requirementsOrContext: reqs,
        targetCount,
        clubType: isPathfinder ? 'PATHFINDER' : 'ADVENTURER'
      });

      setSpecialtyQuestions(generated);
    } catch (err) {
      console.warn('Erro ao gerar questões com IA para especialidade:', err);
      setSpecialtyQuestions(buildSmartFallbackQuestions(spec.nome, spec.area, spec.requisitos || [], targetCount));
    } finally {
      setIsGeneratingSpecialtyQuestions(false);
    }
  };

  useEffect(() => {
    if (preselectedSpecialty && specialtyQuestions.length === 0 && !isGeneratingSpecialtyQuestions) {
      setExamCreationMode('SPECIALTY');
      handleSelectSpecialtyForExam(preselectedSpecialty);
    }
  }, [preselectedSpecialty]);

  // Adiciona uma nova questão manual vazia/editável e já abre o modo de edição
  const handleAddManualQuestion = () => {
    setCustomThemeNotice(null);
    setQuestions((prev) => {
      const nextIdx = prev.length;
      setEditingQuestionIdx(nextIdx);
      return [
        ...prev,
        {
          id: `manual_q_${Date.now()}_${nextIdx}`,
          question: `Pergunta ${nextIdx + 1}: Digite o enunciado da questão aqui`,
          options: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'],
          correctIndex: 0,
          explanation: ''
        }
      ];
    });
  };

  // Gera questões com IA a partir de um Tema Livre digitado pelo instrutor
  const handleGenerateCustomThemeQuestions = async (customCountOverride?: number | React.MouseEvent) => {
    const themeTitle = customExamTitle.trim();
    const extraDetails = customExamTopicDetails.trim();
    if (!themeTitle) {
      setCustomThemeNotice('⚠️ Digite o título ou tema da prova acima para a IA gerar as questões.');
      return;
    }

    setCustomThemeNotice(null);
    setCustomEditingQuestionIdx(null);
    setIsGeneratingCustomQuestions(true);
    const targetCount = Math.max(
      1,
      Math.min(100, (typeof customCountOverride === 'number' ? customCountOverride : customQuestionCount) || 10)
    );

    try {
      const generated = await generateExamQuestionsWithAi({
        subject: themeTitle,
        areaOrCategory: 'Tema Livre',
        requirementsOrContext: extraDetails || themeTitle,
        targetCount,
        clubType: isPathfinder ? 'PATHFINDER' : 'ADVENTURER'
      });

      setCustomQuestions(generated);
      setCustomEditingQuestionIdx(null);
    } catch {
      setCustomThemeNotice('⚠️ Não foi possível conectar à IA no momento. Você pode adicionar ou editar as questões manualmente.');
      setCustomQuestions(buildSmartFallbackQuestions(themeTitle, 'Tema Livre', [], targetCount));
    } finally {
      setIsGeneratingCustomQuestions(false);
    }
  };

  // ============================================================================
  // PROVA DOS LIVROS E MANUAIS: CARREGAMENTO DO CATÁLOGO E GERAÇÃO DE QUESTÕES
  // ============================================================================
  const isNistoCremosBook = useCallback((book: LiveExamBookItem | null | undefined): boolean => {
    if (!book?.title) return false;
    const norm = book.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return norm.includes('nisto cremos');
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadAllBooksForExam = async () => {
      if (booksCatalog.length === 0) {
        setIsLoadingBooksCatalog(true);
      }
      try {
        const [classesList, anoList, outrosList, avtList, manuaisDbvList, manuaisAvtList] =
          await Promise.all([
            fetchLivrosClasses().catch(() => []),
            fetchLivrosAno().catch(() => []),
            fetchOutrosLivros().catch(() => []),
            fetchLivrosAVT().catch(() => []),
            fetchManuaisDBV().catch(() => []),
            fetchManuaisAVT().catch(() => [])
          ]);

        if (cancelled) return;

        const unified: LiveExamBookItem[] = [];

        (classesList || []).forEach((b: any) => {
          const title = String(b?.Nome || b?.nome || '').trim();
          if (!title) return;
          unified.push({
            uid: `classes_${b.id || title}`,
            id: Number(b.id) || unified.length + 1,
            title,
            cover: getImageUrl(b.Capa || b.capa || b.ClasseIMG || ''),
            summary: String(b.Resumo || b.resumo || ''),
            content: String(b.Conteudo || b.conteudo || ''),
            category: 'CLASSES',
            categoryLabel: 'Livro das Classes',
            badgeText: String(b.Classe || b.classe || 'Classes DBV'),
            club: ClubType.PATHFINDER
          });
        });

        (anoList || []).forEach((b: any) => {
          const title = String(b?.Nome || b?.nome || '').trim();
          if (!title) return;
          unified.push({
            uid: `ano_dbv_${b.id || title}`,
            id: Number(b.id) || unified.length + 100,
            title,
            cover: getImageUrl(b.Capa || b.capa || ''),
            summary: String(b.Resumo || b.resumo || ''),
            content: String(b.Conteudo || b.conteudo || ''),
            category: 'ANO_DBV',
            categoryLabel: 'Livro do Ano (DBV)',
            badgeText: b.Ano ? `Ano ${b.Ano}` : 'Livro do Ano',
            club: ClubType.PATHFINDER
          });
        });

        let hasNistoCremos = false;
        (outrosList || []).forEach((b: any) => {
          const title = String(b?.Nome || b?.nome || '').trim();
          if (!title) return;
          if (
            title
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .includes('nisto cremos')
          ) {
            hasNistoCremos = true;
          }
          unified.push({
            uid: `outros_dbv_${b.id || title}`,
            id: Number(b.id) || unified.length + 200,
            title,
            cover: getImageUrl(b.capa || b.Capa || ''),
            summary: String(b.Resumo || b.resumo || ''),
            content: String(b.Conteudo || b.conteudo || ''),
            category: 'OUTROS_DBV',
            categoryLabel: 'Outros Livros',
            badgeText: 'Biblioteca DBV',
            club: ClubType.PATHFINDER
          });
        });

        if (!hasNistoCremos) {
          unified.push({
            uid: 'outros_dbv_nisto_cremos',
            id: 299,
            title: 'Nisto Cremos (28 Crenças Fundamentais da IASD)',
            cover: '',
            summary:
              'As 28 Crenças Fundamentais da Igreja Adventista do Sétimo Dia organizadas nos Capítulos 1 a 10, 11 a 20 e 21 a 28.',
            content: '',
            category: 'OUTROS_DBV',
            categoryLabel: 'Outros Livros',
            badgeText: 'Doutrinas IASD (Cap. 1-28)',
            club: ClubType.PATHFINDER
          });
        }

        let hasManualAdminDbv = false;
        (manuaisDbvList || []).forEach((m: any) => {
          const title = String(m?.Nome || m?.nome || '').trim();
          if (!title) return;
          if (
            title
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .includes('administrativo')
          ) {
            hasManualAdminDbv = true;
          }
          unified.push({
            uid: `manuais_dbv_${m.id || title}`,
            id: Number(m.id) || unified.length + 400,
            title,
            cover: getImageUrl(m.Capa || m.capa || ''),
            summary: String(m.Resumo || m.resumo || 'Manual Oficial do Clube de Desbravadores (DSA).'),
            content: String(m.Conteudo || m.conteudo || m.Link || m.link || ''),
            category: 'MANUAIS_DBV',
            categoryLabel: 'Manuais DBV',
            badgeText: 'Manual Oficial DBV',
            club: ClubType.PATHFINDER
          });
        });

        if (!hasManualAdminDbv) {
          unified.push({
            uid: 'manuais_dbv_manual_administrativo',
            id: 499,
            title: 'Manual Administrativo do Clube de Desbravadores',
            cover: '',
            summary:
              'Filosofia, Faixa Etária (10 a 15 anos), Eleição da Diretoria, Comissões, Sistema de Unidades, Cerimônias, Finanças, Seguro Anual/SGC, Bandeira, Banderim e Disciplina Redentiva.',
            content: '',
            category: 'MANUAIS_DBV',
            categoryLabel: 'Manuais DBV',
            badgeText: 'Manual Oficial DSA',
            club: ClubType.PATHFINDER
          });
        }

        (avtList || []).forEach((b: any) => {
          const title = String(b?.Nome || b?.nome || '').trim();
          if (!title) return;
          unified.push({
            uid: `avt_${b.id || title}`,
            id: Number(b.id) || unified.length + 300,
            title,
            cover: getImageUrl(b.Capa || b.capa || ''),
            summary: String(b.Resumo || b.resumo || ''),
            content: String(b.Conteudo || b.conteudo || ''),
            category: 'AVT',
            categoryLabel: 'Livros Aventureiros',
            badgeText: b.Ano ? `AVT ${b.Ano}` : 'Aventureiros',
            club: ClubType.ADVENTURER
          });
        });

        let hasManualAdminAvt = false;
        (manuaisAvtList || []).forEach((m: any) => {
          const title = String(m?.Nome || m?.nome || '').trim();
          if (!title) return;
          if (
            title
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .includes('administrativo')
          ) {
            hasManualAdminAvt = true;
          }
          unified.push({
            uid: `manuais_avt_${m.id || title}`,
            id: Number(m.id) || unified.length + 500,
            title,
            cover: getImageUrl(m.Capa || m.capa || ''),
            summary: String(m.Resumo || m.resumo || 'Manual Oficial do Clube de Aventureiros (DSA).'),
            content: String(m.Conteudo || m.conteudo || m.Link || m.link || ''),
            category: 'MANUAIS_AVT',
            categoryLabel: 'Manuais Aventureiros',
            badgeText: 'Manual Oficial AVT',
            club: ClubType.ADVENTURER
          });
        });

        if (!hasManualAdminAvt) {
          unified.push({
            uid: 'manuais_avt_manual_administrativo',
            id: 599,
            title: 'Manual Administrativo do Clube de Aventureiros',
            cover: '',
            summary:
              'Ideais dos Aventureiros, Classes (Abelhinhas Laboriosas, Luminares, Edificadores e Mãos Ajudadoras), Rede Familiar, Diretoria, Unidades e Cerimônias.',
            content: '',
            category: 'MANUAIS_AVT',
            categoryLabel: 'Manuais Aventureiros',
            badgeText: 'Manual Oficial AVT',
            club: ClubType.ADVENTURER
          });
        }

        if (unified.length > 0) {
          setBooksCatalog(unified);
          try {
            localStorage.setItem('dbv_cached_all_exam_books_v2', JSON.stringify(unified));
          } catch {}
        }
      } catch {}
      if (!cancelled) {
        setIsLoadingBooksCatalog(false);
      }
    };

    loadAllBooksForExam();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredBooksCatalog = useMemo(() => {
    const q = bookSearchQuery
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

    return booksCatalog.filter((b) => {
      if (bookCategoryFilter !== 'TODOS' && b.category !== bookCategoryFilter) {
        return false;
      }
      if (!q) return true;
      const haystack = `${b.title} ${b.badgeText} ${b.categoryLabel} ${b.summary}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [booksCatalog, bookCategoryFilter, bookSearchQuery]);

  const convertCuratedPoolToLiveExamQuestions = (
    pool: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
      reference?: string;
    }>,
    prefix: string
  ): LiveExamQuestion[] => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.map((q, idx) => {
      const rawOpts =
        Array.isArray(q.options) && q.options.length >= 4
          ? q.options.slice(0, 4).map((o) => String(o).trim())
          : ['Opção A', 'Opção B', 'Opção C', 'Opção D'];
      const safeCorrect =
        typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4
          ? q.correctIndex
          : 0;
      const targetSlot = idx % 4;
      const reordered = [...rawOpts];
      const correctText = reordered[safeCorrect];
      reordered[safeCorrect] = reordered[targetSlot];
      reordered[targetSlot] = correctText;
      const expParts = [q.explanation, q.reference ? `Ref.: ${q.reference}` : '']
        .map((s) => (s || '').trim())
        .filter(Boolean);
      return {
        id: `${prefix}_${Date.now()}_${idx}`,
        question: String(q.question),
        options: reordered,
        correctIndex: targetSlot,
        explanation: expParts.join(' • ')
      };
    });
  };

  const buildFallbackBookQuestions = (
    book: LiveExamBookItem,
    count: number,
    chapterFocus?: string
  ): LiveExamQuestion[] => {
    const cleanSummary = (book.summary || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const generated: LiveExamQuestion[] = [];

    generated.push({
      id: `q_book_${Date.now()}_0`,
      question: `A qual categoria da Biblioteca Oficial pertence a obra "${book.title}"?`,
      options: [
        `${book.categoryLabel} (${book.badgeText})`,
        'Catálogo Exclusivo de Insígnias Náuticas',
        'Tabela Externa de Campeonatos Esportivos',
        'Dicionário de Termos Estrangeiros'
      ],
      correctIndex: 0,
      explanation: `A obra "${book.title}" faz parte de ${book.categoryLabel} (${book.badgeText}).`
    });

    if (cleanSummary.length > 20) {
      const shortSum = cleanSummary.length > 165 ? cleanSummary.slice(0, 162) + '...' : cleanSummary;
      generated.push({
        id: `q_book_${Date.now()}_1`,
        question: `Qual das alternativas abaixo descreve corretamente o tema/resumo de "${book.title}"?`,
        options: [
          'Trata apenas de tabelas matemáticas sem história ou diretrizes práticas.',
          shortSum,
          'Aborda exclusivamente regras esportivas de campeonatos.',
          'É um dicionário de termos técnicos sem aplicação no clube.'
        ],
        correctIndex: 1,
        explanation: `Resumo oficial da obra "${book.title}": ${shortSum}`
      });
    }

    while (generated.length < count) {
      const n = generated.length + 1;
      const targetSlot = n % 4;
      const baseOptions = [
        `Compreender o conteúdo, diretrizes e aplicar os ensinamentos cristãos e práticos apresentados em "${book.title}"${chapterFocus ? ` (${chapterFocus})` : ''}.`,
        'Decorar apenas o número de páginas da capa sem ler os capítulos da obra.',
        'Ignorar a mensagem central da obra e substituir a leitura por outra atividade.',
        'Ler apenas o índice sem conhecer o desenvolvimento do conteúdo.'
      ];
      const reordered = [...baseOptions];
      const temp = reordered[targetSlot];
      reordered[targetSlot] = reordered[0];
      reordered[0] = temp;

      generated.push({
        id: `q_book_${Date.now()}_${n}`,
        question: `Sobre o estudo e avaliação de "${book.title}" (${book.badgeText})${chapterFocus ? ` — ${chapterFocus}` : ''}, qual é o objetivo principal de aprendizado para o membro do clube?`,
        options: reordered,
        correctIndex: targetSlot,
        explanation: `O estudo de "${book.title}" visa o crescimento espiritual, mental e técnico no clube.`
      });
    }

    return generated.slice(0, count);
  };

  const handleSelectBookForExam = async (
    book: LiveExamBookItem,
    customFocusOverride?: string,
    customCountOverride?: number,
    customNistoCategoryOverride?: 'ALL' | '1_10' | '11_20' | '21_28'
  ) => {
    setSelectedBookForExam(book);
    setBookExamNotice(null);
    setBookEditingQuestionIdx(null);
    setIsGeneratingBookQuestions(true);
    const targetCount = Math.max(1, Math.min(100, Number(customCountOverride ?? bookQuestionCount) || 10));

    const isNisto = isNistoCremosBook(book);
    const activeNistoCat = customNistoCategoryOverride ?? nistoCremosCategory;
    if (customNistoCategoryOverride) {
      setNistoCremosCategory(customNistoCategoryOverride);
    }

    const nistoLabelMap: Record<'ALL' | '1_10' | '11_20' | '21_28', string> = {
      '1_10': 'Capítulos 1 a 10 (Doutrinas de Deus, Criação, Humanidade e Salvação)',
      '11_20': 'Capítulos 11 a 20 (A Igreja, Batismo, Dons, Lei de Deus e Sábado)',
      '21_28': 'Capítulos 21 a 28 (Mordomia, Conduta, Santuário, Segunda Vinda e Nova Terra)',
      ALL: 'Capítulos 1 a 28 (Todas as 28 Crenças Fundamentais)'
    };

    const focusStr = isNisto
      ? customFocusOverride !== undefined && customFocusOverride.trim()
        ? `${nistoLabelMap[activeNistoCat]} • ${customFocusOverride.trim()}`
        : nistoLabelMap[activeNistoCat]
      : (customFocusOverride !== undefined ? customFocusOverride : bookChapterFocus).trim();

    try {
      // Banco oficial pré-cadastrado para Nisto Cremos (Cap. 1 a 10, 11 a 20, 21 a 28) e Manuais Oficiais
      let curatedBase: LiveExamQuestion[] = [];
      if (isNisto) {
        const pool =
          activeNistoCat === '1_10'
            ? NISTO_CREMOS_1_10_QUESTIONS
            : activeNistoCat === '11_20'
            ? NISTO_CREMOS_11_20_QUESTIONS
            : activeNistoCat === '21_28'
            ? NISTO_CREMOS_21_28_QUESTIONS
            : [
                ...NISTO_CREMOS_1_10_QUESTIONS,
                ...NISTO_CREMOS_11_20_QUESTIONS,
                ...NISTO_CREMOS_21_28_QUESTIONS
              ];
        curatedBase = convertCuratedPoolToLiveExamQuestions(pool, `nisto_${activeNistoCat}`);
        if (curatedBase.length >= targetCount && !customFocusOverride?.trim()) {
          setBookQuestions(curatedBase.slice(0, targetCount));
          setIsGeneratingBookQuestions(false);
          return;
        }
      } else if (book.category === 'MANUAIS_DBV' || book.category === 'MANUAIS_AVT') {
        const normTitle = book.title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        if (book.category === 'MANUAIS_DBV' && normTitle.includes('administrativo')) {
          curatedBase = convertCuratedPoolToLiveExamQuestions(
            [...MANUAL_ADMINISTRATIVO_DBV_QUESTIONS, ...DESBRAVADORES_IDEALS_MANUAL_QUESTIONS],
            'manual_adm_dbv'
          );
          if (curatedBase.length >= targetCount && !focusStr) {
            setBookQuestions(curatedBase.slice(0, targetCount));
            setIsGeneratingBookQuestions(false);
            return;
          }
        } else if (book.category === 'MANUAIS_AVT' && normTitle.includes('administrativo')) {
          curatedBase = convertCuratedPoolToLiveExamQuestions(
            AVENTUREIROS_IDEALS_MANUAL_QUESTIONS,
            'manual_adm_avt'
          );
          if (curatedBase.length >= targetCount && !focusStr) {
            setBookQuestions(curatedBase.slice(0, targetCount));
            setIsGeneratingBookQuestions(false);
            return;
          }
        }
      }

      const cleanSummary = (book.summary || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const rawContent = (book.content || '').trim();
      const isContentUrl = /^https?:\/\//i.test(rawContent) && rawContent.length < 400;
      const textContentExcerpt = !isContentUrl
        ? rawContent
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 8000)
        : '';

      const clubLabel =
        book.club === ClubType.ADVENTURER ? 'Clube de Aventureiros' : 'Clube de Desbravadores';
      const itemTypeLabel =
        book.category === 'MANUAIS_DBV' || book.category === 'MANUAIS_AVT' ? 'manual oficial' : 'livro oficial';

      const prompt = `Você é um Instrutor Oficial do ${clubLabel} (Divisão Sul-Americana da IASD).
Elabore uma prova oficial com exatamente ${targetCount} questões de múltipla escolha sobre o ${itemTypeLabel}:
- Título: "${book.title}"
- Categoria: ${book.categoryLabel} (${book.badgeText})
${cleanSummary ? `- Resumo / Sinopse: ${cleanSummary}` : ''}
${textContentExcerpt ? `- Trecho do Conteúdo Oficial:\n${textContentExcerpt}` : ''}
${focusStr ? `- Recorte / Capítulos obrigatórios: ${focusStr}` : ''}

REGRAS OBRIGATÓRIAS:
1. Elabore perguntas específicas e fiéis ao conteúdo, capítulos, regras ou história de "${book.title}"${focusStr ? ` (focando estritamente em: ${focusStr})` : ''}.
2. Cada questão deve conter exatamente 4 alternativas ("options": array de 4 strings sem letras A/B/C/D no início) e apenas 1 correta ("correctIndex": 0, 1, 2 ou 3).
3. Retorne EXCLUSIVAMENTE um JSON array válido no formato:
[
  {
    "question": "Pergunta clara e objetiva?",
    "options": ["Alternativa 1", "Alternativa 2", "Alternativa 3", "Alternativa 4"],
    "correctIndex": 0,
    "explanation": "Resumo curto explicando a resposta correta com base na obra."
  }
]`;

      let parsedQuestions: any[] = [];
      const modelsToTry = [
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite'
      ];

      try {
        const apiKey = await resolveGeminiApiKey();
        if (apiKey) {
          // 1. Tenta via SDK GoogleGenAI
          try {
            const ai = new GoogleGenAI({ apiKey });
            for (const modelName of modelsToTry) {
              try {
                const res = await ai.models.generateContent({
                  model: modelName,
                  contents: prompt,
                  config: {
                    responseMimeType: 'application/json',
                    temperature: 0.4
                  }
                });
                if (res.text) {
                  const clean = res.text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
                  const first = clean.indexOf('[');
                  const last = clean.lastIndexOf(']');
                  if (first !== -1 && last > first) {
                    const arr = JSON.parse(clean.substring(first, last + 1));
                    if (Array.isArray(arr) && arr.length > 0) {
                      parsedQuestions = arr;
                      break;
                    }
                  }
                }
              } catch {}
            }
          } catch {}

          // 2. Fallback via REST API direto
          if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
            for (const modelName of modelsToTry) {
              try {
                const res = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{ parts: [{ text: prompt }] }],
                      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
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
                    const arr = JSON.parse(clean.substring(first, last + 1));
                    if (Array.isArray(arr) && arr.length > 0) {
                      parsedQuestions = arr;
                      break;
                    }
                  }
                }
              } catch {}
            }
          }
        }
      } catch {}

      if (Array.isArray(parsedQuestions) && parsedQuestions.length >= 1) {
        const formatted: LiveExamQuestion[] = parsedQuestions.slice(0, targetCount).map((q, idx) => {
          const rawOpts =
            Array.isArray(q.options) && q.options.length >= 4
              ? q.options.slice(0, 4).map((o: any) => String(o).replace(/^[A-Da-d][\)\.\-]\s*/, '').trim())
              : ['Opção A', 'Opção B', 'Opção C', 'Opção D'];
          const safeCorrect =
            typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4 ? q.correctIndex : 0;
          const targetSlot = idx % 4;
          const reordered = [...rawOpts];
          const correctText = reordered[safeCorrect];
          reordered[safeCorrect] = reordered[targetSlot];
          reordered[targetSlot] = correctText;

          return {
            id: `book_q_${Date.now()}_${idx}`,
            question: String(q.question || `Questão ${idx + 1} - ${book.title}`),
            options: reordered,
            correctIndex: targetSlot,
            explanation: String(q.explanation || '')
          };
        });
        const mergedWithCurated = curatedBase.length > 0 ? [...curatedBase, ...formatted] : formatted;
        if (mergedWithCurated.length < targetCount) {
          const topUp = buildFallbackBookQuestions(book, targetCount, focusStr).slice(mergedWithCurated.length);
          setBookQuestions([...mergedWithCurated, ...topUp].slice(0, targetCount));
        } else {
          setBookQuestions(mergedWithCurated.slice(0, targetCount));
        }
      } else if (curatedBase.length > 0) {
        if (curatedBase.length < targetCount) {
          const topUp = buildFallbackBookQuestions(book, targetCount, focusStr).slice(curatedBase.length);
          setBookQuestions([...curatedBase, ...topUp].slice(0, targetCount));
        } else {
          setBookQuestions(curatedBase.slice(0, targetCount));
        }
      } else {
        setBookQuestions(buildFallbackBookQuestions(book, targetCount, focusStr));
      }
    } catch {
      setBookQuestions(buildFallbackBookQuestions(book, targetCount, focusStr));
    } finally {
      setIsGeneratingBookQuestions(false);
    }
  };

  const resetStudentExamSessionState = useCallback((nextPinInput?: string) => {
    if (studentChannelRef.current) {
      try {
        supabaseStudentRealtime.removeChannel(studentChannelRef.current);
      } catch {}
      studentChannelRef.current = null;
    }
    studentAnswersPinRef.current = '';
    studentAnswersRef.current = {};
    setStudentAnswers({});
    setStudentCurrentQ(0);
    setStudentFinalTimeSpentSec(0);
    setStudentStartTime(null);
    setStudentRemainingSeconds(0);
    setStudentCheatCount(0);
    studentCheatCountRef.current = 0;
    studentUnlockedCheatCountRef.current = 0;
    studentLockedRef.current = false;
    setStudentLocked(false);
    setStudentWarningModal(null);
    studentPendingAlertsRef.current = [];
    setStudentExamAlreadyClosed(false);
    studentExamAlreadyClosedRef.current = false;
    setStudentRoom(null);
    studentRoomRef.current = null;
    setStudentPhase('ENTER_PIN');
    studentPhaseRef.current = 'ENTER_PIN';
    setStudentError(null);
    if (nextPinInput !== undefined) {
      setStudentPinInput(nextPinInput);
    }
  }, []);

  // Cria a Sala da Prova com PIN de 6 dígitos único e QR Code (suporta Prova de Especialidade, Prova dos Livros e Prova Personalizada Manual/IA)
  const handleCreateLiveExamRoom = () => {
    if (questions.length === 0) return;
    if (examCreationMode === 'SPECIALTY' && !selectedSpecialty) return;
    if (examCreationMode === 'BOOKS' && !selectedBookForExam) return;

    let pin = String(Math.floor(100000 + Math.random() * 900000));
    const existingPins = new Set<string>([
      ...hostRoomsRef.current.map((r) => String(r.pin)),
      ...appliedExamsHistoryRef.current.map((r) => String(r.pin)),
      ...Array.from(deletedAppliedExamPinsRef.current),
      ...Array.from(deletedStudentHistoryPinsRef.current),
      ...Array.from(closedRoomPinsRef.current)
    ]);
    while (existingPins.has(pin)) {
      pin = String(Math.floor(100000 + Math.random() * 900000));
    }

    let specialtyId = 0;
    let roomTitle = 'Prova Personalizada';
    let roomArea = 'Prova Personalizada';
    let roomLogo = '';
    let roomCode = 'PROVA';

    if (examCreationMode === 'BOOKS' && selectedBookForExam) {
      specialtyId = selectedBookForExam.id;
      roomTitle = selectedBookForExam.title;
      roomArea = `${selectedBookForExam.categoryLabel} • ${selectedBookForExam.badgeText}`;
      roomLogo = selectedBookForExam.cover || '';
      roomCode = 'LIVRO';
    } else if (examCreationMode === 'SPECIALTY' && selectedSpecialty) {
      specialtyId = selectedSpecialty.id;
      roomTitle = selectedSpecialty.nome;
      roomArea = selectedSpecialty.area || 'Especialidades';
      roomLogo = getImageUrl(selectedSpecialty.logo);
      roomCode = selectedSpecialty.codigo || selectedSpecialty.sigla || `ESP-${selectedSpecialty.id}`;
    } else {
      roomTitle = customExamTitle.trim() || 'Prova Personalizada';
      const normCustom = roomTitle
        .replace(/^📚\s*/g, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
      const matchedBook = booksCatalog.find(
        (b) =>
          b.title
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim() === normCustom
      );
      if (matchedBook) {
        specialtyId = matchedBook.id;
        roomArea = `${matchedBook.categoryLabel} • ${matchedBook.badgeText}`;
        roomLogo = matchedBook.cover || '';
        roomCode = 'LIVRO';
      }
    }

    const isUnlimited = isUnlimitedRoomDuration(durationMinutes);
    const newRoom: LiveExamRoomState = {
      pin,
      club,
      specialtyId,
      specialtyName: roomTitle,
      specialtyArea: roomArea,
      specialtyLogo: roomLogo,
      specialtyCode: roomCode,
      durationMinutes: isUnlimited ? UNLIMITED_DURATION_MINUTES : durationMinutes,
      unlimitedTime: isUnlimited,
      manuallyFinished: false,
      passingScorePercent,
      lockOnCheat,
      status: 'WAITING',
      resultsReleased: false,
      startedAt: null,
      extraSecondsAdded: 0,
      questions,
      participants: {},
      alerts: [],
      updatedAt: Date.now(),
      createdAt: Date.now()
    };
    resetStudentExamSessionState(pin);
    persistHostRoom(newRoom, { selectRoom: true, isNewRoom: true });
    scrollToQrCodeSection();
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
      manuallyFinished: false,
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
    (hostChannelsMapRef.current.get(activeRoom.pin) || hostChannelRef.current)
      ?.send({
        type: 'broadcast',
        event: 'host:room_sync',
        payload: { room: updated }
      })
      .catch(() => {});
  };

  const handleSetRoomUnlimitedTime = () => {
    if (!activeRoom) return;
    const updated: LiveExamRoomState = {
      ...activeRoom,
      durationMinutes: UNLIMITED_DURATION_MINUTES,
      unlimitedTime: true,
      manuallyFinished: false,
      extraSecondsAdded: 0,
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

  const handleFinishExamForAll = () => {
    if (!activeRoom) return;
    const updated: LiveExamRoomState = {
      ...activeRoom,
      status: 'FINISHED',
      manuallyFinished: true,
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

  const handleReleaseResultsForAll = (targetRoomOverride?: LiveExamRoomState) => {
    const targetRoom =
      targetRoomOverride && targetRoomOverride.pin ? targetRoomOverride : activeRoom;
    if (!targetRoom) return;

    // Se o resultado já havia sido enviado, alterna para RETIRAR RESULTADO (resultsReleased: false)
    if (targetRoom.resultsReleased) {
      const withdrawn: LiveExamRoomState = {
        ...targetRoom,
        status: 'FINISHED',
        manuallyFinished: true,
        resultsReleased: false,
        updatedAt: Date.now()
      };
      persistHostRoom(withdrawn);
      persistAppliedExamsList(
        [
          withdrawn,
          ...appliedExamsHistoryRef.current.filter((r) => String(r.pin) !== String(withdrawn.pin))
        ],
        true
      );
      if (selectedAppliedExam?.pin === withdrawn.pin) {
        setSelectedAppliedExam(withdrawn);
      }
      const ch = hostChannelsMapRef.current.get(withdrawn.pin) || hostChannelRef.current;
      ch?.send({
        type: 'broadcast',
        event: 'host:room_sync',
        payload: { room: withdrawn }
      }).catch(() => {});
      ch?.send({
        type: 'broadcast',
        event: 'host:release_results',
        payload: {
          pin: withdrawn.pin,
          resultsReleased: false,
          room: withdrawn,
          participants: withdrawn.participants
        }
      }).catch(() => {});

      setReleaseFeedbackMsg('🔒 Resultado retirado dos aparelhos dos alunos.');
      setTimeout(() => setReleaseFeedbackMsg(null), 5000);
      return;
    }

    const totalQ = targetRoom.questions.length || 1;
    const finalizedParticipants: Record<string, LiveExamParticipant> = {};
    Object.values(targetRoom.participants || {}).forEach((p) => {
      const ans = p.answers || {};
      let correct = 0;
      Object.entries(ans).forEach(([qIdxStr, chosenOpt]) => {
        const qItem = targetRoom.questions[Number(qIdxStr)];
        if (qItem && qItem.correctIndex === Number(chosenOpt)) {
          correct += 1;
        }
      });
      const answeredCount = Object.keys(ans).length;
      const effectiveCheatCount = Number(p.cheatCount || 0);
      const rawGrade10 = (correct / totalQ) * 10;
      const cheatPenalty = Number((effectiveCheatCount * 0.1).toFixed(1));
      const grade10 = Math.max(0, Number((rawGrade10 - cheatPenalty).toFixed(1)));
      const scorePercent = Math.max(0, Math.round(grade10 * 10));
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
      ...targetRoom,
      status: 'FINISHED',
      manuallyFinished: true,
      resultsReleased: true,
      participants: finalizedParticipants,
      updatedAt: Date.now()
    };
    persistHostRoom(updated);
    persistAppliedExamsList(
      [
        updated,
        ...appliedExamsHistoryRef.current.filter((r) => String(r.pin) !== String(updated.pin))
      ],
      true
    );
    if (selectedAppliedExam?.pin === updated.pin) {
      setSelectedAppliedExam(updated);
    }
    const ch = hostChannelsMapRef.current.get(updated.pin) || hostChannelRef.current;
    ch?.send({
      type: 'broadcast',
      event: 'host:room_sync',
      payload: { room: updated }
    }).catch(() => {});
    ch?.send({
      type: 'broadcast',
      event: 'host:release_results',
      payload: {
        pin: updated.pin,
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

    const maxViolationInAlerts = (activeRoom.alerts || [])
      .filter((a) => a.studentId === targetStudentId)
      .reduce((max, a) => Math.max(max, Number(a.violationNumber || 0)), 0);
    const unlockedCount = Math.max(
      Number(target.cheatCount || 0),
      Number(target.unlockedCheatCount || 0),
      maxViolationInAlerts,
      1
    );

    const updated: LiveExamRoomState = {
      ...activeRoom,
      participants: {
        ...activeRoom.participants,
        [targetStudentId]: {
          ...target,
          cheatCount: Math.max(Number(target.cheatCount || 0), unlockedCount),
          unlockedCheatCount: unlockedCount,
          isLocked: false,
          status:
            target.status === 'FINISHED'
              ? 'FINISHED'
              : activeRoom.status === 'ACTIVE'
              ? 'PLAYING'
              : 'WAITING'
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
        studentId: targetStudentId,
        unlockedAtViolation: unlockedCount
      })
    }).catch(() => {});
    const ch = hostChannelsMapRef.current.get(activeRoom.pin) || hostChannelRef.current;
    ch?.send({
      type: 'broadcast',
      event: 'host:unlock_student',
      payload: { studentId: targetStudentId, unlockedAtViolation: unlockedCount }
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

    const nextCheatCount = Math.max(
      Number(target.cheatCount || 0),
      Number(target.unlockedCheatCount || 0) + 1
    );

    const updated: LiveExamRoomState = {
      ...activeRoom,
      participants: {
        ...activeRoom.participants,
        [targetStudentId]: {
          ...target,
          cheatCount: nextCheatCount,
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
    const closingPin = pinToClose || activeRoom?.pin;
    if (closingPin && String(studentRoomRef.current?.pin) === String(closingPin)) {
      resetStudentExamSessionState('');
    }
    persistHostRoom(null, { closePin: closingPin });
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
    await acquireExamWakeLock();
  };

  const buildCurrentParticipantPayload = useCallback(
    (
      overrides?: Partial<LiveExamParticipant>,
      customAnswers?: Record<number, number>,
      customRoom?: LiveExamRoomState | null
    ): LiveExamParticipant => {
      const roomObj = customRoom || studentRoom;
      const scopedStudentAnswers =
        roomObj?.pin && studentAnswersPinRef.current === String(roomObj.pin)
          ? studentAnswers
          : {};
      const ans = customAnswers ?? scopedStudentAnswers;
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
      const effectiveCheatCount = Math.max(
        Number(overrides?.cheatCount || 0),
        studentCheatCount,
        studentCheatCountRef.current
      );
      const rawGrade10 = (correct / totalQ) * 10;
      const cheatPenalty = Number((effectiveCheatCount * 0.1).toFixed(1));
      const grade10 = Math.max(0, Number((rawGrade10 - cheatPenalty).toFixed(1)));
      const scorePercent = Math.max(0, Math.round(grade10 * 10));

      const effectiveUnlockedCount = studentUnlockedCheatCountRef.current;
      const effectiveLocked =
        effectiveUnlockedCount >= effectiveCheatCount && effectiveUnlockedCount > 0
          ? false
          : Boolean(studentLocked || studentLockedRef.current);
      const effectiveCheatReason = studentLastCheatReason || studentLastCheatReasonRef.current;

      const existingMe = roomObj?.participants?.[studentId];

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
        joinedAt:
          existingMe?.joinedAt ||
          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        joinedAtMs: existingMe?.joinedAtMs || Date.now(),
        currentQuestionIdx: studentCurrentQ,
        answeredCount,
        correctCount: correct,
        scorePercent,
        grade10,
        cheatCount: effectiveCheatCount,
        unlockedCheatCount: effectiveUnlockedCount,
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
      fallbackRoom?: LiveExamRoomState | null,
      isInitialJoin = false
    ) => {
      try {
        let cloudRoom = await downloadCloudExamJson<LiveExamRoomState>(`provas/room_${pin}.json`);
        if (!cloudRoom || !cloudRoom.pin) {
          cloudRoom = fallbackRoom ? { ...fallbackRoom } : null;
        }
        if (!cloudRoom || !cloudRoom.pin) return;

        const isCloudUnlimited = isUnlimitedRoomDuration(
          cloudRoom.durationMinutes ?? fallbackRoom?.durationMinutes,
          cloudRoom.unlimitedTime ?? fallbackRoom?.unlimitedTime
        );
        if (isCloudUnlimited) {
          cloudRoom.durationMinutes = UNLIMITED_DURATION_MINUTES;
          cloudRoom.unlimitedTime = true;
          if (cloudRoom.status === 'FINISHED' && !cloudRoom.manuallyFinished && !cloudRoom.resultsReleased) {
            cloudRoom.status = cloudRoom.startedAt ? 'ACTIVE' : 'WAITING';
          }
        }

        const prevP = cloudRoom.participants?.[participant.id];
        if (cloudRoom.status === 'FINISHED' && !prevP) {
          return;
        }

        if (isInitialJoin && cloudRoom.status !== 'FINISHED') {
          cloudRoom.participants = {
            ...(cloudRoom.participants || {}),
            [participant.id]: {
              ...participant,
              answeredCount: 0,
              correctCount: 0,
              scorePercent: 0,
              grade10: 0,
              cheatCount: 0,
              isLocked: false,
              answers: {}
            }
          };
        } else {
          const maxCheat = Math.max(Number(prevP?.cheatCount || 0), Number(participant.cheatCount || 0));
          const maxUnlocked = Math.max(
            Number(prevP?.unlockedCheatCount || 0),
            Number(participant.unlockedCheatCount || 0)
          );
          const alreadyUnlocked = maxUnlocked >= maxCheat && maxUnlocked > 0;
          const isLocked =
            prevP?.status === 'DISQUALIFIED'
              ? true
              : alreadyUnlocked
              ? false
              : newAlert && cloudRoom.lockOnCheat
              ? true
              : participant.isLocked;
          const nextStatus =
            prevP?.status === 'DISQUALIFIED'
              ? 'DISQUALIFIED'
              : isLocked
              ? 'LOCKED_CHEAT'
              : participant.status === 'LOCKED_CHEAT'
              ? 'PLAYING'
              : participant.status;

          cloudRoom.participants = {
            ...(cloudRoom.participants || {}),
            [participant.id]: {
              ...prevP,
              ...participant,
              cheatCount: maxCheat,
              unlockedCheatCount: maxUnlocked,
              isLocked,
              status: nextStatus
            }
          };
        }

        if (newAlert) {
          const alertsList = Array.isArray(cloudRoom.alerts) ? cloudRoom.alerts : [];
          if (
            !alertsList.some(
              (a) =>
                a.id === newAlert.id ||
                (a.studentId === newAlert.studentId && a.violationNumber === newAlert.violationNumber)
            )
          ) {
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
    setStudentExamAlreadyClosed(false);
    studentExamAlreadyClosedRef.current = false;
    setIsConnectingRoom(true);
    setStudentCurrentQ(0);
    studentAnswersPinRef.current = cleanPin;
    studentAnswersRef.current = {};
    setStudentAnswers({});
    setStudentStartTime(null);
    setStudentRemainingSeconds(0);
    setStudentFinalTimeSpentSec(0);
    setStudentCheatCount(0);
    studentCheatCountRef.current = 0;
    studentUnlockedCheatCountRef.current = 0;
    studentLockedRef.current = false;
    setStudentLocked(false);
    setStudentWarningModal(null);
    studentPendingAlertsRef.current = [];
    studentGraceUntilRef.current = Date.now() + 3500;
    isStudentAwayRef.current = false;

    try {
      localStorage.setItem('dbv_exam_student_name', studentName.trim());
      localStorage.setItem('dbv_exam_student_unit', studentUnit.trim());
    } catch {}

    await requestExamFullscreen();

    let resolvedRoom: LiveExamRoomState | null = null;

    // 1. Tenta buscar estado imediato no servidor (/api/live-exam), nuvem Supabase (sem cache) ou localStorage
    try {
      const [apiRoom, cloudRoom] = await Promise.all([
        fetch(`/api/live-exam?pin=${cleanPin}&t=${Date.now()}`, { cache: 'no-store' })
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

    if (resolvedRoom) {
      const isResUnlimited = isUnlimitedRoomDuration(
        resolvedRoom.durationMinutes,
        resolvedRoom.unlimitedTime
      );
      if (isResUnlimited) {
        resolvedRoom = {
          ...resolvedRoom,
          durationMinutes: UNLIMITED_DURATION_MINUTES,
          unlimitedTime: true,
          status:
            resolvedRoom.status === 'FINISHED' &&
            !resolvedRoom.manuallyFinished &&
            !resolvedRoom.resultsReleased
              ? resolvedRoom.startedAt
                ? 'ACTIVE'
                : 'WAITING'
              : resolvedRoom.status
        };
      }

      // Se a prova já foi encerrada, verifica se este aluno já havia respondido a prova antes.
      // Caso NÃO tenha participado/respondido, mostra a tela de "Prova Encerrada" e NÃO adiciona seu nome à lista de participantes.
      if (resolvedRoom.status === 'FINISHED') {
        const existingMe =
          resolvedRoom.participants?.[studentId] ||
          Object.values(resolvedRoom.participants || {}).find(
            (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
          );
        const hasParticipatedWithAnswers = Boolean(
          existingMe &&
            (Number(existingMe.answeredCount || 0) > 0 ||
              Object.keys(existingMe.answers || {}).length > 0)
        );

        if (!hasParticipatedWithAnswers) {
          setStudentExamAlreadyClosed(true);
          studentExamAlreadyClosedRef.current = true;
          setStudentRoom(resolvedRoom);
          setIsConnectingRoom(false);
          setStudentPhase('FINISHED');
          return;
        }

        if (existingMe?.answers && Object.keys(existingMe.answers).length > 0) {
          studentAnswersPinRef.current = cleanPin;
          studentAnswersRef.current = existingMe.answers;
          setStudentAnswers(existingMe.answers);
        }
        if (existingMe?.timeSpentSeconds && existingMe.timeSpentSeconds > 0) {
          setStudentFinalTimeSpentSec(existingMe.timeSpentSeconds);
        }
        setStudentRoom(resolvedRoom);
        setIsConnectingRoom(false);
        setStudentPhase('FINISHED');
        return;
      }
    }

    const initialParticipant: LiveExamParticipant = {
      id: studentId,
      name: studentName.trim(),
      unit: studentUnit.trim() || 'Sem Unidade',
      status: resolvedRoom?.status === 'ACTIVE' ? 'PLAYING' : 'WAITING',
      joinedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      joinedAtMs: Date.now(),
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
        isInitialJoin: true,
        participant: initialParticipant
      })
    }).catch(() => {});

    syncStudentToCloudRoom(cleanPin, initialParticipant, undefined, resolvedRoom, true);

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
        const rawIncoming: LiveExamRoomState = payload.room;
        const isIncUnlimited = isUnlimitedRoomDuration(
          rawIncoming.durationMinutes,
          rawIncoming.unlimitedTime
        );
        const safeIncomingStatus: LiveExamRoomState['status'] =
          isIncUnlimited &&
          rawIncoming.status === 'FINISHED' &&
          !rawIncoming.manuallyFinished &&
          !rawIncoming.resultsReleased
            ? rawIncoming.startedAt
              ? 'ACTIVE'
              : 'WAITING'
            : rawIncoming.status;
        const incomingRoom: LiveExamRoomState = {
          ...rawIncoming,
          durationMinutes: isIncUnlimited ? UNLIMITED_DURATION_MINUTES : rawIncoming.durationMinutes,
          unlimitedTime: isIncUnlimited,
          status: safeIncomingStatus
        };
        didResolveFromHost = true;
        setStudentRoom(incomingRoom);
        setIsConnectingRoom(false);

        const myRecord =
          incomingRoom.participants?.[studentId] ||
          Object.values(incomingRoom.participants || {}).find(
            (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
          );

        const isRoomClosedForNewStudent =
          ((incomingRoom.status === 'FINISHED' &&
            (!isIncUnlimited || incomingRoom.manuallyFinished || incomingRoom.resultsReleased)) ||
            incomingRoom.resultsReleased) &&
          (!myRecord ||
            (Number(myRecord.answeredCount || 0) === 0 &&
              Object.keys(myRecord.answers || {}).length === 0)) &&
          Object.keys(studentAnswers).length === 0 &&
          !studentStartTime;

        if (isRoomClosedForNewStudent) {
          setStudentExamAlreadyClosed(true);
          studentExamAlreadyClosedRef.current = true;
          setStudentRoom(incomingRoom);
          setIsConnectingRoom(false);
          setStudentPhase('FINISHED');
          return;
        }

        if (myRecord) {
          const recCheat = Number(myRecord.cheatCount || 0);
          const recUnlocked = Number(myRecord.unlockedCheatCount || 0);
          if (recUnlocked > studentUnlockedCheatCountRef.current) {
            studentUnlockedCheatCountRef.current = recUnlocked;
          }
          if (recCheat > studentCheatCountRef.current) {
            studentCheatCountRef.current = recCheat;
            setStudentCheatCount(recCheat);
          }

          const isUnlockedByInstructor =
            (recUnlocked >= Math.max(recCheat, studentCheatCountRef.current) && recUnlocked > 0) ||
            (!myRecord.isLocked && recCheat >= studentCheatCountRef.current && recCheat > 0);

          if (myRecord.status === 'DISQUALIFIED') {
            studentLockedRef.current = true;
            setStudentLocked(true);
          } else if (isUnlockedByInstructor) {
            if (studentLockedRef.current) {
              studentGraceUntilRef.current = Date.now() + 3500;
              isStudentAwayRef.current = false;
            }
            studentUnlockedCheatCountRef.current = Math.max(
              studentUnlockedCheatCountRef.current,
              recUnlocked,
              recCheat,
              studentCheatCountRef.current
            );
            studentPendingAlertsRef.current = [];
            studentLockedRef.current = false;
            setStudentLocked(false);
            setStudentWarningModal(null);
          } else if (myRecord.isLocked && recCheat > studentUnlockedCheatCountRef.current) {
            studentLockedRef.current = true;
            setStudentLocked(true);
          }
        }

        if (incomingRoom.status === 'ACTIVE' && !incomingRoom.resultsReleased) {
          setStudentPhase((prev) => (prev === 'FINISHED' ? 'FINISHED' : 'PLAYING'));
          setStudentStartTime((prev) => prev || Date.now());
        } else if (
          (incomingRoom.status === 'FINISHED' &&
            (!isIncUnlimited || incomingRoom.manuallyFinished || incomingRoom.resultsReleased)) ||
          incomingRoom.resultsReleased
        ) {
          setStudentFinalTimeSpentSec((prev) => {
            if (prev > 0) return prev;
            const recSpent = myRecord?.timeSpentSeconds;
            if (recSpent && recSpent > 0) return recSpent;
            return computeSafeElapsedSeconds(studentStartTime, incomingRoom.startedAt);
          });
          setStudentPhase('FINISHED');
        } else {
          setStudentPhase((prev) => (prev === 'FINISHED' ? 'FINISHED' : 'WAITING_HOST'));
        }
      })
      .on('broadcast', { event: 'host:release_results' }, ({ payload }) => {
        if (!payload?.room) return;
        const releasedFlag =
          payload.resultsReleased !== undefined
            ? Boolean(payload.resultsReleased)
            : Boolean(payload.room.resultsReleased ?? true);
        const incomingRoom: LiveExamRoomState = {
          ...payload.room,
          resultsReleased: releasedFlag
        };
        didResolveFromHost = true;
        setStudentRoom(incomingRoom);
        setIsConnectingRoom(false);

        const myRecord =
          incomingRoom.participants?.[studentId] ||
          Object.values(incomingRoom.participants || {}).find(
            (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
          );
        if (myRecord?.timeSpentSeconds && myRecord.timeSpentSeconds > 0) {
          setStudentFinalTimeSpentSec((prev) => prev || myRecord.timeSpentSeconds || 1);
        }
        setStudentPhase('FINISHED');
        if (releasedFlag) {
          try {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([80, 50, 140]);
            }
          } catch {}
        }
      })
      .on('broadcast', { event: 'host:unlock_student' }, ({ payload }) => {
        if (payload?.studentId === studentId) {
          studentUnlockedCheatCountRef.current = Math.max(
            studentUnlockedCheatCountRef.current,
            Number(payload?.unlockedCheatCount || 0),
            studentCheatCountRef.current
          );
          studentGraceUntilRef.current = Date.now() + 3500;
          isStudentAwayRef.current = false;
          studentPendingAlertsRef.current = [];
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
    if (
      roleMode !== 'STUDENT' ||
      studentPhase === 'ENTER_PIN' ||
      studentExamAlreadyClosed ||
      !studentRoom?.pin
    )
      return;
    const pin = studentRoom.pin;

    const interval = setInterval(async () => {
      try {
        // 1. Primeiro busca o estado mais recente no servidor e nuvem (para detectar liberação do instrutor antes de enviar STUDENT_UPDATE)
        const [apiRoom, cloudRoom] = await Promise.all([
          fetch(`/api/live-exam?pin=${pin}&t=${Date.now()}`, { cache: 'no-store' })
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
          const isCloudNewer = Number(cloudRoom?.updatedAt || 0) >= Number(apiRoom?.updatedAt || 0);
          const localRoomUpdated = Number(studentRoomRef.current?.updatedAt || 0);
          const bestSrvUpdated = Math.max(
            Number(cloudRoom?.updatedAt || 0),
            Number(apiRoom?.updatedAt || 0),
            Number(baseSrv.updatedAt || 0)
          );
          const mergedResultsReleased =
            localRoomUpdated > bestSrvUpdated && typeof studentRoomRef.current?.resultsReleased === 'boolean'
              ? studentRoomRef.current.resultsReleased
              : isCloudNewer
              ? Boolean(cloudRoom?.resultsReleased ?? apiRoom?.resultsReleased ?? baseSrv.resultsReleased)
              : Boolean(apiRoom?.resultsReleased ?? cloudRoom?.resultsReleased ?? baseSrv.resultsReleased);
          const isSrvUnlimited = isUnlimitedRoomDuration(
            baseSrv.durationMinutes ??
              cloudRoom?.durationMinutes ??
              apiRoom?.durationMinutes ??
              studentRoomRef.current?.durationMinutes,
            baseSrv.unlimitedTime ??
              cloudRoom?.unlimitedTime ??
              apiRoom?.unlimitedTime ??
              studentRoomRef.current?.unlimitedTime
          );
          const isSrvManuallyFinished = Boolean(
            cloudRoom?.manuallyFinished ||
              apiRoom?.manuallyFinished ||
              baseSrv.manuallyFinished ||
              mergedResultsReleased
          );
          let mergedStatus: LiveExamRoomState['status'] =
            cloudRoom?.status === 'FINISHED' || apiRoom?.status === 'FINISHED' || baseSrv.status === 'FINISHED'
              ? 'FINISHED'
              : cloudRoom?.status === 'ACTIVE' || apiRoom?.status === 'ACTIVE' || baseSrv.status === 'ACTIVE'
              ? 'ACTIVE'
              : 'WAITING';
          if (isSrvUnlimited && mergedStatus === 'FINISHED' && !isSrvManuallyFinished) {
            mergedStatus =
              cloudRoom?.status === 'ACTIVE' ||
              apiRoom?.status === 'ACTIVE' ||
              baseSrv.status === 'ACTIVE' ||
              cloudRoom?.startedAt ||
              apiRoom?.startedAt ||
              baseSrv.startedAt
                ? 'ACTIVE'
                : 'WAITING';
          }
          const mergedExtraSeconds = Math.max(
            cloudRoom?.extraSecondsAdded || 0,
            apiRoom?.extraSecondsAdded || 0,
            baseSrv.extraSecondsAdded || 0
          );

          // Mescla o participante entre apiRoom e cloudRoom priorizando unlockedCheatCount monotônico
          // para que o arquivo da nuvem com atraso nunca re-bloqueie o aluno após o instrutor clicar em Liberar
          const apiMe = apiRoom?.participants?.[studentId];
          const cloudMe = cloudRoom?.participants?.[studentId];
          const mergedParticipants: Record<string, LiveExamParticipant> = {
            ...(cloudRoom?.participants || {}),
            ...(apiRoom?.participants || {})
          };

          if (apiMe || cloudMe) {
            const maxCheat = Math.max(Number(apiMe?.cheatCount || 0), Number(cloudMe?.cheatCount || 0));
            const maxUnlocked = Math.max(
              Number(apiMe?.unlockedCheatCount || 0),
              Number(cloudMe?.unlockedCheatCount || 0),
              studentUnlockedCheatCountRef.current
            );
            const isDisq = apiMe?.status === 'DISQUALIFIED' || cloudMe?.status === 'DISQUALIFIED';
            const unlockedByInstructor =
              (maxUnlocked >= maxCheat && maxUnlocked > 0) ||
              (apiMe && !apiMe.isLocked && Number(apiMe.cheatCount || 0) >= maxCheat && maxCheat > 0);
            const mergedLocked = isDisq
              ? true
              : unlockedByInstructor
              ? false
              : Boolean(apiMe?.isLocked ?? cloudMe?.isLocked);
            const baseMe = (apiMe || cloudMe)!;
            mergedParticipants[studentId] = {
              ...(cloudMe || {}),
              ...(apiMe || {}),
              cheatCount: maxCheat,
              unlockedCheatCount: unlockedByInstructor ? Math.max(maxUnlocked, maxCheat) : maxUnlocked,
              isLocked: mergedLocked,
              status: isDisq
                ? 'DISQUALIFIED'
                : mergedLocked
                ? 'LOCKED_CHEAT'
                : baseMe.status === 'LOCKED_CHEAT'
                ? 'PLAYING'
                : baseMe.status
            };
          }

          const srv: LiveExamRoomState = {
            ...baseSrv,
            durationMinutes: isSrvUnlimited ? UNLIMITED_DURATION_MINUTES : baseSrv.durationMinutes,
            unlimitedTime: isSrvUnlimited,
            manuallyFinished: isSrvManuallyFinished,
            status: mergedStatus,
            resultsReleased: mergedResultsReleased,
            extraSecondsAdded: mergedExtraSeconds,
            participants: mergedParticipants
          };

          setStudentRoom(srv);

          const me =
            srv.participants?.[studentId] ||
            Object.values(srv.participants || {}).find(
              (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
            );

          if (me) {
            const srvCheat = Number(me.cheatCount || 0);
            const srvUnlocked = Number(me.unlockedCheatCount || 0);
            if (srvUnlocked > studentUnlockedCheatCountRef.current) {
              studentUnlockedCheatCountRef.current = srvUnlocked;
            }
            if (srvCheat > studentCheatCountRef.current) {
              studentCheatCountRef.current = srvCheat;
              setStudentCheatCount(srvCheat);
            }

            const isNowUnlocked =
              (srvUnlocked >= Math.max(srvCheat, studentCheatCountRef.current) && srvUnlocked > 0) ||
              (!me.isLocked && srvCheat >= studentCheatCountRef.current && srvCheat > 0);

            if (me.status === 'DISQUALIFIED') {
              studentLockedRef.current = true;
              setStudentLocked(true);
            } else if (isNowUnlocked) {
              if (studentLockedRef.current) {
                studentGraceUntilRef.current = Date.now() + 3500;
                isStudentAwayRef.current = false;
              }
              studentUnlockedCheatCountRef.current = Math.max(
                studentUnlockedCheatCountRef.current,
                srvUnlocked,
                srvCheat,
                studentCheatCountRef.current
              );
              studentPendingAlertsRef.current = [];
              studentLockedRef.current = false;
              setStudentLocked(false);
              setStudentWarningModal(null);
            } else if (me.isLocked && srvCheat > studentUnlockedCheatCountRef.current) {
              studentLockedRef.current = true;
              setStudentLocked(true);
            }
          }

          // Confirma remoção de alertas pendentes que já constam no servidor
          if (studentPendingAlertsRef.current.length > 0 && Array.isArray(srv.alerts)) {
            studentPendingAlertsRef.current = studentPendingAlertsRef.current.filter(
              (pa) =>
                !srv.alerts.some(
                  (sa) =>
                    sa.id === pa.id ||
                    (sa.studentId === pa.studentId && sa.violationNumber === pa.violationNumber)
                )
            );
          }

          const latestPendingAlert =
            studentPendingAlertsRef.current[studentPendingAlertsRef.current.length - 1];
          const serverMissingCheat =
            studentCheatCountRef.current > Number(me?.cheatCount || 0) && Boolean(latestPendingAlert);

          const currentParticipant = buildCurrentParticipantPayload({
            status:
              studentPhase === 'FINISHED'
                ? 'FINISHED'
                : studentLockedRef.current
                ? 'LOCKED_CHEAT'
                : studentPhase === 'PLAYING'
                ? 'PLAYING'
                : 'WAITING'
          });

          if (serverMissingCheat && latestPendingAlert) {
            const cheatParticipantPayload = buildCurrentParticipantPayload({
              cheatCount: studentCheatCountRef.current,
              unlockedCheatCount: studentUnlockedCheatCountRef.current,
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
          } else {
            const alreadyFinishedOnServer =
              studentPhase === 'FINISHED' &&
              me?.status === 'FINISHED' &&
              (me?.answeredCount || 0) >= currentParticipant.answeredCount;

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

            if (!me || me.answeredCount < currentParticipant.answeredCount) {
              syncStudentToCloudRoom(pin, currentParticipant, undefined, srv);
            }
          }

          if (srv.status === 'ACTIVE' && !srv.resultsReleased && studentPhase === 'WAITING_HOST') {
            studentGraceUntilRef.current = Date.now() + 2500;
            isStudentAwayRef.current = false;
            setStudentPhase('PLAYING');
            setStudentStartTime((prev) => prev || Date.now());
          } else if (
            ((srv.status === 'FINISHED' && (!isSrvUnlimited || isSrvManuallyFinished)) ||
              srv.resultsReleased) &&
            studentPhase !== 'FINISHED'
          ) {
            setStudentFinalTimeSpentSec((prev) => {
              if (prev > 0) return prev;
              const recSpent = me?.timeSpentSeconds;
              if (recSpent && recSpent > 0) return recSpent;
              return computeSafeElapsedSeconds(studentStartTime, srv.startedAt);
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

    // Se essa violação já foi liberada pelo instrutor, limpa a fila e não reenvia bloqueio
    if (studentUnlockedCheatCountRef.current >= latestAlert.violationNumber) {
      studentPendingAlertsRef.current = [];
      return;
    }

    const updatedParticipant = buildCurrentParticipantPayload({
      cheatCount: studentCheatCountRef.current,
      unlockedCheatCount: studentUnlockedCheatCountRef.current,
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
    })
      .then((res) => {
        if (res.ok) {
          studentPendingAlertsRef.current = studentPendingAlertsRef.current.filter(
            (a) => a.id !== latestAlert.id
          );
        }
      })
      .catch(() => {});

    syncStudentToCloudRoom(activeStudentRoom.pin, updatedParticipant, latestAlert, activeStudentRoom);
  }, [buildCurrentParticipantPayload, syncStudentToCloudRoom]);

  const triggerStudentCheatViolation = useCallback(
    (reason: string) => {
      const currentRoom = studentRoomRef.current;
      const currentPhase = studentPhaseRef.current;
      // Só monitora saída quando a prova já começou (PLAYING)
      if (
        roleMode !== 'STUDENT' ||
        currentPhase !== 'PLAYING' ||
        !currentRoom ||
        currentRoom.status === 'FINISHED' ||
        isQrScannerOpen
      ) {
        return;
      }

      // Se a tela do aluno JÁ está bloqueada aguardando o instrutor liberar, não dispara novos alertas em cascata
      if (studentLockedRef.current) return;

      const now = Date.now();
      // Janela de graça após iniciar a prova ou após ser liberado pelo instrutor
      if (now < studentGraceUntilRef.current) return;

      // Garante que UMA única saída de tela gere apenas UM alerta (só reseta quando o aluno voltar à tela ativa e desbloqueada)
      if (isStudentAwayRef.current) return;
      if (now - lastCheatTimestampRef.current < 2500) return;

      isStudentAwayRef.current = true;
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

      // ID determinístico por aluno + número da violação para impedir duplicação no painel do instrutor
      const alertEvent: LiveExamCheatAlert = {
        id: `alert_${studentId}_v${nextCount}`,
        studentId,
        studentName: studentName.trim() || 'Aluno',
        studentUnit: studentUnit.trim() || 'Sem Unidade',
        reason,
        timestamp: timeStr,
        violationNumber: nextCount
      };

      if (!studentPendingAlertsRef.current.some((a) => a.id === alertEvent.id)) {
        studentPendingAlertsRef.current = [...studentPendingAlertsRef.current, alertEvent];
      }

      const updatedParticipant = buildCurrentParticipantPayload({
        cheatCount: nextCount,
        unlockedCheatCount: studentUnlockedCheatCountRef.current,
        lastCheatReason: reason,
        lastCheatTime: timeStr,
        isLocked: shouldLock,
        status: shouldLock ? 'LOCKED_CHEAT' : 'PLAYING'
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
      })
        .then((res) => {
          if (res.ok) {
            studentPendingAlertsRef.current = studentPendingAlertsRef.current.filter(
              (a) => a.id !== alertEvent.id
            );
          }
        })
        .catch(() => {});

      // 3. Sincronização na nuvem respeitando merge
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
    if (roleMode !== 'STUDENT' || studentPhase !== 'PLAYING' || !studentRoom) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        triggerStudentCheatViolation('Mudou de janela ou minimizou o aplicativo no celular');
      } else {
        // Quando o aluno volta para a tela e não está bloqueado, libera o detector para uma eventual próxima saída futura
        if (!studentLockedRef.current) {
          isStudentAwayRef.current = false;
        }
        flushPendingStudentCheatAlerts();
        if (studentPhaseRef.current === 'PLAYING') {
          acquireExamWakeLock();
        }
      }
    };

    const handlePageHide = () => {
      triggerStudentCheatViolation('Saiu da tela da prova ou alternou de aplicativo');
    };

    const handleWindowBlur = () => {
      // Aguarda 180ms para verificar se realmente perdeu foco/visibilidade (evita falsos disparos de clique ou teclado no celular)
      setTimeout(() => {
        if (
          studentPhaseRef.current === 'PLAYING' &&
          !studentLockedRef.current &&
          !isStudentAwayRef.current &&
          (document.hidden || document.visibilityState === 'hidden' || !document.hasFocus())
        ) {
          triggerStudentCheatViolation('Mudou de janela, abriu outro app ou barra do sistema');
        }
      }, 180);
    };

    const handleWindowFocus = () => {
      if (!studentLockedRef.current && !document.hidden && document.visibilityState === 'visible') {
        isStudentAwayRef.current = false;
      }
      flushPendingStudentCheatAlerts();
      if (studentPhaseRef.current === 'PLAYING') {
        acquireExamWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handleWindowFocus);
    };
  }, [roleMode, studentPhase, studentRoom, triggerStudentCheatViolation, flushPendingStudentCheatAlerts]);

  const computeSafeElapsedSeconds = useCallback(
    (localStart?: number | null, roomStart?: number | null): number => {
      const now = Date.now();
      const sLocal = Number(localStart || 0);
      const sRoom = Number(roomStart || 0);
      const validLocal = sLocal > 1700000000000 && sLocal <= now + 60000 ? sLocal : 0;
      const validRoom = sRoom > 1700000000000 && sRoom <= now + 60000 ? sRoom : 0;
      const base = validLocal || validRoom || now;
      const diffSec = Math.max(1, Math.floor((now - base) / 1000));
      return diffSec > 18000 ? 1 : diffSec;
    },
    []
  );

  // Cronômetro regressivo do Aluno durante a Prova
  const handleStudentSubmitExam = useCallback(() => {
    if (!studentRoom) return;
    const spent = computeSafeElapsedSeconds(studentStartTime, studentRoom.startedAt);
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

  // Helper para mesclar e salvar o Histórico de Provas Feitas pelo usuário logado (LocalStorage + Nuvem Supabase)
  const studentHistoryCandidateKeys = useMemo<string[]>(() => {
    const normalizeKey = (val?: string | null) => {
      const raw = String(val || '').trim().toLowerCase();
      if (!raw || raw === 'email@exemplo.com') return '';
      return raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    };
    const keys = new Set<string>();
    [
      instructorKey,
      normalizeKey(instructorIdentity.email),
      normalizeKey(instructorIdentity.name),
      normalizeKey(currentUserEmail),
      normalizeKey(currentUserName)
    ].forEach((k) => {
      if (k) keys.add(k);
    });
    try {
      const savedProfile = localStorage.getItem('dbv_tudo_global_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        [
          normalizeKey(parsed?.email),
          normalizeKey(parsed?.name),
          normalizeKey(parsed?.nome)
        ].forEach((k) => {
          if (k) keys.add(k);
        });
      }
    } catch {}
    return Array.from(keys);
  }, [
    instructorKey,
    instructorIdentity.email,
    instructorIdentity.name,
    currentUserEmail,
    currentUserName
  ]);

  const studentHistoryCandidateKeysRef = useRef<string[]>(studentHistoryCandidateKeys);
  studentHistoryCandidateKeysRef.current = studentHistoryCandidateKeys;

  // Normaliza nomes da conta logada para distinguir provas feitas pelo próprio usuário vs provas respondidas por outras pessoas
  const getLoggedInAccountNormNames = useCallback((): Set<string> => {
    const norm = (s?: string | null) =>
      String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    const set = new Set<string>();
    [instructorIdentityRef.current.name, currentUserName].forEach((n) => {
      const v = norm(n);
      if (v) set.add(v);
    });
    try {
      const savedProfile = localStorage.getItem('dbv_tudo_global_user_profile');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        [parsed?.name, parsed?.nome].forEach((n) => {
          const v = norm(n);
          if (v) set.add(v);
        });
      }
    } catch {}
    return set;
  }, [currentUserName]);

  // Verifica se um registro do histórico pertence na verdade a uma Prova Aplicada (criada pelo usuário ou respondida por outra pessoa)
  const isEntryForAppliedExams = useCallback(
    (entry?: Partial<LiveExamStudentHistoryEntry> | null): boolean => {
      if (!entry || !entry.pin) return false;
      const pinStr = String(entry.pin);
      const specLower = String(entry.specialtyName || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      // Prova de Fisiologia Vegetal criada pelo usuário e respondida por outra pessoa
      if (specLower.includes('fisiologia vegetal')) {
        return true;
      }

      // Se o PIN pertence a uma sala criada/aberta/aplicada pelo instrutor
      const isCreatedByMe =
        hostRoomsRef.current.some((r) => String(r.pin) === pinStr) ||
        appliedExamsHistoryRef.current.some((r) => String(r.pin) === pinStr) ||
        closedRoomPinsRef.current.has(pinStr) ||
        Boolean((entry as any).creatorKey && (entry as any).creatorKey === instructorKeyRef.current);

      const accountNames = getLoggedInAccountNormNames();
      const entryStudentNorm = String(entry.studentName || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

      if (accountNames.size > 0 && entryStudentNorm) {
        const matchesMyName = Array.from(accountNames).some(
          (accName) =>
            accName === entryStudentNorm ||
            accName.includes(entryStudentNorm) ||
            entryStudentNorm.includes(accName)
        );
        if (!matchesMyName) {
          return true;
        }
      }

      if (isCreatedByMe) {
        return true;
      }

      return false;
    },
    [getLoggedInAccountNormNames]
  );

  // Converte um registro de resposta de aluno em objeto de Sala Aplicada para preservar respostas em "Provas Aplicadas"
  const convertHistoryEntryToAppliedRoom = useCallback(
    (entry: LiveExamStudentHistoryEntry): LiveExamRoomState => {
      const pId = entry.id || `stu_${entry.pin}_${(entry.studentName || 'aluno').replace(/\s+/g, '_')}`;
      const participant: LiveExamParticipant = {
        id: pId,
        name: entry.studentName || 'Participante',
        unit: entry.studentUnit || 'Geral',
        status: 'FINISHED',
        joinedAt: entry.dateStr || '',
        currentQuestionIdx: Math.max(0, (entry.totalQuestions || 1) - 1),
        answeredCount: entry.answeredCount || Object.keys(entry.answers || {}).length || entry.totalQuestions || 0,
        correctCount: entry.correctCount || 0,
        scorePercent: entry.scorePercent || 0,
        grade10: entry.grade10 || 0,
        cheatCount: entry.cheatCount || 0,
        isLocked: false,
        answers: entry.answers || {},
        finishedAt: entry.dateStr || '',
        timeSpentSeconds: entry.timeSpentSeconds || 1
      };
      return {
        pin: String(entry.pin),
        club: entry.club || club,
        specialtyId: entry.specialtyId || 0,
        specialtyName: entry.specialtyName || 'Prova Aplicada',
        specialtyArea: entry.specialtyArea || 'Especialidades',
        specialtyLogo: entry.specialtyLogo || '',
        specialtyCode: entry.specialtyCode || 'PROVA',
        durationMinutes: 15,
        passingScorePercent: entry.passingScorePercent || 70,
        lockOnCheat: true,
        status: 'FINISHED',
        resultsReleased: Boolean(entry.resultsReleased ?? true),
        startedAt: entry.completedAt || Date.now(),
        extraSecondsAdded: 0,
        questions: entry.questions || [],
        participants: { [pId]: participant },
        alerts: [],
        updatedAt: entry.completedAt || Date.now(),
        creatorKey: instructorKeyRef.current || undefined,
        creatorEmail: instructorIdentityRef.current.email || undefined,
        creatorName: instructorIdentityRef.current.name || undefined
      };
    },
    [club]
  );

  // Salva e sincroniza a lista de "Provas Aplicadas" (criadas pelo instrutor)
  const persistAppliedExamsList = useCallback(
    (roomsList: LiveExamRoomState[], syncToCloud = true) => {
      const deletedSet = deletedAppliedExamPinsRef.current;
      const byPin = new Map<string, LiveExamRoomState>();

      roomsList.forEach((rm) => {
        if (!rm || !rm.pin || deletedSet.has(String(rm.pin))) return;
        const pinKey = String(rm.pin);
        const prev = byPin.get(pinKey);
        if (!prev) {
          byPin.set(pinKey, rm);
        } else {
          // Mescla participantes pelo id ou pelo nome normalizado para não duplicar o mesmo aluno
          const mergedParticipants: Record<string, LiveExamParticipant> = {
            ...(prev.participants || {})
          };
          Object.values(rm.participants || {}).forEach((incP) => {
            if (!incP) return;
            const normIncName = String(incP.name || '').trim().toLowerCase();
            const existingKey =
              mergedParticipants[incP.id]
                ? incP.id
                : Object.keys(mergedParticipants).find(
                    (k) => String(mergedParticipants[k]?.name || '').trim().toLowerCase() === normIncName
                  ) || incP.id;
            const exP = mergedParticipants[existingKey];
            if (!exP) {
              mergedParticipants[existingKey] = incP;
            } else {
              const incAnsLen = Object.keys(incP.answers || {}).length;
              const exAnsLen = Object.keys(exP.answers || {}).length;
              mergedParticipants[existingKey] = {
                ...exP,
                ...incP,
                id: existingKey,
                answeredCount: Math.max(Number(exP.answeredCount || 0), Number(incP.answeredCount || 0), incAnsLen, exAnsLen),
                correctCount: incAnsLen >= exAnsLen ? incP.correctCount ?? exP.correctCount : exP.correctCount ?? incP.correctCount,
                scorePercent: incAnsLen >= exAnsLen ? incP.scorePercent ?? exP.scorePercent : exP.scorePercent ?? incP.scorePercent,
                grade10: incAnsLen >= exAnsLen ? incP.grade10 ?? exP.grade10 : exP.grade10 ?? incP.grade10,
                cheatCount: Math.max(Number(exP.cheatCount || 0), Number(incP.cheatCount || 0)),
                answers: incAnsLen >= exAnsLen ? incP.answers || exP.answers || {} : exP.answers || incP.answers || {}
              };
            }
          });

          const newer = (rm.updatedAt || 0) >= (prev.updatedAt || 0) ? rm : prev;
          const older = newer === rm ? prev : rm;
          const nextResultsReleased =
            newer.resultsReleased !== undefined
              ? Boolean(newer.resultsReleased)
              : Boolean(older.resultsReleased);
          const isUnlimited = isUnlimitedRoomDuration(
            newer.durationMinutes ?? older.durationMinutes,
            newer.unlimitedTime ?? older.unlimitedTime
          );
          const manuallyFinished = Boolean(
            prev.manuallyFinished || rm.manuallyFinished || nextResultsReleased
          );
          let nextStatus: LiveExamRoomState['status'] =
            prev.status === 'FINISHED' || rm.status === 'FINISHED'
              ? 'FINISHED'
              : prev.status === 'ACTIVE' || rm.status === 'ACTIVE'
              ? 'ACTIVE'
              : newer.status || 'WAITING';
          if (isUnlimited && nextStatus === 'FINISHED' && !manuallyFinished) {
            nextStatus =
              prev.status === 'ACTIVE' || rm.status === 'ACTIVE' || prev.startedAt || rm.startedAt
                ? 'ACTIVE'
                : 'WAITING';
          }
          byPin.set(pinKey, {
            ...older,
            ...newer,
            durationMinutes: isUnlimited ? UNLIMITED_DURATION_MINUTES : newer.durationMinutes ?? older.durationMinutes,
            unlimitedTime: isUnlimited,
            manuallyFinished,
            status: nextStatus,
            resultsReleased: nextResultsReleased,
            questions:
              newer.questions && newer.questions.length > 0
                ? newer.questions
                : older.questions || [],
            participants: mergedParticipants,
            updatedAt: Math.max(Number(prev.updatedAt || 0), Number(rm.updatedAt || 0))
          });
        }
      });

      const sorted = Array.from(byPin.values()).sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
      );

      appliedExamsHistoryRef.current = sorted;
      setAppliedExamsHistory(sorted);
      setSelectedAppliedExam((prevSel) =>
        prevSel ? sorted.find((r) => String(r.pin) === String(prevSel.pin)) || null : null
      );

      const candidateKeys =
        studentHistoryCandidateKeysRef.current.length > 0
          ? studentHistoryCandidateKeysRef.current
          : instructorKeyRef.current
          ? [instructorKeyRef.current]
          : [];

      try {
        const jsonStr = JSON.stringify(sorted);
        localStorage.setItem('dbv_applied_exams_history_global', jsonStr);
        candidateKeys.forEach((k) => {
          localStorage.setItem(`dbv_applied_exams_history_${k}`, jsonStr);
        });
      } catch {}

      if (syncToCloud && candidateKeys.length > 0) {
        candidateKeys.forEach((k) => {
          supabaseQfpy.storage
            .from('App DBV Tudo')
            .upload(
              `provas/applied_exams_${k}.json`,
              JSON.stringify({
                userKey: k,
                updatedAt: Date.now(),
                deletedPins: Array.from(deletedSet),
                rooms: sorted
              }),
              {
                upsert: true,
                contentType: 'application/json',
                cacheControl: '0'
              }
            )
            .catch(() => {});
        });
      }
    },
    []
  );

  // Sincroniza automaticamente todas as salas criadas em hostRooms para "Provas Aplicadas"
  useEffect(() => {
    if (hostRooms.length === 0) return;
    const validHostRooms = hostRooms.filter(
      (r) => r && r.pin && !deletedAppliedExamPinsRef.current.has(String(r.pin))
    );
    if (validHostRooms.length > 0) {
      persistAppliedExamsList([...validHostRooms, ...appliedExamsHistoryRef.current], true);
    }
  }, [hostRooms, persistAppliedExamsList]);

  const persistStudentHistoryList = useCallback(
    (entries: LiveExamStudentHistoryEntry[], syncToCloud = true) => {
      const deletedHistorySet = deletedStudentHistoryPinsRef.current;
      const isFullyAnswered = (entry?: Partial<LiveExamStudentHistoryEntry> | null): boolean => {
        if (!entry || !entry.pin || deletedHistorySet.has(String(entry.pin))) return false;
        const totalQ = Number(
          entry.totalQuestions || (Array.isArray(entry.questions) ? entry.questions.length : 0) || 0
        );
        if (totalQ <= 0) return false;
        const ansFromMap =
          entry.answers && typeof entry.answers === 'object' ? Object.keys(entry.answers).length : 0;
        const ansCount = Math.max(Number(entry.answeredCount || 0), ansFromMap);
        return ansCount >= totalQ;
      };

      const rescuedAppliedRooms: LiveExamRoomState[] = [];
      const byPin = new Map<string, LiveExamStudentHistoryEntry>();

      entries.forEach((item) => {
        if (!isFullyAnswered(item)) return;

        // Se a prova foi criada pelo usuário ou respondida por outra pessoa (ex: Fisiologia Vegetal),
        // move automaticamente para "Provas Aplicadas" e não deixa em "Minhas Provas Feitas"!
        if (isEntryForAppliedExams(item)) {
          if (!deletedAppliedExamPinsRef.current.has(String(item.pin))) {
            rescuedAppliedRooms.push(convertHistoryEntryToAppliedRoom(item));
          }
          return;
        }

        const prev = byPin.get(String(item.pin));
        if (!prev) {
          byPin.set(String(item.pin), item);
        } else {
          const newer = (item.completedAt || 0) >= (prev.completedAt || 0) ? item : prev;
          const older = newer === item ? prev : item;
          const mergedReleased =
            newer.resultsReleased !== undefined
              ? Boolean(newer.resultsReleased)
              : Boolean(older.resultsReleased);
          byPin.set(String(item.pin), {
            ...older,
            ...newer,
            resultsReleased: mergedReleased,
            cheatCount: Math.max(Number(prev.cheatCount || 0), Number(item.cheatCount || 0)),
            answeredCount: Math.max(Number(prev.answeredCount || 0), Number(item.answeredCount || 0)),
            questions:
              newer.questions && newer.questions.length > 0
                ? newer.questions
                : older.questions || [],
            answers:
              newer.answers && Object.keys(newer.answers).length >= Object.keys(older.answers || {}).length
                ? newer.answers
                : older.answers || {}
          });
        }
      });

      if (rescuedAppliedRooms.length > 0) {
        persistAppliedExamsList([...rescuedAppliedRooms, ...appliedExamsHistoryRef.current], true);
      }

      const sorted = Array.from(byPin.values()).sort(
        (a, b) => (b.completedAt || 0) - (a.completedAt || 0)
      );

      setStudentExamHistory(sorted);
      setSelectedHistoryExam((prevSel) =>
        prevSel ? sorted.find((s) => String(s.pin) === String(prevSel.pin)) || null : null
      );

      const candidateKeys =
        studentHistoryCandidateKeysRef.current.length > 0
          ? studentHistoryCandidateKeysRef.current
          : instructorKeyRef.current
          ? [instructorKeyRef.current]
          : [];

      try {
        const jsonStr = JSON.stringify(sorted);
        localStorage.setItem('dbv_student_exam_history_global', jsonStr);
        candidateKeys.forEach((k) => {
          localStorage.setItem(`dbv_student_exam_history_${k}`, jsonStr);
        });
      } catch {}

      if (syncToCloud && candidateKeys.length > 0) {
        fetch('/api/live-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SYNC_STUDENT_HISTORY',
            payload: {
              keys: candidateKeys,
              entries: sorted,
              replace: true,
              deletedPins: Array.from(deletedHistorySet)
            }
          })
        }).catch(() => {});

        candidateKeys.forEach((k) => {
          supabaseQfpy.storage
            .from('App DBV Tudo')
            .upload(
              `provas/student_history_${k}.json`,
              JSON.stringify({
                userKey: k,
                updatedAt: Date.now(),
                deletedPins: Array.from(deletedHistorySet),
                entries: sorted
              }),
              {
                upsert: true,
                contentType: 'application/json',
                cacheControl: '0'
              }
            )
            .catch(() => {});
        });
      }
    },
    [isEntryForAppliedExams, convertHistoryEntryToAppliedRoom, persistAppliedExamsList]
  );

  // Exclui uma Prova Aplicada (remove da lista de Provas Aplicadas, fecha sala se estiver aberta e impede reimportação)
  const handleDeleteAppliedExam = useCallback(
    (pinToDelete: string) => {
      const cleanPin = String(pinToDelete || '').trim();
      if (!cleanPin) return;

      const nextDeleted = Array.from(new Set([...deletedAppliedExamPinsRef.current, cleanPin]));
      deletedAppliedExamPinsRef.current = new Set(nextDeleted);
      setDeletedAppliedExamPins(nextDeleted);

      const candidateKeys =
        studentHistoryCandidateKeysRef.current.length > 0
          ? studentHistoryCandidateKeysRef.current
          : instructorKeyRef.current
          ? [instructorKeyRef.current]
          : [];

      try {
        const delStr = JSON.stringify(nextDeleted);
        localStorage.setItem('dbv_deleted_applied_exams_global', delStr);
        candidateKeys.forEach((k) => {
          localStorage.setItem(`dbv_deleted_applied_exams_${k}`, delStr);
        });
      } catch {}

      // Se a sala estiver aberta em hostRooms, fecha também
      if (hostRoomsRef.current.some((r) => String(r.pin) === cleanPin)) {
        persistHostRoom(null, { closePin: cleanPin });
      }
      if (String(studentRoomRef.current?.pin) === cleanPin || studentAnswersPinRef.current === cleanPin) {
        resetStudentExamSessionState('');
      }

      const remaining = appliedExamsHistoryRef.current.filter((r) => String(r.pin) !== cleanPin);
      persistAppliedExamsList(remaining, true);

      fetch('/api/live-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_APPLIED_EXAM',
          pin: cleanPin,
          instructorKey: instructorKeyRef.current
        })
      }).catch(() => {});

      setConfirmDeleteAppliedPin(null);
      if (selectedAppliedExam?.pin === cleanPin) {
        setSelectedAppliedExam(null);
        setInspectingAppliedStudent(null);
      }
    },
    [persistAppliedExamsList, persistHostRoom, selectedAppliedExam]
  );

  // Exclui um item de "Meu Histórico de Provas Feitas"
  const handleDeleteStudentHistoryEntry = useCallback(
    (pinToDelete: string) => {
      const cleanPin = String(pinToDelete || '').trim();
      if (!cleanPin) return;

      const nextDeleted = Array.from(new Set([...deletedStudentHistoryPinsRef.current, cleanPin]));
      deletedStudentHistoryPinsRef.current = new Set(nextDeleted);
      setDeletedStudentHistoryPins(nextDeleted);

      const candidateKeys =
        studentHistoryCandidateKeysRef.current.length > 0
          ? studentHistoryCandidateKeysRef.current
          : instructorKeyRef.current
          ? [instructorKeyRef.current]
          : [];

      try {
        const delStr = JSON.stringify(nextDeleted);
        localStorage.setItem('dbv_deleted_student_history_global', delStr);
        candidateKeys.forEach((k) => {
          localStorage.setItem(`dbv_deleted_student_history_${k}`, delStr);
        });
      } catch {}

      const remaining = studentExamHistory.filter((item) => String(item.pin) !== cleanPin);
      persistStudentHistoryList(remaining, true);

      if (String(studentRoomRef.current?.pin) === cleanPin || studentAnswersPinRef.current === cleanPin) {
        resetStudentExamSessionState('');
      }

      setConfirmDeleteHistoryPin(null);
      if (selectedHistoryExam?.pin === cleanPin) {
        setSelectedHistoryExam(null);
      }
    },
    [studentExamHistory, persistStudentHistoryList, selectedHistoryExam]
  );

  // Carrega o histórico de provas feitas e provas aplicadas do usuário logado da nuvem/servidor (sincronizando Celular e PC)
  useEffect(() => {
    if (!isLoggedInUser) return;
    let cancelled = false;

    const loadHistory = async () => {
      const candidateKeys =
        studentHistoryCandidateKeys.length > 0
          ? studentHistoryCandidateKeys
          : instructorKey
          ? [instructorKey]
          : [];

      // 1. Carrega Provas Aplicadas da nuvem e sincroniza salas abertas
      try {
        const cloudAppliedResults = await Promise.all(
          candidateKeys.map((k) =>
            downloadCloudExamJson<{ rooms?: LiveExamRoomState[]; deletedPins?: string[] }>(
              `provas/applied_exams_${k}.json`
            ).catch(() => null)
          )
        );
        if (!cancelled) {
          const cloudDeletedApplied: string[] = [];
          const cloudAppliedRooms: LiveExamRoomState[] = [];
          cloudAppliedResults.forEach((res) => {
            if (Array.isArray(res?.deletedPins)) {
              cloudDeletedApplied.push(...res.deletedPins.map(String));
            }
            if (Array.isArray(res?.rooms)) {
              cloudAppliedRooms.push(...res.rooms);
            }
          });
          if (cloudDeletedApplied.length > 0) {
            const mergedDel = Array.from(
              new Set([...deletedAppliedExamPinsRef.current, ...cloudDeletedApplied])
            );
            deletedAppliedExamPinsRef.current = new Set(mergedDel);
            setDeletedAppliedExamPins(mergedDel);
          }
          if (cloudAppliedRooms.length > 0 || hostRooms.length > 0) {
            persistAppliedExamsList(
              [...hostRooms, ...appliedExamsHistoryRef.current, ...cloudAppliedRooms],
              false
            );
          }
        }
      } catch {}

      let localEntries: LiveExamStudentHistoryEntry[] = [];
      try {
        const localRawList: string[] = [];
        const rawGlobal = localStorage.getItem('dbv_student_exam_history_global');
        if (rawGlobal) localRawList.push(rawGlobal);
        candidateKeys.forEach((k) => {
          const rk = localStorage.getItem(`dbv_student_exam_history_${k}`);
          if (rk) localRawList.push(rk);
        });
        localRawList.forEach((rawStr) => {
          try {
            const parsed = JSON.parse(rawStr);
            if (Array.isArray(parsed)) {
              localEntries.push(...parsed);
            }
          } catch {}
        });
      } catch {}

      let apiEntries: LiveExamStudentHistoryEntry[] = [];
      if (candidateKeys.length > 0) {
        try {
          const res = await fetch(
            `/api/live-exam?studentHistoryKeys=${encodeURIComponent(candidateKeys.join(','))}&t=${Date.now()}`,
            { cache: 'no-store' }
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.entries)) {
              apiEntries = data.entries;
            }
          }
        } catch {}
      }

      let cloudEntries: LiveExamStudentHistoryEntry[] = [];
      if (candidateKeys.length > 0) {
        try {
          const results = await Promise.all(
            candidateKeys.map((k) =>
              downloadCloudExamJson<{
                entries?: LiveExamStudentHistoryEntry[];
                deletedPins?: string[];
              }>(`provas/student_history_${k}.json`).catch(() => null)
            )
          );
          results.forEach((cloudData) => {
            if (Array.isArray(cloudData?.deletedPins)) {
              cloudData.deletedPins.forEach((dp) =>
                deletedStudentHistoryPinsRef.current.add(String(dp))
              );
            }
            if (cloudData && Array.isArray(cloudData.entries)) {
              cloudEntries.push(...cloudData.entries);
            }
          });
        } catch {}
      }

      if (cancelled) return;
      const mergedInitial = [...localEntries, ...apiEntries, ...cloudEntries];
      const hadEntriesToCleanOrMigrate = mergedInitial.some((entry) => {
        if (!entry || !entry.pin) return false;
        if (deletedStudentHistoryPinsRef.current.has(String(entry.pin))) return true;
        if (isEntryForAppliedExams(entry)) return true;
        const totalQ = Number(
          entry.totalQuestions || (Array.isArray(entry.questions) ? entry.questions.length : 0) || 0
        );
        const ansFromMap =
          entry.answers && typeof entry.answers === 'object' ? Object.keys(entry.answers).length : 0;
        const ansCount = Math.max(Number(entry.answeredCount || 0), ansFromMap);
        return totalQ <= 0 || ansCount < totalQ;
      });
      if (mergedInitial.length > 0 || hadEntriesToCleanOrMigrate) {
        const shouldPushSync =
          hadEntriesToCleanOrMigrate ||
          (localEntries.length > 0 && (apiEntries.length === 0 || cloudEntries.length === 0));
        persistStudentHistoryList(mergedInitial, shouldPushSync);
      }

      // Verifica se alguma prova do histórico pessoal teve o resultado liberado ou retirado pelo instrutor
      const byPinMap = new Map<string, LiveExamStudentHistoryEntry>();
      mergedInitial.forEach((e) => {
        if (!e?.pin || deletedStudentHistoryPinsRef.current.has(String(e.pin))) return;
        if (isEntryForAppliedExams(e)) return;
        const totalQ = Number(
          e.totalQuestions || (Array.isArray(e.questions) ? e.questions.length : 0) || 0
        );
        const ansFromMap =
          e.answers && typeof e.answers === 'object' ? Object.keys(e.answers).length : 0;
        const ansCount = Math.max(Number(e.answeredCount || 0), ansFromMap);
        if (totalQ > 0 && ansCount >= totalQ) {
          byPinMap.set(String(e.pin), e);
        }
      });
      const entriesToCheck = Array.from(byPinMap.values());
      if (entriesToCheck.length === 0) return;

      let updatedAny = false;
      const updatedList = Array.from(byPinMap.values());

      for (const pending of entriesToCheck) {
        try {
          const [apiRoom, cloudRoom] = await Promise.all([
            fetch(`/api/live-exam?pin=${pending.pin}&t=${Date.now()}`, { cache: 'no-store' })
              .then((r) => (r.ok ? r.json() : null))
              .then((d) => (d?.room ? (d.room as LiveExamRoomState) : null))
              .catch(() => null),
            downloadCloudExamJson<LiveExamRoomState>(`provas/room_${pending.pin}.json`)
          ]);
          const roomData =
            apiRoom && cloudRoom
              ? (cloudRoom.updatedAt || 0) >= (apiRoom.updatedAt || 0)
                ? cloudRoom
                : apiRoom
              : cloudRoom || apiRoom;
          if (roomData) {
            const released = Boolean(roomData.resultsReleased);
            if (released !== Boolean(pending.resultsReleased)) {
              updatedAny = true;
              const idx = updatedList.findIndex((item) => String(item.pin) === String(pending.pin));
              if (idx >= 0) {
                const myP: any =
                  roomData.participants?.[studentId] ||
                  Object.values(roomData.participants || {}).find(
                    (p: any) =>
                      p.name?.trim().toLowerCase() ===
                      (pending.studentName || studentName || '').trim().toLowerCase()
                  );
                updatedList[idx] = {
                  ...updatedList[idx],
                  resultsReleased: released,
                  completedAt: Date.now(),
                  grade10: myP?.grade10 ?? updatedList[idx].grade10,
                  scorePercent: myP?.scorePercent ?? updatedList[idx].scorePercent,
                  correctCount: myP?.correctCount ?? updatedList[idx].correctCount,
                  cheatCount: Math.max(updatedList[idx].cheatCount || 0, Number(myP?.cheatCount || 0)),
                  questions: roomData.questions || updatedList[idx].questions,
                  answers:
                    myP?.answers && Object.keys(myP.answers).length > 0
                      ? myP.answers
                      : updatedList[idx].answers
                };
              }
            }
          }
        } catch {}
      }

      if (!cancelled && updatedAny) {
        persistStudentHistoryList(updatedList, true);
      }
    };

    loadHistory();
    const syncInterval = setInterval(loadHistory, 6000);
    return () => {
      cancelled = true;
      clearInterval(syncInterval);
    };
  }, [
    isLoggedInUser,
    instructorKey,
    studentHistoryCandidateKeys,
    instructorIdentity.name,
    currentUserName,
    studentId,
    studentName,
    hostRooms,
    club,
    isEntryForAppliedExams,
    persistAppliedExamsList,
    persistStudentHistoryList
  ]);

  // Salva/atualiza automaticamente a prova no histórico do usuário logado quando a prova é finalizada ou quando o instrutor libera o resultado
  useEffect(() => {
    if (
      !isLoggedInUser ||
      studentPhase !== 'FINISHED' ||
      studentExamAlreadyClosed ||
      !studentRoom?.pin
    )
      return;

    const mySrvRecord =
      studentRoom.participants?.[studentId] ||
      Object.values(studentRoom.participants || {}).find(
        (p) => p.name?.trim().toLowerCase() === studentName.trim().toLowerCase()
      );
    const effectiveAns =
      Object.keys(studentAnswers).length > 0
        ? studentAnswers
        : mySrvRecord?.answers && Object.keys(mySrvRecord.answers).length > 0
        ? mySrvRecord.answers
        : studentAnswers;
    const effectiveCheat = Math.max(
      studentCheatCount,
      studentCheatCountRef.current,
      Number(mySrvRecord?.cheatCount || 0)
    );
    const payload = buildCurrentParticipantPayload(
      { cheatCount: effectiveCheat },
      effectiveAns,
      studentRoom
    );
    const spentSec =
      studentFinalTimeSpentSec || mySrvRecord?.timeSpentSeconds || 1;

    const totalQuestions = studentRoom.questions?.length || 0;
    const answeredCount = Math.max(
      Number(payload.answeredCount || 0),
      Object.keys(effectiveAns || {}).length
    );
    // Só adiciona ao histórico de provas feitas se todas as questões da prova foram respondidas
    if (totalQuestions <= 0 || answeredCount < totalQuestions) return;

    const nowDate = new Date();
    const dateStr = `${nowDate.toLocaleDateString('pt-BR')} às ${nowDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;

    const newEntry: LiveExamStudentHistoryEntry = {
      id: `hist_${studentRoom.pin}_${studentId}`,
      pin: String(studentRoom.pin),
      club: studentRoom.club || club,
      specialtyId: studentRoom.specialtyId,
      specialtyName: studentRoom.specialtyName,
      specialtyArea: studentRoom.specialtyArea,
      specialtyLogo: studentRoom.specialtyLogo,
      specialtyCode: studentRoom.specialtyCode,
      studentName: payload.name,
      studentUnit: payload.unit,
      dateStr,
      completedAt: Date.now(),
      totalQuestions,
      answeredCount,
      correctCount: payload.correctCount,
      scorePercent: payload.scorePercent,
      grade10: payload.grade10,
      passingScorePercent: studentRoom.passingScorePercent || 70,
      cheatCount: effectiveCheat,
      timeSpentSeconds: spentSec,
      resultsReleased: Boolean(studentRoom.resultsReleased),
      questions: studentRoom.questions,
      answers: effectiveAns
    };

    persistStudentHistoryList([newEntry, ...studentExamHistory], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoggedInUser,
    studentPhase,
    studentRoom?.pin,
    studentRoom?.resultsReleased,
    studentFinalTimeSpentSec,
    studentCheatCount
  ]);

  const handleRefreshHistoryEntryResult = async (entry: LiveExamStudentHistoryEntry) => {
    setIsRefreshingHistoryPin(entry.pin);
    try {
      const [apiRoom, cloudRoom] = await Promise.all([
        fetch(`/api/live-exam?pin=${entry.pin}&t=${Date.now()}`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d?.room ? (d.room as LiveExamRoomState) : null))
          .catch(() => null),
        downloadCloudExamJson<LiveExamRoomState>(`provas/room_${entry.pin}.json`)
      ]);
      const roomData =
        apiRoom && cloudRoom
          ? (cloudRoom.updatedAt || 0) >= (apiRoom.updatedAt || 0)
            ? cloudRoom
            : apiRoom
          : cloudRoom || apiRoom;
      if (roomData) {
        const released = Boolean(roomData.resultsReleased);
        const myP: any =
          roomData.participants?.[studentId] ||
          Object.values(roomData.participants || {}).find(
            (p: any) =>
              p.name?.trim().toLowerCase() === (entry.studentName || studentName || '').trim().toLowerCase()
          );
        const updatedEntry: LiveExamStudentHistoryEntry = {
          ...entry,
          resultsReleased: released,
          completedAt: Date.now(),
          grade10: myP?.grade10 ?? entry.grade10,
          scorePercent: myP?.scorePercent ?? entry.scorePercent,
          correctCount: myP?.correctCount ?? entry.correctCount,
          cheatCount: Math.max(entry.cheatCount || 0, Number(myP?.cheatCount || 0)),
          questions: roomData.questions || entry.questions,
          answers:
            myP?.answers && Object.keys(myP.answers).length > 0 ? myP.answers : entry.answers
        };
        persistStudentHistoryList([updatedEntry, ...studentExamHistory], true);
      }
    } catch {}
    setIsRefreshingHistoryPin(null);
  };

  useEffect(() => {
    if (roleMode !== 'STUDENT' || studentPhase !== 'PLAYING' || !studentRoom) return;

    const updateStudentTimer = () => {
      if (isUnlimitedRoomDuration(studentRoom.durationMinutes, studentRoom.unlimitedTime)) {
        setStudentRemainingSeconds(0);
        return;
      }
      const now = Date.now();
      const rawRoomStart = Number(studentRoom.startedAt || 0);
      const validRoomStart =
        rawRoomStart > 1700000000000 && rawRoomStart <= now + 60000 ? rawRoomStart : 0;
      const validLocalStart =
        studentStartTime && studentStartTime > 1700000000000 && studentStartTime <= now + 60000
          ? studentStartTime
          : 0;
      const baseStart = validRoomStart || validLocalStart || now;
      const elapsed = Math.max(0, Math.floor((now - baseStart) / 1000));
      const safeDurationMins = Math.max(1, Math.min(300, Number(studentRoom.durationMinutes) || 15));
      const totalAllowed =
        safeDurationMins * 60 + Math.max(0, Math.floor(Number(studentRoom.extraSecondsAdded) || 0));
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
    studentAnswersPinRef.current = String(studentRoom.pin);
    const nextAnswers = {
      ...(studentAnswersPinRef.current === String(studentRoom.pin) ? studentAnswers : {}),
      [questionIndex]: optionIndex
    };
    studentAnswersRef.current = nextAnswers;
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

  const sanitizeSecondsValue = (rawSec: number, fallback = 0) => {
    const n = Number(rawSec);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    // Qualquer valor acima de 24h (86400s) é resquício de timestamp bruto (Date.now()/1000)
    if (n > 86400) return fallback;
    return Math.floor(n);
  };

  const formatTimeMMSS = (totalSec: number) => {
    const safeSec = sanitizeSecondsValue(totalSec, 0);
    const mins = Math.floor(safeSec / 60);
    const secs = safeSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const formatDurationDetailed = (totalSec: number) => {
    const safe = Math.max(1, sanitizeSecondsValue(totalSec, 1));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    if (mins <= 0) return `${secs} seg`;
    return `${mins} min e ${String(secs).padStart(2, '0')} seg`;
  };

  const normalizeTextForEvalType = useCallback((val?: string | null) => {
    return String(val || '')
      .replace(/^📚\s*/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const findMatchingBookForRoom = useCallback(
    (room?: Partial<LiveExamRoomState | LiveExamStudentHistoryEntry> | null): LiveExamBookItem | null => {
      if (!room || booksCatalog.length === 0) return null;
      const normTitle = normalizeTextForEvalType(room.specialtyName);
      if (!normTitle) return null;

      const exact = booksCatalog.find((b) => normalizeTextForEvalType(b.title) === normTitle);
      if (exact) return exact;

      if (normTitle.length >= 6) {
        const cleanWithoutLivroPrefix = normTitle.replace(/^(livro|leitura)\s+(do|da|de|dos|das)?\s*/, '').trim();
        const sub = booksCatalog.find((b) => {
          const bNorm = normalizeTextForEvalType(b.title);
          if (bNorm.length < 5) return false;
          return (
            bNorm === cleanWithoutLivroPrefix ||
            bNorm.includes(normTitle) ||
            normTitle.includes(bNorm) ||
            (cleanWithoutLivroPrefix.length >= 6 &&
              (bNorm.includes(cleanWithoutLivroPrefix) || cleanWithoutLivroPrefix.includes(bNorm)))
          );
        });
        if (sub) return sub;
      }
      return null;
    },
    [booksCatalog, normalizeTextForEvalType]
  );

  const getRoomEvaluationType = useCallback(
    (
      room?: Partial<LiveExamRoomState | LiveExamStudentHistoryEntry> | null
    ): 'BOOK' | 'SPECIALTY' | 'CUSTOM' => {
      if (!room) return 'SPECIALTY';

      const code = String(room.specialtyCode || '').trim().toUpperCase();
      const rawName = String(room.specialtyName || '').trim();
      const normName = normalizeTextForEvalType(rawName);
      const normArea = normalizeTextForEvalType(room.specialtyArea);
      const qList = Array.isArray(room.questions) ? room.questions : [];

      if (
        code === 'LIVRO' ||
        rawName.includes('📚') ||
        /^livro(\s|$)/i.test(normName) ||
        normArea.includes('livro') ||
        normArea.includes('biblioteca') ||
        qList.some((q) => String(q?.id || '').startsWith('book_q_') || String(q?.id || '').startsWith('q_book_'))
      ) {
        return 'BOOK';
      }

      if (findMatchingBookForRoom(room)) {
        return 'BOOK';
      }

      if (
        qList.length > 0 &&
        qList.some((q) =>
          /\b(o livro|do livro|no livro|deste livro|leitura do livro|obra literaria)\b/i.test(
            String(q?.question || '')
          )
        )
      ) {
        return 'BOOK';
      }

      if (catalog.length > 0 && normName) {
        const matchesSpec = catalog.some((s) => normalizeTextForEvalType(s.nome) === normName);
        if (matchesSpec) return 'SPECIALTY';
      }

      if (
        code === 'PROVA' ||
        normArea === 'prova personalizada' ||
        qList.some((q) => String(q?.id || '').startsWith('theme_') || String(q?.id || '').startsWith('manual_q_'))
      ) {
        return 'CUSTOM';
      }

      return 'SPECIALTY';
    },
    [catalog, findMatchingBookForRoom, normalizeTextForEvalType]
  );

  const getRoomEvaluationHeaderLabel = useCallback(
    (room?: Partial<LiveExamRoomState | LiveExamStudentHistoryEntry> | null): string => {
      const evalType = getRoomEvaluationType(room);
      if (evalType === 'BOOK') return 'LIVRO EM AVALIAÇÃO';
      if (evalType === 'CUSTOM') return 'TEMA EM AVALIAÇÃO';
      return 'ESPECIALIDADE EM AVALIAÇÃO';
    },
    [getRoomEvaluationType]
  );

  const getRoomResolvedLogo = useCallback(
    (room?: Partial<LiveExamRoomState | LiveExamStudentHistoryEntry> | null): string => {
      if (!room) return '';
      if (room.specialtyLogo && String(room.specialtyLogo).trim()) {
        return String(room.specialtyLogo).trim();
      }
      const matchedBook = findMatchingBookForRoom(room);
      if (matchedBook?.cover) {
        return matchedBook.cover;
      }
      return '';
    },
    [findMatchingBookForRoom]
  );

  const buildParticipantsCircleHtmlString = useCallback((rawList: LiveExamParticipant[]) => {
    const ordered = (rawList || [])
      .map((p, idx) => ({ p, score: parseParticipantJoinScore(p, idx) }))
      .sort((a, b) => a.score - b.score)
      .map((item) => item.p);

    if (ordered.length === 0) {
      return `
        <div class="kahoot-empty-box">
          <div class="kahoot-empty-icon">👥</div>
          <div class="kahoot-empty-title">Aguardando os desbravadores entrarem...</div>
          <div class="kahoot-empty-desc">Aponte a câmera para o QR Code ou digite o PIN ao lado para entrar na sala!</div>
        </div>
      `;
    }

    const latest = ordered[ordered.length - 1];

    const kahootColors = [
      { bg: 'linear-gradient(135deg, #e21b3c 0%, #991b1b 100%)', border: '#f87171' },
      { bg: 'linear-gradient(135deg, #1368ce 0%, #1e40af 100%)', border: '#60a5fa' },
      { bg: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)', border: '#fcd34d' },
      { bg: 'linear-gradient(135deg, #15803d 0%, #14532d 100%)', border: '#4ade80' },
      { bg: 'linear-gradient(135deg, #7e22ce 0%, #581c87 100%)', border: '#c084fc' },
      { bg: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)', border: '#22d3ee' },
      { bg: 'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)', border: '#fb923c' },
      { bg: 'linear-gradient(135deg, #be185d 0%, #831843 100%)', border: '#f472b6' }
    ];

    const cardsHtml = ordered.map((p, idx) => {
      const isLatest = latest && p.id === latest.id;
      let hash = 0;
      const str = String(p.id || p.name || idx);
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) % 1000;
      }
      const col = kahootColors[Math.abs(hash) % kahootColors.length];

      const parts = String(p.name || '').trim().split(/\s+/);
      const initials = parts.length > 1
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : (parts[0] || 'D').slice(0, 2).toUpperCase();

      const safeName = String(p.name || 'Desbravador')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const safeUnit = String(p.unit || 'Clube')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      return `
        <div class="kahoot-card ${isLatest ? 'is-latest' : ''}" style="background: ${col.bg}; border-color: ${isLatest ? '#fbbf24' : col.border};">
          ${isLatest ? '<span class="kahoot-new-tag">✨ NOVO!</span>' : ''}
          <div class="kahoot-card-inner">
            <div class="kahoot-avatar">${initials}</div>
            <div class="kahoot-info">
              <span class="kahoot-name">${safeName}</span>
              <span class="kahoot-unit">${safeUnit}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="kahoot-grid">${cardsHtml}</div>`;
  }, []);

  const renderWaitingParticipantsCircle = useCallback(
    (rawList: LiveExamParticipant[], isExpanded = false) => {
      const ordered = (rawList || [])
        .map((p, idx) => ({ p, score: parseParticipantJoinScore(p, idx) }))
        .sort((a, b) => a.score - b.score)
        .map((item) => item.p);

      const latest = ordered.length > 0 ? ordered[ordered.length - 1] : null;

      const kahootColors = [
        { bg: 'from-rose-600 to-red-800', border: 'border-rose-400/60', text: 'text-white' },
        { bg: 'from-blue-600 to-indigo-800', border: 'border-blue-400/60', text: 'text-white' },
        { bg: 'from-amber-500 to-amber-700', border: 'border-amber-300/60', text: 'text-white' },
        { bg: 'from-emerald-600 to-green-800', border: 'border-emerald-400/60', text: 'text-white' },
        { bg: 'from-purple-600 to-violet-800', border: 'border-purple-400/60', text: 'text-white' },
        { bg: 'from-cyan-600 to-teal-800', border: 'border-cyan-400/60', text: 'text-white' },
        { bg: 'from-orange-600 to-orange-800', border: 'border-orange-400/60', text: 'text-white' },
        { bg: 'from-pink-600 to-rose-800', border: 'border-pink-400/60', text: 'text-white' }
      ];

      if (ordered.length === 0) {
        return (
          <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-900/60 border border-dashed border-indigo-400/25 rounded-3xl min-h-[220px] space-y-2">
            <Users className="w-10 h-10 text-indigo-400/70 animate-pulse" />
            <h4 className="text-sm sm:text-base font-black text-white">Aguardando os desbravadores entrarem...</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Aponte a câmera para o QR Code ou digite o PIN ao lado para aparecer aqui na tela estilo Kahoot!
            </p>
          </div>
        );
      }

      return (
        <div className="w-full flex-1 overflow-y-auto pr-1 scrollbar-hide py-1">
          <style>{`
            @keyframes kahootPopIn {
              0% { opacity: 0; transform: scale(0.65) translateY(12px); }
              60% { opacity: 1; transform: scale(1.04) translateY(-2px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ordered.map((p, idx) => {
              const isLatest = latest && p.id === latest.id;
              let hash = 0;
              const str = String(p.id || p.name || idx);
              for (let i = 0; i < str.length; i++) {
                hash = (hash * 31 + str.charCodeAt(i)) % 1000;
              }
              const col = kahootColors[Math.abs(hash) % kahootColors.length];

              const parts = String(p.name || '').trim().split(/\s+/);
              const initials = parts.length > 1
                ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                : (parts[0] || 'D').slice(0, 2).toUpperCase();

              return (
                <div
                  key={p.id || idx}
                  style={{ animation: 'kahootPopIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
                  className={`relative p-3.5 rounded-2xl bg-gradient-to-br ${col.bg} border-2 ${
                    isLatest
                      ? 'border-amber-300 ring-4 ring-amber-400/40 shadow-[0_0_25px_rgba(251,191,36,0.5)] scale-[1.02]'
                      : `${col.border} shadow-lg shadow-black/30 hover:scale-[1.02]`
                  } transition-all duration-200 flex items-center gap-3 overflow-hidden`}
                >
                  {isLatest && (
                    <span className="absolute top-1.5 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-md animate-pulse">
                      ✨ NOVO!
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-black text-white text-sm shrink-0 shadow-inner">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block font-black text-white text-sm sm:text-base leading-tight truncate">
                      {p.name}
                    </span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-black/25 text-white/90 text-[10px] font-extrabold uppercase tracking-wide truncate max-w-full">
                      {p.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    []
  );

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
    const evalType = getRoomEvaluationType(activeRoom);
    const evalHeaderLabel = getRoomEvaluationHeaderLabel(activeRoom);
    const resolvedRoomLogo = getRoomResolvedLogo(activeRoom);
    const cleanRoomTitle = activeRoom.specialtyName.replace(/^📚\s*/, '');
    const statusLabel =
      activeRoom.status === 'ACTIVE'
        ? '🟢 PROVA EM ANDAMENTO'
        : activeRoom.status === 'FINISHED'
        ? '🏁 PROVA ENCERRADA'
        : '⏳ AGUARDANDO';

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
      padding: 24px 36px;
      user-select: none;
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.12);
      padding-bottom: 16px;
    }
    .top-left-group {
      display: flex;
      align-items: center;
      gap: 14px;
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
    .top-spec-logo {
      width: 50px;
      height: 50px;
      object-fit: contain;
      filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));
    }
    .top-header-center {
      text-align: center;
      flex: 1;
      padding: 0 16px;
    }
    .top-eval-type {
      display: block;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.22em;
      margin-bottom: 2px;
    }
    .top-spec-title {
      font-size: clamp(18px, 2.3vw, 36px);
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.01em;
      line-height: 1.15;
      color: #ffffff;
      text-shadow: 0 4px 20px rgba(0,0,0,0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .top-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .fs-btn {
      background: #4f46e5;
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.2);
      width: 44px;
      height: 44px;
      border-radius: 12px;
      font-weight: 900;
      font-size: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(79, 70, 229, 0.35);
      transition: all 0.2s ease;
    }
    .fs-btn:hover { background: #6366f1; transform: scale(1.05); }
    .main-grid {
      flex: 1;
      display: grid;
      grid-template-columns: minmax(380px, 480px) 1fr;
      gap: 24px;
      align-items: stretch;
      max-width: 1760px;
      width: 100%;
      margin: 16px auto 0;
      min-height: 0;
    }
    .main-grid.exam-started {
      grid-template-columns: minmax(420px, 520px) 1fr;
    }
    @media (min-width: 1400px) {
      .main-grid {
        max-width: 1960px;
        grid-template-columns: minmax(430px, 540px) 1fr;
        gap: 30px;
      }
      .qr-box img {
        width: min(45vh, 340px) !important;
        height: min(45vh, 340px) !important;
      }
    }
    @media (min-width: 1800px) {
      .main-grid {
        max-width: 2400px;
        grid-template-columns: minmax(480px, 600px) 1fr;
        gap: 36px;
      }
      .qr-box img {
        width: min(48vh, 380px) !important;
        height: min(48vh, 380px) !important;
      }
    }
    .qr-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.85);
      border: 2px solid rgba(99, 102, 241, 0.35);
      border-radius: 32px;
      padding: 24px 20px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.5);
      text-align: center;
      gap: 14px;
    }
    .pin-card-wrapper {
      width: 100%;
      background: rgba(30, 27, 75, 0.65);
      border: 1px solid rgba(251, 191, 36, 0.35);
      border-radius: 20px;
      padding: 12px 18px;
      text-align: center;
    }
    .stat-label {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #94a3b8;
      margin-bottom: 4px;
      display: block;
    }
    .pin-value {
      font-size: clamp(34px, 4.4vw, 54px);
      font-weight: 900;
      color: #fbbf24;
      letter-spacing: 0.16em;
      line-height: 1.05;
      text-shadow: 0 4px 20px rgba(251, 191, 36, 0.3);
    }
    .qr-box {
      position: relative;
      overflow: hidden;
      background: #ffffff;
      padding: 14px;
      border-radius: 24px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.35);
    }
    .qr-box img {
      width: min(38vh, 310px);
      height: min(38vh, 310px);
      display: block;
    }
    .qr-caption {
      font-size: 13px;
      font-weight: 800;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      max-width: 300px;
      line-height: 1.35;
    }
    .timer-card-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.85);
      border: 2px solid rgba(56, 189, 248, 0.45);
      border-radius: 32px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 25px 60px rgba(2, 132, 199, 0.22);
    }
    .timer-card-wrapper.timer-urgent {
      border-color: rgba(248, 113, 113, 0.65);
      box-shadow: 0 25px 60px rgba(239, 68, 68, 0.28);
    }
    .timer-value {
      font-size: clamp(56px, 8.5vw, 108px);
      font-weight: 900;
      color: #38bdf8;
      font-variant-numeric: tabular-nums;
      line-height: 1;
      letter-spacing: 0.06em;
      text-shadow: 0 0 35px rgba(56, 189, 248, 0.35);
      margin: 12px 0;
    }
    .timer-card-wrapper.timer-urgent .timer-value {
      color: #f87171;
      text-shadow: 0 0 35px rgba(248, 113, 113, 0.45);
    }
    .timer-value.timer-finished-text {
      font-size: clamp(28px, 4.4vw, 56px);
      color: #f87171;
    }
    .status-badge-live {
      background: rgba(16, 185, 129, 0.16);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #6ee7b7;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .participants-sidebar {
      background: rgba(15, 23, 42, 0.82);
      border: 1.5px solid rgba(99, 102, 241, 0.3);
      border-radius: 32px;
      padding: 20px 22px;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      max-height: calc(100vh - 120px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.4);
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      margin-bottom: 14px;
      flex-shrink: 0;
    }
    .sidebar-badge {
      background: rgba(99, 102, 241, 0.25);
      border: 1px solid rgba(129, 140, 248, 0.45);
      color: #c7d2fe;
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 900;
    }
    .chips {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      padding-right: 4px;
    }
    .chips::-webkit-scrollbar { width: 6px; }
    .chips::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 10px; }
    @keyframes kahootPopIn {
      0% { opacity: 0; transform: scale(0.65) translateY(12px); }
      60% { opacity: 1; transform: scale(1.04) translateY(-2px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .kahoot-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      gap: 12px;
      width: 100%;
      align-content: start;
    }
    .kahoot-card {
      position: relative;
      border-radius: 20px;
      padding: 12px 14px;
      border: 2px solid;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
      animation: kahootPopIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
      transition: transform 0.2s ease;
    }
    .kahoot-card.is-latest {
      box-shadow: 0 0 28px rgba(251, 191, 36, 0.55), 0 10px 25px rgba(0, 0, 0, 0.35);
      transform: scale(1.02);
    }
    .kahoot-new-tag {
      position: absolute;
      top: 5px;
      right: 7px;
      background: #fbbf24;
      color: #0f172a;
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 999px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .kahoot-card-inner {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-width: 0;
    }
    .kahoot-avatar {
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 900;
      color: #ffffff;
      flex-shrink: 0;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
    }
    .kahoot-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .kahoot-name {
      font-size: 14px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .kahoot-unit {
      margin-top: 3px;
      display: inline-block;
      align-self: flex-start;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(255, 255, 255, 0.95);
      background: rgba(0, 0, 0, 0.25);
      padding: 2px 6px;
      border-radius: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .kahoot-empty-box {
      width: 100%;
      min-height: 240px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 30px;
      background: rgba(15, 23, 42, 0.45);
      border: 2px dashed rgba(99, 102, 241, 0.25);
      border-radius: 24px;
    }
    .kahoot-empty-icon {
      font-size: 42px;
      margin-bottom: 10px;
      opacity: 0.75;
    }
    .kahoot-empty-title {
      font-size: 16px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 5px;
    }
    .kahoot-empty-desc {
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      max-width: 320px;
      line-height: 1.4;
    }
    :fullscreen .top-actions .hint-text { display: none; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="top-left-group">
      <div id="telao-v3-top-badge" class="badge">${activeRoom.status === 'WAITING' ? 'SALA ABERTA • AGUARDANDO ALUNOS' : 'PROVA EM ANDAMENTO'}</div>
      ${resolvedRoomLogo ? `<img id="telao-v3-logo" src="${resolvedRoomLogo}" class="top-spec-logo" referrerpolicy="no-referrer" />` : ''}
    </div>
    <div class="top-header-center">
      <span id="telao-v3-eval-type" class="top-eval-type" style="color:${evalType === 'BOOK' ? '#fbbf24' : evalType === 'CUSTOM' ? '#c084fc' : '#818cf8'};">${evalHeaderLabel}</span>
      <h1 id="telao-v3-title" class="top-spec-title">${cleanRoomTitle}</h1>
    </div>
    <div class="top-actions">
      <button class="fs-btn" title="Tela Cheia (F11)" aria-label="Tela Cheia (F11)" onclick="if(!document.fullscreenElement){document.documentElement.requestFullscreen().catch(()=>{});}else{document.exitFullscreen().catch(()=>{});}">
        ⛶
      </button>
    </div>
  </div>
  <div id="telao-v3-grid" class="main-grid ${activeRoom.status !== 'WAITING' ? 'exam-started' : ''}">
    <div id="telao-v3-left-col" class="left-column">
      <div id="telao-v3-qr-col" class="qr-column" style="display:${activeRoom.status !== 'WAITING' ? 'none' : 'flex'};">
        <div class="pin-card-wrapper">
          <span class="stat-label">CÓDIGO DA SALA (PIN)</span>
          <div id="telao-v3-pin" class="pin-value">${activeRoom.pin}</div>
        </div>
        <div class="qr-box">
          <img id="telao-v3-qr" src="${qrCodeDataUrl}" alt="QR Code da Prova" />
        </div>
        <div class="qr-caption">Aponte a Câmera do Celular para Entrar na Prova</div>
      </div>

      <div id="telao-v3-timer-card" class="timer-card-wrapper ${activeRoom.status === 'FINISHED' || (!isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime) && activeRoom.status === 'ACTIVE' && hostRemainingSeconds <= 60) ? 'timer-urgent' : ''}" style="display:${activeRoom.status === 'WAITING' ? 'none' : 'flex'};">
        <span id="telao-v3-timer-label" class="stat-label">${activeRoom.status === 'FINISHED' ? 'STATUS DA AVALIAÇÃO' : isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime) ? 'TEMPO DE PROVA' : 'TEMPO RESTANTE'}</span>
        <div id="telao-v3-timer" class="timer-value ${activeRoom.status === 'FINISHED' ? 'timer-finished-text' : ''}">${
          activeRoom.status === 'FINISHED'
            ? 'PROVA ENCERRADA'
            : isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime)
            ? activeRoom.status === 'ACTIVE'
              ? `∞ LIVRE (${formatTimeMMSS(hostRemainingSeconds)})`
              : '∞ SEM LIMITE'
            : formatTimeMMSS(hostRemainingSeconds)
        }</div>
        <span id="telao-v3-status" class="status-badge-live">${statusLabel}</span>
      </div>
    </div>

    <div class="participants-sidebar">
      <div class="sidebar-header">
        <span class="stat-label" style="margin-bottom:0;color:#c7d2fe;font-size:13px;">PARTICIPANTES NA SALA</span>
        <span id="telao-v3-sidebar-count" class="sidebar-badge">${pList.length}</span>
      </div>
      <div id="telao-v3-chips" class="chips" data-sig="${pList.length === 0 ? 'empty' : pList.map((p) => `${p.id}:${p.name}:${p.unit}:${p.joinedAtMs || p.joinedAt || ''}`).join('|')}">
        ${buildParticipantsCircleHtmlString(pList)}
      </div>
    </div>
  </div>
  <script>
    (function() {
      // Limpa quaisquer intervalos ou Web Workers antigos desta janela popup
      try {
        if (typeof window.__telaoCleanup === 'function') {
          window.__telaoCleanup();
        }
        var maxIntervalId = setInterval(function(){}, 99999);
        for (var cId = 1; cId <= maxIntervalId; cId++) {
          clearInterval(cId);
        }
      } catch (e) {}

      window.__telaoLayoutVersion = 5;
      window.__telaoRoomState = ${JSON.stringify({
        pin: activeRoom.pin,
        status: activeRoom.status,
        startedAt: activeRoom.startedAt,
        durationMinutes: activeRoom.durationMinutes,
        unlimitedTime: isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime),
        manuallyFinished: Boolean(activeRoom.manuallyFinished),
        extraSecondsAdded: activeRoom.extraSecondsAdded || 0,
        specialtyName: activeRoom.specialtyName,
        specialtyLogo: activeRoom.specialtyLogo,
        participants: activeRoom.participants || {},
        updatedAt: activeRoom.updatedAt || Date.now()
      })};

      var statusRank = { WAITING: 0, ACTIVE: 1, FINISHED: 2 };

      function mergeRoomState(prev, incoming) {
        if (!incoming) return prev;
        if (!prev) return incoming;
        var prevRank = statusRank[prev.status] || 0;
        var incRank = statusRank[incoming.status] || 0;
        var nextStatus = incRank >= prevRank ? (incoming.status || prev.status) : prev.status;
        return {
          pin: incoming.pin || prev.pin,
          status: nextStatus,
          startedAt: incoming.startedAt || prev.startedAt,
          durationMinutes: incoming.durationMinutes !== undefined ? incoming.durationMinutes : prev.durationMinutes,
          unlimitedTime: Boolean(incoming.unlimitedTime || prev.unlimitedTime || Number(incoming.durationMinutes) <= 0 || Number(incoming.durationMinutes) > 300),
          manuallyFinished: Boolean(incoming.manuallyFinished || prev.manuallyFinished),
          extraSecondsAdded: Math.max(Number(incoming.extraSecondsAdded || 0), Number(prev.extraSecondsAdded || 0)),
          specialtyName: incoming.specialtyName || prev.specialtyName,
          specialtyLogo: incoming.specialtyLogo || prev.specialtyLogo,
          participants: Object.assign({}, prev.participants || {}, incoming.participants || {}),
          updatedAt: Math.max(Number(incoming.updatedAt || 0), Number(prev.updatedAt || 0))
        };
      }

      function formatMMSS(totalSec) {
        var n = Number(totalSec) || 0;
        if (!isFinite(n) || n <= 0 || n > 86400) n = 0;
        var safe = Math.max(0, Math.floor(n));
        var mins = Math.floor(safe / 60);
        var secs = safe % 60;
        return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
      }

      function escapeHtml(str) {
        return String(str || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }

      function parseJoinScore(p, idx) {
        if (typeof p.joinedAtMs === 'number' && isFinite(p.joinedAtMs) && p.joinedAtMs > 0) {
          return p.joinedAtMs;
        }
        if (typeof p.joinedAt === 'string' && p.joinedAt.indexOf(':') !== -1) {
          var parts = p.joinedAt.split(':');
          var h = parseInt(parts[0], 10) || 0;
          var m = parseInt(parts[1], 10) || 0;
          var s = parseInt(parts[2], 10) || 0;
          return h * 3600 + m * 60 + s;
        }
        return idx + 1;
      }

      var kahootColors = [
        { bg: 'linear-gradient(135deg, #e21b3c 0%, #991b1b 100%)', border: '#f87171' },
        { bg: 'linear-gradient(135deg, #1368ce 0%, #1e40af 100%)', border: '#60a5fa' },
        { bg: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)', border: '#fcd34d' },
        { bg: 'linear-gradient(135deg, #15803d 0%, #14532d 100%)', border: '#4ade80' },
        { bg: 'linear-gradient(135deg, #7e22ce 0%, #581c87 100%)', border: '#c084fc' },
        { bg: 'linear-gradient(135deg, #0e7490 0%, #155e75 100%)', border: '#22d3ee' },
        { bg: 'linear-gradient(135deg, #c2410c 0%, #7c2d12 100%)', border: '#fb923c' },
        { bg: 'linear-gradient(135deg, #be185d 0%, #831843 100%)', border: '#f472b6' }
      ];

      function renderCircleHtml(pList) {
        if (!pList || pList.length === 0) {
          return '<div class="kahoot-empty-box"><div class="kahoot-empty-icon">👥</div><div class="kahoot-empty-title">Aguardando os desbravadores entrarem...</div><div class="kahoot-empty-desc">Aponte a câmera para o QR Code ou digite o PIN ao lado para entrar na sala!</div></div>';
        }
        var ordered = pList
          .map(function(p, idx) { return { p: p, score: parseJoinScore(p, idx) }; })
          .sort(function(a, b) { return a.score - b.score; })
          .map(function(item) { return item.p; });

        var latest = ordered[ordered.length - 1];

        var cards = ordered.map(function(p, idx) {
          var isLatest = latest && p.id === latest.id;
          var hash = 0;
          var str = String(p.id || p.name || idx);
          for (var i = 0; i < str.length; i++) {
            hash = (hash * 31 + str.charCodeAt(i)) % 1000;
          }
          var col = kahootColors[Math.abs(hash) % kahootColors.length];
          var parts = String(p.name || '').trim().split(/\\s+/);
          var initials = parts.length > 1
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : (parts[0] || 'D').slice(0, 2).toUpperCase();

          return '<div class="kahoot-card ' + (isLatest ? 'is-latest' : '') + '" style="background:' + col.bg + ';border-color:' + (isLatest ? '#fbbf24' : col.border) + ';">' +
            (isLatest ? '<span class="kahoot-new-tag">✨ NOVO!</span>' : '') +
            '<div class="kahoot-card-inner">' +
              '<div class="kahoot-avatar">' + initials + '</div>' +
              '<div class="kahoot-info">' +
                '<span class="kahoot-name">' + escapeHtml(p.name || 'Desbravador') + '</span>' +
                '<span class="kahoot-unit">' + escapeHtml(p.unit || 'Clube') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');

        return '<div class="kahoot-grid">' + cards + '</div>';
      }

      function readLatestFromLocalStorage() {
        try {
          var currentPin = window.__telaoRoomState && window.__telaoRoomState.pin;
          if (!currentPin) return;
          var rawMulti = localStorage.getItem('dbv_instructor_active_exam_rooms');
          if (rawMulti) {
            var parsedMulti = JSON.parse(rawMulti);
            if (Array.isArray(parsedMulti)) {
              for (var i = 0; i < parsedMulti.length; i++) {
                var r = parsedMulti[i];
                if (r && String(r.pin) === String(currentPin)) {
                  window.__telaoRoomState = mergeRoomState(window.__telaoRoomState, r);
                  return;
                }
              }
            }
          }
          var rawSingle = localStorage.getItem('dbv_instructor_active_exam_room');
          if (rawSingle) {
            var parsedSingle = JSON.parse(rawSingle);
            if (parsedSingle && String(parsedSingle.pin) === String(currentPin)) {
              window.__telaoRoomState = mergeRoomState(window.__telaoRoomState, parsedSingle);
            }
          }
        } catch (e) {}
      }

      function tickTelao() {
        readLatestFromLocalStorage();
        var st = window.__telaoRoomState;
        if (!st) return;

        var isUnlimited = Boolean(st.unlimitedTime) || Number(st.durationMinutes) <= 0 || Number(st.durationMinutes) > 300;
        var totalAllowed = isUnlimited ? 0 : (Number(st.durationMinutes) || 15) * 60 + (Number(st.extraSecondsAdded) || 0);
        var remaining = totalAllowed;
        if (st.status === 'FINISHED') {
          remaining = 0;
        } else if (st.status === 'ACTIVE' && st.startedAt) {
          var elapsed = Math.floor((Date.now() - Number(st.startedAt)) / 1000);
          if (isUnlimited) {
            remaining = Math.max(0, elapsed);
          } else {
            remaining = Math.max(0, totalAllowed - elapsed);
            if (remaining <= 0) {
              st.status = 'FINISHED';
              remaining = 0;
            }
          }
        }

        var isStarted = st.status !== 'WAITING';
        var topBadgeEl = document.getElementById('telao-v3-top-badge');
        if (topBadgeEl) {
          var nextTopBadge = isStarted ? 'PROVA EM ANDAMENTO' : 'SALA ABERTA • AGUARDANDO ALUNOS';
          if (topBadgeEl.textContent !== nextTopBadge) topBadgeEl.textContent = nextTopBadge;
        }

        var mainGridEl = document.getElementById('telao-v3-grid');
        if (mainGridEl) mainGridEl.classList.toggle('exam-started', isStarted);

        var qrColEl = document.getElementById('telao-v3-qr-col');
        if (qrColEl) qrColEl.style.display = isStarted ? 'none' : 'flex';

        var timerCardEl = document.getElementById('telao-v3-timer-card');
        if (timerCardEl) {
          timerCardEl.style.display = isStarted ? 'flex' : 'none';
          timerCardEl.classList.toggle('timer-urgent', st.status === 'FINISHED' || (!isUnlimited && st.status === 'ACTIVE' && remaining <= 60));
        }

        var timerLabelEl = document.getElementById('telao-v3-timer-label');
        if (timerLabelEl) {
          var nextLabelTxt = st.status === 'FINISHED'
            ? 'STATUS DA AVALIAÇÃO'
            : isUnlimited
            ? 'TEMPO DE PROVA'
            : 'TEMPO RESTANTE';
          if (timerLabelEl.textContent !== nextLabelTxt) {
            timerLabelEl.textContent = nextLabelTxt;
          }
        }

        var timerEl = document.getElementById('telao-v3-timer');
        var formatted = st.status === 'FINISHED'
          ? 'PROVA ENCERRADA'
          : isUnlimited
          ? '∞ SEM LIMITE'
          : formatMMSS(remaining);
        if (timerEl) {
          if (timerEl.textContent !== formatted) {
            timerEl.textContent = formatted;
          }
          timerEl.classList.toggle('timer-finished-text', st.status === 'FINISHED');
        }

        var statusEl = document.getElementById('telao-v3-status');
        if (statusEl) {
          var nextStatusTxt =
            st.status === 'ACTIVE'
              ? '🟢 PROVA EM ANDAMENTO'
              : st.status === 'FINISHED'
              ? '🏁 PROVA ENCERRADA'
              : '⏳ AGUARDANDO';
          if (statusEl.textContent !== nextStatusTxt) {
            statusEl.textContent = nextStatusTxt;
          }
        }

        var pObj = st.participants || {};
        var pList = Object.keys(pObj).map(function(k) { return pObj[k]; }).filter(Boolean);
        var countEl = document.getElementById('telao-v3-count');
        var countTxt = String(pList.length);
        if (countEl && countEl.textContent !== countTxt) {
          countEl.textContent = countTxt;
        }
        var sidebarCountEl = document.getElementById('telao-v3-sidebar-count');
        var sidebarCountTxt = String(pList.length);
        if (sidebarCountEl && sidebarCountEl.textContent !== sidebarCountTxt) {
          sidebarCountEl.textContent = sidebarCountTxt;
        }
        var chipsEl = document.getElementById('telao-v3-chips');
        if (chipsEl) {
          var nextSig = pList.length === 0
            ? 'empty'
            : pList.map(function(p) { return (p.id || '') + ':' + (p.name || '') + ':' + (p.unit || '') + ':' + (p.joinedAtMs || p.joinedAt || ''); }).join('|');
          if (chipsEl.getAttribute('data-sig') !== nextSig) {
            chipsEl.setAttribute('data-sig', nextSig);
            chipsEl.innerHTML = renderCircleHtml(pList);
          }
        }
      }

      var tickInt = setInterval(tickTelao, 250);
      var workerInst = null;
      var workerBlobUrl = null;
      try {
        var wBlob = new Blob(['setInterval(function(){ postMessage("t"); }, 500);'], { type: 'application/javascript' });
        workerBlobUrl = URL.createObjectURL(wBlob);
        workerInst = new Worker(workerBlobUrl);
        workerInst.onmessage = tickTelao;
      } catch (e) {}

      var pollInt = setInterval(function() {
        var st = window.__telaoRoomState;
        if (!st || !st.pin) return;
        fetch('/api/live-exam?pin=' + encodeURIComponent(st.pin) + '&t=' + Date.now(), { cache: 'no-store' })
          .then(function(r) { return r.ok ? r.json() : null; })
          .then(function(data) {
            if (data && data.room && String(data.room.pin) === String(st.pin)) {
              window.__telaoRoomState = mergeRoomState(window.__telaoRoomState, data.room);
              tickTelao();
            }
          })
          .catch(function() {});
      }, 2500);

      window.__telaoCleanup = function() {
        clearInterval(tickInt);
        clearInterval(pollInt);
        if (workerInst) {
          try { workerInst.terminate(); } catch (e) {}
        }
        if (workerBlobUrl) {
          try { URL.revokeObjectURL(workerBlobUrl); } catch (e) {}
        }
      };

      tickTelao();
    })();
  </script>
</body>
</html>`;

    try {
      if (typeof (projWin as any).__telaoCleanup === 'function') {
        (projWin as any).__telaoCleanup();
      }
    } catch {}

    projWin.document.open();
    projWin.document.write(htmlContent);
    projWin.document.close();

    const checkClosed = setInterval(() => {
      if (!projectorWindowRef.current || projectorWindowRef.current.closed) {
        setIsSecondScreenActive(false);
        clearInterval(checkClosed);
      }
    }, 1500);
  }, [activeRoom, qrCodeDataUrl, hostRemainingSeconds, buildParticipantsCircleHtmlString, getRoomEvaluationType, getRoomEvaluationHeaderLabel, getRoomResolvedLogo]);

  // Atualiza automaticamente os dados na janela projetada no Telão em tempo real
  useEffect(() => {
    const projWin = projectorWindowRef.current as any;
    if (!projWin || projWin.closed || !activeRoom) return;
    try {
      const doc = projWin.document;
      if (projWin.__telaoLayoutVersion !== 5 || !doc.getElementById('telao-v3-grid')) {
        handleProjectQrToAnotherScreen();
        return;
      }
      projWin.__telaoRoomState = activeRoom;
      const isStarted = activeRoom.status !== 'WAITING';
      const effectiveRem = activeRoom.status === 'FINISHED' ? 0 : hostRemainingSeconds;

      const topBadgeEl = doc.getElementById('telao-v3-top-badge');
      if (topBadgeEl) {
        topBadgeEl.textContent = isStarted
          ? 'PROVA EM ANDAMENTO'
          : 'SALA ABERTA • AGUARDANDO ALUNOS';
      }

      const mainGridEl = doc.getElementById('telao-v3-grid');
      if (mainGridEl) {
        mainGridEl.classList.toggle('exam-started', isStarted);
      }

      const qrColEl = doc.getElementById('telao-v3-qr-col');
      if (qrColEl) {
        qrColEl.style.display = isStarted ? 'none' : 'flex';
      }

      const cardsRowEl = doc.getElementById('telao-v3-cards-row');
      if (cardsRowEl) {
        cardsRowEl.classList.toggle('single-timer', isStarted);
      }

      const pinCardEl = doc.getElementById('telao-v3-pin-card');
      if (pinCardEl) {
        pinCardEl.style.display = isStarted ? 'none' : 'block';
      }

      const timerCardEl = doc.getElementById('telao-v3-timer-card');
      const isUnlimitedRoom = isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime);
      const isFinishedRoom = activeRoom.status === 'FINISHED';
      if (timerCardEl) {
        timerCardEl.style.display = isStarted ? 'block' : 'none';
        timerCardEl.classList.toggle('timer-featured', isStarted);
        timerCardEl.classList.toggle(
          'timer-urgent',
          isFinishedRoom ||
            (!isUnlimitedRoom && activeRoom.status === 'ACTIVE' && effectiveRem <= 60)
        );
      }

      const timerLabelEl = doc.getElementById('telao-v3-timer-label');
      if (timerLabelEl) {
        const nextLabel = isFinishedRoom
          ? 'STATUS DA AVALIAÇÃO'
          : isUnlimitedRoom
          ? 'TEMPO DE PROVA'
          : 'TEMPO RESTANTE';
        if (timerLabelEl.textContent !== nextLabel) {
          timerLabelEl.textContent = nextLabel;
        }
      }

      const qrEl = doc.getElementById('telao-v3-qr') as HTMLImageElement | null;
      if (qrEl && qrCodeDataUrl && qrEl.src !== qrCodeDataUrl) {
        qrEl.src = qrCodeDataUrl;
      }
      const resolvedLogo = getRoomResolvedLogo(activeRoom);
      const logoEl = doc.getElementById('telao-v3-logo') as HTMLImageElement | null;
      if (logoEl && resolvedLogo && logoEl.src !== resolvedLogo) {
        logoEl.src = resolvedLogo;
      }
      const evalTypeEl = doc.getElementById('telao-v3-eval-type') as HTMLElement | null;
      const nextEvalLabel = getRoomEvaluationHeaderLabel(activeRoom);
      if (evalTypeEl && evalTypeEl.textContent !== nextEvalLabel) {
        evalTypeEl.textContent = nextEvalLabel;
      }
      const titleEl = doc.getElementById('telao-v3-title');
      const cleanTitle = activeRoom.specialtyName.replace(/^📚\s*/, '');
      if (titleEl && titleEl.textContent !== cleanTitle) {
        titleEl.textContent = cleanTitle;
      }

      const pinEl = doc.getElementById('telao-v3-pin');
      if (pinEl && pinEl.textContent !== activeRoom.pin) {
        pinEl.textContent = activeRoom.pin;
      }

      const timerEl = doc.getElementById('telao-v3-timer');
      const formattedTimer = isFinishedRoom
        ? 'PROVA ENCERRADA'
        : isUnlimitedRoom
        ? '∞ SEM LIMITE'
        : formatTimeMMSS(effectiveRem);
      if (timerEl) {
        if (timerEl.textContent !== formattedTimer) {
          timerEl.textContent = formattedTimer;
        }
        timerEl.classList.toggle('timer-finished-text', isFinishedRoom);
      }

      const statusEl = doc.getElementById('telao-v3-status');
      if (statusEl) {
        const nextStatus =
          activeRoom.status === 'ACTIVE'
            ? '🟢 PROVA EM ANDAMENTO'
            : activeRoom.status === 'FINISHED'
            ? '🏁 PROVA ENCERRADA'
            : '⏳ AGUARDANDO';
        if (statusEl.textContent !== nextStatus) {
          statusEl.textContent = nextStatus;
        }
      }
      const qrFinishedEl = doc.getElementById('telao-v3-qr-finished');
      if (qrFinishedEl) {
        qrFinishedEl.style.display = activeRoom.status === 'FINISHED' ? 'flex' : 'none';
      }

      const pList = Object.values(activeRoom.participants || {}) as LiveExamParticipant[];
      const countEl = doc.getElementById('telao-v3-count');
      const countTxt = `${pList.length} participante(s) na sala`;
      if (countEl && countEl.textContent !== countTxt) {
        countEl.textContent = countTxt;
      }
      const sidebarCountEl = doc.getElementById('telao-v3-sidebar-count');
      const sidebarCountTxt = String(pList.length);
      if (sidebarCountEl && sidebarCountEl.textContent !== sidebarCountTxt) {
        sidebarCountEl.textContent = sidebarCountTxt;
      }

      const chipsEl = doc.getElementById('telao-v3-chips');
      if (chipsEl) {
        const nextSig =
          pList.length === 0
            ? 'empty'
            : pList
                .map((p) => `${p.id || ''}:${p.name || ''}:${p.unit || ''}:${p.joinedAtMs || p.joinedAt || ''}`)
                .join('|');
        if (chipsEl.getAttribute('data-sig') !== nextSig) {
          chipsEl.setAttribute('data-sig', nextSig);
          chipsEl.innerHTML = buildParticipantsCircleHtmlString(pList);
        }
      }
    } catch {}
  }, [activeRoom, qrCodeDataUrl, hostRemainingSeconds, handleProjectQrToAnotherScreen, buildParticipantsCircleHtmlString, getRoomEvaluationHeaderLabel, getRoomResolvedLogo]);

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

  const handleStudentJoinRoomRef = useRef(handleStudentJoinRoom);
  handleStudentJoinRoomRef.current = handleStudentJoinRoom;

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
      resetStudentExamSessionState(pinFound);
      setQrScannedSuccessMsg(`✅ QR Code lido! Sala #${pinFound} identificada.`);
      if (studentName.trim().length >= 2) {
        setTimeout(() => {
          handleStudentJoinRoomRef.current(pinFound);
        }, 120);
      }
    },
    [stopQrScannerStream, studentName, resetStudentExamSessionState]
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
        className="fixed inset-0 z-[100005] bg-slate-900/65 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setIsQrScannerOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 rounded-[28px] p-4 sm:p-5 text-slate-800 dark:text-white shadow-2xl space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-600/25 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Camera size={18} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Ler QR Code da Prova
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Aponte a câmera para o QR Code da sala
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsQrScannerOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
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
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-[11px] font-bold text-center">
              {qrScannerError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                setQrScannerFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
              }
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
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
  // SEÇÃO REUTILIZÁVEL: PROVAS APLICADAS PELO INSTRUTOR (COM OPÇÃO DE EXCLUIR E VER RESPOSTAS)
  // ============================================================================
  const renderAppliedExamsSection = () => {
    if (!isLoggedInUser || (!hasHostPermission && appliedExamsHistory.length === 0)) return null;

    return (
      <div className="mt-4 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-[26px] p-4 sm:p-5 text-slate-800 dark:text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                Provas Aplicadas ({appliedExamsHistory.length})
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                Provas que você criou e aplicou para outros participantes responderem
              </p>
            </div>
          </div>
        </div>

        {appliedExamsHistory.length === 0 ? (
          <div className="py-5 px-3 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
            <Users size={22} className="text-slate-400 dark:text-slate-500 mx-auto" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Nenhuma prova aplicada registrada no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1 scrollbar-hide">
            {appliedExamsHistory.map((roomItem) => {
              const pList = Object.values(roomItem.participants || {}) as LiveExamParticipant[];
              const finishedCount = pList.filter((p) => p.status === 'FINISHED').length;
              const dateFormatted = new Date(Number(roomItem.createdAt || Date.now())).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });

              return (
                <div
                  key={roomItem.pin}
                  onClick={() => setSelectedAppliedExam(roomItem)}
                  className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/90 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all flex flex-col gap-3 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0 w-full">
                    {roomItem.specialtyLogo ? (
                      <img
                        src={roomItem.specialtyLogo}
                        alt={roomItem.specialtyName}
                        className="w-10 h-10 object-contain rounded-lg shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                        <Award size={18} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black uppercase text-slate-900 dark:text-white break-words">
                          {roomItem.specialtyName}
                        </h4>
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 text-[9px] font-black">
                          #{roomItem.pin}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase ${
                            roomItem.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                              : roomItem.status === 'FINISHED'
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {roomItem.status === 'ACTIVE'
                            ? '🟢 Ativa'
                            : roomItem.status === 'FINISHED'
                            ? '🏁 Encerrada'
                            : '⏳ Aguardando'}
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {dateFormatted} • {roomItem.questions?.length || 0} questões •{' '}
                        <strong className="text-indigo-600 dark:text-indigo-400">
                          {pList.length} participante(s)
                        </strong>{' '}
                        ({finishedCount} concluíram)
                      </p>

                      {pList.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {pList.slice(0, 4).map((p) => (
                            <span
                              key={p.id || p.name}
                              className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]"
                            >
                              👤 {p.name}: <strong className="text-emerald-600 dark:text-emerald-400">{Number(p.grade10 || 0).toFixed(1).replace('.', ',')}</strong> ({p.scorePercent || 0}%)
                            </span>
                          ))}
                          {pList.length > 4 && (
                            <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">
                              +{pList.length - 4} mais
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-end gap-1.5 w-full pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReleaseResultsForAll(roomItem);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer border whitespace-nowrap ${
                        roomItem.resultsReleased
                          ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      <Award size={12} className="shrink-0" />
                      <span>{roomItem.resultsReleased ? 'Retirar Resultado' : 'Liberar Resultado'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppliedExam(roomItem);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Eye size={12} className="shrink-0" />
                      <span>Respostas ({pList.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setHostRooms((prev) => {
                          const exists = prev.some((r) => r.pin === roomItem.pin);
                          return exists ? prev : [roomItem, ...prev];
                        });
                        setSelectedRoomPin(roomItem.pin);
                        setIsCreatingNewRoom(false);
                        setRoleMode('HOST');
                        setEntryScreenConfirmed(true);
                        scrollToQrCodeSection();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      title="Abrir sala no painel ao vivo"
                    >
                      <QrCode size={12} className="shrink-0" />
                      <span>Sala</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteAppliedPin(roomItem.pin);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      title="Excluir esta prova aplicada"
                    >
                      <Trash2 size={12} className="shrink-0" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAppliedExamModals = () => {
    if (typeof document === 'undefined') return null;

    return (
      <>
        {/* Modal de Confirmação de Exclusão de Prova Aplicada */}
        {confirmDeleteAppliedPin &&
          createPortal(
            <div
              className="fixed inset-0 z-[100010] bg-slate-900/70 dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setConfirmDeleteAppliedPin(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/40 rounded-[26px] p-5 text-slate-800 dark:text-white shadow-2xl space-y-4 text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                  <Trash2 size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-black uppercase text-slate-900 dark:text-white">
                    Excluir Prova Aplicada?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Tem certeza que deseja excluir a sala <strong>#{confirmDeleteAppliedPin}</strong> e todas as respostas registradas nela da sua lista de Provas Aplicadas?
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAppliedPin(null)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAppliedExam(confirmDeleteAppliedPin)}
                    className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-600/20"
                  >
                    <Trash2 size={14} />
                    <span>Sim, Excluir</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Modal de Detalhes e Respostas da Prova Aplicada */}
        {selectedAppliedExam &&
          createPortal(
            <div
              className="fixed inset-0 z-[100006] bg-slate-900/65 dark:bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
              onClick={() => {
                setSelectedAppliedExam(null);
                setInspectingAppliedStudent(null);
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 rounded-[28px] p-5 text-slate-800 dark:text-white space-y-4 shadow-2xl scrollbar-hide"
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedAppliedExam.specialtyLogo && (
                      <img
                        src={selectedAppliedExam.specialtyLogo}
                        alt={selectedAppliedExam.specialtyName}
                        className="w-10 h-10 object-contain rounded-lg shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                        Prova Aplicada • Sala #{selectedAppliedExam.pin}
                      </span>
                      <h4 className="text-sm sm:text-base font-black uppercase text-slate-900 dark:text-white truncate">
                        {selectedAppliedExam.specialtyName}
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAppliedPin(selectedAppliedExam.pin)}
                      className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      title="Excluir esta prova aplicada"
                    >
                      <Trash2 size={13} />
                      <span>Excluir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAppliedExam(null);
                        setInspectingAppliedStudent(null);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {inspectingAppliedStudent ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                          Respostas do Participante
                        </span>
                        <h5 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                          👤 {inspectingAppliedStudent.name} ({inspectingAppliedStudent.unit || 'Geral'})
                        </h5>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          Nota: <strong className="text-emerald-600 dark:text-emerald-400">{Number(inspectingAppliedStudent.grade10 || 0).toFixed(1).replace('.', ',')} / 10</strong> ({inspectingAppliedStudent.scorePercent || 0}%) • Acertos: {inspectingAppliedStudent.correctCount || 0}/{selectedAppliedExam.questions?.length || 0} • Saídas: {inspectingAppliedStudent.cheatCount || 0}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInspectingAppliedStudent(null)}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft size={13} />
                        <span>Voltar à Lista</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 scrollbar-hide">
                      {(selectedAppliedExam.questions || []).map((q, idx) => {
                        const chosen = inspectingAppliedStudent.answers?.[idx];
                        const isCorrect = chosen === q.correctIndex;
                        return (
                          <div
                            key={q.id || idx}
                            className={`p-3 rounded-2xl border text-xs space-y-1 ${
                              chosen === undefined
                                ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'
                                : isCorrect
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-700/60'
                                : 'bg-red-50/70 dark:bg-red-950/35 border-red-200 dark:border-red-800/60'
                            }`}
                          >
                            <p className="font-black text-slate-900 dark:text-white">
                              {idx + 1}. {q.question}
                            </p>
                            <p className={isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-red-700 dark:text-red-300 font-bold'}>
                              Resposta de {inspectingAppliedStudent.name}:{' '}
                              {chosen !== undefined && q.options?.[chosen]
                                ? `${String.fromCharCode(65 + chosen)}) ${q.options[chosen]}`
                                : 'Não respondida'}{' '}
                              {chosen !== undefined ? (isCorrect ? '✅' : '❌') : ''}
                            </p>
                            {!isCorrect && q.options?.[q.correctIndex] && (
                              <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                                Gabarito: {String.fromCharCode(65 + q.correctIndex)}) {q.options[q.correctIndex]}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Participantes que Responderam ({Object.keys(selectedAppliedExam.participants || {}).length})
                      </span>
                      <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-1.5 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleReleaseResultsForAll(selectedAppliedExam)}
                          className={`px-3 py-2 sm:py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                            selectedAppliedExam.resultsReleased
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          <Award size={13} className="shrink-0" />
                          <span>
                            {selectedAppliedExam.resultsReleased
                              ? 'Retirar Resultado'
                              : 'Liberar Resultado'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHostRooms((prev) => {
                              const exists = prev.some((r) => r.pin === selectedAppliedExam.pin);
                              return exists ? prev : [selectedAppliedExam, ...prev];
                            });
                            setSelectedRoomPin(selectedAppliedExam.pin);
                            setIsCreatingNewRoom(false);
                            setRoleMode('HOST');
                            setEntryScreenConfirmed(true);
                            setSelectedAppliedExam(null);
                            scrollToQrCodeSection();
                          }}
                          className="px-3 py-2 sm:py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        >
                          <QrCode size={13} className="shrink-0" />
                          <span>Abrir Sala no Painel Ao Vivo</span>
                        </button>
                      </div>
                    </div>

                    {Object.values(selectedAppliedExam.participants || {}).length === 0 ? (
                      <div className="py-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                        <Users size={24} className="text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Nenhum participante respondeu a esta prova ainda.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 scrollbar-hide">
                        {(Object.values(selectedAppliedExam.participants || {}) as LiveExamParticipant[]).map((p) => {
                          const totalQ = selectedAppliedExam.questions?.length || 1;
                          const approved = (p.scorePercent || 0) >= (selectedAppliedExam.passingScorePercent || 70);
                          return (
                            <div
                              key={p.id || p.name}
                              onClick={() => setInspectingAppliedStudent(p)}
                              className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer transition-all"
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white truncate">
                                    👤 {p.name}
                                  </h5>
                                  <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase">
                                    {p.unit || 'Geral'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                  Acertos: {p.correctCount || 0}/{totalQ} ({p.scorePercent || 0}%) • Tempo: ⏱️ {formatTimeMMSS(p.timeSpentSeconds || 0)}
                                  {p.cheatCount > 0 ? ` • ⚠️ ${p.cheatCount} saída(s)` : ' • 🛡️ 0 saídas'}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <span
                                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                                    approved
                                      ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  Nota {Number(p.grade10 || 0).toFixed(1).replace('.', ',')}
                                </span>
                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                                  Ver Respostas →
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
      </>
    );
  };

  // ============================================================================
  // TELA INICIAL AO ENTRAR NA ÁREA DE PROVA AO VIVO (CELULAR E PC):
  // Botões compactos no celular e em grade no PC:
  // 1. "Criar Prova de Especialidade" | 2. "Prova dos Livros" | 3. "Criar Prova (Manual ou IA)" | 4. "Escanear QR Code" / "Entrar com PIN"
  // ============================================================================
  if (!isIsolatedStudentMode && !initialPin && !entryScreenConfirmed) {
    return (
      <div className="w-full max-w-4xl mx-auto py-2.5 sm:py-6 px-2 animate-fade-in">
        {renderQrScannerModal()}
        {renderAppliedExamModals()}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 text-slate-800 dark:text-white shadow-xl space-y-3.5 sm:space-y-5">
          <div className="text-center space-y-1.5">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/25 border border-indigo-200 dark:border-indigo-400/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mx-auto shadow-sm">
              <QrCode className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-50 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-400/35 text-amber-700 dark:text-amber-300 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
              Prova Ao Vivo • {isPathfinder ? 'Desbravadores' : 'Aventureiros'}
            </span>
            <h2 className="text-base sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Prova Ao Vivo
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-300 font-medium max-w-lg mx-auto">
              Escolha como deseja criar ou acessar a prova ao vivo:
            </p>
          </div>

          {entryPermissionNotice && (
            <div className="p-2.5 sm:p-3 rounded-2xl bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-400/40 text-red-700 dark:text-red-200 text-xs font-bold text-center">
              {entryPermissionNotice}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-0.5">
            {/* Botão 1: Criar Prova de Especialidade (Conselheiro+) */}
            <button
              type="button"
              onClick={() => {
                if (!hasHostPermission) {
                  setEntryPermissionNotice(
                    '🔒 O recurso de Criar Prova de Especialidade é liberado apenas de Conselheiro para cima.'
                  );
                  return;
                }
                setEntryPermissionNotice(null);
                setExamCreationMode('SPECIALTY');
                setRoleMode('HOST');
                setIsCreatingNewRoom(true);
                setEntryScreenConfirmed(true);
              }}
              className={`group relative overflow-hidden rounded-2xl sm:rounded-[22px] p-3 sm:p-4 text-left border transition-all flex flex-row sm:flex-col items-center sm:items-stretch justify-between gap-3 cursor-pointer active:scale-[0.98] ${
                hasHostPermission
                  ? 'bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-600 border-indigo-400/40 shadow-lg shadow-indigo-600/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-85 text-slate-600 dark:text-white'
              }`}
            >
              <span className="ministry-orbit-ring" aria-hidden="true">
                <span
                  className={`ministry-orbit-spinner ${
                    isPathfinder ? 'ministry-orbit-dbv' : 'ministry-orbit-avt'
                  }`}
                />
              </span>
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                    hasHostPermission
                      ? 'bg-white/15 border border-white/20 text-white'
                      : 'bg-slate-200 dark:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-600 dark:text-white'
                  }`}
                >
                  <Award className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>
                <span
                  className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                    hasHostPermission
                      ? 'bg-black/25 text-amber-300'
                      : 'bg-amber-100 dark:bg-black/25 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  Conselheiro+
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <h3
                    className={`text-xs sm:text-sm font-black uppercase tracking-tight leading-snug ${
                      hasHostPermission ? 'text-white' : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    Prova de Especialidade
                  </h3>
                  <span
                    className={`sm:hidden shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      hasHostPermission
                        ? 'bg-black/25 text-amber-300'
                        : 'bg-amber-100 dark:bg-black/25 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    Conselheiro+
                  </span>
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] font-medium leading-snug line-clamp-2 ${
                    hasHostPermission ? 'text-indigo-100/90' : 'text-slate-500 dark:text-indigo-100/90'
                  }`}
                >
                  Escolher uma especialidade oficial e abrir sala com QR Code.
                </p>
              </div>
            </button>

            {/* Botão 2: Prova dos Livros (Novo — Conselheiro+) */}
            <button
              type="button"
              onClick={() => {
                if (!hasHostPermission) {
                  setEntryPermissionNotice(
                    '🔒 O recurso de Prova dos Livros é liberado apenas de Conselheiro para cima.'
                  );
                  return;
                }
                setEntryPermissionNotice(null);
                setExamCreationMode('BOOKS');
                setSelectedSpecialty(null);
                setQuestions([]);
                setEditingQuestionIdx(null);
                setRoleMode('HOST');
                setIsCreatingNewRoom(true);
                setEntryScreenConfirmed(true);
              }}
              className={`group relative overflow-hidden rounded-2xl sm:rounded-[22px] p-3 sm:p-4 text-left border transition-all flex flex-row sm:flex-col items-center sm:items-stretch justify-between gap-3 cursor-pointer active:scale-[0.98] ${
                hasHostPermission
                  ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 hover:from-amber-400 hover:to-orange-500 border-amber-300/40 shadow-lg shadow-amber-600/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-85 text-slate-600 dark:text-white'
              }`}
            >
              <span className="ministry-orbit-ring" aria-hidden="true">
                <span
                  className={`ministry-orbit-spinner orbit-delay-1 ${
                    isPathfinder ? 'ministry-orbit-dbv' : 'ministry-orbit-avt'
                  }`}
                />
              </span>
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                    hasHostPermission
                      ? 'bg-white/15 border border-white/20 text-white'
                      : 'bg-slate-200 dark:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-600 dark:text-white'
                  }`}
                >
                  <BookOpen className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>
                <span
                  className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                    hasHostPermission
                      ? 'bg-black/25 text-amber-200'
                      : 'bg-amber-100 dark:bg-black/25 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  Biblioteca
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <h3
                    className={`text-xs sm:text-sm font-black uppercase tracking-tight leading-snug ${
                      hasHostPermission ? 'text-white' : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    Prova dos Livros
                  </h3>
                  <span
                    className={`sm:hidden shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      hasHostPermission
                        ? 'bg-black/25 text-amber-200'
                        : 'bg-amber-100 dark:bg-black/25 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    Biblioteca
                  </span>
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] font-medium leading-snug line-clamp-2 ${
                    hasHostPermission ? 'text-amber-100/95' : 'text-slate-500 dark:text-amber-100/90'
                  }`}
                >
                  Selecionar livros das Classes, Livros do Ano ou Biblioteca para criar a prova.
                </p>
              </div>
            </button>

            {/* Botão 3: Criar Prova (Manual ou Tema IA — Conselheiro+) */}
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
                setExamCreationMode('CUSTOM');
                setSelectedSpecialty(null);
                setQuestions([]);
                setEditingQuestionIdx(null);
                setRoleMode('HOST');
                setIsCreatingNewRoom(true);
                setEntryScreenConfirmed(true);
              }}
              className={`group relative overflow-hidden rounded-2xl sm:rounded-[22px] p-3 sm:p-4 text-left border transition-all flex flex-row sm:flex-col items-center sm:items-stretch justify-between gap-3 cursor-pointer active:scale-[0.98] ${
                hasHostPermission
                  ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 hover:from-violet-500 hover:to-purple-600 border-violet-400/40 shadow-lg shadow-violet-600/20 text-white'
                  : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-85 text-slate-600 dark:text-white'
              }`}
            >
              <span className="ministry-orbit-ring" aria-hidden="true">
                <span
                  className={`ministry-orbit-spinner orbit-delay-1 ${
                    isPathfinder ? 'ministry-orbit-dbv' : 'ministry-orbit-avt'
                  }`}
                />
              </span>
              <div className="flex items-center justify-between gap-2 shrink-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center ${
                    hasHostPermission
                      ? 'bg-white/15 border border-white/20 text-white'
                      : 'bg-slate-200 dark:bg-white/15 border border-slate-300 dark:border-white/20 text-slate-600 dark:text-white'
                  }`}
                >
                  <Sparkles className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>
                <span
                  className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider ${
                    hasHostPermission
                      ? 'bg-black/25 text-amber-300'
                      : 'bg-amber-100 dark:bg-black/25 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  Manual ou IA
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                <div className="flex items-center justify-between gap-1.5">
                  <h3
                    className={`text-xs sm:text-sm font-black uppercase tracking-tight leading-snug ${
                      hasHostPermission ? 'text-white' : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    Criar Prova Livre
                  </h3>
                  <span
                    className={`sm:hidden shrink-0 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                      hasHostPermission
                        ? 'bg-black/25 text-amber-300'
                        : 'bg-amber-100 dark:bg-black/25 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    Manual ou IA
                  </span>
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] font-medium leading-snug line-clamp-2 ${
                    hasHostPermission ? 'text-purple-100/90' : 'text-slate-500 dark:text-purple-100/90'
                  }`}
                >
                  Adicionar questões manualmente ou colocar o tema para a IA gerar.
                </p>
              </div>
            </button>

            {/* Botão 4: Escanear QR Code (Celular) ou Entrar na Prova com PIN (PC) */}
            {isMobileDevice ? (
              <button
                type="button"
                onClick={() => {
                  setEntryPermissionNotice(null);
                  resetStudentExamSessionState('');
                  setRoleMode('STUDENT');
                  setEntryScreenConfirmed(true);
                  setIsQrScannerOpen(true);
                }}
                className="group relative overflow-hidden rounded-2xl sm:rounded-[22px] p-3 sm:p-4 text-left bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-400/40 shadow-lg shadow-emerald-600/20 transition-all flex flex-row sm:flex-col items-center sm:items-stretch justify-between gap-3 cursor-pointer active:scale-[0.98]"
              >
                <span className="ministry-orbit-ring" aria-hidden="true">
                  <span
                    className={`ministry-orbit-spinner orbit-delay-2 ${
                      isPathfinder ? 'ministry-orbit-dbv' : 'ministry-orbit-avt'
                    }`}
                  />
                </span>
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                    <Camera className="w-5 h-5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-black/25 text-emerald-200 text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                    Área da Prova
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight leading-snug text-white">
                      Escanear QR Code
                    </h3>
                    <span className="sm:hidden shrink-0 px-2 py-0.5 rounded-full bg-black/25 text-emerald-200 text-[8px] font-black uppercase tracking-wider">
                      Área da Prova
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-emerald-100/90 font-medium leading-snug line-clamp-2">
                    Abrir a câmera do celular para ler o QR Code ou digitar o PIN da sala.
                  </p>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEntryPermissionNotice(null);
                  resetStudentExamSessionState('');
                  setRoleMode('STUDENT');
                  setEntryScreenConfirmed(true);
                }}
                className="group relative overflow-hidden rounded-2xl sm:rounded-[22px] p-3 sm:p-4 text-left bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 border border-emerald-400/40 shadow-lg shadow-emerald-600/20 transition-all flex flex-row sm:flex-col items-center sm:items-stretch justify-between gap-3 cursor-pointer active:scale-[0.98]"
              >
                <span className="ministry-orbit-ring" aria-hidden="true">
                  <span
                    className={`ministry-orbit-spinner orbit-delay-2 ${
                      isPathfinder ? 'ministry-orbit-dbv' : 'ministry-orbit-avt'
                    }`}
                  />
                </span>
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white">
                    <QrCode className="w-5 h-5 sm:w-5 sm:h-5" />
                  </div>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-black/25 text-emerald-200 text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                    Área da Prova
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight leading-snug text-white">
                      Entrar na Prova (PIN)
                    </h3>
                    <span className="sm:hidden shrink-0 px-2 py-0.5 rounded-full bg-black/25 text-emerald-200 text-[8px] font-black uppercase tracking-wider">
                      Área da Prova
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-emerald-100/90 font-medium leading-snug line-clamp-2">
                    Digitar o código PIN de 6 dígitos da sala para realizar a prova.
                  </p>
                </div>
              </button>
            )}
          </div>

          {hasHostPermission && hostRooms.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEntryPermissionNotice(null);
                setRoleMode('HOST');
                setIsCreatingNewRoom(false);
                setEntryScreenConfirmed(true);
                scrollToQrCodeSection();
              }}
              className="w-full py-2.5 sm:py-3.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-white/10 dark:hover:bg-white/15 border border-amber-300 dark:border-white/20 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <QrCode size={16} />
              <span>
                Acessar Sala(s) Aberta(s) Sincronizada(s) ({hostRooms.length})
              </span>
            </button>
          )}
        </div>

        {/* Seção de Provas Aplicadas pelo Instrutor (Criadas por você e respondidas por outros) */}
        {renderAppliedExamsSection()}

        {/* Histórico de Provas Feitas pelo Usuário Logado na Tela Inicial do App */}
        {isLoggedInUser && (
          <div className="mt-4 bg-white dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 rounded-[26px] p-4 sm:p-5 text-slate-800 dark:text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Award size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                    Meu Histórico de Provas Feitas ({studentExamHistory.length})
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                    Provas respondidas pessoalmente por você ({instructorIdentity.name || studentName || instructorIdentity.email})
                  </p>
                </div>
              </div>
            </div>

            {studentExamHistory.length === 0 ? (
              <div className="py-5 px-3 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                <BookOpen size={22} className="text-slate-400 dark:text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Você ainda não possui provas feitas por você no seu histórico pessoal.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-hide">
                {studentExamHistory.map((item) => {
                  const approved = item.scorePercent >= (item.passingScorePercent || 70);
                  return (
                    <div
                      key={item.pin}
                      onClick={() => setSelectedHistoryExam(item)}
                      className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/90 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {item.specialtyLogo ? (
                          <img
                            src={item.specialtyLogo}
                            alt={item.specialtyName}
                            className="w-10 h-10 object-contain shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                            <Award size={18} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white truncate">
                              {item.specialtyName}
                            </h4>
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-300 text-[9px] font-black">
                              #{item.pin}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                            {item.dateStr} • ⏱️ {formatTimeMMSS(item.timeSpentSeconds)}
                            {item.cheatCount > 0
                              ? ` • ⚠️ ${item.cheatCount}x (-${(item.cheatCount * 0.1).toFixed(1).replace('.', ',')} pt)`
                              : ' • 🛡️ 0 saídas'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex flex-col items-end gap-1">
                          {item.resultsReleased ? (
                            <>
                              <span
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                                  approved
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                Nota {item.grade10.toFixed(1).replace('.', ',')} ({item.scorePercent}%)
                              </span>
                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300">
                                Ver Gabarito →
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase">
                                ⏳ Aguardando Nota
                              </span>
                              <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-300">
                                Conferir →
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudentHistoryEntry(item.pin);
                          }}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 cursor-pointer"
                          title="Excluir do meu histórico"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalhes / Gabarito de Prova do Histórico */}
        {selectedHistoryExam &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed inset-0 z-[100005] bg-slate-900/65 dark:bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setSelectedHistoryExam(null)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg max-h-[88vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 rounded-[28px] p-5 text-slate-800 dark:text-white space-y-4 shadow-2xl scrollbar-hide"
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {selectedHistoryExam.specialtyLogo && (
                      <img
                        src={selectedHistoryExam.specialtyLogo}
                        alt={selectedHistoryExam.specialtyName}
                        className="w-10 h-10 object-contain shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                        Histórico de Prova • Sala #{selectedHistoryExam.pin}
                      </span>
                      <h4 className="text-sm sm:text-base font-black uppercase text-slate-900 dark:text-white truncate">
                        {selectedHistoryExam.specialtyName}
                      </h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedHistoryExam(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {selectedHistoryExam.resultsReleased ? (
                  <>
                    <div className="grid grid-cols-2 gap-2.5 text-center">
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                          Nota Final
                        </span>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          {selectedHistoryExam.grade10.toFixed(1).replace('.', ',')} / 10
                        </p>
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                          {selectedHistoryExam.correctCount}/{selectedHistoryExam.totalQuestions} acertos ({selectedHistoryExam.scorePercent}%)
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                          Tempo & Anti-Cola
                        </span>
                        <p className="text-base font-black text-amber-600 dark:text-amber-300 tabular-nums">
                          ⏱️ {formatTimeMMSS(selectedHistoryExam.timeSpentSeconds)}
                        </p>
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-300 block">
                          {selectedHistoryExam.cheatCount > 0
                            ? `⚠️ ${selectedHistoryExam.cheatCount} saída(s) (-${(selectedHistoryExam.cheatCount * 0.1).toFixed(1).replace('.', ',')} pt)`
                            : '🛡️ 0 saídas (Sem penalidade)'}
                        </span>
                      </div>
                    </div>

                    {selectedHistoryExam.questions && selectedHistoryExam.questions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                          Gabarito da Prova Realizada:
                        </span>
                        {selectedHistoryExam.questions.map((q, idx) => {
                          const chosen = selectedHistoryExam.answers?.[idx];
                          const isCorrect = chosen === q.correctIndex;
                          return (
                            <div
                              key={q.id || idx}
                              className={`p-3 rounded-2xl border text-xs space-y-1 ${
                                isCorrect
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-700/60'
                                  : 'bg-red-50/70 dark:bg-red-950/35 border-red-200 dark:border-red-800/60'
                              }`}
                            >
                              <p className="font-black text-slate-900 dark:text-white">
                                {idx + 1}. {q.question}
                              </p>
                              <p className={isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-red-700 dark:text-red-300 font-bold'}>
                                Sua resposta:{' '}
                                {chosen !== undefined
                                  ? `${String.fromCharCode(65 + chosen)}) ${q.options[chosen]}`
                                  : 'Não respondida'}{' '}
                                {isCorrect ? '✅' : '❌'}
                              </p>
                              {!isCorrect && (
                                <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                                  Correta: {String.fromCharCode(65 + q.correctIndex)}) {q.options[q.correctIndex]}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center space-y-3">
                    <Clock size={28} className="text-amber-500 dark:text-amber-400 mx-auto" />
                    <div className="space-y-1">
                      <h5 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                        Resultado Ainda Não Liberado pelo Instrutor
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Você concluiu esta prova em {selectedHistoryExam.dateStr} ({selectedHistoryExam.answeredCount}/{selectedHistoryExam.totalQuestions} respondidas). Assim que o instrutor clicar em "Liberar Resultado", sua nota e gabarito aparecerão aqui.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isRefreshingHistoryPin === selectedHistoryExam.pin}
                      onClick={() => handleRefreshHistoryEntryResult(selectedHistoryExam)}
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw
                        size={14}
                        className={isRefreshingHistoryPin === selectedHistoryExam.pin ? 'animate-spin' : ''}
                      />
                      <span>Verificar se o Resultado Foi Liberado</span>
                    </button>
                  </div>
                )}
              </div>
            </div>,
            document.body
          )}
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
    const scopedLocalAnswers =
      studentRoom?.pin && studentAnswersPinRef.current === String(studentRoom.pin)
        ? studentAnswers
        : {};
    const effectiveStudentAnswers =
      Object.keys(scopedLocalAnswers).length > 0
        ? scopedLocalAnswers
        : studentPhase === 'FINISHED' &&
          myServerRecord?.answers &&
          Object.keys(myServerRecord.answers).length > 0
        ? myServerRecord.answers
        : scopedLocalAnswers;
    const effectiveStudentCheatCount = Math.max(
      studentCheatCount,
      Number(myServerRecord?.cheatCount || 0)
    );
    const studentPayloadPreview = buildCurrentParticipantPayload(
      { cheatCount: effectiveStudentCheatCount },
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
        className={`h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col overflow-hidden ${
          studentPhase === 'PLAYING' ? 'select-none' : ''
        }`}
        onCopy={studentPhase === 'PLAYING' ? (e) => e.preventDefault() : undefined}
        onCut={studentPhase === 'PLAYING' ? (e) => e.preventDefault() : undefined}
        onContextMenu={studentPhase === 'PLAYING' ? (e) => e.preventDefault() : undefined}
      >
        {renderQrScannerModal()}
        {/* Topbar da Área de Prova (Com recuo superior apenas quando em modo isolado tela cheia) */}
        <div
          className={`shrink-0 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-5 ${
            isIsolatedStudentMode
              ? 'pt-[max(calc(env(safe-area-inset-top,0px)+12px),2.25rem)] sm:pt-3 pb-2.5'
              : 'py-2.5 sm:py-3'
          } flex items-center justify-between gap-2.5`}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 dark:bg-red-600/20 border border-red-200 dark:border-red-500/40 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
              <ShieldCheck size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block truncate">
                {studentRoom
                  ? `Sala #${studentRoom.pin} • Anti-Cola Ativo`
                  : 'Prova Ao Vivo • Anti-Cola Ativo'}
              </span>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                {studentRoom ? studentRoom.specialtyName : 'Acesso à Prova Oficial'}
              </h2>
            </div>
          </div>

          {studentPhase === 'PLAYING' ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {studentCheatCount > 0 && (
                <span className="px-2 py-1 rounded-xl bg-red-50 dark:bg-red-600/25 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-300 text-[10px] font-black uppercase whitespace-nowrap">
                  ⚠️ {studentCheatCount} (-{(studentCheatCount * 0.1).toFixed(1).replace('.', ',')})
                </span>
              )}
              <div
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-black text-xs sm:text-sm tabular-nums flex items-center gap-1.5 border whitespace-nowrap ${
                  !isUnlimitedRoomDuration(studentRoom?.durationMinutes, studentRoom?.unlimitedTime) &&
                  studentRemainingSeconds <= 60
                    ? 'bg-red-600 text-white border-red-500 animate-pulse'
                    : 'bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-slate-700'
                }`}
              >
                <Timer size={14} />
                <span>
                  {isUnlimitedRoomDuration(studentRoom?.durationMinutes, studentRoom?.unlimitedTime)
                    ? '∞ Sem Limite'
                    : formatTimeMMSS(studentRemainingSeconds)}
                </span>
              </div>
            </div>
          ) : (isIsolatedStudentMode || Boolean(initialPin)) ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  resetStudentExamSessionState('');
                  if (onExitIsolatedMode) {
                    onExitIsolatedMode();
                  } else if (hasHostPermission) {
                    setRoleMode('HOST');
                  } else if (onBack) {
                    onBack();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-[10px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <LogOut size={13} />
                <span>
                  {hasHostPermission
                    ? activeRoom
                      ? 'Painel'
                      : 'Instrutor'
                    : 'Sair'}
                </span>
              </button>
            </div>
          ) : null}
        </div>

        {/* CONTEÚDO PRINCIPAL DO ALUNO (Scroll Fluido sem Travar com Teclado Mobile) */}
        <div className="flex-1 w-full overflow-y-auto overscroll-contain px-4 py-4 sm:py-8 pb-28 scrollbar-hide">
          {/* MODAL DE ESCOLHA: ABRIR NO APP INSTALADO OU NO NAVEGADOR PADRÃO (Exibido apenas se possuir o App instalado) */}
          {showOpenModeChoiceModal && studentPhase === 'ENTER_PIN' && (
            <div className="fixed inset-0 z-[99999] bg-slate-900/65 dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 rounded-[28px] p-5 sm:p-6 shadow-2xl space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                  <Smartphone size={28} />
                </div>

                <div className="space-y-1.5">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                    App DBV Tudo Detectado
                  </span>
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    Onde deseja abrir a Prova?
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    Identificamos que você possui o aplicativo <strong>DBV Tudo</strong> instalado neste aparelho. Escolha como prefere responder à prova da sala{' '}
                    <strong className="text-amber-600 dark:text-amber-300">{studentPinInput || initialPin}</strong>:
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
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-black uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
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
            <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-5 sm:p-6 shadow-xl space-y-4">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
                  <QrCode size={28} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  Sala de Avaliação • {isPathfinder ? 'Desbravadores' : 'Aventureiros'}
                </span>
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Entrar na Prova da Especialidade
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
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
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center">
                  {qrScannedSuccessMsg}
                </div>
              )}

              <div className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
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
                    className="w-full select-text bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-3 text-center text-xl font-black tracking-[0.35em] text-amber-600 dark:text-amber-300 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
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
                    className="w-full select-text bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
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
                    className="w-full select-text bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-2xl px-4 py-3.5 text-base font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Alerta de Penalidades ao Sair da Tela da Prova */}
              <div className="bg-red-50 dark:bg-red-950/50 border-2 border-red-500/40 rounded-2xl p-4 space-y-2 text-left">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-wider">
                  <ShieldAlert size={18} className="shrink-0" />
                  <span>Alerta de Penalidades ao Sair da Tela</span>
                </div>
                <div className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium space-y-1">
                  <p>
                    ⚠️ <strong>ATENÇÃO:</strong> Durante a realização da avaliação, <strong>NÃO saia desta tela</strong>, não minimize o navegador/app, não abra outros aplicativos e não troque de aba.
                  </p>
                  <p className="text-red-600 dark:text-red-300 font-bold">
                    • Cada saída de tela gera um <strong>alerta imediato no painel do instrutor</strong>.
                  </p>
                  <p className="text-red-600 dark:text-red-300 font-bold">
                    • Penalidade automática de <strong>-0,1 ponto na nota final</strong> para cada saída registrada.
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-[10.5px]">
                    • A prova poderá ser bloqueada até que o instrutor autorize seu retorno.
                  </p>
                </div>
              </div>

              {studentError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-600/20 border border-red-300 dark:border-red-500 text-red-700 dark:text-red-200 text-xs font-bold text-center">
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
            <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-6 text-center space-y-4 shadow-xl">
              {getRoomResolvedLogo(studentRoom) ? (
                <img
                  src={getRoomResolvedLogo(studentRoom)}
                  alt={studentRoom.specialtyName}
                  className="w-24 h-24 object-contain mx-auto drop-shadow-xl"
                  referrerPolicy="no-referrer"
                />
              ) : getRoomEvaluationType(studentRoom) === 'BOOK' ? (
                <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto shadow-md">
                  <BookOpen size={36} />
                </div>
              ) : null}
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest inline-block">
                  Conectado na Sala #{studentRoom.pin}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block pt-1">
                  {getRoomEvaluationHeaderLabel(studentRoom)}
                </span>
                <h3 className="text-lg sm:text-xl font-black uppercase text-slate-900 dark:text-white">
                  {studentRoom.specialtyName.replace(/^📚\s*/, '')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  {studentRoom.questions.length} Questões • Tempo Limite:{' '}
                  {isUnlimitedRoomDuration(studentRoom.durationMinutes, studentRoom.unlimitedTime)
                    ? 'Sem limite de tempo'
                    : `${studentRoom.durationMinutes} min`}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-black text-indigo-600 dark:text-indigo-300 uppercase">
                  Participante: {studentName} ({studentUnit || 'Geral'})
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Aguarde o instrutor clicar em <strong>"Iniciar Prova"</strong>.
                </p>
              </div>

              {/* Card Anti-Cola Idêntico à Imagem 2 */}
              <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-500/40 rounded-[22px] p-4 sm:p-5 text-left shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-[#c2410c] dark:text-amber-400 font-black text-xs sm:text-sm uppercase tracking-wider">
                  <ShieldAlert size={18} className="shrink-0 text-[#c2410c] dark:text-amber-400" />
                  <span>SISTEMA ANTI-COLA ATIVADO</span>
                </div>
                <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                  Durante a prova, <strong>não minimize a tela</strong>, não troque de aba e não abra outros aplicativos. Caso a tela seja minimizada, <strong>o instrutor recebe um alerta imediato</strong>, sua prova é bloqueada e há <strong>penalidade de -0,1 ponto na nota para cada saída registrada</strong>.
                </p>
              </div>
            </div>
          )}

          {/* 3. REALIZAÇÃO DA PROVA PELO ALUNO */}
          {studentPhase === 'PLAYING' && studentRoom && activeQuestion && (
            <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-4 sm:p-6 shadow-xl space-y-4 relative">
              {/* Navegador de Questões: Texto acima e sequência de números abaixo */}
              <div className="flex flex-col gap-2.5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Questão {studentCurrentQ + 1} de {totalQuestions}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {Object.keys(studentAnswers).length}/{totalQuestions} respondidas
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                  {studentRoom.questions.map((_, idx) => {
                    const isAnswered = studentAnswers[idx] !== undefined;
                    const isCurrent = idx === studentCurrentQ;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setStudentCurrentQ(idx)}
                        className={`flex-1 min-w-[26px] max-w-[34px] h-7 sm:h-8 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                          isCurrent
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md shadow-indigo-600/30'
                            : isAnswered
                            ? 'bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-500 text-slate-900 dark:text-slate-100'
                            : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 text-slate-500 dark:text-slate-400'
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
                <h4 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white leading-relaxed">
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
                          ? 'bg-indigo-50 dark:bg-indigo-600/30 border-indigo-500 text-indigo-950 dark:text-white ring-1 ring-indigo-400'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/90 dark:hover:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
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
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={studentCurrentQ === 0}
                  onClick={() => setStudentCurrentQ((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white disabled:opacity-40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
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

          {/* 4. TELA DE CONCLUSÃO / ENTREGA DA PROVA PELO ALUNO (Ou aviso de PROVA ENCERRADA caso acesse o link após o encerramento) */}
          {studentPhase === 'FINISHED' && studentRoom && (
            <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-5 sm:p-6 text-center space-y-4 shadow-xl">
              {studentExamAlreadyClosed ||
              (Object.keys(effectiveStudentAnswers).length === 0 &&
                Number(myServerRecord?.answeredCount || 0) === 0 &&
                !studentStartTime) ? (
                <>
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400">
                    <Lock size={34} />
                  </div>

                  {getRoomResolvedLogo(studentRoom) ? (
                    <img
                      src={getRoomResolvedLogo(studentRoom)}
                      alt={studentRoom.specialtyName}
                      className="w-20 h-20 object-contain mx-auto drop-shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : null}

                  <div className="space-y-1.5">
                    <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-300 text-[10px] font-black uppercase tracking-widest inline-block">
                      🏁 Sala #{studentRoom.pin} • Avaliação Encerrada
                    </span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 pt-1">
                      {getRoomEvaluationHeaderLabel(studentRoom)}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white">
                      Prova Encerrada
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                      {studentRoom.specialtyName.replace(/^📚\s*/, '')}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto pt-1">
                      Esta prova já foi encerrada pelo instrutor e não está mais recebendo novos participantes ou respostas.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setStudentExamAlreadyClosed(false);
                      studentExamAlreadyClosedRef.current = false;
                      setStudentRoom(null);
                      setStudentPinInput('');
                      setStudentPhase('ENTER_PIN');
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <QrCode size={16} />
                    <span>Digitar Outro PIN ou Ler Novo QR Code</span>
                  </button>
                </>
              ) : studentRoom.resultsReleased ? (
                <>
                  <div
                    className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${
                      studentPayloadPreview.scorePercent >= studentRoom.passingScorePercent
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Award size={36} />
                  </div>

                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest inline-block">
                      Resultado Individual Recebido no Seu Aparelho
                    </span>
                    <p className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300 pt-1">
                      {studentPayloadPreview.name} • {studentPayloadPreview.unit}
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black uppercase text-slate-900 dark:text-white pt-0.5">
                      Nota Final: {studentPayloadPreview.grade10.toFixed(1).replace('.', ',')} / 10
                    </h3>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      Você acertou{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {studentPayloadPreview.correctCount} de {studentRoom.questions.length} questões
                      </strong>{' '}
                      ({studentPayloadPreview.scorePercent}%)
                    </p>
                    {effectiveStudentCheatCount > 0 && (
                      <p className="text-[11px] font-black text-red-600 dark:text-red-400 pt-0.5">
                        ⚠️ Penalidade por saída de tela: -{(effectiveStudentCheatCount * 0.1).toFixed(1).replace('.', ',')} pt ({effectiveStudentCheatCount}{' '}
                        {effectiveStudentCheatCount === 1 ? 'saída registrada' : 'saídas registradas'})
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/35 rounded-2xl p-3 space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300 block">
                        Tempo de Conclusão
                      </span>
                      <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-300 tabular-nums">
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
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/45 border-emerald-200 dark:border-emerald-500/40'
                          : 'bg-amber-50/70 dark:bg-amber-950/45 border-amber-200 dark:border-amber-500/40'
                      }`}
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 block">
                        Desempenho
                      </span>
                      <p
                        className={`text-sm sm:text-base font-black uppercase ${
                          studentPayloadPreview.scorePercent >= studentRoom.passingScorePercent
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        {studentPayloadPreview.scorePercent >= studentRoom.passingScorePercent
                          ? '✅ Aprovado'
                          : '📚 Revisar'}
                      </p>
                    </div>
                  </div>

                  {/* Revisão de Questões da Prova */}
                  <div className="text-left space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 max-h-80 overflow-y-auto pr-1 scrollbar-hide">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
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
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-700/60'
                              : 'bg-red-50/70 dark:bg-red-950/35 border-red-200 dark:border-red-800/60'
                          }`}
                        >
                          <p className="font-black text-slate-900 dark:text-white">
                            {idx + 1}. {q.question}
                          </p>
                          <p className={isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-red-700 dark:text-red-300 font-bold'}>
                            Sua resposta:{' '}
                            {chosen !== undefined
                              ? `${String.fromCharCode(65 + chosen)}) ${q.options[chosen]}`
                              : 'Não respondida'}{' '}
                            {isCorrect ? '✅' : '❌'}
                          </p>
                          {!isCorrect && (
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold">
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
                  <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400">
                    <Clock size={34} />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Prova Entregue com Sucesso
                    </span>
                    <h3 className="text-xl font-black uppercase text-slate-900 dark:text-white">
                      Avaliação Finalizada!
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Suas respostas foram enviadas. Aguarde o instrutor liberar o resultado da prova.
                    </p>
                  </div>

                  {/* Destaque do Tempo que o Aluno Levou para Terminar a Prova */}
                  <div className="bg-indigo-50/70 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/35 rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300 block">
                      Tempo que você levou para terminar a prova
                    </span>
                    <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-300 tabular-nums">
                      {formatDurationDetailed(
                        studentFinalTimeSpentSec ||
                          studentRoom.participants?.[studentId]?.timeSpentSeconds ||
                          1
                      )}
                    </p>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block tabular-nums">
                      Cronômetro registrado: {formatTimeMMSS(
                        studentFinalTimeSpentSec ||
                          studentRoom.participants?.[studentId]?.timeSpentSeconds ||
                          1
                      )}
                    </span>
                  </div>
                </>
              )}

              {!(
                studentExamAlreadyClosed ||
                (Object.keys(effectiveStudentAnswers).length === 0 &&
                  Number(myServerRecord?.answeredCount || 0) === 0 &&
                  !studentStartTime)
              ) && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 text-xs space-y-1.5">
                  <p className="font-bold text-slate-600 dark:text-slate-300">
                    Aluno: <span className="text-slate-900 dark:text-white">{studentName}</span>
                  </p>
                  <p className="font-bold text-slate-600 dark:text-slate-300">
                    Questões respondidas:{' '}
                    <span className="text-slate-900 dark:text-white">
                      {Object.keys(effectiveStudentAnswers).length} de {studentRoom.questions.length}
                    </span>
                  </p>
                  <p className="font-bold text-slate-600 dark:text-slate-300">
                    Status Anti-Cola:{' '}
                    {effectiveStudentCheatCount === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">0 saídas de tela (Sem penalidade)</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-black">
                        {effectiveStudentCheatCount} {effectiveStudentCheatCount === 1 ? 'saída registrada' : 'saídas registradas'} (-{(effectiveStudentCheatCount * 0.1).toFixed(1).replace('.', ',')} pt)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* HISTÓRICO DE PROVAS FEITAS PELO USUÁRIO LOGADO NO APP (Exibido nas telas ENTER_PIN e FINISHED) */}
          {isLoggedInUser && !isIsolatedStudentMode && (studentPhase === 'ENTER_PIN' || studentPhase === 'FINISHED') && (
            <div className="w-full max-w-md mx-auto mt-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] p-5 text-slate-800 dark:text-white shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <Award size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                      Meu Histórico de Provas Feitas ({studentExamHistory.length})
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Salvo na sua conta do aplicativo
                    </p>
                  </div>
                </div>
              </div>

              {studentExamHistory.length === 0 ? (
                <div className="py-5 px-3 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                  <BookOpen size={20} className="text-slate-400 dark:text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Nenhuma prova finalizada no seu histórico ainda.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-hide">
                  {studentExamHistory.map((item) => {
                    const approved = item.scorePercent >= (item.passingScorePercent || 70);
                    return (
                      <div
                        key={item.pin}
                        onClick={() => setSelectedHistoryExam(item)}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 transition-all flex items-center justify-between gap-2.5 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {item.specialtyLogo ? (
                            <img
                              src={item.specialtyLogo}
                              alt={item.specialtyName}
                              className="w-9 h-9 object-contain shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                              <Award size={16} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white truncate">
                              {item.specialtyName}
                            </h5>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                              #{item.pin} • {item.dateStr}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                              ⏱️ {formatTimeMMSS(item.timeSpentSeconds)}
                              {item.cheatCount > 0
                                ? ` • ⚠️ ${item.cheatCount}x (-${(item.cheatCount * 0.1).toFixed(1).replace('.', ',')} pt)`
                                : ' • 🛡️ 0 saídas'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end gap-1">
                            {item.resultsReleased ? (
                              <span
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                                  approved
                                    ? 'bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-300'
                                }`}
                              >
                                Nota {item.grade10.toFixed(1).replace('.', ',')}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-black uppercase">
                                ⏳ Pendente
                              </span>
                            )}
                            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                              Abrir →
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStudentHistoryEntry(item.pin);
                            }}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/15 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 cursor-pointer"
                            title="Excluir do meu histórico"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Modal de Detalhes / Gabarito de Prova do Histórico (Modo Aluno) */}
          {selectedHistoryExam &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                className="fixed inset-0 z-[100005] bg-slate-900/65 dark:bg-slate-950/88 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
                onClick={() => setSelectedHistoryExam(null)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg max-h-[88vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-indigo-500/40 rounded-[28px] p-5 text-slate-800 dark:text-white space-y-4 shadow-2xl scrollbar-hide"
                >
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {selectedHistoryExam.specialtyLogo && (
                        <img
                          src={selectedHistoryExam.specialtyLogo}
                          alt={selectedHistoryExam.specialtyName}
                          className="w-10 h-10 object-contain shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                          Histórico de Prova • Sala #{selectedHistoryExam.pin}
                        </span>
                        <h4 className="text-sm sm:text-base font-black uppercase text-slate-900 dark:text-white truncate">
                          {selectedHistoryExam.specialtyName}
                        </h4>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedHistoryExam(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {selectedHistoryExam.resultsReleased ? (
                    <>
                      <div className="grid grid-cols-2 gap-2.5 text-center">
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-0.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                            Nota Final
                          </span>
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                            {selectedHistoryExam.grade10.toFixed(1).replace('.', ',')} / 10
                          </p>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block">
                            {selectedHistoryExam.correctCount}/{selectedHistoryExam.totalQuestions} acertos ({selectedHistoryExam.scorePercent}%)
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-0.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                            Tempo & Anti-Cola
                          </span>
                          <p className="text-base font-black text-amber-600 dark:text-amber-300 tabular-nums">
                            ⏱️ {formatTimeMMSS(selectedHistoryExam.timeSpentSeconds)}
                          </p>
                          <span className="text-[10px] font-bold text-red-600 dark:text-red-300 block">
                            {selectedHistoryExam.cheatCount > 0
                              ? `⚠️ ${selectedHistoryExam.cheatCount} saída(s) (-${(selectedHistoryExam.cheatCount * 0.1).toFixed(1).replace('.', ',')} pt)`
                              : '🛡️ 0 saídas (Sem penalidade)'}
                          </span>
                        </div>
                      </div>

                      {selectedHistoryExam.questions && selectedHistoryExam.questions.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">
                            Gabarito da Prova Realizada:
                          </span>
                          {selectedHistoryExam.questions.map((q, idx) => {
                            const chosen = selectedHistoryExam.answers?.[idx];
                            const isCorrect = chosen === q.correctIndex;
                            return (
                              <div
                                key={q.id || idx}
                                className={`p-3 rounded-2xl border text-xs space-y-1 ${
                                  isCorrect
                                    ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-700/60'
                                    : 'bg-red-50/70 dark:bg-red-950/35 border-red-200 dark:border-red-800/60'
                                }`}
                              >
                                <p className="font-black text-slate-900 dark:text-white">
                                  {idx + 1}. {q.question}
                                </p>
                                <p className={isCorrect ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-red-700 dark:text-red-300 font-bold'}>
                                  Sua resposta:{' '}
                                  {chosen !== undefined
                                    ? `${String.fromCharCode(65 + chosen)}) ${q.options[chosen]}`
                                    : 'Não respondida'}{' '}
                                  {isCorrect ? '✅' : '❌'}
                                </p>
                                {!isCorrect && (
                                  <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    Correta: {String.fromCharCode(65 + q.correctIndex)}) {q.options[q.correctIndex]}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center space-y-3">
                      <Clock size={28} className="text-amber-500 dark:text-amber-400 mx-auto" />
                      <div className="space-y-1">
                        <h5 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                          Resultado Ainda Não Liberado pelo Instrutor
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Você concluiu esta prova em {selectedHistoryExam.dateStr} ({selectedHistoryExam.answeredCount}/{selectedHistoryExam.totalQuestions} respondidas). Assim que o instrutor clicar em "Liberar Resultado", sua nota e gabarito aparecerão aqui.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isRefreshingHistoryPin === selectedHistoryExam.pin}
                        onClick={() => handleRefreshHistoryEntryResult(selectedHistoryExam)}
                        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw
                          size={14}
                          className={isRefreshingHistoryPin === selectedHistoryExam.pin ? 'animate-spin' : ''}
                        />
                        <span>Verificar se o Resultado Foi Liberado</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}
        </div>

        {/* OVERLAY DE BLOQUEIO ANTI-COLA QUANDO O ALUNO MINIMIZA A TELA OU MUDA DE JANELA */}
        {(studentLocked || studentWarningModal) &&
          (studentPhase === 'PLAYING' || studentPhase === 'WAITING_HOST') &&
          typeof document !== 'undefined' &&
          createPortal(
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
                  <p className="text-[11px] font-black text-amber-300 bg-amber-500/15 border border-amber-400/30 rounded-xl py-1.5 px-3 inline-block">
                    ⚠️ Penalidade aplicada: -0,1 ponto por saída (Total acumulado: -{(studentCheatCount * 0.1).toFixed(1).replace('.', ',')} pt)
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
            </div>,
            document.body
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
      {renderAppliedExamModals()}
      {/* Barra Superior Compacta + Alternador de Múltiplas Provas (Imagem 1) */}
      <div className="bg-white dark:bg-slate-900 rounded-[22px] p-4 sm:p-4.5 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-white/10 space-y-3 overflow-hidden">
        {/* Linha 1: Título da Sala Amplo e sem cortes (Imagem 1) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0 w-full pb-1 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <h3 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-tight leading-snug break-words text-slate-900 dark:text-white">
              {activeRoom
                ? `Sala #${activeRoom.pin} — ${activeRoom.specialtyName}`
                : examCreationMode === 'BOOKS'
                ? 'Prova dos Livros (Biblioteca)'
                : examCreationMode === 'CUSTOM'
                ? 'Criar Prova (Manual ou Tema com IA)'
                : 'Criar Prova de Especialidade'}
            </h3>
          </div>

          {activeRoom && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                {activeRoom.status === 'ACTIVE'
                  ? '🟢 Em Andamento'
                  : activeRoom.status === 'FINISHED'
                  ? '🏁 Encerrada'
                  : '⏳ Aguardando Alunos'}
              </span>
            </div>
          )}
        </div>

        {/* Linha 2: Botões de Adicionar Nova Prova posicionados abaixo do título da sala (Imagem 1) */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            {hostRooms.length > 0 && !isCreatingNewRoom && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setExamCreationMode('SPECIALTY');
                    setIsCreatingNewRoom(true);
                  }}
                  className="justify-center px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-indigo-600/20 transition-all whitespace-nowrap active:scale-[0.98]"
                  title="Criar uma nova prova de especialidade"
                >
                  <Plus size={14} className="shrink-0" />
                  <span>+ Especialidade</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExamCreationMode('BOOKS');
                    setIsCreatingNewRoom(true);
                  }}
                  className="justify-center px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-amber-600/20 transition-all whitespace-nowrap active:scale-[0.98]"
                  title="Criar uma prova baseada nos livros"
                >
                  <BookOpen size={13} className="shrink-0" />
                  <span>Prova dos Livros</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExamCreationMode('CUSTOM');
                    setIsCreatingNewRoom(true);
                  }}
                  className="justify-center px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-violet-600/20 transition-all whitespace-nowrap active:scale-[0.98]"
                  title="Criar prova adicionando questões manualmente ou pelo tema com IA"
                >
                  <Sparkles size={13} className="shrink-0" />
                  <span>Manual / IA</span>
                </button>
              </>
            )}

            {hostRooms.length > 0 && isCreatingNewRoom && (
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewRoom(false);
                  scrollToQrCodeSection();
                }}
                className="justify-center px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
              >
                <ChevronLeft size={14} className="shrink-0" />
                <span>Voltar às Provas ({hostRooms.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isMobileDevice && (
              <button
                type="button"
                onClick={() => {
                  resetStudentExamSessionState('');
                  setRoleMode('STUDENT');
                  setEntryScreenConfirmed(true);
                  setIsQrScannerOpen(true);
                }}
                className="md:hidden justify-center px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 border border-amber-300 dark:border-amber-400/40 text-amber-800 dark:text-amber-200 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Escanear QR Code de uma sala de prova com a câmera do celular"
              >
                <Camera size={13} className="shrink-0" />
                <span>Escanear QR Code</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                resetStudentExamSessionState(activeRoom?.pin || '');
                setRoleMode('STUDENT');
              }}
              className="justify-center px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/15 dark:hover:bg-white/25 border border-slate-200 dark:border-white/20 text-slate-700 dark:text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <QrCode size={13} className="shrink-0" />
              <span>{activeRoom ? 'Testar como Aluno' : 'Entrar como Aluno'}</span>
            </button>
          </div>
        </div>

        {/* BARRA DE ABAS DE MÚLTIPLAS PROVAS ABERTAS SIMULTANEAMENTE (No celular: título em cima e provas abertas abaixo) */}
        {hostRooms.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-white/10">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300 shrink-0 sm:mr-1">
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
                      scrollToQrCodeSection();
                    }}
                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all shrink-0 cursor-pointer ${
                      isSelectedTab
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
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
                            isSelectedTab ? 'bg-black/25 text-amber-300' : 'bg-amber-100 dark:bg-slate-800 text-amber-800 dark:text-amber-400'
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
                      className={`p-0.5 rounded-md hover:bg-red-500/20 transition-colors cursor-pointer ${isSelectedTab ? 'text-white/80 hover:text-white' : 'text-slate-400 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-200'}`}
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
          MODO 1 DO INSTRUTOR: CONFIGURAR ESPECIALIDADE, PROVA DOS LIVROS OU PROVA PERSONALIZADA (MANUAL / TEMA IA)
         ======================================================================== */}
      {!activeRoom && (
        <div className="space-y-3">
          {/* Seletor Superior de Modalidade de Criação (3 Opções: Especialidade | Prova dos Livros | Manual ou IA) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setExamCreationMode('SPECIALTY');
                setCustomThemeNotice(null);
              }}
              className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                examCreationMode === 'SPECIALTY'
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 hover:bg-indigo-50/50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  examCreationMode === 'SPECIALTY'
                    ? 'bg-white/20 text-white'
                    : 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                }`}
              >
                <Award size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-black uppercase tracking-tight leading-snug break-words">
                  Prova de Especialidade
                </p>
                <p
                  className={`text-[10px] sm:text-xs font-medium leading-snug mt-0.5 ${
                    examCreationMode === 'SPECIALTY' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Catálogo oficial de especialidades
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setExamCreationMode('BOOKS');
                setCustomThemeNotice(null);
              }}
              className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                examCreationMode === 'BOOKS'
                  ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-slate-800 hover:bg-amber-50/50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  examCreationMode === 'BOOKS'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300'
                }`}
              >
                <BookOpen size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-black uppercase tracking-tight leading-snug break-words">
                  Prova dos Livros
                </p>
                <p
                  className={`text-[10px] sm:text-xs font-medium leading-snug mt-0.5 ${
                    examCreationMode === 'BOOKS' ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Escolher livro das Classes, Ano ou Biblioteca
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setExamCreationMode('CUSTOM');
                setCustomThemeNotice(null);
              }}
              className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                examCreationMode === 'CUSTOM'
                  ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/20'
                  : 'bg-white dark:bg-slate-800 hover:bg-violet-50/50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  examCreationMode === 'CUSTOM'
                    ? 'bg-white/20 text-white'
                    : 'bg-violet-50 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300'
                }`}
              >
                <Sparkles size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-black uppercase tracking-tight leading-snug break-words">
                  Criar Prova (Manual ou IA)
                </p>
                <p
                  className={`text-[10px] sm:text-xs font-medium leading-snug mt-0.5 ${
                    examCreationMode === 'CUSTOM' ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Adicionar questões manualmente ou por tema
                </p>
              </div>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Coluna Esquerda: Escolher Especialidade, Livro OU Configurar Tema/Manual + Regras da Sala */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
              {/* Bloco 1: Quantidade de Questões e Tempo de Prova (Acima da Escolha da Especialidade) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    1. Quantidade de Questões e Tempo Limite
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    Configuração da Prova
                  </span>
                </div>

                {/* Bloco: Nº de Questões */}
                <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Nº de Questões (IA / Prova)
                    </label>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase">
                      {questionCount} {questionCount === 1 ? 'questão' : 'questões'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl">
                    {[5, 10, 15, 20, 25, 30, 40, 50].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => {
                          setQuestionCount(cnt);
                          if (!isGeneratingQuestions) {
                            if (examCreationMode === 'SPECIALTY' && selectedSpecialty) {
                              handleSelectSpecialtyForExam(selectedSpecialty, cnt);
                            } else if (examCreationMode === 'BOOKS' && selectedBookForExam) {
                              handleSelectBookForExam(selectedBookForExam, undefined, cnt);
                            }
                          }
                        }}
                        className={`py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                          questionCount === cnt
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap sm:flex-nowrap">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Personalizar quantidade (1 a 100):
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Diminuir 1 questão"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={questionCount}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          if (!Number.isNaN(raw)) {
                            setQuestionCount(Math.max(1, Math.min(100, raw)));
                          }
                        }}
                        className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center text-xs font-black text-indigo-600 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setQuestionCount(Math.min(100, questionCount + 1))}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Aumentar 1 questão"
                      >
                        +
                      </button>
                      {!isGeneratingQuestions &&
                        questions.length > 0 &&
                        questions.length !== questionCount &&
                        ((examCreationMode === 'SPECIALTY' && selectedSpecialty) ||
                          (examCreationMode === 'BOOKS' && selectedBookForExam) ||
                          (examCreationMode === 'CUSTOM' && customExamTitle.trim())) && (
                          <button
                            type="button"
                            onClick={() => {
                              if (examCreationMode === 'SPECIALTY' && selectedSpecialty) {
                                handleSelectSpecialtyForExam(selectedSpecialty, questionCount);
                              } else if (examCreationMode === 'BOOKS' && selectedBookForExam) {
                                handleSelectBookForExam(selectedBookForExam, undefined, questionCount);
                              } else if (examCreationMode === 'CUSTOM') {
                                handleGenerateCustomThemeQuestions(questionCount);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer whitespace-nowrap"
                          >
                            Gerar {questionCount}
                          </button>
                        )}
                    </div>
                  </div>
                </div>

                {/* Bloco: Tempo Limite */}
                <div className="bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tempo Limite da Prova
                    </label>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        durationMinutes <= 0
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                      }`}
                    >
                      {durationMinutes <= 0 ? '∞ Sem Tempo Limite' : `${durationMinutes} min`}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl">
                    {[
                      { mins: 0, label: '∞ Livre' },
                      { mins: 10, label: '10m' },
                      { mins: 15, label: '15m' },
                      { mins: 25, label: '25m' },
                      { mins: 30, label: '30m' },
                      { mins: 45, label: '45m' },
                      { mins: 60, label: '60m' },
                      { mins: 90, label: '90m' }
                    ].map((opt) => (
                      <button
                        key={opt.mins}
                        type="button"
                        onClick={() => setDurationMinutes(opt.mins)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-black cursor-pointer transition-all whitespace-nowrap ${
                          durationMinutes === opt.mins
                            ? opt.mins === 0
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap sm:flex-nowrap">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Outro tempo em minutos (0 = sem limite):
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(Math.max(0, durationMinutes - 5))}
                        className="px-2 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Diminuir 5 minutos"
                      >
                        -5m
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={300}
                        value={durationMinutes}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value, 10);
                          if (e.target.value === '') {
                            setDurationMinutes(0);
                          } else if (!Number.isNaN(raw)) {
                            setDurationMinutes(Math.max(0, Math.min(300, raw)));
                          }
                        }}
                        className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-center text-xs font-black text-indigo-600 dark:text-indigo-300 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(Math.min(300, (durationMinutes <= 0 ? 25 : durationMinutes) + 5))}
                        className="px-2 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Aumentar 5 minutos"
                      >
                        +5m
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bloco: Opção Anti-Cola */}
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

              {/* Bloco 2: Seleção de Conteúdo da Prova */}
              {examCreationMode === 'SPECIALTY' ? (
                <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    2. Escolha a Especialidade no Catálogo Oficial
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
                </div>
              ) : examCreationMode === 'BOOKS' ? (
                <>
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                    1. Escolha o Livro da Biblioteca para Criar a Prova
                  </h4>

                  {/* Busca e Filtro de Categoria de Livros */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={bookSearchQuery}
                        onChange={(e) => setBookSearchQuery(e.target.value)}
                        placeholder="Buscar livro pelo título, classe ou autor..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'TODOS', label: `Todos (${booksCatalog.length})` },
                        { id: 'CLASSES', label: 'Livro das Classes' },
                        { id: 'ANO_DBV', label: 'Livros do Ano' },
                        { id: 'OUTROS_DBV', label: 'Outros Livros' },
                        { id: 'AVT', label: 'Aventureiros' }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setBookCategoryFilter(cat.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                            bookCategoryFilter === cat.id
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Livros do Catálogo */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-hide border border-slate-100 dark:border-slate-700/60 rounded-2xl p-2 bg-slate-50/50 dark:bg-slate-900/40">
                    {isLoadingBooksCatalog ? (
                      <div className="py-8 text-center text-xs font-bold text-slate-400">
                        Carregando livros da biblioteca...
                      </div>
                    ) : filteredBooksCatalog.length === 0 ? (
                      <div className="py-8 text-center text-xs font-bold text-slate-400">
                        Nenhum livro encontrado para este filtro.
                      </div>
                    ) : (
                      filteredBooksCatalog.map((book) => {
                        const isSelected = selectedBookForExam?.uid === book.uid;
                        return (
                          <button
                            key={book.uid}
                            type="button"
                            onClick={() => handleSelectBookForExam(book)}
                            className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 hover:bg-amber-50/60 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700'
                            }`}
                          >
                            {book.cover ? (
                              <img
                                src={getImageUrl(book.cover)}
                                alt={book.title}
                                className="w-9 h-12 object-cover rounded-lg shrink-0 border border-black/10"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div
                                className={`w-9 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300'
                                }`}
                              >
                                <BookOpen size={16} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black truncate">{book.title}</p>
                              <p
                                className={`text-[10px] font-bold truncate ${
                                  isSelected ? 'text-amber-100' : 'text-slate-400'
                                }`}
                              >
                                {book.categoryLabel}
                                {book.badgeText ? ` • ${book.badgeText}` : ''}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Instruções Opcionais de Capítulo/Foco do Livro */}
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Capítulos ou Foco Específico do Livro (Opcional)
                      </label>
                      <input
                        type="text"
                        value={bookChapterFocus}
                        onChange={(e) => setBookChapterFocus(e.target.value)}
                        placeholder="Ex: Capítulos 1 a 4, personagens principais, lições..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {bookExamNotice && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-[11px] font-bold">
                        {bookExamNotice}
                      </div>
                    )}

                    {selectedBookForExam && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={isGeneratingQuestions}
                          onClick={() => handleSelectBookForExam(selectedBookForExam)}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer transition-all"
                        >
                          <Sparkles size={14} className="shrink-0" />
                          <span>Gerar do Livro com IA</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddManualQuestion}
                          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Plus size={14} className="shrink-0" />
                          <span>Questão Manual</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">
                    1. Configurar Tema da Prova ou Criação Manual
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Título / Tema da Prova *
                      </label>
                      <input
                        type="text"
                        value={customExamTitle}
                        onChange={(e) => {
                          setCustomExamTitle(e.target.value);
                          if (customThemeNotice) setCustomThemeNotice(null);
                        }}
                        placeholder="Ex: Livro de Êxodo, História do Clube, Nós e Amarras..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                        Instruções ou Assunto Específico para a IA (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={customExamTopicDetails}
                        onChange={(e) => setCustomExamTopicDetails(e.target.value)}
                        placeholder="Ex: Capítulos 1 a 10, nível médio para desbravadores, focar em datas e personagens..."
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white focus:border-violet-500 focus:outline-none resize-none"
                      />
                    </div>

                    {customThemeNotice && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-[11px] font-bold">
                        {customThemeNotice}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        disabled={isGeneratingQuestions}
                        onClick={handleGenerateCustomThemeQuestions}
                        className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-violet-600/20 cursor-pointer transition-all"
                      >
                        <Sparkles size={14} className="shrink-0" />
                        <span>Gerar com IA pelo Tema</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddManualQuestion}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Plus size={14} className="shrink-0" />
                        <span>Adicionar Questão Manual</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
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
                      {examCreationMode === 'CUSTOM'
                        ? customExamTitle.trim()
                          ? `Tema: ${customExamTitle.trim()}`
                          : 'Adicione questões manualmente ou digite um tema ao lado para a IA gerar.'
                        : examCreationMode === 'BOOKS'
                        ? selectedBookForExam
                          ? `Livro selecionado: ${selectedBookForExam.title}`
                          : 'Selecione um livro na biblioteca ao lado para gerar as questões.'
                        : selectedSpecialty
                        ? `Especialidade selecionada: ${selectedSpecialty.nome}`
                        : 'Selecione uma especialidade ao lado para gerar as questões automaticamente.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {examCreationMode === 'SPECIALTY' && selectedSpecialty && (
                      <button
                        type="button"
                        disabled={isGeneratingQuestions}
                        onClick={() => handleSelectSpecialtyForExam(selectedSpecialty)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={12} />
                        <span>Regerar com IA</span>
                      </button>
                    )}

                    {examCreationMode === 'BOOKS' && selectedBookForExam && (
                      <button
                        type="button"
                        disabled={isGeneratingQuestions}
                        onClick={() => handleSelectBookForExam(selectedBookForExam)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={12} />
                        <span>Regerar do Livro com IA</span>
                      </button>
                    )}

                    {examCreationMode === 'CUSTOM' && (
                      <button
                        type="button"
                        disabled={isGeneratingQuestions}
                        onClick={handleGenerateCustomThemeQuestions}
                        className="px-3 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-600 dark:text-violet-300 border border-violet-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles size={12} />
                        <span>Gerar com IA</span>
                      </button>
                    )}

                    {(selectedSpecialty || selectedBookForExam || examCreationMode === 'CUSTOM') && (
                      <button
                        type="button"
                        onClick={handleAddManualQuestion}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Adicionar Questão</span>
                      </button>
                    )}
                  </div>
                </div>

                {isGeneratingQuestions ? (
                  <div className="py-16 text-center space-y-2">
                    <RefreshCw size={28} className="animate-spin text-indigo-500 mx-auto" />
                    <p className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">
                      {examCreationMode === 'CUSTOM'
                        ? `Elaborando ${questionCount} questões com IA sobre "${customExamTitle.trim()}"...`
                        : examCreationMode === 'BOOKS'
                        ? `Elaborando ${questionCount} questões do livro "${selectedBookForExam?.title || customExamTitle.trim()}"...`
                        : `Elaborando questões oficiais da especialidade ${selectedSpecialty?.nome}...`}
                    </p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="py-10 sm:py-14 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-3">
                    <BookOpen size={28} className="text-slate-400 mx-auto" />
                    {examCreationMode === 'CUSTOM' ? (
                      <>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          Digite o tema da prova ao lado e clique em <strong>"Gerar com IA pelo Tema"</strong>, ou adicione suas próprias questões manualmente:
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleAddManualQuestion}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Plus size={14} />
                            <span>Adicionar 1ª Questão Manualmente</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleGenerateCustomThemeQuestions}
                            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Sparkles size={14} />
                            <span>Gerar Questões com IA</span>
                          </button>
                        </div>
                      </>
                    ) : examCreationMode === 'BOOKS' ? (
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Clique em um livro na lista ao lado (Livro das Classes, Livros do Ano, Outros Livros ou Aventureiros) para elaborar as questões da prova automaticamente.
                      </p>
                    ) : (
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Clique em uma especialidade na lista ao lado para montar as questões da prova e gerar o QR Code.
                      </p>
                    )}
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
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingQuestionIdx(isEditing ? null : qIdx)}
                                className="px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                                title="Editar questão"
                              >
                                <Edit3 size={12} />
                                <span>{isEditing ? 'Fechar' : 'Editar'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setQuestions((prev) => prev.filter((_, i) => i !== qIdx));
                                  setEditingQuestionIdx((prevIdx) => {
                                    if (prevIdx === null) return null;
                                    if (prevIdx === qIdx) return null;
                                    return prevIdx > qIdx ? prevIdx - 1 : prevIdx;
                                  });
                                }}
                                className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                                title="Remover questão"
                              >
                                <Trash2 size={12} />
                                <span>Remover</span>
                              </button>
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
                                placeholder="Digite o enunciado da pergunta..."
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-800 dark:text-white"
                              />
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                Clique na letra (A, B, C ou D) para definir a alternativa correta:
                              </p>
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
                                      placeholder={`Alternativa ${String.fromCharCode(65 + oIdx)}`}
                                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-800 dark:text-white"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingQuestionIdx(null)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  Concluir Edição
                                </button>
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
                disabled={
                  (examCreationMode === 'SPECIALTY' && !selectedSpecialty) ||
                  (examCreationMode === 'BOOKS' && !selectedBookForExam && !customExamTitle.trim()) ||
                  questions.length === 0 ||
                  isGeneratingQuestions
                }
                onClick={handleCreateLiveExamRoom}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-40 text-white rounded-2xl font-black uppercase tracking-wider text-xs sm:text-sm shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <QrCode size={18} />
                <span>Abrir Sala</span>
              </button>
            </div>
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
                {getRoomResolvedLogo(activeRoom) ? (
                  <img
                    src={getRoomResolvedLogo(activeRoom)}
                    alt={activeRoom.specialtyName}
                    className="w-10 h-10 object-contain rounded-lg shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : getRoomEvaluationType(activeRoom) === 'BOOK' ? (
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
                    <BookOpen size={18} />
                  </div>
                ) : null}
                <div className="min-w-0">
                  <span
                    className={`text-[9px] font-black uppercase tracking-widest block ${
                      getRoomEvaluationType(activeRoom) === 'BOOK'
                        ? 'text-amber-600 dark:text-amber-400'
                        : getRoomEvaluationType(activeRoom) === 'CUSTOM'
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    {getRoomEvaluationHeaderLabel(activeRoom)} • {activeRoom.questions.length} Questões
                  </span>
                  <h4 className="text-sm sm:text-base font-black uppercase text-slate-800 dark:text-white leading-tight break-words">
                    {activeRoom.specialtyName.replace(/^📚\s*/, '')}
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
              <div ref={activeRoomQrSectionRef} className="lg:col-span-6 flex flex-col justify-between gap-3">
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
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <div className="w-full min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl py-2 px-2 text-center border border-slate-200 dark:border-slate-800">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                          Código PIN da Sala
                        </span>
                        <p className="text-sm sm:text-base md:text-lg font-black tracking-widest text-amber-600 dark:text-amber-400 leading-tight truncate">
                          {activeRoom.pin}
                        </p>
                      </div>

                      <div className="w-full min-w-0 overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl py-2 px-2 text-center border border-slate-200 dark:border-slate-800">
                        <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block truncate">
                          {activeRoom.status === 'FINISHED'
                            ? 'Status'
                            : isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime)
                            ? 'Tempo'
                            : 'Tempo Restante'}
                        </span>
                        <div
                          className={`text-xs sm:text-sm md:text-base font-black tabular-nums leading-tight flex items-center justify-center gap-1 ${
                            activeRoom.status === 'FINISHED'
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          <Timer size={13} className="shrink-0" />
                          <span className="truncate">
                            {activeRoom.status === 'FINISHED'
                              ? 'Encerrada'
                              : isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime)
                              ? '∞ Sem Limite'
                              : formatTimeMMSS(hostRemainingSeconds)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSoundAlertsEnabled((prev) => !prev)}
                      className={`w-full py-2 px-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1.5 border cursor-pointer ${
                        soundAlertsEnabled
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {soundAlertsEnabled ? <Volume2 size={12} className="shrink-0" /> : <VolumeX size={12} className="shrink-0" />}
                      <span className="truncate">{soundAlertsEnabled ? 'Som Anti-Cola Ativo' : 'Som Anti-Cola Mudo'}</span>
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
                      {(() => {
                        const seenKeys = new Set<string>();
                        const uniqueAlerts = activeRoom.alerts.filter((al) => {
                          const key = `${al.studentId || ''}_v${al.violationNumber || 0}`;
                          if (seenKeys.has(key)) return false;
                          seenKeys.add(key);
                          return true;
                        });
                        return uniqueAlerts.map((al) => {
                          const stu = activeRoom.participants[al.studentId];
                          const isLockedForThisAlert =
                            Boolean(stu?.isLocked) &&
                            stu?.status !== 'DISQUALIFIED' &&
                            Number(al.violationNumber || 0) >= Number(stu?.cheatCount || 0);
                          const wasAlreadyUnlocked =
                            Number(stu?.unlockedCheatCount || 0) >= Number(al.violationNumber || 0);

                          return (
                            <div
                              key={al.id}
                              className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-[11px] font-black text-red-800 dark:text-red-200 truncate">
                                  🚨 {al.studentName} ({al.studentUnit}) — {al.violationNumber}ª saída (-0,1 pt) às {al.timestamp}
                                </p>
                              </div>
                              {isLockedForThisAlert ? (
                                <button
                                  type="button"
                                  onClick={() => handleUnlockStudent(al.studentId)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase shrink-0 cursor-pointer"
                                >
                                  Liberar
                                </button>
                              ) : wasAlreadyUnlocked ? (
                                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase shrink-0">
                                  Liberado
                                </span>
                              ) : null}
                            </div>
                          );
                        });
                      })()}
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
                    <div className="space-y-2 w-full">
                      {!isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime) ? (
                        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => handleAddExtraTime(5)}
                            className="py-2 px-1 sm:px-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[9px] sm:text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Clock size={11} className="shrink-0" />
                            <span>+5m</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddExtraTime(15)}
                            className="py-2 px-1 sm:px-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[9px] sm:text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Clock size={11} className="shrink-0" />
                            <span>+15m</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSetRoomUnlimitedTime}
                            className="py-2 px-1 sm:px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[9px] sm:text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer"
                            title="Deixar esta prova sem tempo limite"
                          >
                            <span>∞ Livre</span>
                          </button>
                        </div>
                      ) : (
                        <div className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase flex items-center justify-center gap-1.5">
                          <Clock size={12} className="shrink-0" />
                          <span>∞ Prova Sem Limite de Tempo</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={handleFinishExamForAll}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] sm:text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
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
                        onClick={() => handleReleaseResultsForAll(activeRoom)}
                        className={`w-full py-3 px-4 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                          activeRoom.resultsReleased
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                        }`}
                      >
                        <Award size={16} className="shrink-0" />
                        <span>
                          {activeRoom.resultsReleased
                            ? 'Retirar Resultado'
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
              <div className="py-6 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-1.5">
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
                  const canViewStudentResult = activeRoom.status !== 'WAITING';

                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (canViewStudentResult) setInspectingStudent(p);
                      }}
                      title={canViewStudentResult ? 'Clique para abrir o resultado da prova' : undefined}
                      className={`px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                        canViewStudentResult ? 'cursor-pointer hover:brightness-105 active:scale-[0.99]' : ''
                      } ${
                        p.status === 'LOCKED_CHEAT'
                          ? 'bg-red-50/90 dark:bg-red-950/50 border-red-500 ring-1 ring-red-500/40'
                          : p.status === 'FINISHED'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/70 dark:border-emerald-800/60'
                          : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {p.name}
                          </h5>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[8px] font-black uppercase shrink-0">
                            {p.unit}
                          </span>
                          {p.cheatCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-md bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 text-[8px] font-black shrink-0">
                              ⚠️ {p.cheatCount}x
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {p.status === 'WAITING'
                            ? 'Na sala aguardando início'
                            : `Questão ${Math.min(totalQ, p.currentQuestionIdx + 1)}/${totalQ} • ${p.answeredCount}/${totalQ} respondidas`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
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
                            ? `✅ Nota ${p.grade10.toFixed(1).replace('.', ',')}`
                            : p.status === 'DISQUALIFIED'
                            ? '⛔ Desclassificado'
                            : p.status === 'PLAYING'
                            ? '🟢 Respondendo'
                            : '⏳ Na Sala'}
                        </span>

                        {p.isLocked && (
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
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEÇÃO DE PROVAS APLICADAS PELO INSTRUTOR (SEMPRE VISÍVEL NO PAINEL DO INSTRUTOR) */}
      {renderAppliedExamsSection()}

      {/* OVERLAY SOBRE O MENU LATERAL ESQUERDO DO PC COM A LISTA DE QUEM ESTÁ FAZENDO A PROVA */}
      {!isIsolatedStudentMode &&
        roleMode === 'HOST' &&
        activeRoom &&
        sidebarOverlayTarget &&
        createPortal(
          <div
            className="absolute inset-0 z-40 bg-white/95 dark:bg-slate-950/92 backdrop-blur-xl flex flex-col justify-between p-3.5 lg:p-4 animate-fade-in text-slate-800 dark:text-white cursor-default select-none shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {isSidebarOpen ? (
              <>
                {/* Topo do Overlay sobre o Menu Lateral */}
                <div className="w-full space-y-2.5 pb-2.5 border-b border-slate-200 dark:border-white/10 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-400/35 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-200">
                        Fazendo a Prova ({participantsList.length})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleSidebar?.(false)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer"
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
                      <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white truncate">
                        {activeRoom.specialtyName}
                      </h4>
                      <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 tracking-wider block">
                        PIN #{activeRoom.pin} • {participantsList.filter((p) => p.status === 'FINISHED').length} entregaram
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lista ao Vivo de Quem Está Fazendo a Prova sobre o Menu Lateral */}
                <div className="flex-1 overflow-y-auto space-y-2 my-2.5 pr-1 scrollbar-hide">
                  {participantsList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-white/15 rounded-2xl space-y-2">
                      <Users size={24} className="text-indigo-500 dark:text-indigo-400/80 mx-auto" />
                      <p className="text-xs font-black uppercase text-slate-800 dark:text-white/90">
                        Nenhum aluno na sala ainda
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        Assim que escanearem o QR Code ou digitarem o PIN <strong className="text-amber-600 dark:text-amber-400">#{activeRoom.pin}</strong>, aparecerão listados aqui.
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
                            canViewStudentResult ? 'cursor-pointer hover:brightness-105 active:scale-[0.99]' : ''
                          } ${
                            p.status === 'LOCKED_CHEAT'
                              ? 'bg-red-50 dark:bg-red-950/75 border-red-500 ring-1 ring-red-500/40'
                              : p.status === 'FINISHED'
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/45 border-emerald-300 dark:border-emerald-500/40'
                              : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200/80 dark:border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1 flex-wrap">
                                <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                  {p.name}
                                </h5>
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-[8px] font-black uppercase shrink-0">
                                  {p.unit}
                                </span>
                              </div>
                              <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
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
                                  : 'bg-amber-100 dark:bg-amber-500/25 text-amber-800 dark:text-amber-300'
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

                          <div className="flex items-center justify-between gap-1 pt-0.5">
                            <div className="flex items-center gap-1 text-[8.5px] font-black flex-wrap">
                              {p.timeSpentSeconds !== undefined && p.timeSpentSeconds > 0 && p.status === 'FINISHED' && (
                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                                  ⏱️ {formatTimeMMSS(p.timeSpentSeconds)}
                                </span>
                              )}
                              {p.cheatCount > 0 && (
                                <span className="px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-500/25 text-red-700 dark:text-red-300">
                                  ⚠️ {p.cheatCount}x (-{(p.cheatCount * 0.1).toFixed(1).replace('.', ',')})
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
                                    className="px-2 py-0.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/35 text-red-700 dark:text-red-300 text-[8.5px] font-black uppercase flex items-center gap-0.5 cursor-pointer"
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
                                  className="px-2 py-0.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-[8.5px] font-black uppercase flex items-center gap-0.5 cursor-pointer"
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
                <div className="pt-2 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                  <span>Na Sala: {participantsList.length}</span>
                  <span className={activeRoom.alerts.length > 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}>
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
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
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

                <span className="text-[9px] font-black uppercase text-slate-600 dark:text-white/80 hover:text-slate-900 dark:hover:text-white">
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
              className={`text-white flex flex-col justify-between transition-all overflow-y-auto scrollbar-hide relative ${
                isQrTelaoExpanded
                  ? 'w-full h-full p-5 sm:p-9 gap-4 sm:gap-5'
                  : 'w-full max-w-6xl max-h-[94vh] rounded-[32px] border border-indigo-500/35 shadow-2xl p-4 sm:p-7 gap-4 sm:gap-5'
              }`}
            >
              {/* Botão Fechar Dedicado no Topo Direito no Celular (Imagem 2) */}
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
                className="md:hidden absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X size={18} />
              </button>

              {/* Barra Superior do Modal (Centralizada no Celular e Completa no PC) */}
              <div className="w-full flex items-center justify-between gap-3 pb-3 sm:pb-3.5 border-b border-white/12 shrink-0">
                <div className="hidden md:flex items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/35 text-amber-300 text-[11px] font-black uppercase tracking-[0.14em]">
                    <QrCode size={14} />
                    <span>
                      {activeRoom.status === 'WAITING'
                        ? 'SALA ABERTA'
                        : 'PROVA EM ANDAMENTO'}
                    </span>
                  </div>
                  {getRoomResolvedLogo(activeRoom) && (
                    <img
                      src={getRoomResolvedLogo(activeRoom)}
                      alt={activeRoom.specialtyName}
                      className="w-9 h-9 object-contain drop-shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                {/* Título Centralizado no Celular e PC (Imagem 2) */}
                <div className="text-center flex-1 px-8 sm:px-2 min-w-0">
                  <span
                    className={`font-black uppercase tracking-[0.18em] block text-[10px] sm:text-xs mb-0.5 ${
                      getRoomEvaluationType(activeRoom) === 'BOOK'
                        ? 'text-amber-400'
                        : getRoomEvaluationType(activeRoom) === 'CUSTOM'
                        ? 'text-violet-400'
                        : 'text-indigo-400'
                    }`}
                  >
                    {getRoomEvaluationHeaderLabel(activeRoom)}
                  </span>
                  <h2
                    className={`font-black uppercase tracking-tight leading-tight text-white truncate ${
                      isQrTelaoExpanded
                        ? 'text-xl sm:text-3xl lg:text-4xl'
                        : 'text-base sm:text-xl lg:text-2xl'
                    }`}
                  >
                    {activeRoom.specialtyName.replace(/^📚\s*/, '')}
                  </h2>
                </div>

                <div className="hidden md:flex items-center gap-2">
                  {isSecondScreenActive ? (
                    <button
                      type="button"
                      onClick={handleCloseProjectionWindow}
                      className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-red-600/25 transition-all"
                      title="Fechar a janela de projeção do Telão"
                      aria-label="Fechar Projeção"
                    >
                      <Monitor size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleProjectQrToAnotherScreen}
                      className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/25 transition-all"
                      title="Projetar em Outra Tela (Telão)"
                      aria-label="Projetar em Outra Tela (Telão)"
                    >
                      <Monitor size={18} />
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
                        } else {
                          setIsQrTelaoExpanded((prev) => !prev);
                        }
                      } catch {
                        setIsQrTelaoExpanded((prev) => !prev);
                      }
                    }}
                    title={isQrTelaoExpanded ? 'Sair da Tela Cheia' : 'Tela Cheia (F11)'}
                    aria-label={isQrTelaoExpanded ? 'Sair da Tela Cheia' : 'Tela Cheia (F11)'}
                    className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-white/20 text-white flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    {isQrTelaoExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
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
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Conteúdo do Modal (Centralizado e Direto no Celular / 2 Colunas no PC) */}
              <div className="w-full flex flex-col md:flex-row items-center md:items-stretch flex-1 min-h-0 gap-4 sm:gap-6 my-auto justify-center">
                {/* Coluna Central/Esquerda: PIN e QR Code perfeitamente alinhados ao centro */}
                <div
                  className={`w-full max-w-md md:max-w-none md:w-[360px] lg:w-[420px] shrink-0 flex flex-col items-center justify-center text-center bg-slate-900/85 border-2 border-indigo-500/35 shadow-xl ${
                    isQrTelaoExpanded ? 'rounded-[32px] p-5 sm:p-6' : 'rounded-3xl p-4 sm:p-5'
                  } gap-3 sm:gap-4 mx-auto`}
                >
                  {activeRoom.status === 'WAITING' ? (
                    <>
                      <div className="w-full bg-indigo-950/70 border border-amber-400/40 rounded-2xl py-2 px-4 text-center">
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.16em] text-slate-400 block mb-0.5">
                          CÓDIGO DA SALA (PIN)
                        </span>
                        <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-400 tracking-[0.16em] leading-tight">
                          {activeRoom.pin}
                        </div>
                      </div>

                      {qrCodeDataUrl && (
                        <div className="relative overflow-hidden bg-white shadow-lg p-3 sm:p-3.5 rounded-2xl mx-auto">
                          <img
                            src={qrCodeDataUrl}
                            alt="QR Code da Prova"
                            className={`object-contain block mx-auto ${
                              isQrTelaoExpanded
                                ? 'w-[min(38vh,290px)] h-[min(38vh,290px)]'
                                : 'w-48 h-48 sm:w-56 sm:h-56'
                            }`}
                          />
                        </div>
                      )}

                      <p className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px] sm:text-xs leading-snug text-center">
                        Aponte a Câmera do Celular para Entrar na Prova
                      </p>
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center p-4">
                      <span className="font-black uppercase tracking-[0.2em] text-xs sm:text-sm text-sky-300 block mb-2">
                        {activeRoom.status === 'FINISHED'
                          ? 'STATUS DA AVALIAÇÃO'
                          : isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime)
                          ? 'TEMPO DE PROVA'
                          : 'TEMPO RESTANTE'}
                      </span>
                      <div
                        className={`font-black tabular-nums tracking-wider leading-none my-3 ${
                          isQrTelaoExpanded ? 'text-6xl sm:text-7xl lg:text-8xl' : 'text-5xl sm:text-6xl'
                        } ${
                          activeRoom.status === 'FINISHED'
                            ? 'text-red-400'
                            : !isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime) &&
                              activeRoom.status === 'ACTIVE' &&
                              hostRemainingSeconds <= 60
                            ? 'text-red-400 animate-pulse'
                            : 'text-sky-400'
                        }`}
                      >
                        {activeRoom.status === 'FINISHED'
                          ? 'PROVA ENCERRADA'
                          : isUnlimitedRoomDuration(activeRoom.durationMinutes, activeRoom.unlimitedTime)
                          ? '∞ SEM LIMITE'
                          : formatTimeMMSS(hostRemainingSeconds)}
                      </div>
                      <div className="mt-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase">
                        {activeRoom.status === 'ACTIVE' ? '🟢 PROVA EM ANDAMENTO' : '🏁 PROVA ENCERRADA'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Coluna Direita: Participantes Estilo Kahoot (Visível APENAS no PC/Desktop, removida no celular conforme Imagem 2) */}
                <div
                  className={`hidden md:flex flex-1 min-w-0 bg-slate-900/80 border border-indigo-500/30 flex-col shadow-xl ${
                    isQrTelaoExpanded
                      ? 'rounded-[32px] p-6 max-h-[calc(100vh-130px)]'
                      : 'rounded-3xl p-5 max-h-[72vh]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10 shrink-0">
                    <span className="font-black uppercase tracking-[0.14em] text-indigo-300 text-xs sm:text-sm">
                      PARTICIPANTES NA SALA
                    </span>
                    <span className="rounded-full bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 font-black px-3 py-0.5 text-xs">
                      {participantsList.length}
                    </span>
                  </div>

                  {renderWaitingParticipantsCircle(participantsList, isQrTelaoExpanded)}
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
            className="fixed inset-0 z-[99999] bg-slate-900/65 dark:bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setInspectingStudent(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[28px] p-5 text-slate-800 dark:text-white space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm sm:text-base font-black uppercase text-slate-900 dark:text-white">{inspectingStudent.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    {inspectingStudent.unit} • Nota: {inspectingStudent.grade10.toFixed(1).replace('.', ',')} ({inspectingStudent.scorePercent}%) • Saídas: {inspectingStudent.cheatCount}
                    {inspectingStudent.cheatCount > 0
                      ? ` (-${(inspectingStudent.cheatCount * 0.1).toFixed(1).replace('.', ',')} pt)`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingStudent(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
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
                          ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                          : isCorrect
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200'
                          : 'bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-700/60 text-red-800 dark:text-red-200'
                      }`}
                    >
                      <p className="font-black text-slate-900 dark:text-white">
                        Q{idx + 1}. {q.question}
                      </p>
                      <p className="font-bold">
                        Resposta do aluno:{' '}
                        {chosen !== undefined ? q.options[chosen] : 'Ainda não respondeu'}
                      </p>
                      {!isCorrect && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold">
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
