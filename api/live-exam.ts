import type { IncomingMessage, ServerResponse } from 'http';

const globalRooms: Map<string, any> =
  (globalThis as any).__dbvLiveExamRooms || new Map<string, any>();
(globalThis as any).__dbvLiveExamRooms = globalRooms;

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
        const { action, pin, room, participant, alert } = payload || {};

        if (action === 'UPSERT_ROOM' && room?.pin) {
          globalRooms.set(String(room.pin), room);
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, room }));
          return;
        }

        if (action === 'STUDENT_UPDATE' && pin && participant?.id) {
          const existing = globalRooms.get(String(pin));
          if (existing) {
            const prevP = existing.participants?.[participant.id];
            const isLocked = prevP?.status === 'DISQUALIFIED' ? true : participant.isLocked;
            existing.participants = {
              ...(existing.participants || {}),
              [participant.id]: {
                ...prevP,
                ...participant,
                isLocked
              }
            };
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
            const shouldLock = Boolean(existing.lockOnCheat);
            existing.participants = {
              ...(existing.participants || {}),
              [participant.id]: {
                ...(existing.participants?.[participant.id] || {}),
                ...participant,
                isLocked: shouldLock,
                status: shouldLock ? 'LOCKED_CHEAT' : participant.status
              }
            };
            const currentAlerts = Array.isArray(existing.alerts) ? existing.alerts : [];
            if (!currentAlerts.some((a: any) => a.id === alert.id)) {
              existing.alerts = [alert, ...currentAlerts];
            }
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
