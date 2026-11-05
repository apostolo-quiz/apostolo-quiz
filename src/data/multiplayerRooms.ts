// Sistema de Salas e Disputa em Grupo (Até 20 Amigos)
// Apóstolos - Quiz Bíblico

import { BASIC_KIDS_100_QUESTIONS } from './basicKidsQuestions';
import { MEDIUM_YOUTH_100_QUESTIONS } from './mediumYouthQuestions';
import { ADVANCED_ADULT_100_QUESTIONS } from './advancedAdultQuestions';
import { BIBLICAL_QUESTIONS } from './questions';

export interface RoomMember {
  userId: string;
  name: string;
  title: 'Irmão' | 'Irmã';
  avatarConfig?: any;
  photoUrl?: string;
  score: number;
  hasAnswered?: boolean;
  selectedOption?: number | null;
  isCorrect?: boolean;
  answerTimeSeconds?: number;
  readyForNext?: boolean;
  interruptedTime?: boolean;
  joinedAt: string;
}

export interface RoomChatMessage {
  id: string;
  userId: string;
  userName: string;
  userTitle: 'Irmão' | 'Irmã' | 'Administrador' | 'Moderador';
  userAvatar?: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
  isAdmin?: boolean;
  flagged?: boolean;
  flagCategory?: 'agressivo' | 'sexual' | 'assedio' | 'nocivo';
  flagReason?: string;
  originalText?: string;
}

export interface ModerationAlert {
  id: string;
  roomId: string;
  roomName: string;
  messageId: string;
  userId: string;
  userName: string;
  userTitle: string;
  originalText: string;
  category: 'agressivo' | 'sexual' | 'assedio' | 'nocivo';
  reason: string;
  severity: 'baixa' | 'media' | 'alta';
  createdAt: string;
  status: 'pending' | 'resolved' | 'dismissed';
  actionTaken?: string;
}

export interface RoomQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  reference: string;
  explanation?: string;
  xp: number;
}

export interface MultiplayerRoom {
  id: string;
  name: string; // Ex: "Herdeiros com Cristo"
  passcode: string; // Ex: "Nova Aliança"
  createdBy: string;
  createdByName: string;
  creatorTitle: 'Irmão' | 'Irmã';
  maxMembers: number; // Até 20 amigos
  members: RoomMember[];
  messages: RoomChatMessage[];
  status: 'waiting' | 'in_progress' | 'intermission' | 'finished';
  level: 'basico' | 'medio' | 'avancado';
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: RoomQuestion[];
  questionTimeLimit: number; // 60 segundos por questão (1 minuto)
  questionSecondsElapsed: number;
  questionExpiresAt?: number; // timestamp
  intermissionTimeLimit: number; // 20 segundos para começar a próxima questão
  intermissionSecondsElapsed: number;
  intermissionExpiresAt?: number;
  timeInterruptedBy: string | null; // Se algum membro interrompeu o tempo
  winnerName?: string;
  createdAt: string;
  lastActivity: string;
}

// Sorteia perguntas para a rodada da disputa
export function getRandomRoomQuestions(level: 'basico' | 'medio' | 'avancado' = 'basico', count: number = 10): RoomQuestion[] {
  let pool: any[] = [];
  if (level === 'medio') {
    pool = [...MEDIUM_YOUTH_100_QUESTIONS];
  } else if (level === 'avancado') {
    pool = [...ADVANCED_ADULT_100_QUESTIONS];
  } else {
    pool = [...BASIC_KIDS_100_QUESTIONS];
  }

  if (!pool || pool.length === 0) {
    pool = [...BIBLICAL_QUESTIONS];
  }

  // Embaralha aleatoriamente
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  return selected.map((q, idx) => ({
    id: q.id || idx + 1,
    question: q.question,
    options: q.options || [],
    correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    reference: q.reference || 'Bíblia Sagrada',
    explanation: q.explanation || '',
    xp: q.xp || 100
  }));
}

// Salas padrão para demonstração inicial caso o servidor esteja inicializando
export const INITIAL_ROOMS_DEMO: MultiplayerRoom[] = [
  {
    id: 'room_herdeiros_com_cristo',
    name: 'Herdeiros com Cristo',
    passcode: 'Nova Aliança',
    createdBy: 'system_creator_1',
    createdByName: 'Pastor Mateus',
    creatorTitle: 'Irmão',
    maxMembers: 20,
    members: [
      {
        userId: 'system_creator_1',
        name: 'Pastor Mateus',
        title: 'Irmão',
        score: 450,
        joinedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        userId: 'system_member_2',
        name: 'Diaconisa Sarah',
        title: 'Irmã',
        score: 380,
        joinedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      },
      {
        userId: 'system_member_3',
        name: 'Evangelista Lucas',
        title: 'Irmão',
        score: 520,
        joinedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      }
    ],
    messages: [
      {
        id: 'msg_welcome_1',
        userId: 'system_creator_1',
        userName: 'Pastor Mateus',
        userTitle: 'Irmão',
        text: 'A paz do Senhor a todos! Sejam muito bem-vindos à nossa sala Herdeiros com Cristo!',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        id: 'msg_welcome_2',
        userId: 'system_member_2',
        userName: 'Diaconisa Sarah',
        userTitle: 'Irmã',
        text: 'Amém pastor! Prontos para a disputa bíblica!',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ],
    status: 'waiting',
    level: 'basico',
    currentQuestionIndex: 0,
    totalQuestions: 10,
    questions: getRandomRoomQuestions('basico', 10),
    questionTimeLimit: 60,
    questionSecondsElapsed: 0,
    intermissionTimeLimit: 20,
    intermissionSecondsElapsed: 0,
    timeInterruptedBy: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    lastActivity: new Date().toISOString()
  }
];

// ==========================================
// CLIENT-SIDE STORAGE & API SYNC
// ==========================================

const ROOMS_STORAGE_KEY = 'apostolos_multiplayer_rooms_cache';

export function getStoredLocalRooms(): MultiplayerRoom[] {
  if (typeof window === 'undefined') return INITIAL_ROOMS_DEMO;
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return INITIAL_ROOMS_DEMO;
}

export function saveStoredLocalRooms(rooms: MultiplayerRoom[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    // Notifica outras abas ou componentes
    if (window.BroadcastChannel) {
      const bc = new BroadcastChannel('apostolos_rooms_sync');
      bc.postMessage({ type: 'ROOMS_UPDATED' });
      bc.close();
    }
  } catch (e) {}
}

export async function fetchRoomsClient(): Promise<Array<{
  id: string;
  name: string;
  createdBy: string;
  createdByName: string;
  creatorTitle: 'Irmão' | 'Irmã';
  membersCount: number;
  maxMembers: number;
  status: string;
  level: string;
  hasPasscode: boolean;
}>> {
  try {
    const res = await fetch('/api/rooms', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.rooms)) {
        return data.rooms;
      }
    }
  } catch (err) {}

  // Fallback local
  const local = getStoredLocalRooms();
  return local.map((r) => ({
    id: r.id,
    name: r.name,
    createdBy: r.createdBy,
    createdByName: r.createdByName,
    creatorTitle: r.creatorTitle,
    membersCount: (r.members || []).length,
    maxMembers: r.maxMembers || 20,
    status: r.status,
    level: r.level,
    hasPasscode: Boolean(r.passcode)
  }));
}

export async function getRoomClient(roomId: string): Promise<MultiplayerRoom | null> {
  try {
    const res = await fetch(`/api/rooms/${roomId}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.room) {
        // Atualiza cache local
        const current = getStoredLocalRooms();
        const idx = current.findIndex((r) => r.id === roomId);
        if (idx !== -1) {
          current[idx] = data.room;
        } else {
          current.unshift(data.room);
        }
        saveStoredLocalRooms(current);
        return data.room;
      }
    }
  } catch (err) {}

  // Fallback local
  const local = getStoredLocalRooms();
  const found = local.find((r) => r.id === roomId);
  return found || null;
}

export async function createRoomClient(data: {
  name: string;
  passcode: string;
  createdBy: string;
  createdByName: string;
  creatorTitle?: 'Irmão' | 'Irmã';
  level?: 'basico' | 'medio' | 'avancado';
  maxMembers?: number;
}): Promise<{ success: boolean; room?: MultiplayerRoom; message?: string }> {
  try {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.room) {
        const local = getStoredLocalRooms();
        local.unshift(json.room);
        saveStoredLocalRooms(local);
        return { success: true, room: json.room };
      }
    }
  } catch (err) {}

  // Fallback local caso offline
  const roomId = 'room_local_' + Date.now();
  const lvl = data.level || 'basico';
  const questions = getRandomRoomQuestions(lvl, 10);
  const newRoom: MultiplayerRoom = {
    id: roomId,
    name: data.name.trim(),
    passcode: data.passcode.trim(),
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    creatorTitle: data.creatorTitle || 'Irmão',
    maxMembers: Math.min(20, Math.max(2, data.maxMembers || 20)),
    members: [
      {
        userId: data.createdBy,
        name: data.createdByName,
        title: data.creatorTitle || 'Irmão',
        score: 0,
        joinedAt: new Date().toISOString()
      }
    ],
    messages: [
      {
        id: 'msg_' + Date.now(),
        userId: 'system',
        userName: 'Apóstolos Quiz',
        userTitle: 'Irmão',
        text: `Sala criada com sucesso! Palavra-chave: "${data.passcode.trim()}". Convide até 20 amigos!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }
    ],
    status: 'waiting',
    level: lvl,
    currentQuestionIndex: 0,
    totalQuestions: questions.length,
    questions,
    questionTimeLimit: 60,
    questionSecondsElapsed: 0,
    intermissionTimeLimit: 20,
    intermissionSecondsElapsed: 0,
    timeInterruptedBy: null,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  const current = getStoredLocalRooms();
  current.unshift(newRoom);
  saveStoredLocalRooms(current);

  return { success: true, room: newRoom };
}

export async function joinRoomClient(
  roomId: string,
  passcode: string,
  member: {
    userId: string;
    name: string;
    title: 'Irmão' | 'Irmã';
    photoUrl?: string;
    avatarConfig?: any;
    userEmail?: string;
  }
): Promise<{ success: boolean; room?: MultiplayerRoom; message?: string }> {
  try {
    const res = await fetch(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode, member, userEmail: member.userEmail })
    });
    const json = await res.json();
    if (res.ok && json.success && json.room) {
      const current = getStoredLocalRooms();
      const idx = current.findIndex((r) => r.id === roomId);
      if (idx !== -1) current[idx] = json.room;
      else current.unshift(json.room);
      saveStoredLocalRooms(current);
      return { success: true, room: json.room };
    } else {
      return { success: false, message: json.message || 'Palavra-chave incorreta!' };
    }
  } catch (err) {}

  // Fallback local
  const current = getStoredLocalRooms();
  const room = current.find((r) => r.id === roomId);
  if (!room) return { success: false, message: 'Grupo não encontrado.' };

  const cleanInput = (passcode || '').trim().toLowerCase();
  const cleanTarget = (room.passcode || '').trim().toLowerCase();

  if (cleanInput !== cleanTarget) {
    return {
      success: false,
      message: `Palavra-chave incorreta! Peça a palavra-chave correta ao criador do grupo.`
    };
  }

  const already = room.members.find((m) => m.userId === member.userId);
  if (!already && room.members.length >= (room.maxMembers || 20)) {
    return {
      success: false,
      message: `Este grupo já atingiu o limite de ${room.maxMembers || 20} amigos.`
    };
  }

  if (!already) {
    room.members.push({
      userId: member.userId,
      name: member.name,
      title: member.title || 'Irmão',
      photoUrl: member.photoUrl,
      avatarConfig: member.avatarConfig,
      score: 0,
      joinedAt: new Date().toISOString()
    });
    room.messages.push({
      id: 'msg_join_' + Date.now(),
      userId: 'system',
      userName: 'Apóstolos Quiz',
      userTitle: 'Irmão',
      text: `🔔 ${member.title} ${member.name} entrou no grupo!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    });
    saveStoredLocalRooms(current);
  }

  return { success: true, room };
}

export async function sendRoomMessageClient(
  roomId: string,
  message: {
    userId: string;
    userName: string;
    userTitle: 'Irmão' | 'Irmã' | 'Administrador' | 'Moderador';
    text: string;
    userAvatar?: string;
    userEmail?: string;
  }
): Promise<{ success: boolean; messages?: RoomChatMessage[]; message?: string }> {
  try {
    const res = await fetch(`/api/rooms/${roomId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send_message', payload: message })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.messages) {
        return { success: true, messages: json.messages };
      }
    }
  } catch (err) {}

  // Fallback local
  const current = getStoredLocalRooms();
  const room = current.find((r) => r.id === roomId);
  if (!room) return { success: false, message: 'Sala não encontrada' };

  const newMsg: RoomChatMessage = {
    id: 'msg_' + Date.now(),
    userId: message.userId,
    userName: message.userName,
    userTitle: message.userTitle || 'Irmão',
    userAvatar: message.userAvatar,
    text: message.text.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  room.messages.push(newMsg);
  saveStoredLocalRooms(current);
  return { success: true, messages: room.messages };
}

export async function performRoomActionClient(
  roomId: string,
  action: 'start_game' | 'interrupt_timer' | 'answer_question' | 'start_next_question' | 'restart_game',
  payload: any
): Promise<{ success: boolean; room?: MultiplayerRoom; message?: string }> {
  try {
    const res = await fetch(`/api/rooms/${roomId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.room) {
        const current = getStoredLocalRooms();
        const idx = current.findIndex((r) => r.id === roomId);
        if (idx !== -1) current[idx] = json.room;
        saveStoredLocalRooms(current);
        return { success: true, room: json.room };
      }
    }
  } catch (err) {}

  // Fallback local
  const current = getStoredLocalRooms();
  const room = current.find((r) => r.id === roomId);
  if (!room) return { success: false, message: 'Sala não encontrada' };

  const now = Date.now();
  if (action === 'start_game') {
    room.status = 'in_progress';
    room.currentQuestionIndex = 0;
    room.questionExpiresAt = now + room.questionTimeLimit * 1000;
    room.questionSecondsElapsed = 0;
    room.timeInterruptedBy = null;
    room.members.forEach((m) => {
      m.score = 0;
      m.hasAnswered = false;
      m.selectedOption = null;
      m.isCorrect = undefined;
      m.readyForNext = false;
      m.interruptedTime = false;
    });
  } else if (action === 'interrupt_timer') {
    room.timeInterruptedBy = payload.userName || 'Um irmão do grupo';
    room.status = 'intermission';
    room.intermissionExpiresAt = now + room.intermissionTimeLimit * 1000;
    room.intermissionSecondsElapsed = 0;
  } else if (action === 'answer_question') {
    const member = room.members.find((m) => m.userId === payload.userId);
    if (member && !member.hasAnswered) {
      const q = room.questions[room.currentQuestionIndex];
      member.hasAnswered = true;
      member.selectedOption = payload.selectedOption;
      member.isCorrect = payload.selectedOption === q.correctIndex;
      if (member.isCorrect) {
        member.score += (q.xp || 100);
      }
      if (room.members.every((m) => m.hasAnswered)) {
        room.status = 'intermission';
        room.intermissionExpiresAt = now + room.intermissionTimeLimit * 1000;
        room.intermissionSecondsElapsed = 0;
      }
    }
  } else if (action === 'start_next_question') {
    if (room.currentQuestionIndex + 1 >= room.totalQuestions) {
      room.status = 'finished';
      const sorted = [...room.members].sort((a, b) => b.score - a.score);
      room.winnerName = sorted[0]?.name || '';
    } else {
      room.currentQuestionIndex += 1;
      room.status = 'in_progress';
      room.questionExpiresAt = now + room.questionTimeLimit * 1000;
      room.questionSecondsElapsed = 0;
      room.timeInterruptedBy = null;
      room.members.forEach((m) => {
        m.hasAnswered = false;
        m.selectedOption = null;
        m.isCorrect = undefined;
        m.readyForNext = false;
        m.interruptedTime = false;
      });
    }
  }

  saveStoredLocalRooms(current);
  return { success: true, room };
}

