import { supabase, QFPY_URL } from './supabaseService';

export interface ErrorReport {
  id: string;
  category: string;
  title: string;
  description: string;
  location?: string;
  userName?: string;
  userEmail?: string;
  deviceInfo?: string;
  appVersion?: string;
  createdAt: number;
  status: 'PENDING' | 'RESOLVED';
  resolvedAt?: number;
  notes?: string;
}

export type NewErrorReport = Omit<ErrorReport, 'id' | 'createdAt' | 'status'>;

const LOCAL_REPORTS_KEY = 'dbv_reported_errors_local';
const ERROR_STORAGE_PATH = 'sync/reported_errors.json';

/**
 * Detecta automaticamente informações do sistema/navegador para facilitar a reprodução do erro
 */
export function getSystemDeviceInfo(): string {
  if (typeof window === 'undefined' || !navigator) return 'Desconhecido';
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const platform = isMobile ? 'Celular / Mobile' : 'Computador / PC';

  let browser = 'Navegador Web';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';

  let os = 'Sistema';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';

  const screenResolution = `${window.innerWidth}x${window.innerHeight}`;
  return `${platform} (${os} • ${browser} • ${screenResolution})`;
}

/**
 * Lê a lista local de reportes em cache
 */
export function getLocalErrorReports(): ErrorReport[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveLocalErrorReports(reports: ErrorReport[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent('dbv_error_reports_updated', { detail: reports }));
  } catch {}
}

/**
 * Envia um novo reporte de erro pelo usuário
 */
export async function submitErrorReport(newReport: NewErrorReport): Promise<{ ok: boolean; report?: ErrorReport; error?: string }> {
  const report: ErrorReport = {
    ...newReport,
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
    status: 'PENDING'
  };

  // 1. Salva localmente
  const currentLocal = getLocalErrorReports();
  const updatedLocal = [report, ...currentLocal.filter(r => r.id !== report.id)];
  saveLocalErrorReports(updatedLocal);

  // 2. Envia para o servidor local /api/live-exam (em memória e broadcast WebSocket)
  try {
    fetch('/api/live-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SUBMIT_ERROR_REPORT',
        report
      })
    }).catch(() => {});
  } catch {}

  // 3. Persiste diretamente no Supabase na tabela Cultura (para o perfil do administrador)
  try {
    const { data: culturaData } = await supabase
      .from('Cultura')
      .select('insignias_tiras')
      .eq('club_type', 'PATHFINDER')
      .single();

    let existingObj: any = {};
    if (culturaData?.insignias_tiras) {
      existingObj = typeof culturaData.insignias_tiras === 'string'
        ? JSON.parse(culturaData.insignias_tiras)
        : culturaData.insignias_tiras;
    }

    const remoteReports: ErrorReport[] = Array.isArray(existingObj.reportes_erros)
      ? existingObj.reportes_erros
      : [];

    const merged = [report, ...remoteReports.filter((r: any) => r && r.id !== report.id)];
    existingObj.reportes_erros = merged.slice(0, 300); // mantém até os 300 mais recentes

    await supabase
      .from('Cultura')
      .update({ insignias_tiras: JSON.stringify(existingObj) })
      .eq('club_type', 'PATHFINDER');
  } catch (err) {
    console.warn("Aviso ao persistir reporte na tabela Cultura:", err);
  }

  // 4. Salva no bucket de storage como backup adicional
  try {
    const { data: currentBlob } = await supabase.storage.from('App DBV Tudo').download(ERROR_STORAGE_PATH);
    let storageList: ErrorReport[] = [];
    if (currentBlob) {
      try {
        const text = await currentBlob.text();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) storageList = parsed;
      } catch {}
    }
    const finalStorageList = [report, ...storageList.filter(r => r.id !== report.id)].slice(0, 300);
    await supabase.storage.from('App DBV Tudo').upload(ERROR_STORAGE_PATH, JSON.stringify(finalStorageList), {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '0'
    });
  } catch {}

  return { ok: true, report };
}

/**
 * Busca todos os reportes de erros gravados (para o perfil do administrador)
 */
export async function fetchAllErrorReports(): Promise<ErrorReport[]> {
  const byId = new Map<string, ErrorReport>();

  // 1. Carrega local
  getLocalErrorReports().forEach(r => byId.set(r.id, r));

  // 2. Carrega da API /api/live-exam
  try {
    const res = await fetch(`/api/live-exam?getErrorReports=1&t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.reports)) {
        data.reports.forEach((r: ErrorReport) => {
          if (r && r.id) byId.set(r.id, r);
        });
      }
    }
  } catch {}

  // 3. Carrega da tabela Cultura no Supabase
  try {
    const { data: culturaData } = await supabase
      .from('Cultura')
      .select('insignias_tiras')
      .eq('club_type', 'PATHFINDER')
      .single();

    if (culturaData?.insignias_tiras) {
      const parsed = typeof culturaData.insignias_tiras === 'string'
        ? JSON.parse(culturaData.insignias_tiras)
        : culturaData.insignias_tiras;
      if (Array.isArray(parsed?.reportes_erros)) {
        parsed.reportes_erros.forEach((r: ErrorReport) => {
          if (r && r.id) byId.set(r.id, r);
        });
      }
    }
  } catch {}

  // 4. Carrega do storage
  try {
    const url = `${QFPY_URL}/storage/v1/object/public/App%20DBV%20Tudo/${ERROR_STORAGE_PATH}?t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const parsed = await res.json();
      if (Array.isArray(parsed)) {
        parsed.forEach((r: ErrorReport) => {
          if (r && r.id) byId.set(r.id, r);
        });
      }
    }
  } catch {}

  const list = Array.from(byId.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  saveLocalErrorReports(list);
  return list;
}

/**
 * Atualiza o status de um reporte (ex: PENDENTE -> RESOLVIDO)
 */
export async function updateErrorReportStatus(reportId: string, status: 'PENDING' | 'RESOLVED', notes?: string): Promise<boolean> {
  const current = getLocalErrorReports();
  const updated = current.map(r => {
    if (r.id === reportId) {
      return {
        ...r,
        status,
        resolvedAt: status === 'RESOLVED' ? Date.now() : undefined,
        notes: notes !== undefined ? notes : r.notes
      };
    }
    return r;
  });
  saveLocalErrorReports(updated);

  // Notifica o servidor
  try {
    fetch('/api/live-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'UPDATE_REPORT_STATUS',
        reportId,
        status,
        notes
      })
    }).catch(() => {});
  } catch {}

  // Atualiza no Supabase Cultura
  try {
    const { data: culturaData } = await supabase
      .from('Cultura')
      .select('insignias_tiras')
      .eq('club_type', 'PATHFINDER')
      .single();

    if (culturaData?.insignias_tiras) {
      const parsed = typeof culturaData.insignias_tiras === 'string'
        ? JSON.parse(culturaData.insignias_tiras)
        : culturaData.insignias_tiras;
      if (Array.isArray(parsed?.reportes_erros)) {
        parsed.reportes_erros = parsed.reportes_erros.map((r: any) => {
          if (r?.id === reportId) {
            return {
              ...r,
              status,
              resolvedAt: status === 'RESOLVED' ? Date.now() : undefined,
              notes: notes !== undefined ? notes : r.notes
            };
          }
          return r;
        });
        await supabase
          .from('Cultura')
          .update({ insignias_tiras: JSON.stringify(parsed) })
          .eq('club_type', 'PATHFINDER');
      }
    }
  } catch {}

  return true;
}

/**
 * Exclui um reporte
 */
export async function deleteErrorReport(reportId: string): Promise<boolean> {
  const current = getLocalErrorReports();
  const filtered = current.filter(r => r.id !== reportId);
  saveLocalErrorReports(filtered);

  try {
    fetch('/api/live-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE_ERROR_REPORT',
        reportId
      })
    }).catch(() => {});
  } catch {}

  try {
    const { data: culturaData } = await supabase
      .from('Cultura')
      .select('insignias_tiras')
      .eq('club_type', 'PATHFINDER')
      .single();

    if (culturaData?.insignias_tiras) {
      const parsed = typeof culturaData.insignias_tiras === 'string'
        ? JSON.parse(culturaData.insignias_tiras)
        : culturaData.insignias_tiras;
      if (Array.isArray(parsed?.reportes_erros)) {
        parsed.reportes_erros = parsed.reportes_erros.filter((r: any) => r?.id !== reportId);
        await supabase
          .from('Cultura')
          .update({ insignias_tiras: JSON.stringify(parsed) })
          .eq('club_type', 'PATHFINDER');
      }
    }
  } catch {}

  return true;
}
