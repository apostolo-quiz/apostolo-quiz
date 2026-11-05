import fs from 'fs/promises';
import path from 'path';
import { UserProfile, ChurchRecord, PaymentTransaction, ADMIN_MASTER_EMAIL, isUserAdmin } from '@/data/db';
import { getSupabase } from '@/lib/supabase';
import { MultiplayerRoom, RoomMember, RoomChatMessage, ModerationAlert, getRandomRoomQuestions, INITIAL_ROOMS_DEMO } from '@/data/multiplayerRooms';
import { analyzeMessageContent } from '@/data/contentModerator';

export interface ServerQuizProgress {
  userId: string;
  userName?: string;
  completedModules: number[];
  score: number;
  currentLevel: 'basico' | 'medio' | 'avancado';
  selectedModuleId: number;
  lastUpdated: string;
}

export interface ServerDatabaseSchema {
  users: UserProfile[];
  quizProgress: Record<string, ServerQuizProgress>;
  churches: ChurchRecord[];
  transactions: PaymentTransaction[];
  rooms?: MultiplayerRoom[];
  moderationAlerts?: ModerationAlert[];
  lastSavedAt: string;
}

const DB_DIR = path.join(process.cwd(), 'server-data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Garante que o arquivo de banco de dados exista no servidor (fallback local)
async function ensureDb(): Promise<ServerDatabaseSchema> {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    try {
      const data = await fs.readFile(DB_FILE, 'utf-8');
      const parsed: ServerDatabaseSchema = JSON.parse(data);
      if (!parsed.users) parsed.users = [];
      if (!parsed.quizProgress) parsed.quizProgress = {};
      if (!parsed.churches) parsed.churches = [];
      if (!parsed.transactions) parsed.transactions = [];
      if (!parsed.rooms || parsed.rooms.length === 0) parsed.rooms = [...INITIAL_ROOMS_DEMO];
      if (!parsed.moderationAlerts) parsed.moderationAlerts = [];
      return parsed;
    } catch {
      const initial: ServerDatabaseSchema = {
        users: [],
        quizProgress: {},
        churches: [],
        transactions: [],
        rooms: [...INITIAL_ROOMS_DEMO],
        moderationAlerts: [],
        lastSavedAt: new Date().toISOString()
      };
      await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
  } catch (err) {
    console.error('Erro ao inicializar banco de dados local:', err);
    return {
      users: [],
      quizProgress: {},
      churches: [],
      transactions: [],
      lastSavedAt: new Date().toISOString()
    };
  }
}

// Salva dados no arquivo JSON local de forma segura (fallback)
async function writeDb(db: ServerDatabaseSchema): Promise<void> {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    db.lastSavedAt = new Date().toISOString();
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao escrever no banco local:', err);
  }
}

// ==========================================
// OPERAÇÕES DE DADOS PESSOAIS (USUÁRIO)
// ==========================================

export async function saveUserProfileServer(profile: UserProfile): Promise<UserProfile> {
  const updatedProfile: UserProfile = {
    ...profile,
    registeredAt: profile.registeredAt || new Date().toISOString()
  };

  // 1. Persistência em Nuvem via Supabase (PostgreSQL)
  const sb = getSupabase();
  if (sb) {
    try {
      const row = {
        id: updatedProfile.id,
        name: updatedProfile.name,
        gender: updatedProfile.gender || 'male',
        title: updatedProfile.title || (updatedProfile.gender === 'female' ? 'Irmã' : 'Irmão'),
        email: updatedProfile.email || null,
        photo_url: updatedProfile.photoUrl || null,
        avatar_config: updatedProfile.avatarConfig || null,
        birth_date: updatedProfile.birthDate || null,
        age: updatedProfile.age || null,
        cep: updatedProfile.cep || null,
        street: updatedProfile.street || null,
        neighborhood: updatedProfile.neighborhood || null,
        city: updatedProfile.city || null,
        state: updatedProfile.state || null,
        church_name: updatedProfile.churchName || null,
        ministry: updatedProfile.ministry || null,
        is_vip: Boolean(updatedProfile.isVip),
        registered_at: updatedProfile.registeredAt
      };
      await sb.from('profiles').upsert(row, { onConflict: 'id' });
    } catch (err) {
      console.error('[SUPABASE PROFILE SAVE ERROR]', err);
    }
  }

  // 2. Fallback de cache local
  try {
    const db = await ensureDb();
    const idx = db.users.findIndex(
      (u) =>
        u.id === profile.id ||
        (profile.email && u.email?.toLowerCase() === profile.email.toLowerCase())
    );

    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...updatedProfile };
    } else {
      db.users.push(updatedProfile);
    }

    await writeDb(db);
  } catch (e) {}

  return updatedProfile;
}

export async function getUserProfileServer(
  userId?: string,
  email?: string
): Promise<UserProfile | null> {
  // 1. Tenta buscar no Supabase
  const sb = getSupabase();
  if (sb) {
    try {
      let query = sb.from('profiles').select('*');
      if (userId) {
        query = query.eq('id', userId);
      } else if (email) {
        query = query.eq('email', email.toLowerCase().trim());
      } else {
        query = query.order('registered_at', { ascending: false }).limit(1);
      }

      const { data, error } = await query.maybeSingle();
      if (data && !error) {
        return {
          id: data.id,
          name: data.name,
          gender: data.gender || 'male',
          title: data.title || (data.gender === 'female' ? 'Irmã' : 'Irmão'),
          email: data.email || '',
          photoUrl: data.photo_url || '',
          avatarConfig: data.avatar_config || undefined,
          birthDate: data.birth_date || '',
          age: data.age || 30,
          cep: data.cep || '',
          street: data.street || '',
          neighborhood: data.neighborhood || '',
          city: data.city || 'Santo André',
          state: data.state || 'SP',
          churchName: data.church_name || '',
          ministry: data.ministry || 'Membro',
          isVip: Boolean(data.is_vip),
          registeredAt: data.registered_at || new Date().toISOString()
        };
      }
    } catch (err) {
      console.error('[SUPABASE PROFILE GET ERROR]', err);
    }
  }

  // 2. Fallback para banco local
  try {
    const db = await ensureDb();
    if (userId) {
      const found = db.users.find((u) => u.id === userId);
      if (found) return found;
    }
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const found = db.users.find((u) => u.email?.toLowerCase().trim() === cleanEmail);
      if (found) return found;
    }
    return db.users.length > 0 ? db.users[db.users.length - 1] : null;
  } catch (e) {
    return null;
  }
}

// ==========================================
// OPERAÇÕES DE PROGRESSO DO QUIZ BÍBLICO
// ==========================================

export async function saveQuizProgressServer(
  userId: string,
  progress: {
    completedModules: number[];
    score: number;
    currentLevel?: 'basico' | 'medio' | 'avancado';
    selectedModuleId?: number;
    userName?: string;
  }
): Promise<ServerQuizProgress> {
  const key = userId || 'user_default';
  const incomingMods = Array.isArray(progress.completedModules) ? progress.completedModules : [];

  const updated: ServerQuizProgress = {
    userId: key,
    userName: progress.userName || '',
    completedModules: incomingMods,
    score: Number(progress.score) || 0,
    currentLevel: progress.currentLevel || 'basico',
    selectedModuleId: Number(progress.selectedModuleId) || 1,
    lastUpdated: new Date().toISOString()
  };

  // 1. Persistência em Nuvem no Supabase
  const sb = getSupabase();
  if (sb) {
    try {
      const row = {
        user_id: key,
        user_name: updated.userName || null,
        completed_modules: updated.completedModules,
        score: updated.score,
        current_level: updated.currentLevel,
        selected_module_id: updated.selectedModuleId,
        last_updated: updated.lastUpdated
      };
      await sb.from('quiz_progress').upsert(row, { onConflict: 'user_id' });
    } catch (err) {
      console.error('[SUPABASE PROGRESS SAVE ERROR]', err);
    }
  }

  // 2. Fallback local
  try {
    const db = await ensureDb();
    const existing = db.quizProgress[key] || {
      userId: key,
      userName: progress.userName || '',
      completedModules: [],
      score: 0,
      currentLevel: 'basico',
      selectedModuleId: 1,
      lastUpdated: new Date().toISOString()
    };

    updated.completedModules = Array.from(new Set([...existing.completedModules, ...incomingMods]));
    updated.score = Math.max(existing.score, updated.score);

    db.quizProgress[key] = updated;
    await writeDb(db);
  } catch (e) {}

  return updated;
}

export async function getQuizProgressServer(userId?: string): Promise<ServerQuizProgress | null> {
  const key = userId || 'user_default';

  // 1. Tenta buscar no Supabase
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('quiz_progress')
        .select('*')
        .eq('user_id', key)
        .maybeSingle();

      if (data && !error) {
        return {
          userId: data.user_id,
          userName: data.user_name || undefined,
          completedModules: Array.isArray(data.completed_modules) ? data.completed_modules : [],
          score: Number(data.score) || 0,
          currentLevel: data.current_level || 'basico',
          selectedModuleId: Number(data.selected_module_id) || 1,
          lastUpdated: data.last_updated || new Date().toISOString()
        };
      }
    } catch (err) {
      console.error('[SUPABASE PROGRESS GET ERROR]', err);
    }
  }

  // 2. Fallback local
  try {
    const db = await ensureDb();
    if (db.quizProgress[key]) {
      return db.quizProgress[key];
    }
    const keys = Object.keys(db.quizProgress);
    if (keys.length > 0) {
      return db.quizProgress[keys[0]];
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Retorna resumo estatístico geral para painel administrativo
export async function getServerStats() {
  try {
    const db = await ensureDb();
    return {
      totalUsers: db.users.length,
      users: db.users.map((u) => ({
        id: u.id,
        name: u.name,
        title: u.title,
        church: u.churchName,
        city: `${u.city}-${u.state}`,
        isVip: u.isVip,
        registeredAt: u.registeredAt
      })),
      progressRecords: Object.values(db.quizProgress),
      totalCompletedModulesOverall: Object.values(db.quizProgress).reduce(
        (acc, p) => acc + p.completedModules.length,
        0
      ),
      lastSavedAt: db.lastSavedAt
    };
  } catch (e) {
    return { totalUsers: 0, users: [], progressRecords: [], totalCompletedModulesOverall: 0, lastSavedAt: '' };
  }
}

// ==========================================
// SISTEMA DE RANQUEAMENTO (LEADERBOARD)
// ==========================================

export interface ServerLeaderboardEntry {
  userId: string;
  userName: string;
  title: 'Irmão' | 'Irmã';
  churchName: string;
  city: string;
  state: string;
  score: number;
  grade: number; // Nota de 0 a 10
  completedModulesCount: number;
  currentLevel: 'basico' | 'medio' | 'avancado';
  avatarConfig?: any;
  photoUrl?: string;
  lastUpdated: string;
  rank?: number;
}

const INITIAL_LEADERBOARD_SEEDS: ServerLeaderboardEntry[] = [
  {
    userId: 'seed_1',
    userName: 'Samuel Oliveira',
    title: 'Irmão',
    churchName: 'Assembleia de Deus',
    city: 'Belo Horizonte',
    state: 'MG',
    score: 3420,
    grade: 9.9,
    completedModulesCount: 22,
    currentLevel: 'avancado',
    photoUrl: '/avatar_pardo_masc_adulto.jpg',
    lastUpdated: '2026-11-03T14:30:00Z'
  },
  {
    userId: 'seed_2',
    userName: 'Débora Santos',
    title: 'Irmã',
    churchName: 'Igreja Batista Memorial',
    city: 'Salvador',
    state: 'BA',
    score: 3150,
    grade: 9.8,
    completedModulesCount: 19,
    currentLevel: 'avancado',
    photoUrl: '/avatar_preto_fem_jovem.jpg',
    lastUpdated: '2026-11-03T13:15:00Z'
  },
  {
    userId: 'seed_3',
    userName: 'Lucas Alencar',
    title: 'Irmão',
    churchName: 'Congregação Cristã',
    city: 'Curitiba',
    state: 'PR',
    score: 2890,
    grade: 9.6,
    completedModulesCount: 16,
    currentLevel: 'medio',
    photoUrl: '/avatar_branco_masc_jovem.jpg',
    lastUpdated: '2026-11-03T11:45:00Z'
  },
  {
    userId: 'seed_4',
    userName: 'Raquel Ferreira',
    title: 'Irmã',
    churchName: 'Igreja Presbiteriana',
    city: 'São Paulo',
    state: 'SP',
    score: 2640,
    grade: 9.5,
    completedModulesCount: 14,
    currentLevel: 'medio',
    photoUrl: '/avatar_pardo_fem_adulto.jpg',
    lastUpdated: '2026-11-03T10:00:00Z'
  },
  {
    userId: 'seed_5',
    userName: 'Davi Guarani',
    title: 'Irmão',
    churchName: 'Missão Indígena da Fé',
    city: 'Dourados',
    state: 'MS',
    score: 2380,
    grade: 9.3,
    completedModulesCount: 11,
    currentLevel: 'basico',
    photoUrl: '/avatar_indigena_masc_jovem.jpg',
    lastUpdated: '2026-11-03T09:20:00Z'
  },
  {
    userId: 'seed_6',
    userName: 'Naomi Tanaka',
    title: 'Irmã',
    churchName: 'Igreja Quadrangular',
    city: 'Maringá',
    state: 'PR',
    score: 2110,
    grade: 9.1,
    completedModulesCount: 9,
    currentLevel: 'basico',
    photoUrl: '/avatar_amarelo_fem_jovem.jpg',
    lastUpdated: '2026-11-03T08:10:00Z'
  }
];

export async function getLeaderboardServer(): Promise<ServerLeaderboardEntry[]> {
  try {
    const db = await ensureDb();
    const usersMap = new Map<string, UserProfile>();
    db.users.forEach((u) => {
      usersMap.set(u.id, u);
      if (u.email) usersMap.set(u.email.toLowerCase(), u);
    });

    const entriesMap = new Map<string, ServerLeaderboardEntry>();

    // Carrega sementes iniciais para garantir ranking vibrante
    INITIAL_LEADERBOARD_SEEDS.forEach((seed) => {
      entriesMap.set(seed.userId, { ...seed });
    });

    // Mescla usuários reais registrados no banco de dados
    const progressList = Object.values(db.quizProgress);
    progressList.forEach((p) => {
      const u = usersMap.get(p.userId);
      const name = p.userName || u?.name || 'Irmão em Comunhão';
      const title: 'Irmão' | 'Irmã' =
        u?.title || (u?.gender === 'female' ? 'Irmã' : 'Irmão');

      // Calcula nota teológica de 0 a 10 com base nos módulos e score
      const calcGrade = Math.min(10, Math.max(1.0, Number((p.score / 350).toFixed(1))));

      entriesMap.set(p.userId, {
        userId: p.userId,
        userName: name,
        title,
        churchName: u?.churchName || 'Igreja do Senhor',
        city: u?.city || 'Brasil',
        state: u?.state || 'BR',
        score: p.score,
        grade: calcGrade,
        completedModulesCount: p.completedModules.length,
        currentLevel: p.currentLevel || 'basico',
        avatarConfig: u?.avatarConfig,
        photoUrl: u?.photoUrl,
        lastUpdated: p.lastUpdated
      });
    });

    // Ordena por pontuação decrescente
    const sorted = Array.from(entriesMap.values()).sort((a, b) => b.score - a.score);

    // Atribui posições (1º, 2º, 3º...)
    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  } catch (err) {
    console.error('[LEADERBOARD ERROR]', err);
    return INITIAL_LEADERBOARD_SEEDS.map((s, i) => ({ ...s, rank: i + 1 }));
  }
}

// ==========================================
// SALAS DE DISPUTA EM GRUPO (ATÉ 20 AMIGOS)
// ==========================================

export async function getRoomsServer(): Promise<MultiplayerRoom[]> {
  const db = await ensureDb();
  if (!db.rooms) db.rooms = [...INITIAL_ROOMS_DEMO];
  return db.rooms;
}

export async function getRoomByIdServer(roomId: string): Promise<MultiplayerRoom | null> {
  const db = await ensureDb();
  if (!db.rooms) db.rooms = [...INITIAL_ROOMS_DEMO];
  const room = db.rooms.find((r) => r.id === roomId);
  if (!room) return null;

  const now = Date.now();
  if (room.status === 'in_progress' && room.questionExpiresAt) {
    const diff = Math.max(0, Math.ceil((room.questionExpiresAt - now) / 1000));
    room.questionSecondsElapsed = Math.max(0, room.questionTimeLimit - diff);
    // Se 1 minuto zerou:
    if (diff <= 0) {
      room.status = 'intermission';
      room.intermissionExpiresAt = now + room.intermissionTimeLimit * 1000;
      room.intermissionSecondsElapsed = 0;
      await writeDb(db);
    }
  } else if (room.status === 'intermission' && room.intermissionExpiresAt) {
    const diff = Math.max(0, Math.ceil((room.intermissionExpiresAt - now) / 1000));
    room.intermissionSecondsElapsed = Math.max(0, room.intermissionTimeLimit - diff);
    // Se 20 segundos zeraram: inicia próxima questão automaticamente
    if (diff <= 0) {
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
      await writeDb(db);
    }
  }

  return room;
}

export async function createRoomServer(data: {
  name: string;
  passcode: string;
  createdBy: string;
  createdByName: string;
  creatorTitle?: 'Irmão' | 'Irmã';
  level?: 'basico' | 'medio' | 'avancado';
  maxMembers?: number;
}): Promise<MultiplayerRoom> {
  const db = await ensureDb();
  if (!db.rooms) db.rooms = [];

  const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const lvl = data.level || 'basico';
  const questions = getRandomRoomQuestions(lvl, 10);

  const initialMember: RoomMember = {
    userId: data.createdBy,
    name: data.createdByName,
    title: data.creatorTitle || 'Irmão',
    score: 0,
    joinedAt: new Date().toISOString()
  };

  const newRoom: MultiplayerRoom = {
    id: roomId,
    name: data.name.trim(),
    passcode: data.passcode.trim(),
    createdBy: data.createdBy,
    createdByName: data.createdByName,
    creatorTitle: data.creatorTitle || 'Irmão',
    maxMembers: Math.min(20, Math.max(2, data.maxMembers || 20)),
    members: [initialMember],
    messages: [
      {
        id: 'msg_init_' + Date.now(),
        userId: 'system',
        userName: 'Apóstolos Quiz',
        userTitle: 'Irmão',
        text: `Sala criada com sucesso! Palavra-chave definida: "${data.passcode.trim()}". Compartilhe com até 20 amigos para disputarem juntos!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      }
    ],
    status: 'waiting',
    level: lvl,
    currentQuestionIndex: 0,
    totalQuestions: questions.length,
    questions,
    questionTimeLimit: 60, // 1 minuto
    questionSecondsElapsed: 0,
    intermissionTimeLimit: 20, // 20 segundos
    intermissionSecondsElapsed: 0,
    timeInterruptedBy: null,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };

  db.rooms.unshift(newRoom);
  await writeDb(db);
  return newRoom;
}

export async function joinRoomServer(
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
  const db = await ensureDb();
  if (!db.rooms) db.rooms = [...INITIAL_ROOMS_DEMO];

  // Verifica se o usuário está banido
  const targetUser = db.users.find(
    (u) => u.id === member.userId || (member.userEmail && u.email?.toLowerCase() === member.userEmail.toLowerCase())
  );
  if (targetUser?.isBanned) {
    return {
      success: false,
      message: `Acesso negado: Seu usuário está suspenso por infração às diretrizes comunitárias.`
    };
  }

  const room = db.rooms.find((r) => r.id === roomId);
  if (!room) {
    return { success: false, message: 'Grupo não encontrado.' };
  }

  // Verifica se o usuário é o Administrador do Sistema (edi.ben.jr@gmail.com)
  const isMasterAdmin =
    targetUser?.email?.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase() ||
    member.userEmail?.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase() ||
    targetUser?.isAdmin === true;

  // Validação da Palavra-Chave (se for Administrador Mestre, concede acesso direto)
  if (!isMasterAdmin) {
    const cleanInput = (passcode || '').trim().toLowerCase();
    const cleanTarget = (room.passcode || '').trim().toLowerCase();

    if (cleanInput !== cleanTarget) {
      return {
        success: false,
        message: `Palavra-chave incorreta! Digite a palavra-chave definida pelo criador do grupo.`
      };
    }
  }

  // Verifica limite de 20 membros
  const alreadyMember = room.members.find((m) => m.userId === member.userId);
  if (!alreadyMember && room.members.length >= (room.maxMembers || 20) && !isMasterAdmin) {
    return {
      success: false,
      message: `Este grupo já atingiu o limite máximo de ${room.maxMembers || 20} amigos.`
    };
  }

  if (!alreadyMember) {
    const newMember: RoomMember = {
      userId: member.userId,
      name: isMasterAdmin ? `${member.name} (Admin)` : member.name,
      title: isMasterAdmin ? 'Irmão' : (member.title || 'Irmão'),
      photoUrl: member.photoUrl,
      avatarConfig: member.avatarConfig,
      score: 0,
      joinedAt: new Date().toISOString()
    };
    room.members.push(newMember);

    // Mensagem de sistema avisando a chegada do irmão ou admin
    room.messages.push({
      id: 'msg_join_' + Date.now(),
      userId: 'system',
      userName: 'Apóstolos Quiz',
      userTitle: 'Irmão',
      text: isMasterAdmin
        ? `🛡️ O Administrador do Sistema entrou na sala com acesso de supervisão.`
        : `🔔 ${member.title} ${member.name} entrou no grupo! Bem-vindo à disputa.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    });
  } else {
    // Atualiza dados caso o perfil tenha mudado
    alreadyMember.name = isMasterAdmin ? `${member.name} (Admin)` : member.name;
    alreadyMember.title = member.title;
    if (member.photoUrl) alreadyMember.photoUrl = member.photoUrl;
    if (member.avatarConfig) alreadyMember.avatarConfig = member.avatarConfig;
  }

  room.lastActivity = new Date().toISOString();
  await writeDb(db);
  return { success: true, room };
}

export async function sendRoomMessageServer(
  roomId: string,
  message: {
    userId: string;
    userName: string;
    userTitle: 'Irmão' | 'Irmã' | 'Administrador';
    text: string;
    userAvatar?: string;
    userEmail?: string;
  }
): Promise<{ success: boolean; messages?: RoomChatMessage[]; message?: string; alertTriggered?: boolean }> {
  const db = await ensureDb();
  if (!db.rooms) return { success: false, message: 'Nenhuma sala disponível.' };

  // Verifica se o usuário está banido
  const senderUser = db.users.find(
    (u) => u.id === message.userId || (message.userEmail && u.email?.toLowerCase() === message.userEmail.toLowerCase())
  );
  if (senderUser?.isBanned) {
    return {
      success: false,
      message: 'Você foi suspenso pela moderação e não pode enviar mensagens.'
    };
  }

  const room = db.rooms.find((r) => r.id === roomId);
  if (!room) return { success: false, message: 'Sala não encontrada.' };

  const isMasterAdmin =
    senderUser?.email?.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase() ||
    message.userEmail?.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase() ||
    senderUser?.isAdmin === true;

  const isMember = room.members.some((m) => m.userId === message.userId);
  if (!isMember && !isMasterAdmin) {
    return { success: false, message: 'Apenas membros da sala podem enviar mensagens neste chat.' };
  }

  // Análise de moderação do conteúdo
  const analysis = analyzeMessageContent(message.text);
  let finalMessageText = message.text.trim();
  let alertTriggered = false;

  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  if (analysis.isViolating) {
    alertTriggered = true;
    finalMessageText = analysis.censoredText;

    // Registra Alerta de Moderação para o Administrador edi.ben.jr@gmail.com
    const alert: ModerationAlert = {
      id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      roomId: room.id,
      roomName: room.name,
      messageId: msgId,
      userId: message.userId,
      userName: message.userName,
      userTitle: message.userTitle || 'Irmão',
      originalText: message.text.trim(),
      category: analysis.category || 'nocivo',
      reason: analysis.reason || 'Conteúdo impróprio',
      severity: analysis.severity,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    if (!db.moderationAlerts) db.moderationAlerts = [];
    db.moderationAlerts.unshift(alert);
    console.warn(`[MODERAÇÃO ALERTA] Violação na sala "${room.name}" por ${message.userName}: ${analysis.reason}`);
  }

  const newMsg: RoomChatMessage = {
    id: msgId,
    userId: message.userId,
    userName: isMasterAdmin ? `${message.userName} 🛡️` : message.userName,
    userTitle: isMasterAdmin ? 'Administrador' : (message.userTitle || 'Irmão'),
    userAvatar: message.userAvatar,
    text: finalMessageText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isAdmin: isMasterAdmin,
    flagged: analysis.isViolating,
    flagCategory: analysis.category,
    flagReason: analysis.reason,
    originalText: analysis.isViolating ? message.text.trim() : undefined
  };

  room.messages.push(newMsg);
  // Mantém histórico das últimas 100 mensagens da sala
  if (room.messages.length > 100) {
    room.messages = room.messages.slice(-100);
  }

  room.lastActivity = new Date().toISOString();
  await writeDb(db);
  return { success: true, messages: room.messages, alertTriggered };
}

// ==========================================
// SERVIÇOS DO ADMINISTRADOR DO SISTEMA
// ==========================================

export async function getAdminOverviewServer(adminEmail: string) {
  const db = await ensureDb();
  const normalizedEmail = (adminEmail || '').trim().toLowerCase();

  // Garante que edi.ben.jr@gmail.com sempre tenha privilégios totais de admin
  if (normalizedEmail === ADMIN_MASTER_EMAIL.toLowerCase()) {
    const adminUser = db.users.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (adminUser) {
      adminUser.isAdmin = true;
      adminUser.role = 'admin';
    }
  }

  const alerts = db.moderationAlerts || [];
  const rooms = db.rooms || [];
  const users = db.users || [];

  return {
    success: true,
    alerts,
    rooms,
    users,
    stats: {
      totalUsers: users.length,
      totalRooms: rooms.length,
      pendingAlerts: alerts.filter((a) => a.status === 'pending').length
    }
  };
}

export async function performAdminActionServer(
  action: string,
  payload: any,
  adminEmail: string
): Promise<{ success: boolean; message?: string; data?: any }> {
  const db = await ensureDb();
  const normalizedEmail = (adminEmail || '').trim().toLowerCase();

  const isAdmin =
    normalizedEmail === ADMIN_MASTER_EMAIL.toLowerCase() ||
    db.users.some((u) => u.email?.toLowerCase() === normalizedEmail && (u.isAdmin || u.role === 'admin'));

  if (!isAdmin) {
    return { success: false, message: 'Permissão negada: Apenas o Administrador do Sistema pode executar esta ação.' };
  }

  if (!db.moderationAlerts) db.moderationAlerts = [];
  if (!db.rooms) db.rooms = [];

  switch (action) {
    // 1. Resolver Alerta de Moderação
    case 'resolve_alert': {
      const alert = db.moderationAlerts.find((a) => a.id === payload.alertId);
      if (alert) {
        alert.status = 'resolved';
        alert.actionTaken = payload.actionTaken || 'Resolvido pelo Administrador';
        await writeDb(db);
        return { success: true, message: 'Alerta marcado como resolvido com sucesso.' };
      }
      return { success: false, message: 'Alerta não encontrado.' };
    }

    // 2. Dispensar Alerta (Falso Positivo)
    case 'dismiss_alert': {
      const alert = db.moderationAlerts.find((a) => a.id === payload.alertId);
      if (alert) {
        alert.status = 'dismissed';
        alert.actionTaken = 'Dispensado (Falso Positivo)';
        await writeDb(db);
        return { success: true, message: 'Alerta dispensado.' };
      }
      return { success: false, message: 'Alerta não encontrado.' };
    }

    // 3. Apagar Mensagem da Sala
    case 'delete_message': {
      const { roomId, messageId } = payload;
      const room = db.rooms.find((r) => r.id === roomId);
      if (room) {
        room.messages = room.messages.filter((m) => m.id !== messageId);
        // Atualiza alerta correspondente se houver
        const alert = db.moderationAlerts.find((a) => a.messageId === messageId);
        if (alert) {
          alert.status = 'resolved';
          alert.actionTaken = 'Mensagem apagada pelo Administrador';
        }
        await writeDb(db);
        return { success: true, message: 'Mensagem apagada com sucesso da sala.' };
      }
      return { success: false, message: 'Sala não encontrada.' };
    }

    // 4. Advertir Usuário
    case 'warn_user': {
      const { roomId, userId, userName, reason } = payload;
      const room = db.rooms.find((r) => r.id === roomId);
      if (room) {
        room.messages.push({
          id: 'msg_warn_' + Date.now(),
          userId: 'system',
          userName: '🛡️ Moderação do Sistema',
          userTitle: 'Administrador',
          text: `⚠️ ADVERTÊNCIA FORMAL para ${userName}: ${reason || 'Comportamento inadequado. Mantenha a santidade e respeito no chat bíblico.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
        await writeDb(db);
        return { success: true, message: `Advertência enviada para ${userName}.` };
      }
      return { success: false, message: 'Sala não encontrada.' };
    }

    // 5. Expulsar Membro da Sala
    case 'kick_member': {
      const { roomId, userId } = payload;
      const room = db.rooms.find((r) => r.id === roomId);
      if (room) {
        const removed = room.members.find((m) => m.userId === userId);
        room.members = room.members.filter((m) => m.userId !== userId);
        room.messages.push({
          id: 'msg_kick_' + Date.now(),
          userId: 'system',
          userName: '🛡️ Moderação do Sistema',
          userTitle: 'Administrador',
          text: `🚪 ${removed?.name || 'Um participante'} foi removido da sala pela moderação.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
        await writeDb(db);
        return { success: true, message: 'Membro expulso da sala.' };
      }
      return { success: false, message: 'Sala não encontrada.' };
    }

    // 6. Banir Usuário do Sistema
    case 'ban_user': {
      const { userId, reason } = payload;
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        user.isBanned = true;
        user.banReason = reason || 'Violação recorrente das diretrizes comunitárias';
      }
      // Remove de todas as salas
      db.rooms.forEach((r) => {
        r.members = r.members.filter((m) => m.userId !== userId);
      });
      await writeDb(db);
      return { success: true, message: `Usuário ${user?.name || userId} suspenso do sistema.` };
    }

    // 7. Desbanir Usuário
    case 'unban_user': {
      const { userId } = payload;
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        user.isBanned = false;
        user.banReason = undefined;
        await writeDb(db);
        return { success: true, message: `Suspensão revogada para ${user.name}.` };
      }
      return { success: false, message: 'Usuário não encontrado.' };
    }

    // 8. Excluir Sala
    case 'delete_room': {
      const { roomId } = payload;
      const idx = db.rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        const removed = db.rooms.splice(idx, 1)[0];
        await writeDb(db);
        return { success: true, message: `Sala "${removed.name}" excluída com sucesso.` };
      }
      return { success: false, message: 'Sala não encontrada.' };
    }

    // 8.1. Excluir Pessoa / Usuário Definitivamente do Sistema
    case 'delete_user': {
      const { userId } = payload;
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        if (user.email && user.email.trim().toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase()) {
          return { success: false, message: 'O Administrador Geral não pode ser excluído.' };
        }
        db.users = db.users.filter((u) => u.id !== userId);
        if (db.quizProgress && db.quizProgress[userId]) {
          delete db.quizProgress[userId];
        }
        if (db.rooms) {
          db.rooms.forEach((r) => {
            r.members = r.members.filter((m) => m.userId !== userId);
          });
        }
        await writeDb(db);
        return { success: true, message: `Usuário "${user.name}" excluído definitivamente do sistema.` };
      }
      return { success: false, message: 'Usuário não encontrado.' };
    }

    // 9. Limpar Chat da Sala
    case 'clear_chat': {
      const { roomId } = payload;
      const room = db.rooms.find((r) => r.id === roomId);
      if (room) {
        room.messages = [
          {
            id: 'msg_clean_' + Date.now(),
            userId: 'system',
            userName: '🛡️ Moderação do Sistema',
            userTitle: 'Administrador',
            text: '🧹 O histórico de mensagens desta sala foi limpo pelo Administrador do Sistema.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
          }
        ];
        await writeDb(db);
        return { success: true, message: 'Histórico do chat limpo com sucesso.' };
      }
      return { success: false, message: 'Sala não encontrada.' };
    }

    default:
      return { success: false, message: `Ação desconhecida: ${action}` };
  }
}

export async function performRoomActionServer(
  roomId: string,
  action: 'start_game' | 'interrupt_timer' | 'answer_question' | 'start_next_question' | 'restart_game',
  payload: any
): Promise<{ success: boolean; room?: MultiplayerRoom; message?: string }> {
  const db = await ensureDb();
  if (!db.rooms) return { success: false, message: 'Banco de salas vazio.' };

  const room = db.rooms.find((r) => r.id === roomId);
  if (!room) return { success: false, message: 'Sala não encontrada.' };

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

    room.messages.push({
      id: 'msg_start_' + now,
      userId: 'system',
      userName: 'Apóstolos Quiz',
      userTitle: 'Irmão',
      text: `⚔️ A Disputa Bíblica começou! 1 minuto para cada questão ou até alguém interromper o tempo!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true
    });
  } else if (action === 'interrupt_timer') {
    // Algum membro do grupo interrompeu o tempo de 1 minuto!
    if (room.status === 'in_progress') {
      const memberName = payload.userName || 'Um irmão do grupo';
      room.timeInterruptedBy = memberName;
      room.status = 'intermission';
      room.intermissionExpiresAt = now + room.intermissionTimeLimit * 1000;
      room.intermissionSecondsElapsed = 0;

      const member = room.members.find((m) => m.userId === payload.userId);
      if (member) member.interruptedTime = true;

      room.messages.push({
        id: 'msg_interrupt_' + now,
        userId: 'system',
        userName: 'Apóstolos Quiz',
        userTitle: 'Irmão',
        text: `⚡ ${memberName} interrompeu o tempo da questão! Próxima questão em 20 segundos ou comece já.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true
      });
    }
  } else if (action === 'answer_question') {
    const member = room.members.find((m) => m.userId === payload.userId);
    if (member && !member.hasAnswered) {
      const currentQ = room.questions[room.currentQuestionIndex];
      const isCorrect = payload.selectedOption === currentQ.correctIndex;
      member.hasAnswered = true;
      member.selectedOption = payload.selectedOption;
      member.isCorrect = isCorrect;
      member.answerTimeSeconds = payload.secondsElapsed || 0;

      if (isCorrect) {
        // Bônus de rapidez se respondeu logo
        const speedBonus = Math.max(0, 60 - (payload.secondsElapsed || 0));
        const pts = (currentQ.xp || 100) + speedBonus * 2;
        member.score += pts;
      }

      // Se todos os membros responderam, finaliza a questão e entra em intermission
      const allAnswered = room.members.every((m) => m.hasAnswered);
      if (allAnswered && room.status === 'in_progress') {
        room.status = 'intermission';
        room.intermissionExpiresAt = now + room.intermissionTimeLimit * 1000;
        room.intermissionSecondsElapsed = 0;

        room.messages.push({
          id: 'msg_all_answered_' + now,
          userId: 'system',
          userName: 'Apóstolos Quiz',
          userTitle: 'Irmão',
          text: `🎯 Todos os amigos responderam! Intervalo de 20 segundos para a próxima questão.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
      }
    }
  } else if (action === 'start_next_question') {
    // Qualquer membro tem 20 segundos para começar a próxima questão ou ela começa sozinha
    const member = room.members.find((m) => m.userId === payload.userId);
    if (member) member.readyForNext = true;

    // Se o líder clicou OU se todos clicaram OU se forçar início
    const isLeader = room.createdBy === payload.userId;
    const allReady = room.members.every((m) => m.readyForNext);

    if (isLeader || allReady || payload.forceNext) {
      if (room.currentQuestionIndex + 1 >= room.totalQuestions) {
        room.status = 'finished';
        const sorted = [...room.members].sort((a, b) => b.score - a.score);
        room.winnerName = sorted[0]?.name || '';

        room.messages.push({
          id: 'msg_finished_' + now,
          userId: 'system',
          userName: 'Apóstolos Quiz',
          userTitle: 'Irmão',
          text: `🏆 Disputa concluída! Grande vencedor: ${room.winnerName}! Glória a Deus pela edificação!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
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

        room.messages.push({
          id: 'msg_next_q_' + now,
          userId: 'system',
          userName: 'Apóstolos Quiz',
          userTitle: 'Irmão',
          text: `📖 Questão ${room.currentQuestionIndex + 1} de ${room.totalQuestions} iniciada!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true
        });
      }
    }
  } else if (action === 'restart_game') {
    room.questions = getRandomRoomQuestions(room.level, 10);
    room.totalQuestions = room.questions.length;
    room.currentQuestionIndex = 0;
    room.status = 'waiting';
    room.winnerName = undefined;
    room.timeInterruptedBy = null;
    room.members.forEach((m) => {
      m.score = 0;
      m.hasAnswered = false;
      m.selectedOption = null;
      m.isCorrect = undefined;
      m.readyForNext = false;
      m.interruptedTime = false;
    });
  }

  room.lastActivity = new Date().toISOString();
  await writeDb(db);
  return { success: true, room };
}

