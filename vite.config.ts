import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const buildTime = Date.now();
const appVersion = '3.0.95';
const liveExamRooms = new Map<string, any>();
const liveExamInstructorSessions = new Map<
  string,
  {
    instructorKey: string;
    instructorEmail?: string;
    instructorName?: string;
    selectedRoomPin: string | null;
    closedPins: string[];
    roomPins: string[];
    updatedAt: number;
  }
>();

function versionPlugin(): Plugin {
  return {
    name: 'version-generator-plugin',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({
          version: buildTime,
          versionName: appVersion,
          buildDate: new Date(buildTime).toISOString(),
          timestamp: buildTime,
          highlights: [
            "Prova Ao Vivo liberada apenas de Conselheiro para cima, opção de Ler QR Code pelo aplicativo e envio individual do resultado para o aparelho de cada aluno"
          ]
        }, null, 2)
      });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/version.json')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.end(JSON.stringify({
            version: buildTime,
            versionName: appVersion,
            buildDate: new Date(buildTime).toISOString(),
            timestamp: buildTime,
            highlights: [
              "Prova Ao Vivo liberada apenas de Conselheiro para cima, opção de Ler QR Code pelo aplicativo e envio individual do resultado para o aparelho de cada aluno"
            ]
          }));
          return;
        }

        // Endpoint em tempo real para sincronização de Salas de Prova Ao Vivo (QR Code + Anti-Cola + Sincronia PC/Celular do Instrutor)
        if (req.url && req.url.startsWith('/api/live-exam')) {
          if (req.method === 'GET') {
            try {
              const u = new URL(req.url, 'http://localhost:3000');
              const pin = (u.searchParams.get('pin') || '').trim();
              const instructorKey = (u.searchParams.get('instructor') || '').trim();

              if (instructorKey) {
                const session = liveExamInstructorSessions.get(instructorKey);
                const closedSet = new Set(session?.closedPins || []);
                const roomsMap = new Map<string, any>();

                if (session?.roomPins) {
                  session.roomPins.forEach((rPin) => {
                    if (closedSet.has(rPin)) return;
                    const r = liveExamRooms.get(String(rPin));
                    if (r) roomsMap.set(String(rPin), r);
                  });
                }

                Array.from(liveExamRooms.values()).forEach((r: any) => {
                  if (r?.creatorKey === instructorKey && r?.pin && !closedSet.has(String(r.pin))) {
                    roomsMap.set(String(r.pin), r);
                  }
                });

                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Cache-Control', 'no-store');
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

              const room = liveExamRooms.get(pin) || null;
              res.setHeader('Content-Type', 'application/json');
              res.setHeader('Cache-Control', 'no-store');
              res.end(JSON.stringify({ room }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err?.message }));
            }
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const payload = JSON.parse(body || '{}');
                const { action, pin, room, participant, alert, studentId, instructorKey, rooms, selectedRoomPin, closedPins } = payload;

                const dedupeAlertsSrv = (alertsList: any[]): any[] => {
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
                };

                const mergeParticipantSrv = (existingP: any, incomingP: any, fromStudentUpdate = false): any => {
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
                };

                const mergeRoomSrv = (existingRoom: any, incomingRoom: any): any => {
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
                    mergedParticipants[pid] = mergeParticipantSrv(
                      existingRoom.participants?.[pid],
                      incomingRoom.participants?.[pid],
                      false
                    );
                  });

                  const mergedAlerts = dedupeAlertsSrv([...(incomingRoom.alerts || []), ...(existingRoom.alerts || [])]);

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
                };

                if (action === 'UPSERT_ROOM' && room?.pin) {
                  const rPin = String(room.pin);
                  const existingRoom = liveExamRooms.get(rPin);
                  const savedRoom = mergeRoomSrv(existingRoom, room);
                  liveExamRooms.set(rPin, savedRoom);
                  const cKey = String(room.creatorKey || instructorKey || existingRoom?.creatorKey || '').trim();
                  if (cKey) {
                    const prevSession = liveExamInstructorSessions.get(cKey);
                    const nextClosed = (prevSession?.closedPins || []).filter((p) => p !== rPin);
                    const nextPins = Array.from(new Set([...(prevSession?.roomPins || []), rPin]));
                    liveExamInstructorSessions.set(cKey, {
                      instructorKey: cKey,
                      instructorEmail: room.creatorEmail || prevSession?.instructorEmail,
                      instructorName: room.creatorName || prevSession?.instructorName,
                      selectedRoomPin: selectedRoomPin || prevSession?.selectedRoomPin || rPin,
                      closedPins: nextClosed,
                      roomPins: nextPins,
                      updatedAt: Date.now()
                    });
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true, room: savedRoom }));
                  return;
                }

                if (action === 'UNLOCK_STUDENT' && pin && studentId) {
                  const existing = liveExamRooms.get(String(pin));
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
                    liveExamRooms.set(String(pin), existing);
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true, room: existing || null }));
                  return;
                }

                if (action === 'CLOSE_ROOM' && pin) {
                  const targetPin = String(pin);
                  const existing = liveExamRooms.get(targetPin);
                  const cKey = String(instructorKey || existing?.creatorKey || '').trim();
                  liveExamRooms.delete(targetPin);
                  if (cKey) {
                    const prevSession = liveExamInstructorSessions.get(cKey);
                    const nextPins = (prevSession?.roomPins || []).filter((p) => p !== targetPin);
                    const nextClosed = Array.from(new Set([...(prevSession?.closedPins || []), targetPin]));
                    liveExamInstructorSessions.set(cKey, {
                      instructorKey: cKey,
                      instructorEmail: prevSession?.instructorEmail,
                      instructorName: prevSession?.instructorName,
                      selectedRoomPin:
                        prevSession?.selectedRoomPin === targetPin
                          ? nextPins[0] || null
                          : prevSession?.selectedRoomPin || null,
                      closedPins: nextClosed,
                      roomPins: nextPins,
                      updatedAt: Date.now()
                    });
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true }));
                  return;
                }

                if (action === 'SYNC_INSTRUCTOR_STATE' && instructorKey) {
                  const cKey = String(instructorKey).trim();
                  const prevSession = liveExamInstructorSessions.get(cKey);
                  const nextClosed = Array.from(
                    new Set([...(prevSession?.closedPins || []), ...(Array.isArray(closedPins) ? closedPins.map(String) : [])])
                  );
                  const closedSet = new Set(nextClosed);
                  const incomingRooms = Array.isArray(rooms) ? rooms : [];
                  const nextPins: string[] = [];

                  incomingRooms.forEach((r: any) => {
                    if (!r?.pin || closedSet.has(String(r.pin))) return;
                    const rPin = String(r.pin);
                    nextPins.push(rPin);
                    const existingRoom = liveExamRooms.get(rPin);
                    liveExamRooms.set(rPin, mergeRoomSrv(existingRoom, r));
                  });

                  nextClosed.forEach((cPin) => {
                    liveExamRooms.delete(cPin);
                  });

                  liveExamInstructorSessions.set(cKey, {
                    instructorKey: cKey,
                    instructorEmail: payload.instructorEmail || prevSession?.instructorEmail,
                    instructorName: payload.instructorName || prevSession?.instructorName,
                    selectedRoomPin: selectedRoomPin !== undefined ? selectedRoomPin : prevSession?.selectedRoomPin || nextPins[0] || null,
                    closedPins: nextClosed,
                    roomPins: Array.from(new Set(nextPins)),
                    updatedAt: Date.now()
                  });

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true }));
                  return;
                }

                if (action === 'STUDENT_UPDATE' && pin && participant?.id) {
                  const existing = liveExamRooms.get(String(pin));
                  if (existing) {
                    const prevP = existing.participants?.[participant.id];
                    const mergedP = mergeParticipantSrv(prevP, participant, true);
                    existing.participants = {
                      ...(existing.participants || {}),
                      [participant.id]: mergedP
                    };
                    if (alert && alert.id) {
                      existing.alerts = dedupeAlertsSrv([alert, ...(existing.alerts || [])]);
                    }
                    existing.updatedAt = Date.now();
                    liveExamRooms.set(String(pin), existing);
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true, room: existing || null }));
                  return;
                }

                if (action === 'CHEAT_ALERT' && pin && alert && participant?.id) {
                  const existing = liveExamRooms.get(String(pin));
                  if (existing) {
                    const prevP = existing.participants?.[participant.id];
                    const maxCheat = Math.max(Number(prevP?.cheatCount || 0), Number(participant.cheatCount || 0));
                    const maxUnlocked = Math.max(
                      Number(prevP?.unlockedCheatCount || 0),
                      Number(participant.unlockedCheatCount || 0)
                    );
                    const alreadyUnlocked = maxUnlocked >= maxCheat && maxUnlocked > 0;
                    const shouldLock = Boolean(existing.lockOnCheat) && !alreadyUnlocked;
                    const mergedP = mergeParticipantSrv(
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
                    existing.alerts = dedupeAlertsSrv([alert, ...(existing.alerts || [])]);
                    existing.updatedAt = Date.now();
                    liveExamRooms.set(String(pin), existing);
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ ok: true, room: existing || null }));
                  return;
                }

                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err?.message }));
              }
            });
            return;
          }
        }

        // Endpoint de geração de respostas didáticas com IA no servidor
        if (req.url && req.url.startsWith('/api/gemini/generate-didactic') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsedBody = JSON.parse(body || '{}');
              const { prompt, systemInstruction } = parsedBody;
              const responseMimeType = parsedBody.responseMimeType ?? 'application/json';
              const temperature = typeof parsedBody.temperature === 'number' ? parsedBody.temperature : 0.3;

              if (!prompt) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Prompt ausente' }));
                return;
              }

              const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
              if (!apiKey) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'GEMINI_API_KEY não configurada' }));
                return;
              }

              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    'User-Agent': 'aistudio-build',
                  }
                }
              });
              const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
              
              let resultText = '';
              let lastError = null;

              for (const modelName of models) {
                try {
                  const configObj: any = { temperature };
                  if (responseMimeType) {
                    configObj.responseMimeType = responseMimeType;
                  }
                  if (systemInstruction) {
                    configObj.systemInstruction = systemInstruction;
                  }

                  const response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt,
                    config: configObj
                  });
                  if (response && response.text) {
                    resultText = response.text;
                    break;
                  }
                } catch (err) {
                  lastError = err;
                  console.warn(`Tentativa com ${modelName} falhou no servidor:`, err);
                }
              }

              if (resultText) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ text: resultText }));
              } else {
                res.statusCode = 502;
                res.end(JSON.stringify({ error: 'Todos os modelos de IA falharam', details: String(lastError) }));
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Erro interno ao processar requisição', details: err?.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiApiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/supabase-proxy': {
            target: 'https://dembhtmryutggifbpuka.supabase.co',
            changeOrigin: true,
            secure: false,
            rewrite: (p) => p.replace(/^\/supabase-proxy/, '')
          }
        }
      },
      plugins: [react(), tailwindcss(), versionPlugin()],
      define: {
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'global': 'globalThis',
        '__APP_BUILD_TIME__': JSON.stringify(buildTime),
        '__APP_VERSION__': JSON.stringify(appVersion),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

