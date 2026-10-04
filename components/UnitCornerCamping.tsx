import React, { useState, useEffect, useMemo } from 'react';
import {
  Tent,
  Backpack,
  ClipboardCheck,
  Utensils,
  Flame,
  Droplets,
  Sparkles,
  Check,
  Plus,
  Trash2,
  RotateCcw,
  Share2,
  Users,
  Calendar,
  Award,
  BookOpen,
  Shirt,
  Clock,
  DollarSign,
  UserCheck,
  Shuffle,
  CheckCircle2,
  ChevronRight,
  Shield,
  Copy,
  X
} from 'lucide-react';
import { ClubType } from '../types';

interface UnitCornerCampingProps {
  club: ClubType;
  onBack?: () => void;
}

type ActiveTab = 'MOCHILA' | 'ACAMPAMENTO' | 'CANTINHO';

interface BackpackItem {
  id: string;
  category: 'DOCUMENTOS_BIBLIA' | 'UNIFORMES' | 'DORMITORIO' | 'HIGIENE' | 'CAMPO_COZINHA';
  name: string;
  mandatory: boolean;
  checked: boolean;
  isCustom?: boolean;
}

interface UnitMember {
  id: string;
  name: string;
  role: 'Conselheiro(a)' | 'Capitão(ã)' | 'Secretário(a)' | 'Almoxarife' | 'Padioleiro(a)' | 'Membro';
}

interface MealScheduleSlot {
  id: string;
  dayLabel: string;
  mealName: string;
  menuDescription: string;
  ingredients: string;
  waterAndWood: string;
  cooking: string;
  dishwashing: string;
}

interface SundayAttendanceEntry {
  present: boolean;
  punctual: boolean;
  bible: boolean;
  uniform: boolean;
  duesPaid: boolean;
  notes?: string;
}

interface SundayMeetingSheet {
  id: string;
  date: string;
  label: string;
  records: Record<string, SundayAttendanceEntry>; // memberId -> entry
}

const DEFAULT_BACKPACK_ITEMS: BackpackItem[] = [
  // Documentos e Bíblia
  { id: 'bp_1', category: 'DOCUMENTOS_BIBLIA', name: 'Bíblia Sagrada (física) e Lição da Escola Sabatina', mandatory: true, checked: false },
  { id: 'bp_2', category: 'DOCUMENTOS_BIBLIA', name: 'Caderno de anotações e caneta/lápis', mandatory: true, checked: false },
  { id: 'bp_3', category: 'DOCUMENTOS_BIBLIA', name: 'Autorização dos pais/responsáveis assinada', mandatory: true, checked: false },
  { id: 'bp_4', category: 'DOCUMENTOS_BIBLIA', name: 'RG / Certidão, Cartão do SUS e Convênio Médico', mandatory: true, checked: false },
  { id: 'bp_5', category: 'DOCUMENTOS_BIBLIA', name: 'Medicamentos pessoais identificados com receita/horário', mandatory: false, checked: false },

  // Uniformes
  { id: 'bp_6', category: 'UNIFORMES', name: 'Uniforme de Gala completo (camisa, calça/saia, cinto)', mandatory: true, checked: false },
  { id: 'bp_7', category: 'UNIFORMES', name: 'Lenço oficial, prendedor de lenço e Faixa de Especialidades', mandatory: true, checked: false },
  { id: 'bp_8', category: 'UNIFORMES', name: 'Sapato preto e meias oficiais (pretas / brancas)', mandatory: true, checked: false },
  { id: 'bp_9', category: 'UNIFORMES', name: 'Uniforme de Atividades (camisetas do clube/unidade e calça/bermuda)', mandatory: true, checked: false },
  { id: 'bp_10', category: 'UNIFORMES', name: 'Boné/chapéu do clube e 2 pares de tênis resistentes', mandatory: true, checked: false },
  { id: 'bp_11', category: 'UNIFORMES', name: 'Agasalho reforçado / jaqueta para a noite e madrugada', mandatory: true, checked: false },

  // Dormitório e Cama
  { id: 'bp_12', category: 'DORMITORIO', name: 'Saco de dormir ou cobertor quente + lençol', mandatory: true, checked: false },
  { id: 'bp_13', category: 'DORMITORIO', name: 'Isolante térmico ou colchonete de acampamento', mandatory: true, checked: false },
  { id: 'bp_14', category: 'DORMITORIO', name: 'Travesseiro pequeno / inflável', mandatory: false, checked: false },
  { id: 'bp_15', category: 'DORMITORIO', name: 'Lanterna de mão ou cabeça com pilhas extras', mandatory: true, checked: false },
  { id: 'bp_16', category: 'DORMITORIO', name: 'Lona plástica extra para proteção contra umidade', mandatory: false, checked: false },

  // Higiene Pessoal
  { id: 'bp_17', category: 'HIGIENE', name: 'Escova de dente, creme dental e fio dental', mandatory: true, checked: false },
  { id: 'bp_18', category: 'HIGIENE', name: 'Sabonete (com saboneteira), shampoo e toalha de banho', mandatory: true, checked: false },
  { id: 'bp_19', category: 'HIGIENE', name: 'Protetor solar e repelente contra insetos', mandatory: true, checked: false },
  { id: 'bp_20', category: 'HIGIENE', name: 'Papel higiênico e lenços umedecidos', mandatory: true, checked: false },
  { id: 'bp_21', category: 'HIGIENE', name: 'Sacolas plásticas resistentes para roupa suja/molhada', mandatory: true, checked: false },

  // Campo e Cozinha
  { id: 'bp_22', category: 'CAMPO_COZINHA', name: 'Prato fundo, caneca e talheres (não descartáveis e identificados)', mandatory: true, checked: false },
  { id: 'bp_23', category: 'CAMPO_COZINHA', name: 'Cantil ou garrafa de água individual (mínimo 500ml)', mandatory: true, checked: false },
  { id: 'bp_24', category: 'CAMPO_COZINHA', name: 'Capa de chuva resistente', mandatory: true, checked: false },
  { id: 'bp_25', category: 'CAMPO_COZINHA', name: 'Corda individual para nós e amarras (2 metros) e apito', mandatory: false, checked: false }
];

const DEFAULT_MEAL_SLOTS: MealScheduleSlot[] = [
  {
    id: 'meal_sex_jantar',
    dayLabel: 'Sexta-feira',
    mealName: 'Jantar de Abertura (Recepção do Sábado)',
    menuDescription: 'Sopa nutritiva de legumes com macarrão, pão integral e suco natural de uva',
    ingredients: 'Macarrão, batata, cenoura, chuchu, proteína de soja, pão integral, suco de uva',
    waterAndWood: '',
    cooking: '',
    dishwashing: ''
  },
  {
    id: 'meal_sab_desjejum',
    dayLabel: 'Sábado',
    mealName: 'Desjejum de Sábado',
    menuDescription: 'Granola com frutas picadas (banana e maçã), leite/iogurte, pão com pasta de grão-de-bico',
    ingredients: 'Granola, bananas, maçãs, leite ou bebida vegetal, pão de forma, grão-de-bico',
    waterAndWood: '',
    cooking: '',
    dishwashing: ''
  },
  {
    id: 'meal_sab_almoco',
    dayLabel: 'Sábado',
    mealName: 'Almoço de Sábado (Pré-pronto na Sexta)',
    menuDescription: 'Arroz soltinho, feijão tropeiro vegetariano, assado de glúten/soja e salada colorida',
    ingredients: 'Arroz, feijão, farinha de mandioca, milho, tomate, alface, cenoura ralada, azeite',
    waterAndWood: '',
    cooking: '',
    dishwashing: ''
  },
  {
    id: 'meal_sab_jantar',
    dayLabel: 'Sábado',
    mealName: 'Lanche / Jantar de Sábado (Fogo do Conselho)',
    menuDescription: 'Sanduíches naturais com queijo/tofu, tomate e orégano + chá quente ou achocolatado',
    ingredients: 'Pão integral, queijo/tofu, tomate, orégano, alface, achocolatado ou erva-doce',
    waterAndWood: '',
    cooking: '',
    dishwashing: ''
  },
  {
    id: 'meal_dom_desjejum',
    dayLabel: 'Domingo',
    mealName: 'Desjejum de Domingo (Fogueira e Pioneiria)',
    menuDescription: 'Cuscuz nordestino com ovos mexidos / mexido de tofu, frutas da estação e pão na chapa',
    ingredients: 'Flocão de milho, ovos ou tofu, frutas, pão, manteiga/azeite',
    waterAndWood: '',
    cooking: '',
    dishwashing: ''
  },
  {
    id: 'meal_dom_almoco',
    dayLabel: 'Domingo',
    mealName: 'Almoço de Encerramento',
    menuDescription: 'Macarronada campestre ao molho de tomate caseiro e proteína de soja + salada verde',
    ingredients: 'Macarrão espaguete, molho de tomate, proteína texturizada de soja, milho, cheiro-verde',
    waterAndWood: '',
    cooking: '',
    dishwashing: ''
  }
];

const DEFAULT_MEMBERS: UnitMember[] = [];
const LEGACY_DEMO_IDS = new Set(['m_1', 'm_2', 'm_3', 'm_4', 'm_5', 'm_6']);

const CATEGORY_META: Record<
  BackpackItem['category'],
  { label: string; badgeColor: string }
> = {
  DOCUMENTOS_BIBLIA: {
    label: 'Bíblia & Documentos',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
  },
  UNIFORMES: {
    label: 'Uniformes (Gala e Campo)',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
  },
  DORMITORIO: {
    label: 'Cama & Dormitório',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
  },
  HIGIENE: {
    label: 'Higiene & Saúde',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
  },
  CAMPO_COZINHA: {
    label: 'Cozinha & Equipamentos',
    badgeColor: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300'
  }
};

const UnitCornerCamping: React.FC<UnitCornerCampingProps> = ({ club }) => {
  const isPathfinder = club === ClubType.PATHFINDER;
  const storagePrefix = `dbv_unit_corner_${isPathfinder ? 'DBV' : 'AVT'}`;

  const [activeTab, setActiveTab] = useState<ActiveTab>('CANTINHO');
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);

  // ============================================================================
  // DADOS GERAIS DA UNIDADE E MEMBROS
  // ============================================================================
  const [unitName, setUnitName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_unit_name`);
      if (saved && saved !== 'Unidade Águias da Colina' && saved !== 'Unidade Estrelas de Jesus') {
        return saved;
      }
    } catch {}
    return '';
  });

  const [counselorName, setCounselorName] = useState<string>(() => {
    try {
      return localStorage.getItem(`${storagePrefix}_counselor_name`) || '';
    } catch {
      return '';
    }
  });

  const [members, setMembers] = useState<UnitMember[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_members`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((m: any) => m && !LEGACY_DEMO_IDS.has(String(m.id)));
        }
      }
    } catch {}
    return DEFAULT_MEMBERS;
  });

  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<UnitMember['role']>('Membro');

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_unit_name`, unitName);
      localStorage.setItem(`${storagePrefix}_counselor_name`, counselorName);
      localStorage.setItem(`${storagePrefix}_members`, JSON.stringify(members));
    } catch {}
  }, [unitName, counselorName, members, storagePrefix]);

  // ============================================================================
  // 1. ESTADO DO CHECKLIST DE MOCHILA
  // ============================================================================
  const [backpackItems, setBackpackItems] = useState<BackpackItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_backpack`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_BACKPACK_ITEMS;
  });

  const [selectedBackpackCat, setSelectedBackpackCat] = useState<'TODAS' | BackpackItem['category']>('TODAS');
  const [newCustomItemName, setNewCustomItemName] = useState<string>('');
  const [newCustomItemCat, setNewCustomItemCat] = useState<BackpackItem['category']>('CAMPO_COZINHA');

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_backpack`, JSON.stringify(backpackItems));
    } catch {}
  }, [backpackItems, storagePrefix]);

  // ============================================================================
  // 2. ESTADO DO PLANEJADOR DE ACAMPAMENTO (ESCALA + CARDÁPIO)
  // ============================================================================
  const [campEventName, setCampEventName] = useState<string>(() => {
    try {
      return localStorage.getItem(`${storagePrefix}_camp_name`) || 'Acampamento de Instrução da Unidade';
    } catch {
      return 'Acampamento de Instrução da Unidade';
    }
  });

  const [mealSlots, setMealSlots] = useState<MealScheduleSlot[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_meals`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_MEAL_SLOTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_camp_name`, campEventName);
      localStorage.setItem(`${storagePrefix}_meals`, JSON.stringify(mealSlots));
    } catch {}
  }, [campEventName, mealSlots, storagePrefix]);

  // ============================================================================
  // 3. ESTADO DA CADERNETA DE PONTUAÇÃO DO CANTINHO DA UNIDADE
  // ============================================================================
  const [meetings, setMeetings] = useState<SundayMeetingSheet[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_meetings`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const todayStr = new Date().toLocaleDateString('pt-BR');
    return [
      {
        id: 'meet_1',
        date: todayStr,
        label: `Reunião de Domingo (${todayStr})`,
        records: {}
      }
    ];
  });

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(() => {
    return meetings[0]?.id || 'meet_1';
  });

  const [newMeetingDateInput, setNewMeetingDateInput] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_meetings`, JSON.stringify(meetings));
    } catch {}
  }, [meetings, storagePrefix]);

  const showToast = (msg: string) => {
    setCopiedFeedback(msg);
    setTimeout(() => setCopiedFeedback(null), 2800);
  };

  // ============================================================================
  // FUNÇÕES: MEMBROS E PONTUAÇÃO DO CANTINHO DA UNIDADE
  // ============================================================================
  const currentMeeting = useMemo(() => {
    return meetings.find((m) => m.id === selectedMeetingId) || meetings[0];
  }, [meetings, selectedMeetingId]);

  const handleAddMember = () => {
    const clean = newMemberName.trim();
    if (!clean) return;
    const newMem: UnitMember = {
      id: `mem_${Date.now()}`,
      name: clean,
      role: newMemberRole
    };
    setMembers((prev) => [...prev, newMem]);
    setNewMemberName('');
    setNewMemberRole('Membro');
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const getMemberMeetingRecord = (memberId: string): SundayAttendanceEntry => {
    const rec = currentMeeting?.records?.[memberId];
    return (
      rec || {
        present: false,
        punctual: false,
        bible: false,
        uniform: false,
        duesPaid: false
      }
    );
  };

  const calculateEntryPoints = (entry: SundayAttendanceEntry): number => {
    let pts = 0;
    if (entry.present) pts += 20;
    if (entry.punctual) pts += 20;
    if (entry.bible) pts += 20;
    if (entry.uniform) pts += 20;
    if (entry.duesPaid) pts += 20;
    return pts;
  };

  const toggleCriterion = (memberId: string, field: keyof Omit<SundayAttendanceEntry, 'notes'>) => {
    if (!currentMeeting) return;
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== currentMeeting.id) return m;
        const existing = m.records[memberId] || {
          present: false,
          punctual: false,
          bible: false,
          uniform: false,
          duesPaid: false
        };
        const nextVal = !existing[field];
        // Se marcou pontualidade, bíblia ou uniforme, marca presença automaticamente
        const updatedEntry: SundayAttendanceEntry = {
          ...existing,
          [field]: nextVal,
          present: field === 'present' ? nextVal : (nextVal ? true : existing.present)
        };
        return {
          ...m,
          records: {
            ...m.records,
            [memberId]: updatedEntry
          }
        };
      })
    );
  };

  const markMember100Percent = (memberId: string) => {
    if (!currentMeeting) return;
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== currentMeeting.id) return m;
        const current = getMemberMeetingRecord(memberId);
        const isAllTrue =
          current.present && current.punctual && current.bible && current.uniform && current.duesPaid;
        return {
          ...m,
          records: {
            ...m.records,
            [memberId]: {
              present: !isAllTrue,
              punctual: !isAllTrue,
              bible: !isAllTrue,
              uniform: !isAllTrue,
              duesPaid: !isAllTrue
            }
          }
        };
      })
    );
  };

  const handleCreateNewSundayMeeting = () => {
    const formattedDate = newMeetingDateInput.trim()
      ? newMeetingDateInput.trim()
      : new Date().toLocaleDateString('pt-BR');
    const newSheet: SundayMeetingSheet = {
      id: `meet_${Date.now()}`,
      date: formattedDate,
      label: `Domingo • ${formattedDate}`,
      records: {}
    };
    setMeetings((prev) => [newSheet, ...prev]);
    setSelectedMeetingId(newSheet.id);
    setNewMeetingDateInput('');
    showToast(`Reunião (${formattedDate}) criada!`);
  };

  const handleDeleteSundayMeeting = (meetingId: string) => {
    setMeetings((prev) => {
      const remaining = prev.filter((m) => m.id !== meetingId);
      if (remaining.length === 0) {
        const todayStr = new Date().toLocaleDateString('pt-BR');
        const fallback: SundayMeetingSheet = {
          id: `meet_${Date.now()}`,
          date: todayStr,
          label: `Domingo • ${todayStr}`,
          records: {}
        };
        setSelectedMeetingId(fallback.id);
        return [fallback];
      }
      if (selectedMeetingId === meetingId) {
        setSelectedMeetingId(remaining[0].id);
      }
      return remaining;
    });
    showToast('Data de domingo removida!');
  };

  // Ranking acumulado de todos os membros somando todas as reuniões registradas
  const memberCumulativeRanking = useMemo(() => {
    return members
      .map((member) => {
        let totalPoints = 0;
        let meetingsPresent = 0;
        meetings.forEach((sheet) => {
          const rec = sheet.records[member.id];
          if (rec) {
            totalPoints += calculateEntryPoints(rec);
            if (rec.present) meetingsPresent += 1;
          }
        });
        return {
          ...member,
          totalPoints,
          meetingsPresent
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);
  }, [members, meetings]);

  const handleCopySundayReport = () => {
    if (!currentMeeting) return;
    const lines: string[] = [
      `📋 *RELATÓRIO DO CANTINHO DA UNIDADE*`,
      `🛡️ *${unitName.trim() || 'Minha Unidade'}* (${isPathfinder ? 'Desbravadores' : 'Aventureiros'})`,
      counselorName ? `👤 *Conselheiro(a):* ${counselorName}` : '',
      `📅 *Data:* ${currentMeeting.date}`,
      `--------------------------------`,
      ...members.map((m) => {
        const r = getMemberMeetingRecord(m.id);
        const pts = calculateEntryPoints(r);
        const flags = [
          r.present ? '✅Pres' : '❌Pres',
          r.punctual ? '⏰Pont' : '⚪Pont',
          r.bible ? '📖Bíb' : '⚪Bíb',
          r.uniform ? '👕Unif' : '⚪Unif',
          r.duesPaid ? '💲Mens' : '⚪Mens'
        ].join(' | ');
        return `• *${m.name}* (${m.role}): *${pts} pts*\n   ${flags}`;
      })
    ].filter(Boolean);

    const avg =
      members.length > 0
        ? Math.round(
            members.reduce((acc, m) => acc + calculateEntryPoints(getMemberMeetingRecord(m.id)), 0) /
              members.length
          )
        : 0;
    lines.push(`--------------------------------`);
    lines.push(`🏆 *Média Geral da Unidade:* ${avg}%`);

    navigator.clipboard?.writeText(lines.join('\n'));
    showToast('Relatório do Cantinho copiado para o WhatsApp!');
  };

  // ============================================================================
  // FUNÇÕES: PLANEJADOR DE ACAMPAMENTO (ESCALA + CARDÁPIO)
  // ============================================================================
  const handleAutoRotateCampSchedule = () => {
    if (members.length === 0) {
      showToast('Cadastre membros na unidade primeiro!');
      return;
    }
    const names = members.map((m) => m.name);
    setMealSlots((prev) =>
      prev.map((slot, idx) => {
        const p1 = names[(idx * 3) % names.length];
        const p2 = names[(idx * 3 + 1) % names.length];
        const p3 = names[(idx * 3 + 2) % names.length];
        const p4 = names[(idx * 3 + 3) % names.length];
        const p5 = names[(idx * 3 + 4) % names.length];
        const p6 = names[(idx * 3 + 5) % names.length];

        return {
          ...slot,
          waterAndWood: names.length >= 2 ? `${p1} e ${p2}` : p1,
          cooking: names.length >= 4 ? `${p3} e ${p4}` : p2,
          dishwashing: names.length >= 6 ? `${p5} e ${p6}` : p3
        };
      })
    );
    showToast('Escala rodiziada automaticamente entre os membros!');
  };

  const handleUpdateMealSlot = (id: string, field: keyof MealScheduleSlot, value: string) => {
    setMealSlots((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleCopyCampSchedule = () => {
    const lines: string[] = [
      `⛺ *PLANEJAMENTO DE ACAMPAMENTO E CARDÁPIO*`,
      `🛡️ *${unitName.trim() || 'Minha Unidade'}* • ${campEventName}`,
      `--------------------------------`,
      ...mealSlots.map(
        (s) =>
          `🍽️ *${s.dayLabel} — ${s.mealName}*\n` +
          `🥘 *Cardápio:* ${s.menuDescription}\n` +
          `🛒 *Ingredientes:* ${s.ingredients}\n` +
          `💧🔥 *Água e Lenha:* ${s.waterAndWood || 'A definir'}\n` +
          `👨‍🍳 *Cozinha:* ${s.cooking || 'A definir'}\n` +
          `🧽 *Louça e Limpeza:* ${s.dishwashing || 'A definir'}\n`
      )
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    showToast('Escala e Cardápio do Acampamento copiados!');
  };

  // ============================================================================
  // FUNÇÕES: CHECKLIST DE MOCHILA
  // ============================================================================
  const toggleBackpackItem = (id: string) => {
    setBackpackItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const handleAddCustomBackpackItem = () => {
    const clean = newCustomItemName.trim();
    if (!clean) return;
    const item: BackpackItem = {
      id: `bp_custom_${Date.now()}`,
      category: newCustomItemCat,
      name: clean,
      mandatory: false,
      checked: false,
      isCustom: true
    };
    setBackpackItems((prev) => [...prev, item]);
    setNewCustomItemName('');
    showToast('Item adicionado à mochila!');
  };

  const handleRemoveCustomBackpackItem = (id: string) => {
    setBackpackItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleResetBackpack = () => {
    setBackpackItems((prev) => prev.map((i) => ({ ...i, checked: false })));
    showToast('Checklist da mochila zerado para novo acampamento!');
  };

  const handleCopyBackpackChecklist = () => {
    const checkedCount = backpackItems.filter((i) => i.checked).length;
    const lines = [
      `🎒 *CHECKLIST OFICIAL DE MOCHILA DE ACAMPAMENTO*`,
      `🛡️ *${unitName.trim() || 'Minha Unidade'}* (${checkedCount}/${backpackItems.length} itens prontos)`,
      `--------------------------------`,
      ...backpackItems.map(
        (i) => `${i.checked ? '✅' : '⬜'} ${i.name} ${i.mandatory ? '*(Obrigatório)*' : ''}`
      )
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    showToast('Lista de mochila copiada para o WhatsApp!');
  };

  const backpackStats = useMemo(() => {
    const total = backpackItems.length;
    const checked = backpackItems.filter((i) => i.checked).length;
    const mandatoryTotal = backpackItems.filter((i) => i.mandatory).length;
    const mandatoryChecked = backpackItems.filter((i) => i.mandatory && i.checked).length;
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { total, checked, mandatoryTotal, mandatoryChecked, pct };
  }, [backpackItems]);

  const filteredBackpackItems = useMemo(() => {
    if (selectedBackpackCat === 'TODAS') return backpackItems;
    return backpackItems.filter((i) => i.category === selectedBackpackCat);
  }, [backpackItems, selectedBackpackCat]);

  return (
    <div className="animate-slide-in space-y-5 pb-28 max-w-5xl mx-auto">
      {/* Toast de Confirmação */}
      {copiedFeedback && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl font-black text-xs uppercase tracking-wider flex items-center space-x-2 animate-bounce-in">
          <CheckCircle2 size={16} />
          <span>{copiedFeedback}</span>
        </div>
      )}

      {/* Cabeçalho da Unidade (Identificação editável para Conselheiros e Capitães) */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-[28px] p-4 sm:p-6 text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 text-white/10 pointer-events-none">
          <Tent className="w-36 h-36 stroke-[1.2]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
              <Tent size={12} />
              <span>Para Conselheiros, Capitães e Secretários</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Nome da Unidade..."
                className="bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/20 rounded-xl px-3 py-1.5 text-base sm:text-lg font-black uppercase tracking-tight text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-amber-400 sm:w-72"
              />
              <input
                type="text"
                value={counselorName}
                onChange={(e) => setCounselorName(e.target.value)}
                placeholder="Nome do Conselheiro(a)..."
                className="bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-100 placeholder:text-white/50 outline-none focus:ring-2 focus:ring-amber-400 sm:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-200 block">
                Membros
              </span>
              <span className="text-base font-black text-white">{members.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 text-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-200 block">
                Mochila
              </span>
              <span className="text-base font-black text-white">{backpackStats.pct}%</span>
            </div>
          </div>
        </div>

        {/* Barra de Navegação entre os 3 Módulos — Clara e Sem Corte de Texto no Celular */}
        <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t border-white/15">
          <button
            type="button"
            onClick={() => setActiveTab('CANTINHO')}
            className={`py-2.5 px-1.5 sm:px-4 rounded-2xl transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center sm:text-left border ${
              activeTab === 'CANTINHO'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg ring-2 ring-inset ring-white/40'
                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTab === 'CANTINHO' ? 'bg-slate-950/15 text-slate-950' : 'bg-white/15 text-amber-300'
              }`}
            >
              <ClipboardCheck size={18} strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block">
                Cantinho
              </span>
              <span
                className={`text-[8.5px] sm:text-[10px] font-bold block mt-0.5 ${
                  activeTab === 'CANTINHO' ? 'text-slate-900/80' : 'text-emerald-100/80'
                }`}
              >
                Chamada & Pontos
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ACAMPAMENTO')}
            className={`py-2.5 px-1.5 sm:px-4 rounded-2xl transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center sm:text-left border ${
              activeTab === 'ACAMPAMENTO'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg ring-2 ring-inset ring-white/40'
                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTab === 'ACAMPAMENTO' ? 'bg-slate-950/15 text-slate-950' : 'bg-white/15 text-amber-300'
              }`}
            >
              <Utensils size={18} strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block">
                Acampamento
              </span>
              <span
                className={`text-[8.5px] sm:text-[10px] font-bold block mt-0.5 ${
                  activeTab === 'ACAMPAMENTO' ? 'text-slate-900/80' : 'text-emerald-100/80'
                }`}
              >
                Escala & Cardápio
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MOCHILA')}
            className={`py-2.5 px-1.5 sm:px-4 rounded-2xl transition-all active:scale-95 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 text-center sm:text-left border ${
              activeTab === 'MOCHILA'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg ring-2 ring-inset ring-white/40'
                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            }`}
          >
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTab === 'MOCHILA' ? 'bg-slate-950/15 text-slate-950' : 'bg-white/15 text-amber-300'
              }`}
            >
              <Backpack size={18} strokeWidth={2.5} />
            </div>
            <div className="leading-tight min-w-0">
              <span className="font-black text-[11px] sm:text-xs uppercase tracking-tight block">
                Mochila
              </span>
              <span
                className={`text-[8.5px] sm:text-[10px] font-bold block mt-0.5 ${
                  activeTab === 'MOCHILA' ? 'text-slate-900/80' : 'text-emerald-100/80'
                }`}
              >
                Checklist ({backpackStats.pct}%)
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================
          ABA 1: PONTUAÇÃO DO CANTINHO DA UNIDADE (CADERNETA DE DOMINGO)
          ======================================================================== */}
      {activeTab === 'CANTINHO' && (
        <div className="space-y-5">
          {/* Barra de Reunião de Domingo + Criar Nova Data */}
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight flex items-center space-x-2">
                  <Calendar size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Caderneta de Domingo • Chamada da Unidade</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Toque nos ícones de cada membro para marcar Presença, Pontualidade, Bíblia, Uniforme e Mensalidade (20 pts cada).
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopySundayReport}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all shrink-0"
              >
                <Copy size={14} />
                <span>Copiar Relatório WhatsApp</span>
              </button>
            </div>

            {/* Seletor de Reuniões e Adição/Exclusão de Reunião */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/70">
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide flex-1 py-0.5">
                {meetings.map((sheet) => {
                  const isActiveSheet = currentMeeting?.id === sheet.id;
                  return (
                    <div
                      key={sheet.id}
                      className={`inline-flex items-center rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                        isActiveSheet
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedMeetingId(sheet.id)}
                        className="pl-3.5 pr-2 py-2"
                      >
                        {sheet.date}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSundayMeeting(sheet.id);
                        }}
                        title="Remover este domingo"
                        className={`pr-2.5 pl-1 py-2 rounded-r-xl transition-colors ${
                          isActiveSheet
                            ? 'text-white/75 hover:text-white'
                            : 'text-slate-400 hover:text-red-500'
                        }`}
                      >
                        <X size={13} strokeWidth={2.8} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={newMeetingDateInput}
                  onChange={(e) => setNewMeetingDateInput(e.target.value)}
                  placeholder="Ex: 11/10/2026"
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 w-32 outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleCreateNewSundayMeeting}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-black text-[11px] uppercase tracking-wider flex items-center space-x-1 active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>Novo Domingo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cadastrar Membro na Unidade — Posicionado no Topo com Largura Total Sem Cortes no PC */}
          <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-xs space-y-3">
            <h5 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Users size={15} className="text-indigo-600 dark:text-indigo-400" />
              <span>Cadastrar Membro na Unidade</span>
            </h5>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                placeholder={`Nome do ${isPathfinder ? 'desbravador' : 'aventureiro'}...`}
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as UnitMember['role'])}
                  className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="Membro">Membro</option>
                  <option value="Capitão(ã)">Capitão(ã)</option>
                  <option value="Secretário(a)">Secretário(a)</option>
                  <option value="Almoxarife">Almoxarife</option>
                  <option value="Padioleiro(a)">Padioleiro(a)</option>
                  <option value="Conselheiro(a)">Conselheiro(a)</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 active:scale-95 transition-all shrink-0 shadow-xs"
                >
                  <Plus size={16} />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Membros da Unidade com Marcação Rápida */}
          {members.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[24px] p-6 border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-1.5">
              <Users size={28} className="mx-auto text-indigo-500 opacity-80" />
              <h5 className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight">
                Nenhum membro cadastrado na unidade
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Adicione abaixo os nomes dos {isPathfinder ? 'desbravadores' : 'aventureiros'} da sua unidade para iniciar a chamada e a escala.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
              const rec = getMemberMeetingRecord(member.id);
              const pts = calculateEntryPoints(rec);

              const criteriaButtons: {
                key: keyof Omit<SundayAttendanceEntry, 'notes'>;
                label: string;
                icon: React.FC<any>;
                activeClass: string;
              }[] = [
                {
                  key: 'present',
                  label: 'Presença',
                  icon: UserCheck,
                  activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                },
                {
                  key: 'punctual',
                  label: 'Pontual',
                  icon: Clock,
                  activeClass: 'bg-blue-600 text-white border-blue-600 shadow-xs'
                },
                {
                  key: 'bible',
                  label: 'Bíblia',
                  icon: BookOpen,
                  activeClass: 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                },
                {
                  key: 'uniform',
                  label: 'Uniforme',
                  icon: Shirt,
                  activeClass: 'bg-amber-500 text-white border-amber-500 shadow-xs'
                },
                {
                  key: 'duesPaid',
                  label: 'Mensalid.',
                  icon: DollarSign,
                  activeClass: 'bg-teal-600 text-white border-teal-600 shadow-xs'
                }
              ];

              return (
                <div
                  key={member.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-4 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          pts === 100
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : pts >= 60
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pts}
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-black text-slate-800 dark:text-white text-sm truncate">
                          {member.name}
                        </h5>
                        <span className="inline-block text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => markMember100Percent(member.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${
                          pts === 100
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-400'
                        }`}
                      >
                        {pts === 100 ? '100% OK' : 'Marcar 100%'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1.5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Remover membro da unidade"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* 5 Botões de Critérios do Cantinho */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {criteriaButtons.map((crit) => {
                      const CritIcon = crit.icon;
                      const isActive = rec[crit.key];
                      return (
                        <button
                          key={crit.key}
                          type="button"
                          onClick={() => toggleCriterion(member.id, crit.key)}
                          className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                            isActive
                              ? crit.activeClass
                              : 'bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border-slate-200/70 dark:border-slate-700'
                          }`}
                        >
                          <CritIcon size={15} strokeWidth={2.3} />
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight truncate max-w-full">
                            {crit.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </div>
          )}

          {/* Ranking Acumulado do Trimestre / Ano */}
          {members.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-xs space-y-2.5">
              <h5 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Award size={15} className="text-amber-500" />
                <span>Ranking Geral da Unidade ({meetings.length} reuniões)</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {memberCumulativeRanking.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                        {m.name}
                      </span>
                    </div>
                    <span className="font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                      {m.totalPoints} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          ABA 2: PLANEJADOR DE ACAMPAMENTO DA UNIDADE (ESCALA + CARDÁPIO)
          ======================================================================== */}
      {activeTab === 'ACAMPAMENTO' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Evento / Acampamento da Unidade
                </label>
                <input
                  type="text"
                  value={campEventName}
                  onChange={(e) => setCampEventName(e.target.value)}
                  className="mt-1 w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-black text-sm text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAutoRotateCampSchedule}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] uppercase tracking-wider flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Shuffle size={14} />
                  <span>Sortear Escala entre Membros</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCampSchedule}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Share2 size={14} />
                  <span>Copiar Escala & Cardápio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards de Cada Refeição com Cardápio e Escala (Água/Lenha, Cozinha, Louça) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealSlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white dark:bg-slate-800 rounded-[24px] p-4 border border-slate-100 dark:border-slate-700 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-2">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {slot.dayLabel}
                      </span>
                      <h5 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm uppercase tracking-tight mt-1">
                        {slot.mealName}
                      </h5>
                    </div>
                    <Utensils size={18} className="text-amber-500 shrink-0" />
                  </div>

                  {/* Cardápio e Ingredientes */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Prato Principal / Cardápio
                    </label>
                    <input
                      type="text"
                      value={slot.menuDescription}
                      onChange={(e) => handleUpdateMealSlot(slot.id, 'menuDescription', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Lista de Ingredientes / Intendência
                    </label>
                    <input
                      type="text"
                      value={slot.ingredients}
                      onChange={(e) => handleUpdateMealSlot(slot.id, 'ingredients', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Escala de Tarefas da Refeição */}
                  <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-700/70">
                    <div className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Flame size={13} />
                        <span>Água / Lenha:</span>
                      </span>
                      <input
                        type="text"
                        value={slot.waterAndWood}
                        onChange={(e) => handleUpdateMealSlot(slot.id, 'waterAndWood', e.target.value)}
                        placeholder="Quem busca água e lenha..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 text-xs font-bold text-slate-800 dark:text-white outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Utensils size={13} />
                        <span>Cozinha:</span>
                      </span>
                      <input
                        type="text"
                        value={slot.cooking}
                        onChange={(e) => handleUpdateMealSlot(slot.id, 'cooking', e.target.value)}
                        placeholder="Quem prepara a refeição..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 text-xs font-bold text-slate-800 dark:text-white outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-28 shrink-0 text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Droplets size={13} />
                        <span>Lavar Louça:</span>
                      </span>
                      <input
                        type="text"
                        value={slot.dishwashing}
                        onChange={(e) => handleUpdateMealSlot(slot.id, 'dishwashing', e.target.value)}
                        placeholder="Quem lava a louça e limpa..."
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/50 text-xs font-bold text-slate-800 dark:text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================
          ABA 3: CHECKLIST INTERATIVO DE MOCHILA DE ACAMPAMENTO
          ======================================================================== */}
      {activeTab === 'MOCHILA' && (
        <div className="space-y-4">
          {/* Card de Progresso da Mochila */}
          <div className="bg-white dark:bg-slate-800 rounded-[26px] p-4 sm:p-5 border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="font-black text-slate-800 dark:text-white text-sm sm:text-base uppercase tracking-tight flex items-center space-x-2">
                  <Backpack size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span>
                    Mochila de Acampamento: {backpackStats.checked}/{backpackStats.total} itens ({backpackStats.pct}%)
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Itens obrigatórios conferidos: {backpackStats.mandatoryChecked} de {backpackStats.mandatoryTotal}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetBackpack}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 hover:bg-slate-200 transition-all"
                >
                  <RotateCcw size={13} />
                  <span>Desmarcar Tudo</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyBackpackChecklist}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Share2 size={13} />
                  <span>Compartilhar Lista</span>
                </button>
              </div>
            </div>

            {/* Barra de Progresso Visual */}
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-600 via-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                style={{ width: `${backpackStats.pct}%` }}
              />
            </div>

            {/* Filtros de Categoria da Mochila */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1">
              <button
                type="button"
                onClick={() => setSelectedBackpackCat('TODAS')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedBackpackCat === 'TODAS'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Todos ({backpackItems.length})
              </button>
              {(Object.keys(CATEGORY_META) as BackpackItem['category'][]).map((catKey) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedBackpackCat(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                    selectedBackpackCat === catKey
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {CATEGORY_META[catKey].label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista Interativa de Itens da Mochila */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredBackpackItems.map((item) => {
              const catInfo = CATEGORY_META[item.category];
              return (
                <div
                  key={item.id}
                  onClick={() => toggleBackpackItem(item.id)}
                  className={`cursor-pointer rounded-2xl p-3.5 border transition-all flex items-center justify-between gap-3 select-none active:scale-[0.99] ${
                    item.checked
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/70'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                        item.checked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-xs sm:text-sm font-bold leading-snug ${
                          item.checked
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-white'
                        }`}
                      >
                        {item.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${catInfo.badgeColor}`}>
                          {catInfo.label}
                        </span>
                        {item.mandatory && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Obrigatório
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCustomBackpackItem(item.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 shrink-0"
                      title="Remover item personalizado"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Adicionar Item Extra na Mochila */}
          <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 border border-slate-100 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newCustomItemName}
              onChange={(e) => setNewCustomItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomBackpackItem()}
              placeholder="Adicionar item extra na mochila (ex: Bússola, Corda 10m, Bota de trilha)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white outline-none focus:border-indigo-500"
            />
            <select
              value={newCustomItemCat}
              onChange={(e) => setNewCustomItemCat(e.target.value as BackpackItem['category'])}
              className="px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
            >
              {(Object.keys(CATEGORY_META) as BackpackItem['category'][]).map((catKey) => (
                <option key={catKey} value={catKey}>
                  {CATEGORY_META[catKey].label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddCustomBackpackItem}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 active:scale-95 transition-all shrink-0"
            >
              <Plus size={15} />
              <span>Adicionar Item</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitCornerCamping;
