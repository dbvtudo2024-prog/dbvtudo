
import { createClient } from '@supabase/supabase-js';
import { ClubType, Category, Especialidade, ClubClass, DesbravaMais, BibleBook, BibleVerse, BibleDictionaryEntry, UserProfile, FuncaoCargo, Devocional, Cultura, LivroClasse, LivroAno, OutroLivro, ManualDBV, CampingDBV, Formulario, Video, VideoCategory, LivroAVT, ManualAVT, AppLink, Conquista, Trunfo } from '../types';
import { CANONICAL_BIBLE_BOOKS } from './bibleData';
import { RUD_UNIFORMES_DBV, RUD_UNIFORMES_AVT, RUD_EMBLEMAS_DBV, RUD_EMBLEMAS_AVT, RUD_CREDITS, getOfficialRudUniforms, getOfficialRudEmblems } from './rudService';
export { CANONICAL_BIBLE_BOOKS, RUD_UNIFORMES_DBV, RUD_UNIFORMES_AVT, RUD_EMBLEMAS_DBV, RUD_EMBLEMAS_AVT, RUD_CREDITS, getOfficialRudUniforms, getOfficialRudEmblems };

export const QFPY_URL = 'https://qfpyjavbncijowjvznkg.supabase.co';
export const QFPY_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmcHlqYXZibmNpam93anZ6bmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDcxMDUsImV4cCI6MjA3NDQyMzEwNX0.adxRCkobV-m_XUHp1KBXmg67VXkR-HL4QKFVtgQOmYc';

export const DEMB_URL = 'https://dembhtmryutggifbpuka.supabase.co';
export const DEMB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbWJodG1yeXV0Z2dpZmJwdWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDQ0NjUsImV4cCI6MjA5NTM4MDQ2NX0.PVAqzmvqo4wDO2_i_MCF1lw8yxXzLxJj1Uj_gcyKTRI';

const DEFAULT_URL = QFPY_URL;
const DEFAULT_KEY = QFPY_KEY;

const envMeta = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
const supabaseKey = envMeta.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

function resolveAlignedSupabaseUrl(rawUrl: string | undefined, key: string): string {
  try {
    if (key && key.split('.').length === 3) {
      const payloadB64 = key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = typeof atob === 'function' ? atob(payloadB64) : Buffer.from(payloadB64, 'base64').toString('utf8');
      const payload = JSON.parse(jsonStr);
      if (payload && payload.ref && typeof payload.ref === 'string') {
        return `https://${payload.ref}.supabase.co`;
      }
    }
  } catch {}
  if (rawUrl && rawUrl.startsWith('http')) return rawUrl;
  if (rawUrl && /^[a-z0-9]{15,30}$/i.test(rawUrl.trim())) {
    return `https://${rawUrl.trim()}.supabase.co`;
  }
  return DEFAULT_URL;
}

const supabaseUrl = resolveAlignedSupabaseUrl(envMeta.VITE_SUPABASE_URL, supabaseKey);

const safeSupabaseStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const val = window.localStorage.getItem(key);
      if (val && key.includes('auth-token')) {
        try {
          const parsed = JSON.parse(val);
          // Se o token for malformado (não tiver 3 partes JWT), limpa para não bloquear as consultas anônimas
          if (parsed && parsed.access_token && typeof parsed.access_token === 'string') {
            if (parsed.access_token.split('.').length !== 3) {
              window.localStorage.removeItem(key);
              return null;
            }
          }
        } catch {
          window.localStorage.removeItem(key);
          return null;
        }
      }
      return val;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
  }
};

export const supabaseQfpy = createClient(QFPY_URL, QFPY_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: safeSupabaseStorage
  }
});

export const supabaseDemb = createClient(DEMB_URL, DEMB_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: safeSupabaseStorage
  }
});

let _activeAuthProject: 'qfpy' | 'demb' = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('dbv_active_supabase_project');
      if (saved === 'demb' || saved === 'qfpy') return saved;
      if (window.localStorage.getItem('sb-qfpyjavbncijowjvznkg-auth-token')) return 'qfpy';
      if (window.localStorage.getItem('sb-dembhtmryutggifbpuka-auth-token')) return 'demb';
    }
  } catch {}
  return supabaseUrl.includes('dembhtmryutggifbpuka') ? 'demb' : 'qfpy';
})();

export function setActiveSupabaseProject(proj: 'qfpy' | 'demb') {
  _activeAuthProject = proj;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('dbv_active_supabase_project', proj);
    }
  } catch {}
}

export function getActiveSupabaseClient() {
  return _activeAuthProject === 'demb' ? supabaseDemb : supabaseQfpy;
}

export const supabase = new Proxy(supabaseQfpy, {
  get(_target, prop, _receiver) {
    const client = getActiveSupabaseClient() as any;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

export async function authenticateUserMultiProject(email: string, rawPassword: string): Promise<{
  user: any | null;
  profile: any | null;
  error: any | null;
}> {
  const cleanEmail = email.trim().toLowerCase();
  const trimmedPassword = rawPassword.trim();
  const candidates = Array.from(new Set([
    rawPassword,
    trimmedPassword,
    trimmedPassword.length > 1 && /^[A-Z]/.test(trimmedPassword)
      ? trimmedPassword.charAt(0).toLowerCase() + trimmedPassword.slice(1)
      : rawPassword,
    trimmedPassword.length > 1 && /^[a-z]/.test(trimmedPassword)
      ? trimmedPassword.charAt(0).toUpperCase() + trimmedPassword.slice(1)
      : rawPassword,
  ])).filter(Boolean);

  let lastError: any = null;
  let emailUnconfirmedPassword: string | null = null;

  for (const pwd of candidates) {
    // 1. Tenta no banco principal (qfpyjavbncijowjvznkg) e no banco secundário (dembhtmryutggifbpuka) simultaneamente
    const [resQfpy, resDemb] = await Promise.all([
      supabaseQfpy.auth.signInWithPassword({ email: cleanEmail, password: pwd }).catch(e => ({ data: { user: null, session: null }, error: e })),
      supabaseDemb.auth.signInWithPassword({ email: cleanEmail, password: pwd }).catch(e => ({ data: { user: null, session: null }, error: e }))
    ]);

    if (!resQfpy.error && resQfpy.data?.user) {
      setActiveSupabaseProject('qfpy');
      let profile: any = null;
      try {
        const { data: p1 } = await supabaseQfpy.from('Usuarios').select('*').eq('user_id', resQfpy.data.user.id).maybeSingle();
        profile = p1;
        if (!profile && !resDemb.error && resDemb.data?.user) {
          const { data: p2 } = await supabaseDemb.from('Usuarios').select('*').eq('user_id', resDemb.data.user.id).maybeSingle();
          if (p2) profile = p2;
        }
      } catch {}
      return { user: resQfpy.data.user, profile, error: null };
    }

    if (!resDemb.error && resDemb.data?.user) {
      setActiveSupabaseProject('demb');
      let profile: any = null;
      try {
        const { data: p2 } = await supabaseDemb.from('Usuarios').select('*').eq('user_id', resDemb.data.user.id).maybeSingle();
        profile = p2;
      } catch {}
      return { user: resDemb.data.user, profile, error: null };
    }

    const dembMsg = (resDemb.error?.message || '').toLowerCase();
    const qfpyMsg = (resQfpy.error?.message || '').toLowerCase();
    if (dembMsg.includes('email not confirmed') || qfpyMsg.includes('email not confirmed')) {
      emailUnconfirmedPassword = pwd;
    }

    lastError = resQfpy.error || resDemb.error;
  }

  // Se a conta foi criada na instância demb (onde mailer_autoconfirm era false) com esta senha exata,
  // ativa automaticamente no banco principal qfpy (onde mailer_autoconfirm é true)
  if (emailUnconfirmedPassword) {
    try {
      const signUpQfpy = await supabaseQfpy.auth.signUp({
        email: cleanEmail,
        password: emailUnconfirmedPassword
      });
      if (!signUpQfpy.error && signUpQfpy.data?.user) {
        setActiveSupabaseProject('qfpy');
        const { data: profile } = await supabaseQfpy.from('Usuarios').select('*').eq('user_id', signUpQfpy.data.user.id).maybeSingle();
        return { user: signUpQfpy.data.user, profile: profile || null, error: null };
      }
    } catch {}
  }

  return { user: null, profile: null, error: lastError };
}

export async function resetPasswordMultiProject(email: string, redirectTo: string): Promise<{ error: any | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const [r1, r2] = await Promise.all([
    supabaseQfpy.auth.resetPasswordForEmail(cleanEmail, { redirectTo }).catch(e => ({ error: e })),
    supabaseDemb.auth.resetPasswordForEmail(cleanEmail, { redirectTo }).catch(e => ({ error: e }))
  ]);
  if (!r1.error || !r2.error) {
    return { error: null };
  }
  return { error: r1.error || r2.error };
}

let _isSupabaseRestricted = false;
let _restrictionMessage = '';

export function notifySupabaseError(error: any) {
  if (!error) return;
  const msg = typeof error === 'string' ? error : (error.message || '');
  const code = error.code || (error.status ? String(error.status) : '');
  
  if (
    code === '402' ||
    msg.includes('exceed_cached_egress_quota') ||
    msg.includes('restricted') ||
    msg.includes('remove spend caps')
  ) {
    _isSupabaseRestricted = true;
    _restrictionMessage = msg || 'O projeto do Supabase atingiu o limite de tráfego de dados (egress quota) e está temporariamente restrito.';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('supabase_restricted', { 
        detail: { 
          message: _restrictionMessage,
          code: code || '402',
          isRestricted: true 
        } 
      }));
    }
  }
}

export function getSupabaseStatus() {
  return {
    isRestricted: _isSupabaseRestricted,
    message: _restrictionMessage
  };
}

export async function checkSupabaseHealth(): Promise<{ ok: boolean; message?: string }> {
  try {
    const { error } = await supabase.from('Cultura').select('id').limit(1);
    if (error) {
      notifySupabaseError(error);
      return { ok: false, message: error.message };
    }
    _isSupabaseRestricted = false;
    return { ok: true };
  } catch (err: any) {
    notifySupabaseError(err);
    return { ok: false, message: err?.message || 'Erro de conexão' };
  }
}

export async function fetchVideos(club: ClubType): Promise<Video[]> {
  try {
    const { data, error } = await supabase
      .from('Videos')
      .select('*')
      .eq('club', club)
      .order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function fetchAtividadesJogosDBV(): Promise<Video[]> {
  try {
    const { data, error } = await supabase.from('AtividadesJogosDBV').select('*').order('id', { ascending: true });
    if (error) return [];
    return (data || []).map(v => ({
      id: v.id,
      created_at: v.created_at,
      titulo: v.Titulo || '',
      canal: v.Canal || '',
      duracao: v.Minutos || '',
      visualizacoes: v.Visualizacao || '0',
      link: v.Link || '',
      categoria_id: -1, // Virtual ID
      club: ClubType.PATHFINDER
    }));
  } catch {
    return [];
  }
}

export async function fetchCerimoniasDBV(): Promise<Video[]> {
  try {
    const { data, error } = await supabase.from('CerimoniasDBV').select('*').order('id', { ascending: true });
    if (error) return [];
    return (data || []).map(v => ({
      id: v.id,
      created_at: v.created_at,
      titulo: v.Titulo || '',
      canal: v.Canal || '',
      duracao: v.Minutos || '',
      visualizacoes: v.Visualizacao || '0',
      link: v.Link || '',
      categoria_id: -2, // Virtual ID
      club: ClubType.PATHFINDER
    }));
  } catch {
    return [];
  }
}

export async function fetchVideosDBV(): Promise<Video[]> {
  try {
    const { data, error } = await supabase.from('VideosDBV').select('*').order('id', { ascending: true });
    if (error) return [];
    return (data || []).map(v => ({
      id: v.id,
      created_at: v.created_at,
      titulo: v.Titulo || '',
      canal: v.Canal || '',
      duracao: v.Minutos || '',
      visualizacoes: v.Visualizacao || '0',
      link: v.Link || '',
      categoria_id: -3, // Virtual ID
      club: ClubType.PATHFINDER
    }));
  } catch {
    return [];
  }
}

export async function fetchVideoCategories(club: ClubType): Promise<VideoCategory[]> {
  try {
    const { data, error } = await supabase
      .from('VideoCategories')
      .select('*')
      .eq('club', club)
      .order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function createVideo(video: Omit<Video, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase.from('Videos').insert([video]).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateVideo(video: Partial<Video> & { id: number }) {
  try {
    const { data, error } = await supabase.from('Videos').update(video).eq('id', video.id).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteVideo(id: number) {
  try {
    const { error } = await supabase.from('Videos').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function createVideoCategory(category: Omit<VideoCategory, 'id'>) {
  try {
    const { data, error } = await supabase.from('VideoCategories').insert([category]).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateVideoCategory(category: Partial<VideoCategory> & { id: number }) {
  try {
    const { data, error } = await supabase.from('VideoCategories').update(category).eq('id', category.id).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteVideoCategory(id: number) {
  try {
    const { error } = await supabase.from('VideoCategories').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchTableWithFallback(
  tableName: string,
  orderField: string = 'id',
  filterParam?: string
): Promise<any[]> {
  // 1. Supabase SDK
  try {
    let query = supabase.from(tableName).select('*');
    if (filterParam) {
      const [key, val] = filterParam.split('=');
      if (key && val) query = query.eq(key, decodeURIComponent(val));
    }
    const { data, error } = await query.order(orderField, { ascending: true });
    if (!error && data && Array.isArray(data) && data.length > 0) {
      return data;
    }
    if (error) {
      console.warn(`[Supabase SDK] Erro ao consultar ${tableName}:`, error);
      if (error.code === 'PGRST301' || (error as any).status === 401 || error.message?.includes('JWT')) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            Object.keys(window.localStorage).forEach(k => {
              if (k.startsWith('sb-') && k.endsWith('-auth-token')) window.localStorage.removeItem(k);
            });
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn(`[Supabase SDK] Exceção em ${tableName}:`, err);
  }

  // 2. Direct REST to Supabase API
  try {
    let restUrl = `${DEFAULT_URL}/rest/v1/${tableName}?select=*&order=${orderField}.asc`;
    if (filterParam) {
      restUrl += `&${filterParam}`;
    }
    const res = await fetch(restUrl, {
      headers: {
        'apikey': DEFAULT_KEY,
        'authorization': `Bearer ${DEFAULT_KEY}`
      }
    });
    if (res.ok) {
      const restData = await res.json();
      if (Array.isArray(restData) && restData.length > 0) {
        return restData;
      }
    }
  } catch (errRest) {
    console.warn(`[REST Direct] Erro em ${tableName}:`, errRest);
  }

  // 3. Same-origin proxy (fallback para dev)
  try {
    let proxyUrl = `/supabase-proxy/rest/v1/${tableName}?select=*&order=${orderField}.asc`;
    if (filterParam) {
      proxyUrl += `&${filterParam}`;
    }
    const res = await fetch(proxyUrl, {
      headers: {
        'apikey': DEFAULT_KEY,
        'authorization': `Bearer ${DEFAULT_KEY}`
      }
    });
    if (res.ok) {
      const pData = await res.json();
      if (Array.isArray(pData) && pData.length > 0) {
        return pData;
      }
    }
  } catch {}

  return [];
}

export async function fetchLivrosClasses(): Promise<LivroClasse[]> {
  const cacheKey = 'dbv_cached_livros_classes';
  const data = await fetchTableWithFallback('LivroDasClasses', 'id');
  if (data.length > 0) {
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    return data;
  }
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

export async function fetchLivrosAno(): Promise<LivroAno[]> {
  const cacheKey = 'dbv_cached_livros_ano';
  const data = await fetchTableWithFallback('LivrosDoAno', 'id');
  if (data.length > 0) {
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    return data;
  }
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

export async function fetchOutrosLivros(): Promise<OutroLivro[]> {
  const cacheKey = 'dbv_cached_outros_livros';
  const data = await fetchTableWithFallback('OutrosLivros', 'id');
  if (data.length > 0) {
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    return data;
  }
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

export async function fetchManuaisDBV(): Promise<ManualDBV[]> {
  const cacheKey = 'dbv_cached_manuais_dbv';
  const data = await fetchTableWithFallback('ManuaisDBV', 'id');
  if (data.length > 0) {
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    return data;
  }
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

export async function fetchCampingDBV(): Promise<CampingDBV[]> {
  const cacheKey = 'dbv_cached_camping_dbv';
  const data = await fetchTableWithFallback('CampingDBV', 'id');
  if (data.length > 0) {
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    return data;
  }
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

export async function fetchFormularios(): Promise<Formulario[]> {
  try {
    const { data, error } = await supabase.from('Formularios').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function createFormulario(formulario: Omit<Formulario, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase.from('Formularios').insert([formulario]).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateFormulario(formulario: Partial<Formulario> & { id: number }) {
  try {
    const { data, error } = await supabase.from('Formularios').update(formulario).eq('id', formulario.id).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteFormulario(id: number) {
  try {
    const { error } = await supabase.from('Formularios').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchCategories(club: ClubType): Promise<Category[]> {
  const cacheKey = `dbv_cached_categories_${club}`;
  const table = club === ClubType.PATHFINDER ? 'CategoriaEspecialidadeDBV' : 'CategoriaEspecialidadeAVT';
  const data = await fetchTableWithFallback(table, 'id');
  if (data.length > 0) {
    const mapped: Category[] = data.map(item => ({
      id: item.id,
      nome: item.Mestrado || item.Nome || item.nome || item.Titulo || 'Sem Nome',
      imagem: item.Imagem || item.imagem || item.Icone,
      cor: item.CorCorpo || item.Cor || item.cor,
      sigla: item.Sigla || item.sigla
    }));
    try { localStorage.setItem(cacheKey, JSON.stringify(mapped)); } catch {}
    return mapped;
  }
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

export async function fetchClasses(club: ClubType): Promise<ClubClass[]> {
  const cacheKey = `dbv_cached_classes_${club}`;
  const table = club === ClubType.PATHFINDER ? 'Classes' : 'ClassesAVT';
  const data = await fetchTableWithFallback(table, 'id');
  if (data.length > 0) {
    const mapped: ClubClass[] = data.map(item => ({
      id: item.id,
      titulo: item.titulo || item.Titulo || item.nome || item.Nome || item.classe || item.Classe || '',
      sigla: item.Sigla || item.sigla,
      imagem: item.Imagem || item.imagem || item.logo || item.Logo || item.Icone || item.icone,
      subtitulo: item.SubTitulo || item.Subtitulo || item.subtitulo || item.descricao || item.Descricao || '',
      cor: item.Cor || item.cor,
      corpo: item.Corpo || item.corpo
    }));
    try { localStorage.setItem(cacheKey, JSON.stringify(mapped)); } catch {}
    return mapped;
  }
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

const ESPECIALIDADES_CACHE_KEY_PREFIX = 'dbv_tudo_cached_specialties_';
const ESPECIALIDADES_LIGHT_CACHE_KEY_PREFIX = 'dbv_tudo_cached_specialties_light_';
const ESPECIALIDADES_CACHE_TS_PREFIX = 'dbv_tudo_cached_specialties_ts_';
const ESPECIALIDADES_ALL_CACHE_KEY = 'dbv_tudo_cached_specialties_all';
const ESPECIALIDADES_CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 horas

const _memoryEspecialidadesCache: Partial<Record<ClubType, { full?: Especialidade[]; light?: Especialidade[]; ts: number }>> = {};

export function getCachedEspecialidades(club?: ClubType | null, allowLight: boolean = false): Especialidade[] {
  if (club && _memoryEspecialidadesCache[club]) {
    const mem = _memoryEspecialidadesCache[club]!;
    if (mem.full && mem.full.length > 0) return mem.full;
    if (allowLight && mem.light && mem.light.length > 0) return mem.light;
  }
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    if (club) {
      const specific = localStorage.getItem(ESPECIALIDADES_CACHE_KEY_PREFIX + club);
      if (specific) {
        const parsed = JSON.parse(specific);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      if (allowLight) {
        const specificLight = localStorage.getItem(ESPECIALIDADES_LIGHT_CACHE_KEY_PREFIX + club);
        if (specificLight) {
          const parsedLight = JSON.parse(specificLight);
          if (Array.isArray(parsedLight) && parsedLight.length > 0) return parsedLight;
        }
      }
    }
    const all = localStorage.getItem(ESPECIALIDADES_ALL_CACHE_KEY);
    if (all) {
      const parsed = JSON.parse(all);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (club) return parsed.filter((item: Especialidade) => item.club === club);
        return parsed;
      }
    }
  } catch {}
  return [];
}

function isEspecialidadesCacheFresh(club: ClubType, requireFull: boolean): Especialidade[] | null {
  const now = Date.now();
  const mem = _memoryEspecialidadesCache[club];
  if (mem && (now - mem.ts < ESPECIALIDADES_CACHE_TTL_MS)) {
    if (mem.full && mem.full.length > 0) return mem.full;
    if (!requireFull && mem.light && mem.light.length > 0) return mem.light;
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const tsStr = localStorage.getItem(ESPECIALIDADES_CACHE_TS_PREFIX + club);
      const ts = tsStr ? Number(tsStr) : 0;
      if (ts > 0 && (now - ts < ESPECIALIDADES_CACHE_TTL_MS)) {
        const fullRaw = localStorage.getItem(ESPECIALIDADES_CACHE_KEY_PREFIX + club);
        if (fullRaw) {
          const parsed = JSON.parse(fullRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            _memoryEspecialidadesCache[club] = { ...(mem || {}), full: parsed, ts };
            return parsed;
          }
        }
        if (!requireFull) {
          const lightRaw = localStorage.getItem(ESPECIALIDADES_LIGHT_CACHE_KEY_PREFIX + club);
          if (lightRaw) {
            const parsedLight = JSON.parse(lightRaw);
            if (Array.isArray(parsedLight) && parsedLight.length > 0) {
              _memoryEspecialidadesCache[club] = { ...(mem || {}), light: parsedLight, ts };
              return parsedLight;
            }
          }
        }
      }
    } catch {}
  }
  return null;
}

export async function fetchAllEspecialidades(options?: { excludeQuestions?: boolean }): Promise<Especialidade[]> {
  try {
    const [dbv, avt] = await Promise.all([
      fetchEspecialidades(ClubType.PATHFINDER, undefined, options),
      fetchEspecialidades(ClubType.ADVENTURER, undefined, options)
    ]);
    const combined = [...dbv, ...avt];
    if (combined.length > 0) {
      if (!options?.excludeQuestions) {
        try {
          localStorage.setItem(ESPECIALIDADES_ALL_CACHE_KEY, JSON.stringify(combined));
        } catch {}
      }
      return combined;
    }
    return getCachedEspecialidades(null, !!options?.excludeQuestions);
  } catch {
    return getCachedEspecialidades(null, !!options?.excludeQuestions);
  }
}

export async function fetchEspecialidadeRequisitos(club: ClubType, id: number): Promise<string[]> {
  const table = club === ClubType.PATHFINDER ? 'EspecialidadesDBV' : 'EspecialidadesAVT';
  try {
    const { data, error } = await supabase.from(table).select('Questoes').eq('id', id).maybeSingle();
    if (!error && data?.Questoes) {
      return data.Questoes.split(/\r?\n/).map((r: string) => r.trim()).filter((r: string) => r.length > 0);
    }
  } catch {}
  try {
    const res = await fetch(`${DEFAULT_URL}/rest/v1/${table}?select=Questoes&id=eq.${id}&limit=1`, {
      headers: {
        'apikey': DEFAULT_KEY,
        'authorization': `Bearer ${DEFAULT_KEY}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      const q = rows?.[0]?.Questoes;
      if (q) {
        return q.split(/\r?\n/).map((r: string) => r.trim()).filter((r: string) => r.length > 0);
      }
    }
  } catch {}
  return [];
}

export async function fetchEspecialidades(
  club: ClubType,
  categoryFilter?: string,
  options?: { excludeQuestions?: boolean; forceRefresh?: boolean }
): Promise<Especialidade[]> {
  const excludeQuestions = !!options?.excludeQuestions;
  try {
    // 1. Reutiliza cache fresco em memória/localStorage para evitar consultas repetidas ao banco
    if (!options?.forceRefresh) {
      const cached = isEspecialidadesCacheFresh(club, !excludeQuestions);
      if (cached && cached.length > 0) {
        return categoryFilter
          ? cached.filter(item => item.area === categoryFilter)
          : cached;
      }
    }

    const table = club === ClubType.PATHFINDER ? 'EspecialidadesDBV' : 'EspecialidadesAVT';
    const selectCols = excludeQuestions
      ? 'id,ID,Nome,Categoria,Imagem,Sigla,Nivel,Ano,Origem'
      : '*';

    let query = supabase.from(table).select(selectCols);
    if (categoryFilter) query = query.eq('Categoria', categoryFilter);
    
    const { data, error } = await query.order('ID', { ascending: true });
    if (error || !data) {
      if (error) {
        console.warn(`Erro ao consultar ${table} no Supabase:`, error);
        if (error.code === 'PGRST301' || (error as any).status === 401 || error.message?.includes('JWT')) {
          try {
            if (typeof window !== 'undefined' && window.localStorage) {
              Object.keys(window.localStorage).forEach(k => {
                if (k.startsWith('sb-') && k.endsWith('-auth-token')) window.localStorage.removeItem(k);
              });
            }
          } catch {}
        }
      }

      // 1. Tenta fallback direto via REST API oficial do Supabase
      try {
        let directUrl = `${DEFAULT_URL}/rest/v1/${table}?select=${encodeURIComponent(selectCols)}&order=ID.asc`;
        if (categoryFilter) directUrl += `&Categoria=eq.${encodeURIComponent(categoryFilter)}`;
        const res = await fetch(directUrl, {
          headers: {
            'apikey': DEFAULT_KEY,
            'authorization': `Bearer ${DEFAULT_KEY}`
          }
        });
        if (res.ok) {
          const pData = await res.json();
          if (Array.isArray(pData) && pData.length > 0) {
            const mappedProxy: Especialidade[] = pData.map(item => ({
              id: item.id,
              nome: item.Nome,
              area: item.Categoria,
              logo: item.Imagem,
              requisitos: item.Questoes ? item.Questoes.split(/\r?\n/).map((r: string) => r.trim()).filter((r: string) => r.length > 0) : [],
              club,
              sigla: item.Sigla,
              nivel: item.Nivel,
              ano: item.Ano,
              origem: item.Origem,
              codigo: item.ID
            }));
            if (!categoryFilter && mappedProxy.length > 0) {
              const now = Date.now();
              const prevMem = _memoryEspecialidadesCache[club] || { ts: now };
              _memoryEspecialidadesCache[club] = excludeQuestions
                ? { ...prevMem, light: mappedProxy, ts: now }
                : { ...prevMem, full: mappedProxy, light: mappedProxy, ts: now };
              try {
                const key = (excludeQuestions ? ESPECIALIDADES_LIGHT_CACHE_KEY_PREFIX : ESPECIALIDADES_CACHE_KEY_PREFIX) + club;
                localStorage.setItem(key, JSON.stringify(mappedProxy));
                localStorage.setItem(ESPECIALIDADES_CACHE_TS_PREFIX + club, String(now));
              } catch {}
            }
            return mappedProxy;
          }
        }
      } catch (errDirect) {
        console.warn(`Fallback REST direto para ${table} falhou:`, errDirect);
      }

      // 2. Tenta fallback via same-origin proxy (dev)
      try {
        let proxyUrl = `/supabase-proxy/rest/v1/${table}?select=${encodeURIComponent(selectCols)}&order=ID.asc`;
        if (categoryFilter) proxyUrl += `&Categoria=eq.${encodeURIComponent(categoryFilter)}`;
        const res = await fetch(proxyUrl, {
          headers: {
            'apikey': DEFAULT_KEY,
            'authorization': `Bearer ${DEFAULT_KEY}`
          }
        });
        if (res.ok) {
          const pData = await res.json();
          if (Array.isArray(pData) && pData.length > 0) {
            const mappedProxy: Especialidade[] = pData.map(item => ({
              id: item.id,
              nome: item.Nome,
              area: item.Categoria,
              logo: item.Imagem,
              requisitos: item.Questoes ? item.Questoes.split(/\r?\n/).map((r: string) => r.trim()).filter((r: string) => r.length > 0) : [],
              club,
              sigla: item.Sigla,
              nivel: item.Nivel,
              ano: item.Ano,
              origem: item.Origem,
              codigo: item.ID
            }));
            if (!categoryFilter && mappedProxy.length > 0) {
              const now = Date.now();
              const prevMem = _memoryEspecialidadesCache[club] || { ts: now };
              _memoryEspecialidadesCache[club] = excludeQuestions
                ? { ...prevMem, light: mappedProxy, ts: now }
                : { ...prevMem, full: mappedProxy, light: mappedProxy, ts: now };
              try {
                const key = (excludeQuestions ? ESPECIALIDADES_LIGHT_CACHE_KEY_PREFIX : ESPECIALIDADES_CACHE_KEY_PREFIX) + club;
                localStorage.setItem(key, JSON.stringify(mappedProxy));
                localStorage.setItem(ESPECIALIDADES_CACHE_TS_PREFIX + club, String(now));
              } catch {}
            }
            return mappedProxy;
          }
        }
      } catch {}

      return getCachedEspecialidades(club, excludeQuestions);
    }
    const mapped: Especialidade[] = (data || []).map((item: any) => ({
      id: item.id,
      nome: item.Nome,
      area: item.Categoria,
      logo: item.Imagem,
      requisitos: item.Questoes ? item.Questoes.split(/\r?\n/).map((r: string) => r.trim()).filter((r: string) => r.length > 0) : [],
      club,
      sigla: item.Sigla,
      nivel: item.Nivel,
      ano: item.Ano,
      origem: item.Origem,
      codigo: item.ID
    }));

    if (!categoryFilter && mapped.length > 0) {
      const now = Date.now();
      const prevMem = _memoryEspecialidadesCache[club] || { ts: now };
      _memoryEspecialidadesCache[club] = excludeQuestions
        ? { ...prevMem, light: mapped, ts: now }
        : { ...prevMem, full: mapped, light: mapped, ts: now };
      try {
        const key = (excludeQuestions ? ESPECIALIDADES_LIGHT_CACHE_KEY_PREFIX : ESPECIALIDADES_CACHE_KEY_PREFIX) + club;
        localStorage.setItem(key, JSON.stringify(mapped));
        localStorage.setItem(ESPECIALIDADES_CACHE_TS_PREFIX + club, String(now));
      } catch {}
    }

    return mapped;
  } catch {
    return getCachedEspecialidades(club, excludeQuestions);
  }
}

export async function fetchDesbravaMais(): Promise<DesbravaMais[]> {
  try {
    const { data, error } = await supabase
      .from('DesbravaMais')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) return [];
    return (data || []).map(item => ({
      ...item,
      PDF: item.PDF || item.pdf || item.Pdf || item.Link || item.link
    }));
  } catch {
    return [];
  }
}

// ==========================================
// 1. Minha Faixa (Especialidades Conquistadas pelo Membro - Isoladas por Clube)
// ==========================================
export function getLocalFaixaSpecialties(email?: string | null, clubType?: string | null): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  const club = clubType === 'ADVENTURER' ? 'ADVENTURER' : 'PATHFINDER';
  const cleanEmail = (email && email !== 'email@exemplo.com') ? email.toLowerCase().trim() : null;
  const foundIds = new Set<string>();

  const parseAndAdd = (raw: string | null) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item !== null && item !== undefined) {
            const str = item.toString().trim();
            if (str.length > 0) foundIds.add(str);
          }
        });
      }
    } catch {}
  };

  if (cleanEmail) {
    parseAndAdd(localStorage.getItem(`dbv_tudo_faixa_${club}_${cleanEmail}`));
  }
  parseAndAdd(localStorage.getItem(`dbv_tudo_faixa_${club}`));

  // Fallback legível apenas da chave isolada daquele clube
  if (foundIds.size === 0) {
    parseAndAdd(localStorage.getItem(`dbv_tudo_liked_specialties_${club}`));
  }

  return Array.from(foundIds);
}

export function saveLocalFaixaSpecialties(specialties: string[], email?: string | null, clubType?: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const club = clubType === 'ADVENTURER' ? 'ADVENTURER' : 'PATHFINDER';
  const cleanEmail = (email && email !== 'email@exemplo.com') ? email.toLowerCase().trim() : null;

  const validIds = Array.from(new Set(
    (specialties || [])
      .map(id => (id !== null && id !== undefined ? id.toString().trim() : ''))
      .filter(id => id.length > 0)
  ));
  const serialized = JSON.stringify(validIds);

  try {
    localStorage.setItem(`dbv_tudo_faixa_${club}`, serialized);
    if (cleanEmail) {
      localStorage.setItem(`dbv_tudo_faixa_${club}_${cleanEmail}`, serialized);
    }
    // Manter chave de compatibilidade por clube para persistência resiliente da faixa
    localStorage.setItem(`dbv_tudo_liked_specialties_${club}`, serialized);

    // Salva no perfil global
    try {
      const profileRaw = localStorage.getItem('dbv_tudo_global_user_profile');
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        profile.faixa = validIds;
        profile.Especialidades = validIds.join(',');
        localStorage.setItem('dbv_tudo_global_user_profile', JSON.stringify(profile));
      }
    } catch {}

    // Notificar exclusivamente ouvintes da Faixa (NÃO notifica o catálogo)
    window.dispatchEvent(new CustomEvent('dbv_faixa_changed', { detail: { club, specialties: validIds } }));
  } catch (e) {
    console.warn("Erro ao salvar faixa localmente:", e);
  }
}

export function clearLocalFaixaSpecialties(email?: string | null, clubType?: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const club = clubType === 'ADVENTURER' ? 'ADVENTURER' : 'PATHFINDER';
  const cleanEmail = (email && email !== 'email@exemplo.com') ? email.toLowerCase().trim() : null;
  const empty = JSON.stringify([]);

  try {
    localStorage.setItem(`dbv_tudo_faixa_${club}`, empty);
    if (cleanEmail) {
      localStorage.setItem(`dbv_tudo_faixa_${club}_${cleanEmail}`, empty);
    }
    localStorage.setItem(`dbv_tudo_liked_specialties_${club}`, empty);

    window.dispatchEvent(new CustomEvent('dbv_faixa_changed', { detail: { club, specialties: [] } }));
  } catch (e) {
    console.warn("Erro ao limpar faixa localmente:", e);
  }
}

export async function fetchUserFaixaSpecialties(email?: string | null, userId?: string | null, clubType?: string | null): Promise<string[]> {
  try {
    let rawData: any = null;
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) effectiveUserId = data.user.id;
      } catch {}
    }

    if (effectiveUserId) {
      try {
        const { data } = await supabase
          .from('Usuarios')
          .select('Especialidades, especialidades')
          .eq('user_id', effectiveUserId)
          .maybeSingle();
        if (data) {
          rawData = data.Especialidades !== undefined ? data.Especialidades : data.especialidades;
        }
      } catch {}
    }

    if (rawData !== null && rawData !== undefined) {
      if (typeof rawData === 'string') {
        const parsed = rawData.split(',').map(id => id.trim()).filter(id => id.length > 0);
        // Retorna mesmo que vazio (ex: usuário removeu tudo) ou com especialidades
        return parsed;
      }

      if (Array.isArray(rawData)) {
        const parsed = rawData
          .map(id => (id !== null && id !== undefined ? id.toString().trim() : ''))
          .filter(id => id.length > 0);
        return parsed;
      }
    }

    return getLocalFaixaSpecialties(email, clubType);
  } catch {
    return getLocalFaixaSpecialties(email, clubType);
  }
}

export async function updateUserFaixa(email?: string | null, specialties: string[] = [], userId?: string | null, clubType?: string | null) {
  try {
    const validIds = Array.from(new Set(
      (specialties || [])
        .map(id => (id !== null && id !== undefined ? id.toString().trim() : ''))
        .filter(id => id.length > 0)
    ));
    const espString = validIds.join(',');

    // Salva localmente na Faixa de forma imediata e isolada
    saveLocalFaixaSpecialties(validIds, email, clubType);

    let effectiveUserId = userId;
    if (!effectiveUserId) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) effectiveUserId = data.user.id;
      } catch {}
    }

    if (!effectiveUserId) return { error: "Sem ID de usuário autenticado" };

    // Tabela Usuarios no Supabase possui apenas colunas: user_id, Especialidades, nome, etc. Não possui updated_at!
    const res = await supabase
      .from('Usuarios')
      .upsert({
        user_id: effectiveUserId,
        Especialidades: espString
      }, { onConflict: 'user_id' });

    return { data: res.data, error: res.error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

// ==========================================
// 2. Especialidades Curtidas no Catálogo (Salvas para Estudo - Isoladas por Clube)
// ==========================================
export function getLocalCatalogFavorites(email?: string | null, club?: ClubType | string | null): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  const clubKey = club === ClubType.ADVENTURER || club === 'ADVENTURER' ? 'ADVENTURER' : 'PATHFINDER';
  const cleanEmail = (email && email !== 'email@exemplo.com') ? email.toLowerCase().trim() : null;
  const found = new Set<string>();

  const parseAndAdd = (raw: string | null) => {
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item !== null && item !== undefined) {
            const str = item.toString().trim();
            if (str.length > 0) found.add(str);
          }
        });
      }
    } catch {}
  };

  if (cleanEmail) {
    parseAndAdd(localStorage.getItem(`dbv_tudo_catalog_favs_${clubKey}_${cleanEmail}`));
  }
  parseAndAdd(localStorage.getItem(`dbv_tudo_catalog_favs_${clubKey}`));

  return Array.from(found);
}

export function saveLocalCatalogFavorites(favorites: string[], email?: string | null, club?: ClubType | string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const clubKey = club === ClubType.ADVENTURER || club === 'ADVENTURER' ? 'ADVENTURER' : 'PATHFINDER';
  const cleanEmail = (email && email !== 'email@exemplo.com') ? email.toLowerCase().trim() : null;

  const validIds = Array.from(new Set(
    (favorites || [])
      .map(id => (id !== null && id !== undefined ? id.toString().trim() : ''))
      .filter(id => id.length > 0)
  ));
  const serialized = JSON.stringify(validIds);

  try {
    localStorage.setItem(`dbv_tudo_catalog_favs_${clubKey}`, serialized);
    if (cleanEmail) {
      localStorage.setItem(`dbv_tudo_catalog_favs_${clubKey}_${cleanEmail}`, serialized);
    }
    // Notifica exclusivamente a tela de catálogo
    window.dispatchEvent(new CustomEvent('dbv_catalog_favs_changed', { detail: { club: clubKey, favorites: validIds } }));
  } catch (e) {
    console.warn("Erro ao salvar favoritas do catálogo:", e);
  }
}

// Funções de compatibilidade para chamadas legadas
const SPECIALTY_GLOBAL_KEY = 'dbv_tudo_completed_specialties_global';

export function getLocalUserSpecialties(email?: string | null, clubType?: string | null): string[] {
  return getLocalCatalogFavorites(email, clubType);
}

export function saveLocalUserSpecialties(specialties: string[], email?: string | null, clubType?: string | null): void {
  saveLocalCatalogFavorites(specialties, email, clubType);
}

export function clearLocalUserSpecialties(email?: string | null, clubType?: string | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const clubKey = clubType === 'ADVENTURER' ? 'ADVENTURER' : 'PATHFINDER';
  const cleanEmail = (email && email !== 'email@exemplo.com') ? email.toLowerCase().trim() : null;
  const empty = JSON.stringify([]);
  try {
    localStorage.setItem(`dbv_tudo_catalog_favs_${clubKey}`, empty);
    if (cleanEmail) {
      localStorage.setItem(`dbv_tudo_catalog_favs_${clubKey}_${cleanEmail}`, empty);
    }
    window.dispatchEvent(new CustomEvent('dbv_catalog_favs_changed', { detail: { club: clubKey, favorites: [] } }));
  } catch (e) {
    console.warn("Erro ao limpar especialidades locais:", e);
  }
}

export async function fetchUserSpecialties(email?: string | null, userId?: string | null): Promise<string[]> {
  try {
    let rawData: any = null;

    // 1. Obter userId da sessão se não fornecido
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          effectiveUserId = data.user.id;
        }
      } catch {}
    }

    // 2. Se temos userId, buscar primeiro por user_id na tabela Usuarios
    if (effectiveUserId) {
      try {
        const { data } = await supabase
          .from('Usuarios')
          .select('Especialidades, especialidades')
          .eq('user_id', effectiveUserId)
          .maybeSingle();
        if (data) {
          rawData = data.Especialidades || data.especialidades;
        }
      } catch {}
    }

    // 3. Fallback na tabela 'profiles' se existir
    if (!rawData && effectiveUserId) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('Especialidades, especialidades')
          .eq('user_id', effectiveUserId)
          .maybeSingle();
        if (data) {
          rawData = data.Especialidades || data.especialidades;
        }
      } catch {}
    }

    if (!rawData) {
      return getLocalUserSpecialties(email);
    }

    // Se for string (ex: "1,2,3"), converte para array de strings
    if (typeof rawData === 'string') {
      const parsed = rawData
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);
      if (parsed.length > 0) return parsed;
    }

    // Se já for array
    if (Array.isArray(rawData)) {
      const parsed = rawData
        .map(id => (id !== null && id !== undefined ? id.toString().trim() : ''))
        .filter(id => id.length > 0);
      if (parsed.length > 0) return parsed;
    }

    return getLocalUserSpecialties(email);
  } catch {
    return getLocalUserSpecialties(email);
  }
}

export async function updateUserSpecialties(email?: string | null, specialties: string[] = [], userId?: string | null) {
  try {
    const validIds = Array.from(new Set(
      (specialties || [])
        .map(id => (id !== null && id !== undefined ? id.toString().trim() : ''))
        .filter(id => id.length > 0)
    ));
    const espString = validIds.join(',');

    // Sempre salva localmente primeiro para proteção total
    saveLocalUserSpecialties(validIds, email);

    // Obter user_id se não fornecido
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          effectiveUserId = data.user.id;
        }
      } catch {}
    }

    let success = false;
    let lastError: any = null;

    if (effectiveUserId) {
      // 1. Tentar upsert com Especialidades na tabela Usuarios
      const upsertRes = await supabase
        .from('Usuarios')
        .upsert(
          { user_id: effectiveUserId, Especialidades: espString },
          { onConflict: 'user_id' }
        );

      if (!upsertRes.error) {
        success = true;
      } else {
        // Se falhar o upsert, tentar update direto
        const res1 = await supabase
          .from('Usuarios')
          .update({ Especialidades: espString })
          .eq('user_id', effectiveUserId);

        if (!res1.error) {
          success = true;
        } else {
          // Tenta com minúsculas se a coluna tiver casing diferente
          const res2 = await supabase
            .from('Usuarios')
            .update({ especialidades: espString })
            .eq('user_id', effectiveUserId);
          if (!res2.error) {
            success = true;
          } else {
            lastError = res1.error || res2.error;
          }
        }
      }
    }

    return { error: success ? null : lastError };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchBibleBooks(): Promise<BibleBook[]> {
  try {
    // 1. Verificar cache local rápido
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cached = localStorage.getItem('dbv_cached_bible_books');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length >= 66) {
            return parsed;
          }
        }
      }
    } catch {}

    // 2. Consulta via Supabase Client
    const { data, error } = await supabase
      .from('Biblia_Completa')
      .select('id, book_name, book_abbrev, total_chapters, testament')
      .eq('chapter', '1')
      .eq('verse_number', '1')
      .order('id', { ascending: true });
    
    if (!error && data && data.length > 0) {
      const mapped: BibleBook[] = data.map((item, idx) => ({
        id: Number(item.id) || (idx + 1),
        book_name: item.book_name || '',
        book_abbrev: item.book_abbrev || CANONICAL_BIBLE_BOOKS[idx]?.book_abbrev || '',
        total_chapters: Number(item.total_chapters) || CANONICAL_BIBLE_BOOKS[idx]?.total_chapters || 1,
        testament: item.testament || CANONICAL_BIBLE_BOOKS[idx]?.testament || 'Antigo'
      }));
      try {
        localStorage.setItem('dbv_cached_bible_books', JSON.stringify(mapped));
      } catch {}
      return mapped;
    }

    // 3. Fallback via fetch direto à API REST do Supabase
    try {
      const restUrl = `${DEFAULT_URL}/rest/v1/Biblia_Completa?select=id,book_name,book_abbrev,total_chapters,testament&chapter=eq.1&verse_number=eq.1&order=id.asc`;
      const res = await fetch(restUrl, {
        headers: {
          'apikey': DEFAULT_KEY,
          'authorization': `Bearer ${DEFAULT_KEY}`
        }
      });
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          const mapped: BibleBook[] = restData.map((item, idx) => ({
            id: Number(item.id) || (idx + 1),
            book_name: item.book_name || '',
            book_abbrev: item.book_abbrev || CANONICAL_BIBLE_BOOKS[idx]?.book_abbrev || '',
            total_chapters: Number(item.total_chapters) || CANONICAL_BIBLE_BOOKS[idx]?.total_chapters || 1,
            testament: item.testament || CANONICAL_BIBLE_BOOKS[idx]?.testament || 'Antigo'
          }));
          try {
            localStorage.setItem('dbv_cached_bible_books', JSON.stringify(mapped));
          } catch {}
          return mapped;
        }
      }
    } catch {}

    return CANONICAL_BIBLE_BOOKS;
  } catch (err) {
    console.warn('Exceção ao buscar livros da Bíblia:', err);
    return CANONICAL_BIBLE_BOOKS;
  }
}

export async function fetchBibleVerses(bookName: string, chapter: string): Promise<BibleVerse[]> {
  const cacheKey = `dbv_bible_cache_${bookName}_${chapter}`;

  // 1. Verificar cache local imediato
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {}

  const saveCache = (verses: BibleVerse[]) => {
    if (Array.isArray(verses) && verses.length > 0) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(verses));
      } catch {}
    }
  };

  try {
    // 2. Consulta via Supabase Client
    const { data, error } = await supabase
      .from('Biblia_Completa')
      .select('id, book_name, chapter, verse_number, text')
      .eq('book_name', bookName)
      .eq('chapter', chapter)
      .order('id', { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped = data.map(item => ({
        id: Number(item.id),
        book_name: item.book_name || '',
        chapter: item.chapter || '',
        verse_number: item.verse_number || '',
        text: item.text || ''
      }));
      saveCache(mapped);
      return mapped;
    }

    if (error) {
      console.warn('Erro ao consultar versículos no Supabase:', error);
      if (error.code === 'PGRST301' || (error as any).status === 401 || error.message?.includes('JWT')) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            Object.keys(window.localStorage).forEach(k => {
              if (k.startsWith('sb-') && k.endsWith('-auth-token')) window.localStorage.removeItem(k);
            });
          }
        } catch {}
      }
    }

    // 3. Fallback Direto via REST API do Supabase com chave oficial anônima
    try {
      const directUrl = `${DEFAULT_URL}/rest/v1/Biblia_Completa?select=id,book_name,chapter,verse_number,text&book_name=eq.${encodeURIComponent(bookName)}&chapter=eq.${encodeURIComponent(chapter)}&order=id.asc`;
      const res = await fetch(directUrl, {
        headers: {
          'apikey': DEFAULT_KEY,
          'authorization': `Bearer ${DEFAULT_KEY}`
        }
      });
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          const mapped = restData.map(item => ({
            id: Number(item.id),
            book_name: item.book_name || '',
            chapter: item.chapter || '',
            verse_number: item.verse_number || '',
            text: item.text || ''
          }));
          saveCache(mapped);
          return mapped;
        }
      }
    } catch (errRest) {
      console.warn('Fallback REST direto falhou:', errRest);
    }

    // 4. Fallback via proxy local (caso exista no ambiente de desenvolvimento)
    try {
      const proxyUrl = `/supabase-proxy/rest/v1/Biblia_Completa?select=id,book_name,chapter,verse_number,text&book_name=eq.${encodeURIComponent(bookName)}&chapter=eq.${encodeURIComponent(chapter)}&order=id.asc`;
      const res = await fetch(proxyUrl, {
        headers: {
          'apikey': DEFAULT_KEY,
          'authorization': `Bearer ${DEFAULT_KEY}`
        }
      });
      if (res.ok) {
        const proxyData = await res.json();
        if (Array.isArray(proxyData) && proxyData.length > 0) {
          const mapped = proxyData.map(item => ({
            id: Number(item.id),
            book_name: item.book_name || '',
            chapter: item.chapter || '',
            verse_number: item.verse_number || '',
            text: item.text || ''
          }));
          saveCache(mapped);
          return mapped;
        }
      }
    } catch {}

    return [];
  } catch (errCatch) {
    console.warn('Exceção ao buscar versículos da Bíblia:', errCatch);

    // Tentativa final de resgate direto via REST
    try {
      const directUrl = `${DEFAULT_URL}/rest/v1/Biblia_Completa?select=id,book_name,chapter,verse_number,text&book_name=eq.${encodeURIComponent(bookName)}&chapter=eq.${encodeURIComponent(chapter)}&order=id.asc`;
      const res = await fetch(directUrl, {
        headers: {
          'apikey': DEFAULT_KEY,
          'authorization': `Bearer ${DEFAULT_KEY}`
        }
      });
      if (res.ok) {
        const restData = await res.json();
        if (Array.isArray(restData) && restData.length > 0) {
          const mapped = restData.map(item => ({
            id: Number(item.id),
            book_name: item.book_name || '',
            chapter: item.chapter || '',
            verse_number: item.verse_number || '',
            text: item.text || ''
          }));
          saveCache(mapped);
          return mapped;
        }
      }
    } catch {}

    return [];
  }
}

export async function fetchBibleDictionary(search?: string): Promise<BibleDictionaryEntry[]> {
  try {
    let query = supabase.from('Biblia_Dicionario').select('*');
    
    if (search) {
      query = query.ilike('nome', `%${search}%`);
    }
    
    const { data, error } = await query.order('nome', { ascending: true }).limit(100);
    
    if (error || !data) return [];
    
    return (data || []).map(item => ({
      id: Number(item.id),
      nome: item.nome || '',
      texto: item.texto || '',
      categoria: item.categoria || '',
      referencia: item.referencia || ''
    }));
  } catch {
    return [];
  }
}

// Funções para Devocionais
export async function fetchDevocionais(): Promise<Devocional[]> {
  try {
    const { data, error } = await supabase
      .from('devocionais')
      .select('*')
      .order('agendado_para', { ascending: false });
    
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function createDevocional(devocional: Omit<Devocional, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('devocionais')
      .insert([devocional])
      .select()
      .single();
    
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function updateDevocional(devocional: Partial<Devocional> & { id: string }) {
  try {
    const { data, error } = await supabase
      .from('devocionais')
      .update(devocional)
      .eq('id', devocional.id)
      .select()
      .single();
    
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteDevocional(id: string) {
  try {
    const { error } = await supabase
      .from('devocionais')
      .delete()
      .eq('id', id);
    
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

// Funções para Perfil do Usuário
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const primaryClient = getActiveSupabaseClient();
    const { data, error } = await primaryClient
      .from('Usuarios')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!error && data) return data;

    const secondaryClient = primaryClient === supabaseQfpy ? supabaseDemb : supabaseQfpy;
    const { data: fallbackData } = await secondaryClient
      .from('Usuarios')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return fallbackData || null;
  } catch {
    return null;
  }
}

export async function fetchUserProfileByEmail(email: string): Promise<UserProfile | null> {
  // A tabela 'Usuarios' não tem a coluna 'email'. Retornamos null com segurança para evitar erro PGRST204.
  return null;
}

export async function updateUserProfile(profile: Partial<UserProfile>) {
  if (!profile.user_id) return { error: "User ID is required" };
  
  try {
    // Sanitização de campos: a tabela 'Usuarios' NÃO tem a coluna 'email'!
    // Qualquer payload contendo 'email' provoca erro PGRST204 impedindo upsert no Supabase.
    const cleanProfile: Record<string, any> = {
      user_id: profile.user_id,
    };
    if (profile.nome !== undefined) cleanProfile.nome = profile.nome;
    if (profile.foto !== undefined) cleanProfile.foto = profile.foto;
    if (profile.telefone !== undefined) cleanProfile.telefone = profile.telefone;
    if (profile.clube !== undefined) cleanProfile.clube = profile.clube;
    if (profile.funçao !== undefined || (profile as any).cargo !== undefined) {
      cleanProfile.funçao = profile.funçao || (profile as any).cargo;
    }
    if (profile.clubes !== undefined) cleanProfile.clubes = profile.clubes;
    if (profile.cidade !== undefined) cleanProfile.cidade = profile.cidade;
    if (profile.estado !== undefined) cleanProfile.estado = profile.estado;
    if (profile.ADM !== undefined) cleanProfile.ADM = profile.ADM;
    if (profile.fundo !== undefined) cleanProfile.fundo = profile.fundo;
    if (profile.Especialidades !== undefined) cleanProfile.Especialidades = profile.Especialidades;
    if (profile.Conquistas !== undefined) cleanProfile.Conquistas = profile.Conquistas;
    if (profile.data_nascimento !== undefined) {
      try {
        let meta: Record<string, any> = {};
        if (cleanProfile.fundo) {
          try { meta = JSON.parse(cleanProfile.fundo); } catch { meta = { raw: cleanProfile.fundo }; }
        }
        meta.data_nascimento = profile.data_nascimento;
        cleanProfile.fundo = JSON.stringify(meta);
      } catch {}
    }

    const { error } = await supabase
      .from('Usuarios')
      .upsert(cleanProfile, { onConflict: 'user_id' });
      
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export const DEFAULT_CARGOS: string[] = [
  "Pastor",
  "Regional",
  "Distrital",
  "Diretor (a)",
  "Diretor (a) Associado (a)",
  "Secretário (a)",
  "Tesoureiro (a)",
  "Capelão (ã)",
  "Ancião (â)",
  "Instrutor (a)",
  "Conselheiro (a)",
  "Conselheiro (a) Associado (a)",
  "Capitão (ã)",
  "Desbravador (a)",
  "Aspirante",
  "Apoio"
];

const CARGOS_CACHE_KEY = 'dbv_tudo_cargos_cache_v2';

export function getCachedFuncoes(): string[] {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_CARGOS;
  try {
    const cached = localStorage.getItem(CARGOS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CARGOS;
}

export async function fetchFuncoes(): Promise<string[]> {
  try {
    let rows: any[] = [];

    // 1. Tenta carregar da tabela 'Funcao'
    const res1 = await supabase.from('Funcao').select('*');
    if (!res1.error && res1.data && res1.data.length > 0) {
      rows = res1.data;
    } else {
      // 2. Tenta variações de nomenclatura de tabela
      const res2 = await supabase.from('funcao').select('*');
      if (!res2.error && res2.data && res2.data.length > 0) {
        rows = res2.data;
      } else {
        const res3 = await supabase.from('Funcoes').select('*');
        if (!res3.error && res3.data && res3.data.length > 0) {
          rows = res3.data;
        }
      }
    }

    if (rows.length > 0) {
      const sorted = [...rows].sort((a, b) => {
        const idxA = a.indice || a.Indice || a.ordem || a.Ordem || a.id || a.ID || '999';
        const idxB = b.indice || b.Indice || b.ordem || b.Ordem || b.id || b.ID || '999';
        const numA = parseInt(idxA, 10);
        const numB = parseInt(idxB, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        const nameA = (a.cargo || a.Cargo || a.funcao || a.Funcao || a.funçao || a.Função || a.nome || a.Nome || '').toString();
        const nameB = (b.cargo || b.Cargo || b.funcao || b.Funcao || b.funçao || b.Função || b.nome || b.Nome || '').toString();
        return nameA.localeCompare(nameB);
      });

      const dbList = sorted
        .map(item => {
          const raw = item.cargo || item.Cargo || item.funcao || item.Funcao || item.funçao || item.Função || item.nome || item.Nome || item.titulo || item.Titulo || item.descricao || item.name;
          return typeof raw === 'string' ? raw.trim() : '';
        })
        .filter((c): c is string => Boolean(c && c.length > 0));

      if (dbList.length > 0) {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(CARGOS_CACHE_KEY, JSON.stringify(dbList));
            // Remove o cache antigo que continha itens extras
            localStorage.removeItem('dbv_tudo_cargos_cache');
          }
        } catch {}
        return dbList;
      }
    }

    return getCachedFuncoes();
  } catch (err) {
    console.error("Exceção ao buscar funções do banco:", err);
    return getCachedFuncoes();
  }
}

export const DEFAULT_CULTURA_DBV: Cultura = {
  id: 1,
  club_type: 'PATHFINDER',
  ideais: `Voto: Pela graça de Deus, serei puro, bondoso e leal; guardarei a lei do Desbravador, serei servo de Deus e amigo de todos.
Lei: A Lei do Desbravador ordena-me: 1. Observar a devoção matinal; 2. Cumprir fielmente a parte que me corresponde; 3. Cuidar de meu corpo; 4. Manter a consciência limpa; 5. Ser cortês e obediente; 6. Andar com reverência na casa de Deus; 7. Ter sempre um cântico no coração; 8. Ir aonde Deus mandar.
Alvo: A mensagem do advento a todo o mundo em minha geração.
Lema: O amor de Cristo me motiva.
Objetivo: Salvar do pecado e guiar no serviço.
Voto à Bíblia: Prometo fidelidade à Bíblia, à sua mensagem de um Salvador crucificado, ressurreto e prestes a vir, doador de vida e liberdade a todos que nEle crêem.`,
  voto: 'Pela graça de Deus, serei puro, bondoso e leal; guardarei a lei do Desbravador, serei servo de Deus e amigo de todos.',
  lei: 'A Lei do Desbravador ordena-me:\n1. Observar a devoção matinal;\n2. Cumprir fielmente a parte que me corresponde;\n3. Cuidar de meu corpo;\n4. Manter a consciência limpa;\n5. Ser cortês e obediente;\n6. Andar com reverência na casa de Deus;\n7. Ter sempre um cântico no coração;\n8. Ir aonde Deus mandar.',
  alvo: 'A mensagem do advento a todo o mundo em minha geração.',
  lema: 'O amor de Cristo me motiva.',
  objetivo: 'Salvar do pecado e guiar no serviço.',
  voto_biblia: 'Prometo fidelidade à Bíblia, à sua mensagem de um Salvador crucificado, ressurreto e prestes a vir, doador de vida e liberdade a todos que nEle crêem.',
  hino_letra: `Nós somos os Desbravadores,
Os servos do Rei dos reis!
Sempre avante assim marchamos,
Fiéis às Suas leis.

Devemos ao mundo anunciar,
As novas da salvação,
Que Cristo virá em breve
Dar o galardão!`,
  hino_video: 'https://www.youtube.com/watch?v=kYJjZ8kZq-E',
  historia_mundial: 'O Clube de Desbravadores é um ministério mundial da Igreja Adventista do Sétimo Dia, trabalhando com juvenis de 10 a 15 anos no desenvolvimento físico, mental e espiritual.',
  historia_america_sul: 'Na América do Sul, o movimento dos Desbravadores floresceu rapidamente a partir da década de 1950, tornando-se uma das maiores forças jovens do continente.',
  historia_brasil: 'No Brasil, os primeiros clubes oficiais surgiram em 1959 no estado de São Paulo, expandindo-se para todas as regiões do país.',
  historia_mundial_img: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Paises/mundial.png',
  historia_america_sul_img: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Paises/unasul.jpg',
  historia_argentina_img: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Paises/argentina.jpg',
  historia_bolivia_img: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Paises/bolivia.jpg',
  historia_brasil_img: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Paises/brasil.jpg',
  historia_chile_img: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Paises/chile.jpg',
  historia_equador_img: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Paises/equador.jpg',
  historia_peru_img: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Paises/peru.jpg',
  historia_uruguai_img: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Paises/uruguai.jpg',
  uniformes_list: RUD_UNIFORMES_DBV,
  emblemas_list: RUD_EMBLEMAS_DBV
};

export const DEFAULT_CULTURA_AVT: Cultura = {
  id: 2,
  club_type: 'ADVENTURER',
  ideais: `Voto: Por amor a Jesus, farei sempre o meu melhor.
Lei: A Lei do Aventureiro ordena-me: Jesus me ajuda a ser: Obediente, Puro, Reverente, Bondoso e Cortês.
Alvo: Ver o retorno de Jesus e viver eternamente com Ele.
Lema: O amor de Jesus me conduz.
Voto à Bíblia: Prometo fidelidade à Bíblia, à sua mensagem de um Salvador crucificado, ressurreto e prestes a vir, doador de vida e liberdade a todos que nEle crêem.`,
  voto: 'Por amor a Jesus, farei sempre o meu melhor.',
  lei: 'A Lei do Aventureiro manda-me: Jesus me ajuda a ser:\n• Obediente\n• Puro\n• Reverente\n• Bondoso\n• Cortês',
  alvo: 'Ver o retorno de Jesus e viver eternamente com Ele.',
  lema: 'O amor de Jesus me conduz.',
  objetivo: 'Ajudar as crianças de 6 a 9 anos a fortalecerem seu relacionamento com Deus, família e comunidade.',
  voto_biblia: 'Prometo fidelidade à Bíblia, à sua mensagem de um Salvador crucificado, ressurreto e prestes a vir, doador de vida e liberdade a todos que nEle crêem.',
  hino_letra: `Somos Aventureiros alegres,
Que confiam no amigo Jesus.
Aprendemos que sempre devemos,
Ser pra todos um brilho de luz.

Descobrimos em tudo a beleza,
E o amor de um Deus criador.
E amando a Cristo faremos,
Maravilhas pro seu louvor!`,
  hino_video: 'https://www.youtube.com/watch?v=0kFv1QGv1bM',
  historia_mundial: 'O Clube de Aventureiros foi idealizado pela Igreja Adventista para atender especificamente as necessidades de crianças de 6 a 9 anos e suas famílias.',
  historia_america_sul: 'Na Divisão Sul-Americana, os Aventureiros foram estruturados no início dos anos 1990 com currículo especializado.',
  historia_brasil: 'No Brasil, centenas de milhares de crianças participam ativamente do Clube de Aventureiros em igrejas de todo o território nacional.',
  uniformes_list: RUD_UNIFORMES_AVT,
  emblemas_list: RUD_EMBLEMAS_AVT
};

export function getFallbackCultura(clubType: string): Cultura {
  const isDBV = clubType === 'PATHFINDER' || clubType === ClubType.PATHFINDER;
  const defaultObj = isDBV ? DEFAULT_CULTURA_DBV : DEFAULT_CULTURA_AVT;
  try {
    const cached = localStorage.getItem(`dbv_tudo_cultura_${clubType}`);
    if (cached && !cached.includes('data:image/')) {
      const parsed = JSON.parse(cached);
      return {
        ...defaultObj,
        ...parsed,
        uniformes_list: getOfficialRudUniforms(clubType),
        emblemas_list: (Array.isArray(parsed.emblemas_list) && parsed.emblemas_list.length > 0)
          ? parsed.emblemas_list
          : defaultObj.emblemas_list
      };
    } else if (cached && cached.includes('data:image/')) {
      localStorage.removeItem(`dbv_tudo_cultura_${clubType}`);
    }
  } catch {}
  return {
    ...defaultObj,
    uniformes_list: getOfficialRudUniforms(clubType)
  };
}

export async function uploadCultureAsset(file: File, folder = 'Emblemas'): Promise<string> {
  try {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const filePath = `${folder}/${cleanName || 'asset'}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('App DBV Tudo')
      .upload(filePath, file, { upsert: true, contentType: file.type || 'image/png' });
    if (!error) {
      const { data } = supabase.storage.from('App DBV Tudo').getPublicUrl(filePath);
      if (data?.publicUrl) return data.publicUrl;
    }
  } catch {}
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string) || '');
    reader.readAsDataURL(file);
  });
}

export async function fetchCultura(clubType: string): Promise<Cultura | null> {
  try {
    const { data, error } = await supabase
      .from('Cultura')
      .select('id,club_type,ideais,voto,lei,alvo,lema,objetivo,voto_biblia,hino_letra,hino_video,historia_mundial,historia_america_sul,historia_argentina,historia_bolivia,historia_brasil,historia_chile,historia_colombia,historia_equador,historia_peru,historia_uruguai,historia_mundial_img,historia_america_sul_img,historia_argentina_img,historia_bolivia_img,historia_brasil_img,historia_chile_img,historia_colombia_img,historia_equador_img,historia_peru_img,historia_uruguai_img,emblemas_list')
      .eq('club_type', clubType)
      .maybeSingle();
    
    if (error || !data) {
      return getFallbackCultura(clubType);
    }

    const defaultObj = (clubType === 'PATHFINDER' || clubType === ClubType.PATHFINDER)
      ? DEFAULT_CULTURA_DBV
      : DEFAULT_CULTURA_AVT;

    const hasValidEmblems = Array.isArray(data.emblemas_list) && data.emblemas_list.length > 0 && !JSON.stringify(data.emblemas_list).includes('data:image/');

    const enrichedData: Cultura = {
      ...defaultObj,
      ...data,
      // Os Uniformes vêm diretamente do catálogo oficial RUD da internet (padrão Emblemas), sem depender do banco
      uniformes_list: getOfficialRudUniforms(clubType),
      emblemas_list: hasValidEmblems
        ? data.emblemas_list
        : defaultObj.emblemas_list
    };
    
    // Save lightweight fields to local cache for offline/instant access
    try {
      const { uniformes_list, ...cacheable } = enrichedData;
      localStorage.setItem(`dbv_tudo_cultura_${clubType}`, JSON.stringify(cacheable));
    } catch {}
    
    return enrichedData;
  } catch {
    return getFallbackCultura(clubType);
  }
}

export async function updateCultura(cultura: Partial<Cultura>) {
  // Update local cache immediately
  if (cultura.club_type) {
    try {
      const existing = getFallbackCultura(cultura.club_type);
      localStorage.setItem(`dbv_tudo_cultura_${cultura.club_type}`, JSON.stringify({ ...existing, ...cultura }));
    } catch {}
  }

  try {
    // First attempt with all fields
    const { data, error } = await supabase
      .from('Cultura')
      .upsert(cultura, { onConflict: 'club_type' })
      .select()
      .single();
    
    // If error is "column does not exist" or "not found in schema cache", try removing the list fields
    if (error && error.message && (
      (error.message.includes('column') && error.message.includes('does not exist')) ||
      (error.message.includes('Could not find') && error.message.includes('column') && error.message.includes('schema cache'))
    )) {
      console.warn("Colunas de lista não encontradas no banco de dados, tentando salvar apenas campos básicos...", error.message);
      const { uniformes_list, emblemas_list, ...rest } = cultura;
      const { data: retryData, error: retryError } = await supabase
        .from('Cultura')
        .upsert(rest, { onConflict: 'club_type' })
        .select()
        .single();
      
      if (retryError) return { data: retryData, error: retryError };
      
      return { 
        data: retryData, 
        error: { 
          message: "Os campos básicos foram salvos, mas as listas de Uniformes e Emblemas não puderam ser salvas porque as colunas ainda não existem no banco de dados." 
        } as any 
      };
    }
    
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function fetchLivrosAVT(): Promise<LivroAVT[]> {
  const cacheKey = 'dbv_cached_livros_avt';
  const data = await fetchTableWithFallback('LivrosAVT', 'id');
  if (data.length > 0) {
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    return data;
  }
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

export async function fetchManuaisAVT(): Promise<ManualAVT[]> {
  const cacheKey = 'dbv_cached_manuais_avt';
  const data = await fetchTableWithFallback('ManuaisAVT', 'id');
  if (data.length > 0) {
    try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    return data;
  }
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

export async function fetchAppLinks(): Promise<AppLink[]> {
  try {
    const { data, error } = await supabase.from('AppLinks').select('*').order('id', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function updateAppLink(link: Partial<AppLink>) {
  try {
    const { data, error } = await supabase.from('AppLinks').upsert(link).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteAppLink(id: number) {
  try {
    const { error } = await supabase.from('AppLinks').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchConquistas(): Promise<Conquista[]> {
  try {
    const { data, error } = await supabase.from('Conquistas').select('*').order('ordem', { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function updateConquista(conquista: Partial<Conquista>) {
  try {
    const { data, error } = await supabase.from('Conquistas').upsert(conquista).select().single();
    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteConquista(id: number) {
  try {
    const { error } = await supabase.from('Conquistas').delete().eq('id', id);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

export async function fetchUserAchievements(email: string): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('Usuarios')
      .select('Conquistas')
      .eq('email', email)
      .maybeSingle();
    
    if (error || !data || !data.Conquistas) return [];
    
    if (typeof data.Conquistas === 'string') {
      return data.Conquistas.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    }
    
    if (Array.isArray(data.Conquistas)) {
      return data.Conquistas.map(id => parseInt(id.toString())).filter(id => !isNaN(id));
    }

    return [];
  } catch {
    return [];
  }
}

export async function updateUserAchievements(email: string, achievementIds: number[]) {
  try {
    const { error } = await supabase
      .from('Usuarios')
      .update({ Conquistas: achievementIds.join(',') })
      .eq('email', email);
    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

const DEFAULT_TRUNFOS: Trunfo[] = [
  // --- DIVISÃO SUL-AMERICANA (DSA) - DESBRAVADORES ---
  {
    id: 1,
    titulo: 'VI Campori Sul-Americano - Sempre Desbravador',
    ano: '2027',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O VI Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia acontecerá em janeiro de 2027 sob o tema oficial "Sempre Desbravador".

Local: Parque do Peão de Barretos, no interior de São Paulo.

Participantes: A expectativa oficial é reunir mais de 120 mil desbravadores, líderes e equipe de apoio de 8 países da América do Sul, divididos nas edições Alpha (5 a 10 de janeiro) e Ômega (12 a 17 de janeiro).

Tema central: "Sempre Desbravador" celebra o compromisso perpétuo do jovem com a fé cristã, a liderança servidora, a integridade bíblica e o cumprimento da missão até a volta de Jesus.

Atividades: O evento contará com superpalco de louvor internacional, oratória bíblica, feira de especialidades, projetos sociais na comunidade de Barretos, batismos em massa, investiduras históricas e mega gincanas de pioneirismo.`,
    club: 'PATHFINDER'
  },
  {
    id: 2,
    titulo: 'V Campori Sul-Americano - A Melhor Aventura',
    ano: '2019',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O V Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado em janeiro de 2019 sob o tema "#AMelhorAventura".

Local: Parque do Peão em Barretos, São Paulo.

Participantes: Reuniu mais de 100 mil participantes de 8 países da América do Sul, distribuídos nas edições Alpha (08 a 13 de janeiro) e Ômega (15 a 20 de janeiro), consagrando-se como o maior campori da história da igreja no mundo.

Tema central: O logo e a mensagem central retratavam desbravadores escalando uma montanha íngreme de mãos dadas com seus líderes e Jesus, representando que a jornada cristã até o Céu é a maior e mais extraordinária aventura da vida.

Atividades: Incluiu a mega tenda de especialidades, feira de projetos científicos e ecológicos, museu de história dos pioneiros, musicais ao vivo, encenações bíblicas teatrais, batismos na arena e expressivas ações comunitárias de doação de sangue e alimentos na cidade.`,
    club: 'PATHFINDER'
  },
  {
    id: 3,
    titulo: 'IV Campori Sul-Americano - Encontro Marcado na Eternidade',
    ano: '2014',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O IV Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado em janeiro de 2014 sob o tema "Encontro Marcado na Eternidade".

Local: Parque do Peão em Barretos, São Paulo.

Participantes: Reuniu cerca de 35 mil desbravadores e líderes de 8 países da América do Sul, inaugurando o Parque do Peão de Barretos como a "capital sul-americana dos desbravadores".

Tema central: O tema enfatizou a certeza da volta de Jesus e o reencontro glorioso dos desbravadores de todas as nações na eternidade celestial.

Atividades: Concursos de ordem unida, feira de especialidades, desfiles de gala, projetos de revitalização em praças públicas de Barretos, batismos no grande tanque central da arena e cerimônias de investidura.`,
    club: 'PATHFINDER'
  },
  {
    id: 4,
    titulo: 'III Campori Sul-Americano - Fonte de Esperança',
    ano: '2005',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O III Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado em janeiro de 2005 sob o tema "Fonte de Esperança".

Local: Balneário Municipal de Santa Helena, Paraná, às margens do Lago de Itaipu.

Participantes: Reuniu mais de 20 mil desbravadores de 8 países sul-americanos.

Tema central: "Fonte de Esperança" ressaltou Cristo como a água viva inesgotável e motivou a juventude a ser um canal de paz e esperança em suas famílias e comunidades.

Atividades: Provas náuticas e de nós/amarras às margens do Lago de Itaipu, feira de artesanato sustentável, grandes momentos de louvor comunitário, desfile cívico na cidade e investiduras de liderança.`,
    club: 'PATHFINDER'
  },
  {
    id: 5,
    titulo: 'II Campori Sul-Americano - Na Trilha dos Pioneiros',
    ano: '1994',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O II Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado de 10 a 15 de janeiro de 1994 sob o tema "Na Trilha dos Pioneiros".

Local: Ponta Grossa, Paraná.

Participantes: Reuniu aproximadamente 8 mil desbravadores de todos os países do território sul-americano.

Tema central: Resgate da história e bravura dos pioneiros da Igreja Adventista e dos primeiros clubes de desbravadores no mundo, inspirando as novas gerações a manterem a chama missionária acesa.

Atividades: Gincanas rústicas de acampamento e sobrevivência na mata, feira missionária, cultos ao ar livre, passeata cívica e apresentações musicais de orquestras de fanfarras.`,
    club: 'PATHFINDER'
  },
  {
    id: 6,
    titulo: 'I Campori Sul-Americano - Da Natureza ao Criador',
    ano: '1984',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O I e histórico Campori de Desbravadores da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado de 28 de dezembro de 1983 a 04 de janeiro de 1984 sob o tema "Da Natureza ao Criador".

Local: Foz do Iguaçu, Paraná.

Participantes: Reuniu mais de 4.000 desbravadores pioneiros de Brasil, Argentina, Paraguai, Bolívia e Chile sob a liderança geral do Pastor Cláudio Belz.

Tema central: Apreciação da grandiosidade da natureza e dos ecossistemas como testemunho vivo do poder de Deus Pai Criador.

Atividades: Visitas de estudo ecológico ao Parque Nacional do Iguaçu e às Cataratas, provas de orientação com bússola, primeiros socorros, montagem de pioneirias e celebrações espirituais com os pioneiros do clube.`,
    club: 'PATHFINDER'
  },

  // --- CAMPORIS DE UNIÕES (DESBRAVADORES) ---
  {
    id: 7,
    titulo: 'Campori UCOB - O Segredo',
    ano: '2024',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O Campori "O Segredo" foi o 4º Campori de Desbravadores da União Centro-Oeste Brasileira (UCOB) da Igreja Adventista do Sétimo Dia, realizado em julho de 2024.

Local: O evento aconteceu no Instituto Adventista Brasil Central (IABC), localizado em Abadiânia, Goiás.

Participantes: Reuniu cerca de 17 mil a 20 mil desbravadores e líderes voluntários.

Tema central: A programação girou em torno da série cinematográfica "O Segredo", que contava a história de um desbravador chamado Caio em busca de seu lenço perdido, transmitindo mensagens espirituais e de fé.

Atividades: O encontro incluiu gincanas, momentos de louvor, batismos, civismo e incentivo a missões transculturais.`,
    club: 'PATHFINDER'
  },
  {
    id: 8,
    titulo: 'VIII Campori UNB - Os Escolhidos',
    ano: '2023',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O VIII Campori de Desbravadores da União Norte Brasileira (UNB) da Igreja Adventista do Sétimo Dia foi realizado em novembro de 2023 sob o tema "Os Escolhidos".

Local: Parque de Exposições Agropecuárias de Paragominas, Pará.

Participantes: Reuniu mais de 25 mil desbravadores e instrutores dos estados do Pará, Maranhão e Amapá.

Tema central: Baseado na trajetória dos discípulos e profetas bíblicos, reforçou a convicção de que cada desbravador foi pessoalmente escolhido por Deus para fazer a diferença e proclamar o evangelho na Amazônia e no mundo.

Atividades: Mega arena de gincanas esportivas e de nós, feira de ciências da natureza amazônica, projetos de reflorestamento e limpeza urbana em Paragominas, grandes batismos e festivais de música.`,
    club: 'PATHFINDER'
  },
  {
    id: 9,
    titulo: 'Campori UNoB - O Último Desafio',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O Campori de Desbravadores da União Noroeste Brasileira (UNoB) da Igreja Adventista do Sétimo Dia foi realizado em 2022 sob o tema "O Último Desafio".

Local: Instituto Adventista Agro-Industrial (IAAI), em Rio Preto da Eva, Amazonas.

Participantes: Reuniu mais de 12 mil desbravadores do Amazonas, Rondônia, Roraima e Acre.

Tema central: Despertar os jovens para o compromisso de pregar o evangelho nos mais desafiadores rincões da floresta e comunidades ribeirinhas antes da volta de Cristo.

Atividades: Provas de sobrevivência na selva e nós rústicos, barco hospital missionário, feira ambiental, cultos com iluminação cênica na floresta e batismos no lago.`,
    club: 'PATHFINDER'
  },
  {
    id: 10,
    titulo: 'Campori de Líderes DSA - Chamados com um Propósito',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/logo%20app.PNG',
    historia: `A Convenção Sul-Americana de Líderes de Desbravadores e Aventureiros da Divisão Sul-Americana (DSA) foi realizada em 2022 sob o tema "Chamados com um Propósito".

Local: Centro de Eventos e Arena da Fadminas / FAP, com transmissões e polos integrados em toda a América do Sul.

Participantes: Reuniu mais de 15 mil diretores, conselheiros, secretários e instrutores de clubes.

Tema central: Capacitação de excelência e alinhamento espiritual da liderança para acolher, discipular e salvar as novas gerações de juvenis e crianças.

Atividades: Oficinas de liderança e gestão de clubes, palestras sobre saúde mental na adolescência, workshops de novas especialidades, treinamentos técnicos de acampamento e vigília de oração intercessória.`,
    club: 'ALL'
  },
  {
    id: 11,
    titulo: 'VII Campori UCB - Um Chamado de Coragem',
    ano: '2017',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O VII Campori de Desbravadores da União Central Brasileira (UCB) da Igreja Adventista do Sétimo Dia foi realizado em julho de 2017 sob o tema "Um Chamado de Coragem".

Local: Parque do Peão em Barretos, São Paulo.

Participantes: Reuniu mais de 22 mil desbravadores de todo o Estado de São Paulo.

Tema central: Inspirado no livro bíblico de Daniel, desafiou os desbravadores a serem fiéis a Deus em qualquer circunstância, demonstrando coragem moral e espiritual contra as pressões do mundo.

Atividades: Musical encenando a fornalha ardente e a cova dos leões, feira de colecionismo de trunfos, mega pista de obstáculos cívicos, projetos de saúde comunitária na cidade de Barretos e batismos.`,
    club: 'PATHFINDER'
  },
  {
    id: 12,
    titulo: 'IV Campori UNeB - Inabalável (Do Poço ao Palácio)',
    ano: '2017',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O IV Campori de Desbravadores da União Nordeste Brasileira (UNeB) da Igreja Adventista do Sétimo Dia foi realizado em 2017 sob o tema "Inabalável - Do Poço ao Palácio".

Local: Parnamirim, Rio Grande do Norte.

Participantes: Reuniu cerca de 18 mil desbravadores dos estados de PE, PB, RN, CE, PI e AL.

Tema central: A vida e fidelidade de José do Egito, ensinando que mesmo em momentos de provação, a integridade diante de Deus transforma a história humana.

Atividades: Simulações de resgate e nós avançados, apresentações culturais e folclóricas bíblicas, doação massiva de sangue e alimentos para comunidades carentes, batismos emocionantes e marcha cívica.`,
    club: 'PATHFINDER'
  },
  {
    id: 13,
    titulo: 'VI Campori USEB - Somos Mais que Ouro',
    ano: '2016',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O VI Campori de Desbravadores da União Sudeste Brasileira (USEB) da Igreja Adventista do Sétimo Dia foi realizado em 2016 sob o tema "Somos Mais que Ouro".

Local: Parque de Exposições de Lavras, Minas Gerais.

Participantes: Reuniu mais de 16 mil desbravadores dos estados de Minas Gerais, Rio de Janeiro e Espírito Santo.

Tema central: Em consonância com o ano olímpico no Brasil, o evento lembrou que a coroa da vida eterna oferecida por Jesus tem valor infinito, muito superior a qualquer ouro perecível da terra.

Atividades: Olimpíadas desbravadoras de habilidades de campo, feira de nós e amarras, corrida rústica, feira de saúde pública gratuita e grande celebração com batismos em massa.`,
    club: 'PATHFINDER'
  },
  {
    id: 14,
    titulo: 'V Campori USB - Fiel a Toda Prova',
    ano: '2015',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Desbravadores.png',
    historia: `O V Campori de Desbravadores da União Sul Brasileira (USB) da Igreja Adventista do Sétimo Dia foi realizado em 2015 sob o tema "Fiel a Toda Prova".

Local: Balneário de Santa Helena, Paraná.

Participantes: Reuniu aproximadamente 15 mil desbravadores dos estados do Paraná, Santa Catarina e Rio Grande do Sul.

Tema central: O compromisso incondicional de permanecer fiel a Deus na escola, na família, na natureza e na sociedade sob qualquer prova da vida.

Atividades: Provas aquáticas de caiaque e balsa no lago, pista de orientação topográfica na mata, desfile de fanfarras, tenda de especialidades avançadas e investiduras de Guia Maior.`,
    club: 'PATHFINDER'
  },

  // --- AVENTURIS (CLUBE DE AVENTUREIROS) ---
  {
    id: 15,
    titulo: 'Aventuri DSA - Pequenos Gigantes',
    ano: '2024',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Grande Aventuri Comemorativo dos Aventureiros da Divisão Sul-Americana (DSA) da Igreja Adventista do Sétimo Dia foi realizado em 2024 sob o tema "Pequenos Gigantes".

Local: Evento realizado em múltiplos polos integrados com grande celebração nas uniões da América do Sul.

Participantes: Reuniu mais de 50 mil crianças de 6 a 9 anos juntamente com seus pais, instrutores e conselheiros.

Tema central: Demonstrar que, através do amor e da dependência de Jesus, mesmo sendo pequeninas, as crianças são gigantes na fé, no testemunho, na oração e na bondade.

Atividades: Gincanas lúdicas de artes e natureza, circuito de nós simples para aventureiros, peças teatrais com fantoches bíblicos, oficinas familiares com pais e filhos e investiduras de estrelas de classe.`,
    club: 'ADVENTURER'
  },
  {
    id: 16,
    titulo: 'Aventuri UCB - Uma Incrível Aventura',
    ano: '2023',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Central Brasileira (UCB) da Igreja Adventista do Sétimo Dia foi realizado em outubro de 2023 sob o tema "Uma Incrível Aventura".

Local: Centro Adventista de Treinamento e Recreação (CATRE), São Paulo.

Participantes: Reuniu mais de 8 mil aventureiros, pais e conselheiros de todo o território paulista.

Tema central: A jornada mágica e real de viver diariamente ao lado de Jesus, aprendendo valores familiares, amor à criação e serviço ao próximo.

Atividades: Brincadeiras pedagógicas, feira de especialidades infantis (como Amigo da Natureza e Jardineiro), musical infantil interativo, momentos de oração entre pais e filhos e cerimônias de condecoração.`,
    club: 'ADVENTURER'
  },
  {
    id: 17,
    titulo: 'Aventuri USEB - Heróis de Verdade',
    ano: '2023',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Sudeste Brasileira (USEB) da Igreja Adventista do Sétimo Dia foi realizado em 2023 sob o tema "Heróis de Verdade".

Local: Parque de Exposições de Governador Valadares, Minas Gerais.

Participantes: Reuniu cerca de 7 mil aventureiros de Minas Gerais, Rio de Janeiro e Espírito Santo.

Tema central: Ensinar as crianças que os verdadeiros heróis não vestem capas mágicas, mas sim praticam a obediência, a honestidade e a coragem de seguir Jesus inspirados pelos grandes personagens bíblicos.

Atividades: Vila temática dos heróis da Bíblia (Davi, Ester, Moisés, Noé), circuito de recreação inflável, noite dos talentos e cantoria, entrega de medalhas de bravura cristã e celebração com os pais.`,
    club: 'ADVENTURER'
  },
  {
    id: 18,
    titulo: 'Aventuri UNB - Guardiões da Criação',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Norte Brasileira (UNB) da Igreja Adventista do Sétimo Dia foi realizado em 2022 sob o tema "Guardiões da Criação".

Local: Belém, Pará.

Participantes: Reuniu mais de 6 mil crianças e familiares dos estados do Pará, Maranhão e Amapá.

Tema central: O dever cristão e alegre de cuidar das plantas, dos animais e das águas da Amazônia, reconhecendo Deus como o Artista e Criador Supremo.

Atividades: Trilha guiada de conscientização ecológica, oficinas de reciclagem lúdica, plantio de mudas nativas, gincanas aquáticas seguras e celebrações bíblicas.`,
    club: 'ADVENTURER'
  },
  {
    id: 19,
    titulo: 'Aventuri USB - Brilhando por Jesus',
    ano: '2021',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Sul Brasileira (USB) da Igreja Adventista do Sétimo Dia foi realizado em 2021 sob o tema "Brilhando por Jesus".

Local: Santa Catarina (com transmissão online e polos regionais integrados).

Participantes: Reuniu mais de 10 mil famílias de aventureiros do Paraná, Santa Catarina e Rio Grande do Sul.

Tema central: Motivar as crianças a serem uma luz reluzente no lar, na escola e na vizinhança através de palavras de carinho, orações e auxílio nas tarefas de casa.

Atividades: Desafios bíblicos em família, festival de vídeos com boas ações, caça ao tesouro das especialidades e cerimônia de investidura das quatro classes (Abelhitas, Luminares, Edificadores e Mãos Ajudadoras).`,
    club: 'ADVENTURER'
  },
  {
    id: 20,
    titulo: 'Aventuri UNeB - A Grande Viagem na Arca',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Nordeste Brasileira (UNeB) da Igreja Adventista do Sétimo Dia foi realizado em 2022 sob o tema "A Grande Viagem na Arca".

Local: Caruaru, Pernambuco.

Participantes: Reuniu cerca de 6.500 aventureiros e líderes do Nordeste.

Tema central: A jornada de fé de Noé e sua família na arca, destacando a importância do amor familiar, da obediência aos pais e do refúgio seguro em Deus.

Atividades: Cenário gigante reproduzindo a Arca de Noé, desfile de fantasias dos animais bíblicos, jogos cooperativos sem eliminação, dinâmicas de louvor e investiduras.`,
    club: 'ADVENTURER'
  },
  {
    id: 21,
    titulo: 'Aventuri UCOB - Pequenos Missionários',
    ano: '2023',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Centro-Oeste Brasileira (UCOB) da Igreja Adventista do Sétimo Dia foi realizado em 2023 sob o tema "Pequenos Missionários".

Local: Brasília, Distrito Federal.

Participantes: Reuniu mais de 7 mil crianças e pais do DF, Goiás, Mato Grosso, Mato Grosso do Sul e Tocantins.

Tema central: O poder do testemunho infantil na evangelização de amiguinhos, vizinhos e parentes através do exemplo e da oração.

Atividades: Feira de missões mundiais infantis, oficina de cartas para missionários em outros países, gincana bíblica, circuito esportivo e culto de ação de graças.`,
    club: 'ADVENTURER'
  },
  {
    id: 22,
    titulo: 'Aventuri UNoB - Amigos da Natureza',
    ano: '2022',
    imagem: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/Aventureiros/Av_Emblema_A1.png',
    historia: `O Aventuri da União Noroeste Brasileira (UNoB) da Igreja Adventista do Sétimo Dia foi realizado em 2022 sob o tema "Amigos da Natureza".

Local: Manaus, Amazonas.

Participantes: Reuniu mais de 5 mil aventureiros dos quatro estados da região noroeste.

Tema central: Conectar o coração das crianças aos encantos da criação divina, promovendo amizade e companheirismo fraternal.

Atividades: Trilha ecológica educativa, observação de pássaros, jogos de cooperação em equipe, teatro de fantoches e investidura das insígnias oficiais.`,
    club: 'ADVENTURER'
  }
];

// Helper para gerenciar IDs de trunfos excluídos
function getDeletedTrunfoIds(): Set<number> {
  try {
    const raw = localStorage.getItem('dbv_tudo_trunfos_deleted_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map(Number));
      }
    }
  } catch {}
  return new Set<number>();
}

function recordDeletedTrunfoId(id: number) {
  try {
    const set = getDeletedTrunfoIds();
    set.add(Number(id));
    localStorage.setItem('dbv_tudo_trunfos_deleted_ids', JSON.stringify(Array.from(set)));
  } catch {}
}

function unrecordDeletedTrunfoId(id: number) {
  try {
    const set = getDeletedTrunfoIds();
    set.delete(Number(id));
    localStorage.setItem('dbv_tudo_trunfos_deleted_ids', JSON.stringify(Array.from(set)));
  } catch {}
}

// Helper para mesclar os padrões com dados locais/nuvem respeitando itens excluídos
function mergeWithDefaultTrunfos(loadedList: Trunfo[] | null, isSeeding = false): Trunfo[] {
  const deletedIds = getDeletedTrunfoIds();
  
  // Se recebemos uma lista concreta da nuvem ou do localStorage
  if (loadedList && Array.isArray(loadedList) && loadedList.length > 0) {
    return loadedList.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
  }

  // Se a lista estiver vazia ou for inicialização pela primeira vez
  return DEFAULT_TRUNFOS.filter(item => !deletedIds.has(Number(item.id)));
}

export async function fetchTrunfos(club?: string): Promise<Trunfo[]> {
  try {
    const deletedIds = getDeletedTrunfoIds();
    const localData = localStorage.getItem('dbv_tudo_trunfos');
    let localList: Trunfo[] = [];

    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          localList = parsed.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
        }
      } catch {}
    }

    if (localList.length === 0 && !localStorage.getItem('dbv_tudo_trunfos_initialized')) {
      localList = DEFAULT_TRUNFOS.filter(item => !deletedIds.has(Number(item.id)));
      localStorage.setItem('dbv_tudo_trunfos_initialized', 'true');
      localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(localList));
    }

    // 1. Tentar buscar da tabela 'Trunfos' do Supabase
    try {
      const query = supabase.from('Trunfos').select('*').order('id', { ascending: false });
      const { data, error } = await query;
      if (!error && data && Array.isArray(data)) {
        if (data.length > 0) {
          const validData = data.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
          localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(validData));
          localList = validData;
          if (club) {
            return localList.filter(t => !t.club || t.club === club || t.club === 'ALL');
          }
          return localList;
        }
      }
    } catch {}

    // 2. Buscar da tabela 'Cultura' (onde os trunfos ficam persistidos na coluna 'distintivos')
    try {
      const { data: culturaRows, error: cultError } = await supabase
        .from('Cultura')
        .select('club_type, distintivos');

      if (!cultError && culturaRows && culturaRows.length > 0) {
        let combinedTrunfos: Trunfo[] = [];
        const seenIds = new Set<number>();

        for (const row of culturaRows) {
          if (row.distintivos) {
            try {
              const parsed = typeof row.distintivos === 'string' ? JSON.parse(row.distintivos) : row.distintivos;
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  if (item && item.id && !seenIds.has(Number(item.id)) && !deletedIds.has(Number(item.id))) {
                    seenIds.add(Number(item.id));
                    combinedTrunfos.push(item);
                  }
                }
              }
            } catch {}
          }
        }

        if (combinedTrunfos.length > 0) {
          localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(combinedTrunfos));
          localList = combinedTrunfos;
        }
      }
    } catch {}

    localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(localList));

    if (club) {
      return localList.filter(t => !t.club || t.club === club || t.club === 'ALL');
    }
    return localList;
  } catch {
    const deletedIds = getDeletedTrunfoIds();
    const localData = localStorage.getItem('dbv_tudo_trunfos');
    let localList: Trunfo[] = [];
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          localList = parsed.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
        }
      } catch {}
    }
    if (localList.length === 0) {
      localList = DEFAULT_TRUNFOS.filter(item => !deletedIds.has(Number(item.id)));
    }
    if (club) {
      return localList.filter(t => !t.club || t.club === club || t.club === 'ALL');
    }
    return localList;
  }
}

export async function updateTrunfo(trunfo: Partial<Trunfo>) {
  try {
    const deletedIds = getDeletedTrunfoIds();
    const localData = localStorage.getItem('dbv_tudo_trunfos');
    let currentList: Trunfo[] = [];

    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          currentList = parsed.filter(item => item && item.id && !deletedIds.has(Number(item.id)));
        }
      } catch {}
    }

    if (currentList.length === 0) {
      currentList = DEFAULT_TRUNFOS.filter(item => !deletedIds.has(Number(item.id)));
    }

    let savedItem: Trunfo;
    if (trunfo.id && trunfo.id > 0) {
      unrecordDeletedTrunfoId(trunfo.id);
      currentList = currentList.map(item => item.id === trunfo.id ? { ...item, ...trunfo } as Trunfo : item);
      savedItem = currentList.find(item => item.id === trunfo.id)!;
    } else {
      const newId = Date.now();
      savedItem = {
        id: newId,
        titulo: trunfo.titulo || 'Novo Trunfo',
        ano: trunfo.ano || '',
        imagem: trunfo.imagem || '',
        historia: trunfo.historia || '',
        club: trunfo.club || 'PATHFINDER',
        created_at: new Date().toISOString()
      };
      currentList.unshift(savedItem);
    }
    localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(currentList));

    // 1. Tentar salvar na tabela Trunfos se existir
    try {
      const payload: any = { 
        id: savedItem.id,
        titulo: savedItem.titulo,
        ano: savedItem.ano,
        imagem: savedItem.imagem,
        historia: savedItem.historia,
        club: savedItem.club
      };
      await supabase.from('Trunfos').upsert(payload);
    } catch {}

    // 2. Persistir na tabela Cultura (coluna distintivos) no banco Supabase
    try {
      const jsonStr = JSON.stringify(currentList);
      await Promise.all([
        supabase.from('Cultura').update({ distintivos: jsonStr }).eq('club_type', 'PATHFINDER'),
        supabase.from('Cultura').update({ distintivos: jsonStr }).eq('club_type', 'ADVENTURER')
      ]);
    } catch (e) {
      console.error("Erro ao salvar trunfos no banco Supabase:", e);
    }

    return { data: savedItem, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

export async function deleteTrunfo(id: number) {
  try {
    const numId = Number(id);
    recordDeletedTrunfoId(numId);

    const localData = localStorage.getItem('dbv_tudo_trunfos');
    let filtered: Trunfo[] = [];
    if (localData) {
      try {
        const currentList: Trunfo[] = JSON.parse(localData);
        if (Array.isArray(currentList)) {
          filtered = currentList.filter(item => item && Number(item.id) !== numId);
        }
      } catch {}
    } else {
      filtered = DEFAULT_TRUNFOS.filter(item => Number(item.id) !== numId);
    }

    localStorage.setItem('dbv_tudo_trunfos', JSON.stringify(filtered));

    // 1. Tentar deletar da tabela Trunfos no Supabase
    try {
      await supabase.from('Trunfos').delete().eq('id', numId);
    } catch (e) {
      console.warn("Erro ao deletar da tabela Trunfos no Supabase:", e);
    }

    // 2. Atualizar tabela Cultura no banco Supabase
    try {
      const jsonStr = JSON.stringify(filtered);
      await Promise.all([
        supabase.from('Cultura').update({ distintivos: jsonStr }).eq('club_type', 'PATHFINDER'),
        supabase.from('Cultura').update({ distintivos: jsonStr }).eq('club_type', 'ADVENTURER')
      ]);
    } catch (e) {
      console.warn("Erro ao atualizar Cultura no Supabase:", e);
    }

    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
}

export interface FaixaConfig {
  globo_desbravador: string; // Até 15 anos fundo cáqui
  globo_lideranca: string;   // 16 acima fundo branco
  globo_lider: string;       // Pin de líder, master e master avançado
}

export const DEFAULT_FAIXA_CONFIG: FaixaConfig = {
  globo_desbravador: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/insignias/D4_b%20Desbravador.png',
  globo_lideranca: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/insignias/D4_a%20Lideranca.png',
  globo_lider: 'https://qfpyjavbncijowjvznkg.supabase.co/storage/v1/object/public/App%20DBV%20Tudo/insignias/L1%20Lider.png',
};

const DEFAULT_ENCODED_AI_CFG = 'JSsMPicMJVoPdWZAWRILRFgQNCAlAgNQJzFdWXByDQEBKxwhKSYf';

function decodeAiCfg(encoded: string): string {
  try {
    const mask = 'dbv_tudo_2026_dsa';
    const binary = typeof atob === 'function' ? atob(encoded) : Buffer.from(encoded, 'base64').toString('binary');
    let out = '';
    for (let i = 0; i < binary.length; i++) {
      out += String.fromCharCode(binary.charCodeAt(i) ^ mask.charCodeAt(i % mask.length));
    }
    return out;
  } catch {
    return '';
  }
}

let _cachedRemoteAiKey = decodeAiCfg(DEFAULT_ENCODED_AI_CFG);

export async function resolveGeminiApiKey(): Promise<string> {
  const envKey = (typeof process !== 'undefined' && (process.env?.GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY || process.env?.API_KEY)) ||
    ((import.meta as any).env?.VITE_GEMINI_API_KEY) || '';
  if (envKey && envKey.length > 10) return envKey;
  if (_cachedRemoteAiKey && _cachedRemoteAiKey.length > 10) return _cachedRemoteAiKey;

  try {
    const res = await fetch(`${DEFAULT_URL}/rest/v1/Cultura?club_type=eq.PATHFINDER&select=insignias_tiras&limit=1`, {
      headers: {
        apikey: DEFAULT_KEY,
        Authorization: `Bearer ${DEFAULT_KEY}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      const raw = rows?.[0]?.insignias_tiras;
      if (raw) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && parsed._ai_cfg) {
          const decoded = decodeAiCfg(parsed._ai_cfg);
          if (decoded && decoded.length > 10) {
            _cachedRemoteAiKey = decoded;
            return decoded;
          }
        }
      }
    }
  } catch {}

  return decodeAiCfg(DEFAULT_ENCODED_AI_CFG);
}

export async function fetchFaixaConfig(): Promise<FaixaConfig> {
  let localConfig: FaixaConfig | null = null;
  try {
    const raw = localStorage.getItem('dbv_tudo_faixa_config');
    if (raw) localConfig = JSON.parse(raw);
  } catch {}

  try {
    const { data, error } = await supabase
      .from('Cultura')
      .select('insignias_tiras')
      .eq('club_type', 'PATHFINDER')
      .single();

    if (!error && data?.insignias_tiras) {
      let parsed = typeof data.insignias_tiras === 'string'
        ? JSON.parse(data.insignias_tiras)
        : data.insignias_tiras;

      if (parsed && parsed._ai_cfg && !_cachedRemoteAiKey) {
        const decoded = decodeAiCfg(parsed._ai_cfg);
        if (decoded && decoded.length > 10) _cachedRemoteAiKey = decoded;
      }

      if (parsed && (parsed.globo_desbravador || parsed.globo_lideranca || parsed.globo_lider)) {
        const merged: FaixaConfig = {
          globo_desbravador: parsed.globo_desbravador || DEFAULT_FAIXA_CONFIG.globo_desbravador,
          globo_lideranca: parsed.globo_lideranca || DEFAULT_FAIXA_CONFIG.globo_lideranca,
          globo_lider: parsed.globo_lider || DEFAULT_FAIXA_CONFIG.globo_lider,
        };
        try {
          localStorage.setItem('dbv_tudo_faixa_config', JSON.stringify(merged));
        } catch {}
        return merged;
      }
    }
  } catch (err) {
    console.warn("Erro ao buscar configurações da faixa:", err);
  }

  return localConfig || DEFAULT_FAIXA_CONFIG;
}

export async function updateFaixaConfig(config: FaixaConfig): Promise<{ error: any }> {
  try {
    localStorage.setItem('dbv_tudo_faixa_config', JSON.stringify(config));
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('dbv_faixa_config_updated', { detail: config }));
    } catch {}

    let existingObj: any = {};
    try {
      const { data } = await supabase.from('Cultura').select('insignias_tiras').eq('club_type', 'PATHFINDER').single();
      if (data?.insignias_tiras) {
        existingObj = typeof data.insignias_tiras === 'string' ? JSON.parse(data.insignias_tiras) : data.insignias_tiras;
      }
    } catch {}

    const jsonStr = JSON.stringify({ ...existingObj, ...config });
    const { error } = await supabase
      .from('Cultura')
      .update({ insignias_tiras: jsonStr })
      .eq('club_type', 'PATHFINDER');

    return { error };
  } catch (err) {
    return { error: err };
  }
}

export async function uploadFaixaImage(file: File, filenameKey: string): Promise<{ url: string | null; error: any }> {
  try {
    const ext = file.name.split('.').pop() || 'png';
    const cleanFileName = `faixa_${filenameKey}_${Date.now()}.${ext}`;
    const path = `insignias/${cleanFileName}`;

    const { error } = await supabase.storage
      .from('App DBV Tudo')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn("Upload no Supabase falhou, utilizando base64:", error);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: reader.result as string, error: null });
        };
        reader.onerror = (e) => resolve({ url: null, error: e });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from('App DBV Tudo')
      .getPublicUrl(path);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ url: reader.result as string, error: null });
      };
      reader.onerror = (e) => resolve({ url: null, error: e });
      reader.readAsDataURL(file);
    });
  }
}

