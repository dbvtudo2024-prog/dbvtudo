import type { IncomingMessage, ServerResponse } from 'http';

const globalRooms: Map<string, any> =
  (globalThis as any).__dbvLiveExamRooms || new Map<string, any>();
(globalThis as any).__dbvLiveExamRooms = globalRooms;

const globalInstructorSessions: Map<string, any> =
  (globalThis as any).__dbvLiveExamInstructorSessions || new Map<string, any>();
(globalThis as any).__dbvLiveExamInstructorSessions = globalInstructorSessions;

const globalStudentHistories: Map<string, any[]> =
  (globalThis as any).__dbvLiveExamStudentHistories || new Map<string, any[]>();
(globalThis as any).__dbvLiveExamStudentHistories = globalStudentHistories;

const globalUserCloudBundles: Map<string, any> =
  (globalThis as any).__dbvUserCloudSyncBundles || new Map<string, any>();
(globalThis as any).__dbvUserCloudSyncBundles = globalUserCloudBundles;

function mergeStudentHistoryEntries(existingList: any[], incomingList: any[]): any[] {
  const byPin = new Map<string, any>();
  [...(existingList || []), ...(incomingList || [])].forEach((item) => {
    if (!item || !item.pin) return;
    const pinKey = String(item.pin);
    const prev = byPin.get(pinKey);
    if (!prev) {
      byPin.set(pinKey, item);
    } else {
      const mergedReleased = Boolean(prev.resultsReleased || item.resultsReleased);
      const newer = (item.completedAt || 0) >= (prev.completedAt || 0) ? item : prev;
      const older = newer === item ? prev : item;
      byPin.set(pinKey, {
        ...older,
        ...newer,
        resultsReleased: mergedReleased,
        cheatCount: Math.max(Number(prev.cheatCount || 0), Number(item.cheatCount || 0)),
        answeredCount: Math.max(Number(prev.answeredCount || 0), Number(item.answeredCount || 0))
      });
    }
  });
  return Array.from(byPin.values()).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
}

function mergeParticipantRecords(existingP: any, incomingP: any, fromStudentUpdate = false): any {
  if (!existingP) return incomingP;
  if (!incomingP) return existingP;

  const eCheat = Number(existingP.cheatCount || 0);
  const iCheat = Number(incomingP.cheatCount || 0);
  const maxCheat = Math.max(eCheat, iCheat);

  const eUnlocked = Number(existingP.unlockedCheatCount || 0);
  const iUnlocked = Number(incomingP.unlockedCheatCount || 0);
  const maxUnlocked = Math.max(eUnlocked, iUnlocked);

  const maxAnswered = Math.max(Number(existingP.answeredCount || 0), Number(incomingP.answeredCount || 0));

  const answers =
    Object.keys(incomingP.answers || {}).length >= Object.keys(existingP.answers || {}).length
      ? incomingP.answers || existingP.answers || {}
      : existingP.answers || {};

  let isLocked: boolean;
  let status: string;
  if (existingP.status === 'DISQUALIFIED' || incomingP.status === 'DISQUALIFIED') {
    isLocked = true;
    status = 'DISQUALIFIED';
  } else if (maxUnlocked >= maxCheat && maxUnlocked > 0) {
    isLocked = false;
    status =
      incomingP.status === 'FINISHED' || existingP.status === 'FINISHED'
        ? 'FINISHED'
        : incomingP.status === 'LOCKED_CHEAT' || existingP.status === 'LOCKED_CHEAT'
        ? 'PLAYING'
        : incomingP.status || existingP.status || 'PLAYING';
  } else if (fromStudentUpdate) {
    isLocked = Boolean(existingP.isLocked || incomingP.isLocked);
    status =
      incomingP.status === 'FINISHED' || existingP.status === 'FINISHED'
        ? 'FINISHED'
        : isLocked
        ? 'LOCKED_CHEAT'
        : incomingP.status || existingP.status || 'PLAYING';
  } else {
    if (eCheat > iCheat) {
      isLocked = Boolean(existingP.isLocked);
      status = isLocked ? 'LOCKED_CHEAT' : existingP.status || incomingP.status;
    } else {
      isLocked = Boolean(incomingP.isLocked);
      status =
        incomingP.status === 'FINISHED' || existingP.status === 'FINISHED'
          ? 'FINISHED'
          : isLocked
          ? 'LOCKED_CHEAT'
          : incomingP.status === 'LOCKED_CHEAT'
          ? 'PLAYING'
          : incomingP.status || existingP.status || 'PLAYING';
    }
  }

  return {
    ...existingP,
    ...incomingP,
    answeredCount: maxAnswered,
    correctCount:
      Number(incomingP.answeredCount || 0) >= Number(existingP.answeredCount || 0)
        ? incomingP.correctCount ?? existingP.correctCount ?? 0
        : existingP.correctCount ?? incomingP.correctCount ?? 0,
    scorePercent:
      Number(incomingP.answeredCount || 0) >= Number(existingP.answeredCount || 0)
        ? incomingP.scorePercent ?? existingP.scorePercent ?? 0
        : existingP.scorePercent ?? incomingP.scorePercent ?? 0,
    grade10:
      Number(incomingP.answeredCount || 0) >= Number(existingP.answeredCount || 0)
        ? incomingP.grade10 ?? existingP.grade10 ?? 0
        : existingP.grade10 ?? incomingP.grade10 ?? 0,
    cheatCount: maxCheat,
    unlockedCheatCount: maxUnlocked,
    lastCheatReason:
      iCheat >= eCheat
        ? incomingP.lastCheatReason || existingP.lastCheatReason
        : existingP.lastCheatReason || incomingP.lastCheatReason,
    lastCheatTime:
      iCheat >= eCheat
        ? incomingP.lastCheatTime || existingP.lastCheatTime
        : existingP.lastCheatTime || incomingP.lastCheatTime,
    isLocked,
    status,
    answers,
    timeSpentSeconds: incomingP.timeSpentSeconds || existingP.timeSpentSeconds
  };
}

function dedupeAlertsList(alertsList: any[]): any[] {
  const seenKeys = new Set<string>();
  const result: any[] = [];
  alertsList.forEach((a: any) => {
    if (!a?.id) return;
    const vKey = a.studentId && a.violationNumber ? `${a.studentId}_v${a.violationNumber}` : a.id;
    if (!seenKeys.has(a.id) && !seenKeys.has(vKey)) {
      seenKeys.add(a.id);
      seenKeys.add(vKey);
      result.push(a);
    }
  });
  return result;
}

function mergeRoomRecords(existingRoom: any, incomingRoom: any): any {
  if (!existingRoom) return incomingRoom;
  if (!incomingRoom) return existingRoom;

  const mergedParticipants: Record<string, any> = {
    ...(existingRoom.participants || {}),
    ...(incomingRoom.participants || {})
  };
  const allPids = new Set([
    ...Object.keys(existingRoom.participants || {}),
    ...Object.keys(incomingRoom.participants || {})
  ]);
  allPids.forEach((pid) => {
    mergedParticipants[pid] = mergeParticipantRecords(
      existingRoom.participants?.[pid],
      incomingRoom.participants?.[pid],
      false
    );
  });

  const mergedAlerts = dedupeAlertsList([...(incomingRoom.alerts || []), ...(existingRoom.alerts || [])]);

  const status =
    existingRoom.status === 'FINISHED' || incomingRoom.status === 'FINISHED'
      ? 'FINISHED'
      : existingRoom.status === 'ACTIVE' || incomingRoom.status === 'ACTIVE'
      ? 'ACTIVE'
      : incomingRoom.status || existingRoom.status || 'WAITING';

  return {
    ...existingRoom,
    ...incomingRoom,
    status,
    resultsReleased: Boolean(incomingRoom.resultsReleased || existingRoom.resultsReleased),
    startedAt: incomingRoom.startedAt || existingRoom.startedAt || null,
    extraSecondsAdded: Math.max(
      Number(existingRoom.extraSecondsAdded || 0),
      Number(incomingRoom.extraSecondsAdded || 0)
    ),
    participants: mergedParticipants,
    alerts: mergedAlerts,
    updatedAt: Math.max(Number(existingRoom.updatedAt || 0), Number(incomingRoom.updatedAt || 0), Date.now())
  };
}

export default async function handler(
  req: IncomingMessage & { query?: Record<string, string>; body?: any },
  res: ServerResponse
) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'GET') {
    try {
      const u = new URL(req.url || '', 'http://localhost:3000');
      const pin = (req.query?.pin || u.searchParams.get('pin') || '').trim();
      const instructorKey = (req.query?.instructor || u.searchParams.get('instructor') || '').trim();
      const cloudSyncUser = (req.query?.cloudSyncUser || u.searchParams.get('cloudSyncUser') || '').trim();
      const studentHistoryKeysRaw = (
        req.query?.studentHistoryKeys ||
        u.searchParams.get('studentHistoryKeys') ||
        ''
      ).trim();

      if (cloudSyncUser) {
        const bundle = globalUserCloudBundles.get(cloudSyncUser) || globalUserCloudBundles.get('shared_unit_fallback') || null;
        res.statusCode = 200;
        res.end(JSON.stringify({ bundle }));
        return;
      }

      if (studentHistoryKeysRaw) {
        const keys = studentHistoryKeysRaw
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean);
        let merged: any[] = [];
        keys.forEach((k) => {
          const list = globalStudentHistories.get(k);
          if (Array.isArray(list)) {
            merged = mergeStudentHistoryEntries(merged, list);
          }
        });
        res.statusCode = 200;
        res.end(JSON.stringify({ entries: merged }));
        return;
      }

      if (instructorKey) {
        const session = globalInstructorSessions.get(instructorKey);
        const closedSet = new Set<string>(session?.closedPins || []);
        const roomsMap = new Map<string, any>();

        if (session?.roomPins) {
          session.roomPins.forEach((rPin: string) => {
            if (closedSet.has(rPin)) return;
            const r = globalRooms.get(String(rPin));
            if (r) roomsMap.set(String(rPin), r);
          });
        }

        Array.from(globalRooms.values()).forEach((r: any) => {
          if (r?.creatorKey === instructorKey && r?.pin && !closedSet.has(String(r.pin))) {
            roomsMap.set(String(r.pin), r);
          }
        });

        res.statusCode = 200;
        res.end(
          JSON.stringify({
            instructorState: {
              instructorKey,
              selectedRoomPin: session?.selectedRoomPin || null,
              closedPins: Array.from(closedSet),
              rooms: Array.from(roomsMap.values()),
              updatedAt: session?.updatedAt || Date.now()
            }
          })
        );
        return;
      }

      const room = globalRooms.get(pin) || null;
      res.statusCode = 200;
      res.end(JSON.stringify({ room }));
    } catch (err: any) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err?.message || 'Erro interno' }));
    }
    return;
  }

  if (req.method === 'POST') {
    const processPayload = (payload: any) => {
      try {
        const {
          action,
          pin,
          room,
          participant,
          alert,
          studentId,
          instructorKey,
          rooms,
          selectedRoomPin,
          closedPins
        } = payload || {};

        if (action === 'SYNC_USER_CLOUD_BUNDLE' && payload?.userKey && payload?.bundle) {
          const uKey = String(payload.userKey).trim();
          const prev = globalUserCloudBundles.get(uKey);
          const mergedEntries = {
            ...(prev?.entries || {}),
            ...(payload.bundle.entries || {})
          };
          const savedBundle = {
            ...payload.bundle,
            entries: mergedEntries,
            updatedAt: Math.max(Number(prev?.updatedAt || 0), Number(payload.bundle.updatedAt || Date.now()))
          };
          globalUserCloudBundles.set(uKey, savedBundle);
          globalUserCloudBundles.set('shared_unit_fallback', savedBundle);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, bundle: savedBundle }));
          return;
        }

        if (action === 'SYNC_STUDENT_HISTORY' && Array.isArray(payload?.keys) && Array.isArray(payload?.entries)) {
          const keys = payload.keys.map((k: any) => String(k || '').trim()).filter(Boolean);
          let combined = payload.entries;
          keys.forEach((k: string) => {
            const existing = globalStudentHistories.get(k) || [];
            combined = mergeStudentHistoryEntries(existing, combined);
          });
          keys.forEach((k: string) => {
            globalStudentHistories.set(k, combined);
          });
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, entries: combined }));
          return;
        }

        if (action === 'UPSERT_ROOM' && room?.pin) {
          const rPin = String(room.pin);
          const existingRoom = globalRooms.get(rPin);
          const savedRoom = mergeRoomRecords(existingRoom, room);
          globalRooms.set(rPin, savedRoom);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, room: savedRoom }));
          return;
        }

        if (action === 'UNLOCK_STUDENT' && pin && studentId) {
          const existing = globalRooms.get(String(pin));
          if (existing && existing.participants?.[studentId]) {
            const prevP = existing.participants[studentId];
            const nextUnlocked = Math.max(
              Number(prevP.cheatCount || 0),
              Number(prevP.unlockedCheatCount || 0),
              Number(payload.unlockedAtViolation || 0),
              1
            );
            existing.participants = {
              ...existing.participants,
              [studentId]: {
                ...prevP,
                unlockedCheatCount: nextUnlocked,
                isLocked: false,
                status:
                  prevP.status === 'FINISHED'
                    ? 'FINISHED'
                    : existing.status === 'ACTIVE'
                    ? 'PLAYING'
                    : 'WAITING'
              }
            };
            existing.updatedAt = Date.now();
            globalRooms.set(String(pin), existing);
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, room: existing || null }));
          return;
        }

        if (action === 'SYNC_INSTRUCTOR_STATE' && instructorKey) {
          const cKey = String(instructorKey).trim();
          const prevSession = globalInstructorSessions.get(cKey);
          const nextClosed = Array.from(
            new Set<string>([
              ...(prevSession?.closedPins || []),
              ...(Array.isArray(closedPins) ? closedPins.map(String) : [])
            ])
          );
          const closedSet = new Set<string>(nextClosed);
          const incomingRooms = Array.isArray(rooms) ? rooms : [];
          const nextPins: string[] = [];

          incomingRooms.forEach((r: any) => {
            if (!r?.pin || closedSet.has(String(r.pin))) return;
            const rPin = String(r.pin);
            nextPins.push(rPin);
            const existingRoom = globalRooms.get(rPin);
            globalRooms.set(rPin, mergeRoomRecords(existingRoom, r));
          });

          globalInstructorSessions.set(cKey, {
            instructorKey: cKey,
            selectedRoomPin:
              selectedRoomPin !== undefined
                ? selectedRoomPin
                : prevSession?.selectedRoomPin || nextPins[0] || null,
            closedPins: nextClosed,
            roomPins: Array.from(new Set(nextPins)),
            updatedAt: Date.now()
          });

          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        if (action === 'STUDENT_UPDATE' && pin && participant?.id) {
          const existing = globalRooms.get(String(pin));
          if (existing) {
            const prevP = existing.participants?.[participant.id];
            const mergedP = mergeParticipantRecords(prevP, participant, true);
            existing.participants = {
              ...(existing.participants || {}),
              [participant.id]: mergedP
            };
            if (alert && alert.id) {
              existing.alerts = dedupeAlertsList([alert, ...(existing.alerts || [])]);
            }
            existing.updatedAt = Date.now();
            globalRooms.set(String(pin), existing);
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, room: existing || null }));
          return;
        }

        if (action === 'CHEAT_ALERT' && pin && alert && participant?.id) {
          const existing = globalRooms.get(String(pin));
          if (existing) {
            const prevP = existing.participants?.[participant.id];
            const maxCheat = Math.max(Number(prevP?.cheatCount || 0), Number(participant.cheatCount || 0));
            const maxUnlocked = Math.max(
              Number(prevP?.unlockedCheatCount || 0),
              Number(participant.unlockedCheatCount || 0)
            );
            const alreadyUnlocked = maxUnlocked >= maxCheat && maxUnlocked > 0;
            const shouldLock = Boolean(existing.lockOnCheat) && !alreadyUnlocked;
            const mergedP = mergeParticipantRecords(
              prevP,
              {
                ...participant,
                cheatCount: maxCheat,
                unlockedCheatCount: maxUnlocked,
                isLocked: shouldLock,
                status: shouldLock ? 'LOCKED_CHEAT' : participant.status
              },
              true
            );
            existing.participants = {
              ...(existing.participants || {}),
              [participant.id]: {
                ...mergedP,
                isLocked: shouldLock,
                status: shouldLock ? 'LOCKED_CHEAT' : mergedP.status === 'LOCKED_CHEAT' ? 'PLAYING' : mergedP.status
              }
            };
            existing.alerts = dedupeAlertsList([alert, ...(existing.alerts || [])]);
            existing.updatedAt = Date.now();
            globalRooms.set(String(pin), existing);
          }
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, room: existing || null }));
          return;
        }

        res.statusCode = 200;
        res.end(JSON.stringify({ ok: true }));
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err?.message || 'Erro interno' }));
      }
    };

    if (req.body && typeof req.body === 'object') {
      processPayload(req.body);
      return;
    }

    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        processPayload(JSON.parse(raw || '{}'));
      } catch {
        processPayload({});
      }
    });
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method Not Allowed' }));
}
