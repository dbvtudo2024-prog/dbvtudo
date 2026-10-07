import { createClient } from '@supabase/supabase-js';
import { QFPY_URL, QFPY_KEY, supabaseQfpy, supabase } from './supabaseService';

export interface SyncedKeyEntry {
  value: string;
  updatedAt: number;
  explicitEmpty?: boolean;
}

export interface UserCloudSyncBundle {
  userKey: string;
  userEmail?: string;
  userName?: string;
  updatedAt: number;
  deviceId: string;
  entries: Record<string, SyncedKeyEntry>;
}

const SYNC_META_STORAGE_KEY = 'dbv_cloud_sync_key_meta_v1';
const DEVICE_ID_STORAGE_KEY = 'dbv_cloud_sync_device_id';

const EXACT_TRACKED_KEYS = new Set<string>([
  // Cantinho da Unidade, Acampamento & Mochila (Desbravadores)
  'dbv_unit_corner_DBV_unit_name',
  'dbv_unit_corner_DBV_counselor_name',
  'dbv_unit_corner_DBV_members',
  'dbv_unit_corner_DBV_backpack',
  'dbv_unit_corner_DBV_camp_name',
  'dbv_unit_corner_DBV_meals',
  'dbv_unit_corner_DBV_meetings',
  // Cantinho da Unidade, Acampamento & Mochila (Aventureiros)
  'dbv_unit_corner_AVT_unit_name',
  'dbv_unit_corner_AVT_counselor_name',
  'dbv_unit_corner_AVT_members',
  'dbv_unit_corner_AVT_backpack',
  'dbv_unit_corner_AVT_camp_name',
  'dbv_unit_corner_AVT_meals',
  'dbv_unit_corner_AVT_meetings',
  // Bíblia Sagrada (Versículos Marcados, Notas e Configurações)
  'markedVerses',
  'bibleNotes',
  'dbv_tudo_bible_settings',
  'dbv_tudo_bible_last_read',
  // Minha Faixa e Favoritas do Catálogo
  'dbv_tudo_faixa_PATHFINDER',
  'dbv_tudo_faixa_ADVENTURER',
  'dbv_tudo_liked_specialties_PATHFINDER',
  'dbv_tudo_liked_specialties_ADVENTURER',
  'dbv_tudo_catalog_favs_PATHFINDER',
  'dbv_tudo_catalog_favs_ADVENTURER',
  // Conquistas, Classes, Batismo e Perfil
  'dbv_tudo_user_achievements',
  'dbv_tudo_user_baptized',
  'dbv_tudo_global_user_profile',
  // Arena de Quiz Interativo
  'dbv_quiz_scores_PATHFINDER',
  'dbv_quiz_scores_ADVENTURER',
  'dbv_quiz_auto_advance',
  // Provas Ao Vivo e Histórico de Provas
  'dbv_student_exam_history_global',
  'dbv_instructor_active_exam_rooms',
  'dbv_instructor_active_exam_room',
  'dbv_exam_student_name',
  'dbv_exam_student_unit',
  'dbv_exam_draft_specialty_PATHFINDER',
  'dbv_exam_draft_specialty_ADVENTURER',
  'dbv_exam_draft_custom_PATHFINDER',
  'dbv_exam_draft_custom_ADVENTURER',
  // Preferências do App
  'dbv_tudo_theme',
  'dbv_tudo_accent_color',
  'dbv_pin_sidebar'
]);

const TRACKED_KEY_PREFIXES = [
  'dbv_unit_corner_',
  'dbv_tudo_faixa_PATHFINDER_',
  'dbv_tudo_faixa_ADVENTURER_',
  'dbv_tudo_catalog_favs_PATHFINDER_',
  'dbv_tudo_catalog_favs_ADVENTURER_',
  'dbv_student_exam_history_',
  'dbv_exam_draft_'
];

// Chaves que também são espelhadas no arquivo compartilhado da unidade/clube
// para garantir que apareçam entre Celular e PC mesmo se um dos aparelhos estiver em modo visitante ou sessão diferente
function isUnitOrSharedFallbackKey(key: string): boolean {
  return (
    key.startsWith('dbv_unit_corner_') ||
    key === 'markedVerses' ||
    key === 'bibleNotes' ||
    key.startsWith('dbv_exam_draft_')
  );
}

export function isTrackedSyncKey(key: string): boolean {
  if (!key || key === SYNC_META_STORAGE_KEY || key === DEVICE_ID_STORAGE_KEY) return false;
  if (EXACT_TRACKED_KEYS.has(key)) return true;
  return TRACKED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

let _nativeGetItem: ((key: string) => string | null) | null = null;
let _nativeSetItem: ((key: string, val: string) => void) | null = null;
let _nativeRemoveItem: ((key: string) => void) | null = null;
let _isApplyingRemoteSync = false;
let _isInitialized = false;
let _pushDebounceTimer: any = null;
let _realtimeChannel: any = null;
let _syncInProgress = false;
let _lastSyncTimestamp = 0;

// Cliente Realtime dedicado para sincronização multi-dispositivo
const supabaseCloudSyncRealtime = createClient(QFPY_URL, QFPY_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

function ensureNativeStorageRefs() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (!_nativeGetItem) {
    _nativeGetItem = window.localStorage.getItem.bind(window.localStorage);
    _nativeSetItem = window.localStorage.setItem.bind(window.localStorage);
    _nativeRemoveItem = window.localStorage.removeItem.bind(window.localStorage);
  }
}

function getDeviceId(): string {
  ensureNativeStorageRefs();
  if (!_nativeGetItem || !_nativeSetItem) return 'dev_unknown';
  try {
    const existing = _nativeGetItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const created = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    _nativeSetItem(DEVICE_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return 'dev_fallback';
  }
}

function normalizeUserKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function resolveCurrentSyncUserIdentity(): {
  userKey: string;
  email: string;
  name: string;
} {
  ensureNativeStorageRefs();
  let email = '';
  let name = '';

  if (_nativeGetItem) {
    try {
      const profileRaw = _nativeGetItem('dbv_tudo_global_user_profile');
      if (profileRaw) {
        const parsed = JSON.parse(profileRaw);
        if (parsed?.email && parsed.email !== 'email@exemplo.com') {
          email = String(parsed.email).trim().toLowerCase();
        }
        if (parsed?.name || parsed?.nome) {
          name = String(parsed.name || parsed.nome).trim();
        }
      }
    } catch {}

    if (!email) {
      try {
        const lastEmail = _nativeGetItem('dbv_last_login_email');
        if (lastEmail && lastEmail !== 'email@exemplo.com') {
          email = lastEmail.trim().toLowerCase();
        }
      } catch {}
    }
  }

  const rawKey = email || name || 'global_default_user';
  const userKey = normalizeUserKey(rawKey) || 'global_default_user';
  return { userKey, email, name };
}

function loadLocalKeyMeta(): Record<string, { updatedAt: number; explicitEmpty?: boolean }> {
  ensureNativeStorageRefs();
  if (!_nativeGetItem) return {};
  try {
    const raw = _nativeGetItem(SYNC_META_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {}
  return {};
}

function saveLocalKeyMeta(meta: Record<string, { updatedAt: number; explicitEmpty?: boolean }>) {
  ensureNativeStorageRefs();
  if (!_nativeSetItem) return;
  try {
    _nativeSetItem(SYNC_META_STORAGE_KEY, JSON.stringify(meta));
  } catch {}
}

/**
 * Verifica se um valor no localStorage é vazio ou apenas o valor inicial padrão (sem edições do usuário).
 * Isso impede que um dispositivo recém-aberto (ex: PC vazio) sobrescreva os dados reais cadastrados no celular!
 */
export function isValueEmptyOrDefault(key: string, rawVal: string | null | undefined): boolean {
  if (rawVal === null || rawVal === undefined) return true;
  const trimmed = String(rawVal).trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return true;
  if (trimmed === '[]' || trimmed === '{}') return true;

  if (key.endsWith('_unit_name')) {
    return (
      trimmed === 'Unidade Águias da Colina' ||
      trimmed === 'Unidade Estrelas de Jesus' ||
      trimmed === 'Unidade Águias Reais' ||
      trimmed === 'Unidade Pequenos Luminares'
    );
  }

  if (key.endsWith('_camp_name')) {
    return trimmed === 'Acampamento de Instrução da Unidade';
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      if (parsed.length === 0) return true;

      // Caderneta de domingo padrão vem com 1 reunião vazia (records: {})
      if (key.endsWith('_meetings')) {
        const hasAnyRecord = parsed.some(
          (sheet: any) => sheet && sheet.records && Object.keys(sheet.records).length > 0
        );
        if (parsed.length === 1 && !hasAnyRecord) return true;
      }

      // Checklist de mochila padrão vem com todos checked === false e nenhum isCustom
      if (key.endsWith('_backpack')) {
        const hasCheckedOrCustom = parsed.some((item: any) => item && (item.checked || item.isCustom));
        if (!hasCheckedOrCustom && parsed.length === 25) return true;
      }

      // Cardápio de acampamento padrão vem com 6 refeições e sem escala preenchida
      if (key.endsWith('_meals')) {
        const defaultIds = new Set([
          'meal_sex_jantar',
          'meal_sab_desjejum',
          'meal_sab_almoco',
          'meal_sab_jantar',
          'meal_dom_desjejum',
          'meal_dom_almoco'
        ]);
        const allDefaultIds =
          parsed.length === 6 && parsed.every((slot: any) => slot && defaultIds.has(String(slot.id)));
        const hasDutyAssigned = parsed.some(
          (slot: any) =>
            slot &&
            ((slot.waterAndWood && String(slot.waterAndWood).trim() !== '') ||
              (slot.cooking && String(slot.cooking).trim() !== '') ||
              (slot.dishwashing && String(slot.dishwashing).trim() !== ''))
        );
        if (allDefaultIds && !hasDutyAssigned) return true;
      }

      return false;
    }

    if (parsed && typeof parsed === 'object') {
      if (key.startsWith('dbv_quiz_scores_')) {
        const allZero = Object.values(parsed).every(
          (s: any) => !s || (!s.bestScore && !s.gamesPlayed)
        );
        if (allZero) return true;
      }

      if (key === 'dbv_tudo_bible_settings') {
        if (
          parsed.fontSize === 16 &&
          !parsed.darkMode &&
          !parsed.dailyReminder &&
          parsed.chapterStyle === 'Capítulo N'
        ) {
          return true;
        }
      }
    }
  } catch {}

  return false;
}

/**
 * Mescla de forma inteligente listas de itens com ID (como membros da unidade, reuniões de domingo,
 * versículos marcados, notas bíblicas e histórico de provas) quando ambos os aparelhos possuem dados.
 */
function tryMergeJsonCollections(
  key: string,
  localRaw: string,
  cloudRaw: string,
  localUpdatedAt: number,
  cloudUpdatedAt: number
): string | null {
  try {
    const localArr = JSON.parse(localRaw);
    const cloudArr = JSON.parse(cloudRaw);

    // Mesclagem de Membros da Unidade: se um dos lados era legado (updatedAt === 0), une sem duplicar por nome/id
    if (key.endsWith('_members') && Array.isArray(localArr) && Array.isArray(cloudArr)) {
      if (localUpdatedAt === 0 || cloudUpdatedAt === 0) {
        const primary = cloudUpdatedAt >= localUpdatedAt ? cloudArr : localArr;
        const secondary = cloudUpdatedAt >= localUpdatedAt ? localArr : cloudArr;
        const merged = [...primary];
        const seenIds = new Set(primary.map((m: any) => String(m?.id || '')));
        const seenNames = new Set(
          primary.map((m: any) => String(m?.name || '').trim().toLowerCase())
        );
        for (const item of secondary) {
          if (!item || !item.name) continue;
          const idStr = String(item.id || '');
          const nameKey = String(item.name).trim().toLowerCase();
          if (!seenIds.has(idStr) && !seenNames.has(nameKey)) {
            seenIds.add(idStr);
            seenNames.add(nameKey);
            merged.push(item);
          }
        }
        return JSON.stringify(merged);
      }
    }

    // Mesclagem de Reuniões de Domingo do Cantinho da Unidade
    if (key.endsWith('_meetings') && Array.isArray(localArr) && Array.isArray(cloudArr)) {
      if (localUpdatedAt === 0 || cloudUpdatedAt === 0) {
        const byDate = new Map<string, any>();
        const older = cloudUpdatedAt >= localUpdatedAt ? localArr : cloudArr;
        const newer = cloudUpdatedAt >= localUpdatedAt ? cloudArr : localArr;

        for (const sheet of [...older, ...newer]) {
          if (!sheet || !sheet.date) continue;
          const dKey = String(sheet.date).trim();
          const prev = byDate.get(dKey);
          if (!prev) {
            byDate.set(dKey, sheet);
          } else {
            byDate.set(dKey, {
              ...prev,
              ...sheet,
              records: {
                ...(prev.records || {}),
                ...(sheet.records || {})
              }
            });
          }
        }
        const mergedList = Array.from(byDate.values());
        if (mergedList.length > 0) return JSON.stringify(mergedList);
      }
    }

    // Mesclagem de Especialidades da Faixa e Favoritas do Catálogo
    if (
      (key.includes('faixa_') || key.includes('liked_specialties_') || key.includes('catalog_favs_')) &&
      Array.isArray(localArr) &&
      Array.isArray(cloudArr)
    ) {
      if (localUpdatedAt === 0 || cloudUpdatedAt === 0) {
        const union = Array.from(
          new Set([...cloudArr, ...localArr].map((x) => String(x).trim()).filter(Boolean))
        );
        return JSON.stringify(union);
      }
    }

    // Mesclagem de Versículos Marcados e Notas Bíblicas
    if ((key === 'markedVerses' || key === 'bibleNotes') && Array.isArray(localArr) && Array.isArray(cloudArr)) {
      if (localUpdatedAt === 0 || cloudUpdatedAt === 0) {
        const byId = new Map<string, any>();
        for (const item of [...localArr, ...cloudArr]) {
          if (item && item.id !== undefined) {
            byId.set(String(item.id), item);
          }
        }
        return JSON.stringify(Array.from(byId.values()));
      }
    }

    // Mesclagem de Recordes do Quiz (mantém sempre o maior recorde de cada arena)
    if (
      key.startsWith('dbv_quiz_scores_') &&
      localArr &&
      cloudArr &&
      typeof localArr === 'object' &&
      typeof cloudArr === 'object' &&
      !Array.isArray(localArr)
    ) {
      const mergedScores: Record<string, any> = { ...localArr, ...cloudArr };
      for (const arena of Object.keys(mergedScores)) {
        const l = localArr[arena] || { bestScore: 0, bestAccuracy: 0, gamesPlayed: 0, lastPlayed: '' };
        const c = cloudArr[arena] || { bestScore: 0, bestAccuracy: 0, gamesPlayed: 0, lastPlayed: '' };
        mergedScores[arena] = {
          bestScore: Math.max(Number(l.bestScore || 0), Number(c.bestScore || 0)),
          bestAccuracy: Math.max(Number(l.bestAccuracy || 0), Number(c.bestAccuracy || 0)),
          gamesPlayed: Math.max(Number(l.gamesPlayed || 0), Number(c.gamesPlayed || 0)),
          lastPlayed: c.lastPlayed || l.lastPlayed || ''
        };
      }
      return JSON.stringify(mergedScores);
    }
  } catch {}
  return null;
}

async function downloadSyncJsonFromStorage(filePath: string): Promise<UserCloudSyncBundle | null> {
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
      if (parsed && parsed.entries && typeof parsed.entries === 'object') {
        return parsed as UserCloudSyncBundle;
      }
    }
  } catch {}

  try {
    const { data: blob } = await supabaseQfpy.storage.from('App DBV Tudo').download(filePath);
    if (blob) {
      const text = await blob.text();
      const parsed = JSON.parse(text);
      if (parsed && parsed.entries && typeof parsed.entries === 'object') {
        return parsed as UserCloudSyncBundle;
      }
    }
  } catch {}

  return null;
}

async function uploadSyncJsonToStorage(filePath: string, bundle: UserCloudSyncBundle): Promise<void> {
  try {
    await supabaseQfpy.storage
      .from('App DBV Tudo')
      .upload(filePath, JSON.stringify(bundle), {
        upsert: true,
        contentType: 'application/json',
        cacheControl: '0'
      });
  } catch {}
}

/**
 * Coleta todas as chaves rastreadas atualmente presentes no localStorage deste dispositivo.
 */
function buildLocalEntriesMap(): Record<string, SyncedKeyEntry> {
  ensureNativeStorageRefs();
  if (!_nativeGetItem || typeof window === 'undefined' || !window.localStorage) return {};

  const meta = loadLocalKeyMeta();
  const entries: Record<string, SyncedKeyEntry> = {};

  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !isTrackedSyncKey(key)) continue;
    const rawVal = _nativeGetItem(key);
    if (rawVal === null) continue;

    const kMeta = meta[key];
    const isEmpty = isValueEmptyOrDefault(key, rawVal);

    // Só inclui uma chave vazia/padrão se o usuário tiver esvaziado explicitamente
    if (isEmpty && !kMeta?.explicitEmpty) {
      continue;
    }

    entries[key] = {
      value: rawVal,
      updatedAt: kMeta?.updatedAt || 0,
      explicitEmpty: Boolean(kMeta?.explicitEmpty)
    };
  }

  return entries;
}

/**
 * Envia o estado atual do dispositivo para a nuvem (Supabase Storage + Tabela Usuarios + API Server + Realtime).
 */
export async function pushLocalStateToCloud(): Promise<void> {
  ensureNativeStorageRefs();
  if (!_nativeGetItem) return;

  const { userKey, email, name } = resolveCurrentSyncUserIdentity();
  const entries = buildLocalEntriesMap();
  if (Object.keys(entries).length === 0) return;

  const now = Date.now();
  const bundle: UserCloudSyncBundle = {
    userKey,
    userEmail: email,
    userName: name,
    updatedAt: now,
    deviceId: getDeviceId(),
    entries
  };

  // 1. Salva no arquivo exclusivo do usuário no bucket público "App DBV Tudo"
  const uploads: Promise<any>[] = [
    uploadSyncJsonToStorage(`sync/user_${userKey}.json`, bundle)
  ];

  // 2. Salva as chaves de unidade/estudo no arquivo compartilhado de fallback (para sincronizar mesmo se um dos aparelhos estiver sem login)
  const sharedEntries: Record<string, SyncedKeyEntry> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (isUnitOrSharedFallbackKey(k)) {
      sharedEntries[k] = v;
    }
  }
  if (Object.keys(sharedEntries).length > 0) {
    const sharedBundle: UserCloudSyncBundle = {
      userKey: 'shared_unit_fallback',
      userEmail: email,
      userName: name,
      updatedAt: now,
      deviceId: getDeviceId(),
      entries: sharedEntries
    };
    uploads.push(uploadSyncJsonToStorage('sync/shared_unit_fallback.json', sharedBundle));
  }

  // 3. Envia para o endpoint em memória do servidor (/api/live-exam)
  try {
    fetch('/api/live-exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SYNC_USER_CLOUD_BUNDLE',
        userKey,
        bundle
      })
    }).catch(() => {});
  } catch {}

  // 4. Transmite em tempo real via WebSocket para o outro aparelho aberto (Celular <-> PC)
  try {
    _realtimeChannel
      ?.send({
        type: 'broadcast',
        event: 'user:cloud_sync',
        payload: bundle
      })
      .catch(() => {});
  } catch {}

  // 5. Se o usuário estiver autenticado no Supabase, também persiste o resumo na coluna 'fundo' de Usuarios
  try {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user?.id) {
        try {
          const { data: row } = await supabase
            .from('Usuarios')
            .select('fundo')
            .eq('user_id', data.user.id)
            .maybeSingle();
          let existingFundo: Record<string, any> = {};
          if (row?.fundo) {
            try {
              existingFundo = JSON.parse(row.fundo);
            } catch {}
          }
          existingFundo.email = email || data.user.email || existingFundo.email;
          existingFundo.cloudSyncEntries = entries;
          existingFundo.cloudSyncUpdatedAt = now;
          await supabase
            .from('Usuarios')
            .upsert(
              {
                user_id: data.user.id,
                fundo: JSON.stringify(existingFundo)
              },
              { onConflict: 'user_id' }
            );
        } catch {}
      }
    }).catch(() => {});
  } catch {}

  await Promise.allSettled(uploads);
  _lastSyncTimestamp = now;
  try {
    window.dispatchEvent(
      new CustomEvent('dbv_cloud_sync_status', {
        detail: { status: 'SYNCED', timestamp: now }
      })
    );
  } catch {}
}

/**
 * Aplica um pacote vindo da nuvem ao localStorage local com mesclagem inteligente sem perda de dados.
 */
function applyRemoteBundleToLocal(
  remoteBundle: UserCloudSyncBundle | null,
  options?: { isFallbackBundle?: boolean }
): { appliedKeys: string[]; needsPushBack: boolean } {
  ensureNativeStorageRefs();
  if (!remoteBundle || !remoteBundle.entries || !_nativeGetItem || !_nativeSetItem) {
    return { appliedKeys: [], needsPushBack: false };
  }

  const localMeta = loadLocalKeyMeta();
  const appliedKeys: string[] = [];
  let needsPushBack = false;
  let metaChanged = false;

  _isApplyingRemoteSync = true;
  try {
    const remoteKeys = Object.keys(remoteBundle.entries);

    for (const key of remoteKeys) {
      if (!isTrackedSyncKey(key)) continue;
      if (options?.isFallbackBundle && !isUnitOrSharedFallbackKey(key)) continue;

      const remoteEntry = remoteBundle.entries[key];
      if (!remoteEntry || typeof remoteEntry.value !== 'string') continue;

      const localRaw = _nativeGetItem(key);
      const lMeta = localMeta[key] || { updatedAt: 0, explicitEmpty: false };
      const rUpdatedAt = Number(remoteEntry.updatedAt || remoteBundle.updatedAt || 0);

      const isLocalEmpty = isValueEmptyOrDefault(key, localRaw);
      const isRemoteEmpty = isValueEmptyOrDefault(key, remoteEntry.value);

      // Se for pacote de fallback compartilhado, só preenche chaves que ainda estão vazias/padrão neste aparelho
      // ou quando o próprio usuário enviou uma atualização mais recente
      if (options?.isFallbackBundle && !isLocalEmpty && lMeta.updatedAt >= rUpdatedAt) {
        continue;
      }

      if (isRemoteEmpty && !remoteEntry.explicitEmpty) {
        if (!isLocalEmpty) {
          needsPushBack = true;
        }
        continue;
      }

      // Caso 1: Local está vazio/padrão (e não foi esvaziado explicitamente após a nuvem) -> Adota o valor da nuvem!
      if (isLocalEmpty && (!lMeta.explicitEmpty || rUpdatedAt > lMeta.updatedAt)) {
        if (localRaw !== remoteEntry.value) {
          _nativeSetItem(key, remoteEntry.value);
          localMeta[key] = {
            updatedAt: Math.max(rUpdatedAt, Date.now()),
            explicitEmpty: Boolean(remoteEntry.explicitEmpty)
          };
          metaChanged = true;
          appliedKeys.push(key);
        }
        continue;
      }

      // Caso 2: Ambos possuem dados não-vazios diferentes -> Tenta mesclagem inteligente de coleções ou usa o mais recente
      if (!isLocalEmpty && !isRemoteEmpty && localRaw && localRaw !== remoteEntry.value) {
        const mergedCollection = tryMergeJsonCollections(
          key,
          localRaw,
          remoteEntry.value,
          lMeta.updatedAt,
          rUpdatedAt
        );

        if (mergedCollection && mergedCollection !== localRaw) {
          _nativeSetItem(key, mergedCollection);
          localMeta[key] = {
            updatedAt: Math.max(lMeta.updatedAt, rUpdatedAt, Date.now()),
            explicitEmpty: false
          };
          metaChanged = true;
          appliedKeys.push(key);
          if (mergedCollection !== remoteEntry.value) {
            needsPushBack = true;
          }
          continue;
        } else if (mergedCollection && mergedCollection !== remoteEntry.value) {
          needsPushBack = true;
          continue;
        }

        if (rUpdatedAt > lMeta.updatedAt) {
          _nativeSetItem(key, remoteEntry.value);
          localMeta[key] = {
            updatedAt: rUpdatedAt,
            explicitEmpty: Boolean(remoteEntry.explicitEmpty)
          };
          metaChanged = true;
          appliedKeys.push(key);
        } else if (lMeta.updatedAt > rUpdatedAt) {
          needsPushBack = true;
        }
        continue;
      }

      // Caso 3: Usuário excluiu todos os itens explicitamente no outro aparelho (explicitEmpty === true e rUpdatedAt > lMeta.updatedAt)
      if (remoteEntry.explicitEmpty && rUpdatedAt > lMeta.updatedAt && localRaw !== remoteEntry.value) {
        _nativeSetItem(key, remoteEntry.value);
        localMeta[key] = {
          updatedAt: rUpdatedAt,
          explicitEmpty: true
        };
        metaChanged = true;
        appliedKeys.push(key);
      }
    }

    // Verifica se há chaves locais com dados reais que ainda não existem no pacote remoto
    if (!options?.isFallbackBundle) {
      const localEntries = buildLocalEntriesMap();
      for (const [k, lEntry] of Object.entries(localEntries)) {
        const rEntry = remoteBundle.entries[k];
        if (!rEntry || (isValueEmptyOrDefault(k, rEntry.value) && !rEntry.explicitEmpty)) {
          if (!isValueEmptyOrDefault(k, lEntry.value)) {
            needsPushBack = true;
          }
        }
      }
    }
  } finally {
    _isApplyingRemoteSync = false;
  }

  if (metaChanged) {
    saveLocalKeyMeta(localMeta);
  }

  if (appliedKeys.length > 0 && typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('dbv_cloud_sync_applied', {
          detail: { keys: appliedKeys, timestamp: Date.now() }
        })
      );
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }

  return { appliedKeys, needsPushBack };
}

/**
 * Baixa os dados da nuvem (Supabase Storage + Tabela Usuarios + API Server),
 * mescla com os dados locais e envia de volta qualquer dado local novo.
 */
export async function syncUserCloudDataNow(): Promise<{ appliedKeys: string[] }> {
  if (_syncInProgress) return { appliedKeys: [] };
  _syncInProgress = true;

  try {
    window.dispatchEvent(
      new CustomEvent('dbv_cloud_sync_status', {
        detail: { status: 'SYNCING', timestamp: Date.now() }
      })
    );
  } catch {}

  const allAppliedKeys = new Set<string>();
  let shouldPushLocal = false;

  try {
    const { userKey } = resolveCurrentSyncUserIdentity();

    const [userStorageBundle, sharedFallbackBundle, apiBundle, dbFundoBundle] = await Promise.all([
      downloadSyncJsonFromStorage(`sync/user_${userKey}.json`),
      downloadSyncJsonFromStorage('sync/shared_unit_fallback.json'),
      fetch(`/api/live-exam?cloudSyncUser=${encodeURIComponent(userKey)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => (d?.bundle ? (d.bundle as UserCloudSyncBundle) : null))
        .catch(() => null),
      supabase.auth
        .getUser()
        .then(async ({ data }) => {
          if (!data?.user?.id) return null;
          const { data: row } = await supabase
            .from('Usuarios')
            .select('fundo')
            .eq('user_id', data.user.id)
            .maybeSingle();
          if (row?.fundo) {
            const parsed = JSON.parse(row.fundo);
            if (parsed?.cloudSyncEntries && typeof parsed.cloudSyncEntries === 'object') {
              return {
                userKey,
                updatedAt: Number(parsed.cloudSyncUpdatedAt || 0),
                deviceId: 'supabase_db',
                entries: parsed.cloudSyncEntries
              } as UserCloudSyncBundle;
            }
          }
          return null;
        })
        .catch(() => null)
    ]);

    // 1. Aplica pacotes do usuário (ordenados do mais antigo ao mais recente)
    const userBundles = [dbFundoBundle, userStorageBundle, apiBundle]
      .filter(Boolean)
      .sort((a, b) => (a!.updatedAt || 0) - (b!.updatedAt || 0)) as UserCloudSyncBundle[];

    if (userBundles.length === 0) {
      const localEntries = buildLocalEntriesMap();
      if (Object.keys(localEntries).length > 0) {
        shouldPushLocal = true;
      }
    } else {
      for (const b of userBundles) {
        const { appliedKeys, needsPushBack } = applyRemoteBundleToLocal(b, { isFallbackBundle: false });
        appliedKeys.forEach((k) => allAppliedKeys.add(k));
        if (needsPushBack) shouldPushLocal = true;
      }
    }

    // 2. Aplica pacote compartilhado de fallback para chaves do Cantinho da Unidade que ainda estejam vazias neste aparelho
    if (sharedFallbackBundle) {
      const { appliedKeys, needsPushBack } = applyRemoteBundleToLocal(sharedFallbackBundle, {
        isFallbackBundle: true
      });
      appliedKeys.forEach((k) => allAppliedKeys.add(k));
      if (needsPushBack) shouldPushLocal = true;
    }

    // 3. Se havia dados locais no aparelho que ainda não estavam na nuvem, envia agora!
    if (shouldPushLocal) {
      await pushLocalStateToCloud();
    } else {
      _lastSyncTimestamp = Date.now();
      try {
        window.dispatchEvent(
          new CustomEvent('dbv_cloud_sync_status', {
            detail: { status: 'SYNCED', timestamp: _lastSyncTimestamp }
          })
        );
      } catch {}
    }
  } catch {
    try {
      window.dispatchEvent(
        new CustomEvent('dbv_cloud_sync_status', {
          detail: { status: 'IDLE', timestamp: _lastSyncTimestamp }
        })
      );
    } catch {}
  } finally {
    _syncInProgress = false;
  }

  return { appliedKeys: Array.from(allAppliedKeys) };
}

function scheduleCloudPush() {
  if (_pushDebounceTimer) clearTimeout(_pushDebounceTimer);
  _pushDebounceTimer = setTimeout(() => {
    pushLocalStateToCloud().catch(() => {});
  }, 280);
}

/**
 * Inicializa a sincronização automática Celular <-> PC em segundo plano,
 * interceptando gravações no localStorage e escutando mudanças via WebSocket Realtime.
 */
export function initUserCloudSync(): void {
  if (typeof window === 'undefined' || _isInitialized) return;
  _isInitialized = true;
  ensureNativeStorageRefs();

  // 1. Intercepta localStorage.setItem para detectar automaticamente qualquer alteração feita pelo usuário
  if (_nativeSetItem && _nativeGetItem) {
    const originalSetItem = _nativeSetItem;
    const originalGetItem = _nativeGetItem;

    window.localStorage.setItem = function (key: string, value: string) {
      const prevValue = originalGetItem(key);
      originalSetItem(key, value);

      if (_isApplyingRemoteSync || !isTrackedSyncKey(key)) return;
      if (prevValue === value) return;

      const isNewEmpty = isValueEmptyOrDefault(key, value);
      const wasPrevEmpty = isValueEmptyOrDefault(key, prevValue);

      // Se a chave não existia (prevValue === null) e o componente acabou de gravar o valor vazio padrão na montagem,
      // NÃO marca como edição explícita para não sobrescrever dados da nuvem!
      if (prevValue === null && isNewEmpty) {
        return;
      }

      const meta = loadLocalKeyMeta();
      meta[key] = {
        updatedAt: Date.now(),
        explicitEmpty: isNewEmpty && !wasPrevEmpty
      };
      saveLocalKeyMeta(meta);

      scheduleCloudPush();
    };
  }

  // 2. Canal Realtime WebSocket para atualização instantânea quando Celular e PC estão abertos juntos
  try {
    const myDeviceId = getDeviceId();
    const ch = supabaseCloudSyncRealtime
      .channel('dbv_universal_cloud_sync_v1', {
        config: { broadcast: { self: false } }
      })
      .on('broadcast', { event: 'user:cloud_sync' }, ({ payload }) => {
        if (!payload || payload.deviceId === myDeviceId) return;
        const { userKey: myUserKey } = resolveCurrentSyncUserIdentity();
        const isSameUser = payload.userKey === myUserKey;
        applyRemoteBundleToLocal(payload as UserCloudSyncBundle, {
          isFallbackBundle: !isSameUser
        });
      })
      .subscribe();
    _realtimeChannel = ch;
  } catch {}

  // 3. Sincroniza imediatamente ao abrir o app
  syncUserCloudDataNow().catch(() => {});

  // 4. Sincroniza sempre que o usuário alternar para a aba/janela no PC ou abrir o app no celular
  window.addEventListener('focus', () => {
    syncUserCloudDataNow().catch(() => {});
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      syncUserCloudDataNow().catch(() => {});
    }
  });

  // 5. Verificação periódica leve para garantir sincronia contínua
  setInterval(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      syncUserCloudDataNow().catch(() => {});
    }
  }, 8000);
}
