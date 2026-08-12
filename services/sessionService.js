import {
  createFrenchSession,
  finishFrenchSession,
  getState,
  setState,
} from "../database/db";

function makeSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function startFrenchSession() {
  const existing = await getState("active_session_id", null);
  if (existing) return existing;

  const sessionId = makeSessionId();
  await createFrenchSession(sessionId, Date.now());
  await setState("active_session_id", sessionId);
  return sessionId;
}

export async function finishActiveFrenchSession() {
  const sessionId = await getState("active_session_id", null);
  if (!sessionId) return;
  await finishFrenchSession(sessionId, Date.now());
  await setState("active_session_id", null);
}

export async function getActiveSessionId() {
  return getState("active_session_id", null);
}
