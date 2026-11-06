import fs from 'fs/promises';
import path from 'path';
import { UserProfile, ChurchRecord, PaymentTransaction, ADMIN_MASTER_EMAIL, isUserAdmin } from '@/data/db';
import { getSupabase } from '@/lib/supabase';
import { MultiplayerRoom, RoomMember, RoomChatMessage, ModerationAlert, getRandomRoomQuestions, INITIAL_ROOMS_DEMO } from '@/data/multiplayerRooms';
import { analyzeMessageContent } from '@/data/contentModerator';
import { CommunityUser, Friendship, DirectMessage, DEMO_COMMUNITY_USERS } from '@/data/communitySocial';

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
  friendships?: Friendship[];
  directMessages?: DirectMessage[];
  deletedUserIds?: string[];
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
      if (!parsed.rooms) parsed.rooms = [];
      if (!parsed.moderationAlerts) parsed.moderationAlerts = [];
      if (!parsed.friendships) parsed.friendships = [];
      if (!parsed.directMessages) parsed.directMessages = [];
      if (!parsed.deletedUserIds) parsed.deletedUserIds = [];

      // Filtra permanentemente usuários excluídos
      if (parsed.deletedUserIds.length > 0) {
        const deletedSet = new Set(parsed.deletedUserIds);
        parsed.users = parsed.users.filter((u) => !deletedSet.has(u.id));
      }

      return parsed;
    } catch {
      const initial: ServerDatabaseSchema = {
        users: [],
        quizProgress: {},
        churches: [],
        transactions: [],
        rooms: [...INITIAL_ROOMS_DEMO],
        moderationAlerts: [],
        friendships: [],
        directMessages: [],
        deletedUserIds: [],
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
      rooms: [],
      moderationAlerts: [],
      friendships: [],
      directMessages: [],
      deletedUserIds: [],
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
  title: 'Irmão' | 'Irmã' | 'Administrador';
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
      const title: 'Irmão' | 'Irmã' | 'Administrador' =
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
  if (!db.rooms) db.rooms = [];
  return db.rooms;
}

export async function getRoomByIdServer(roomId: string): Promise<MultiplayerRoom | null> {
  const db = await ensureDb();
  if (!db.rooms) db.rooms = [];
  const targetId = String(roomId || '').trim();
  const room = db.rooms.find((r) => r.id === targetId || String(r.id).trim() === targetId);
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
  creatorTitle?: 'Irmão' | 'Irmã' | 'Administrador';
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

// ==========================================
// SISTEMA DE ADVERTÊNCIAS E SUSPENSÕES
// Regra: 3 advertências no mês -> 15 dias de suspensão
// Se persistir mais 3 (6 no mês) -> 30 dias de suspensão
// ==========================================

export function checkUserSuspension(user?: UserProfile | null): {
  isSuspended: boolean;
  reason?: string;
  until?: string | null;
  daysLeft?: number;
  untilFormatted?: string;
  countThisMonth?: number;
} {
  if (!user) return { isSuspended: false };
  if (!user.isSuspended && !user.isBanned) return { isSuspended: false };

  if (user.suspendedUntil) {
    const untilTime = new Date(user.suspendedUntil).getTime();
    const nowTime = Date.now();
    if (nowTime >= untilTime) {
      // Suspensão expirou naturalmente!
      user.isSuspended = false;
      user.isBanned = false;
      user.suspendedUntil = null;
      user.suspensionReason = undefined;
      user.banReason = undefined;
      return { isSuspended: false };
    }
    const daysLeft = Math.max(1, Math.ceil((untilTime - nowTime) / (24 * 60 * 60 * 1000)));
    const untilFormatted = new Date(user.suspendedUntil).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return {
      isSuspended: true,
      reason: user.suspensionReason || user.banReason || 'Suspensão temporária por advertências disciplinares',
      until: user.suspendedUntil,
      daysLeft,
      untilFormatted,
      countThisMonth: user.warningCount || 0
    };
  }

  if (user.isBanned) {
    return {
      isSuspended: true,
      reason: user.banReason || 'Suspenso pela administração',
      until: null,
      daysLeft: 999,
      countThisMonth: user.warningCount || 0
    };
  }

  return { isSuspended: false };
}

export function applyUserWarning(
  db: ServerDatabaseSchema,
  userId: string,
  userName: string,
  reason: string,
  context: string,
  issuedBy: 'moderacao_automatica' | 'administrador'
): {
  warningId: string;
  countThisMonth: number;
  totalWarnings: number;
  isSuspended: boolean;
  suspendedDays: number;
  suspendedUntil?: string;
  untilFormatted?: string;
  message: string;
} {
  let user = db.users.find(
    (u) => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase())
  );

  if (!user) {
    user = {
      id: userId,
      name: userName || 'Irmão em Comunhão',
      gender: 'male',
      title: 'Irmão',
      email: userId.includes('@') ? userId : '',
      photoUrl: '/avatar_pardo_masc_adulto.jpg',
      birthDate: '1995-01-01',
      age: 30,
      cep: '09111000',
      street: '',
      neighborhood: '',
      city: 'São Paulo',
      state: 'SP',
      churchName: 'Igreja Local',
      ministry: 'Membro',
      isVip: false,
      registeredAt: new Date().toISOString()
    };
    db.users.push(user);
  }

  if (!user.warnings) user.warnings = [];

  const warningId = 'warn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  user.warnings.unshift({
    id: warningId,
    reason: reason || 'Violação das diretrizes comunitárias cristãs',
    timestamp: new Date().toISOString(),
    context: context || 'Comunidade Cristã',
    issuedBy
  });

  // Contabiliza advertências no mês corrente
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyWarnings = user.warnings.filter((w) => {
    const d = new Date(w.timestamp);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const countThisMonth = monthlyWarnings.length;
  user.warningCount = countThisMonth;

  let isSuspended = false;
  let suspendedDays = 0;
  let suspendedUntil: string | undefined = undefined;

  // Regra 2: Se persistir mais 3 advertências (6 ou mais no mês) -> Suspenso por 30 dias
  if (countThisMonth >= 6) {
    isSuspended = true;
    suspendedDays = 30;
    suspendedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    user.isSuspended = true;
    user.isBanned = true;
    user.suspendedUntil = suspendedUntil;
    user.suspensionReason = `Suspensão disciplinar de 30 dias por reincidência de advertências (${countThisMonth} no mês).`;
    user.banReason = user.suspensionReason;
    user.suspensionHistoryCount = (user.suspensionHistoryCount || 0) + 1;
  }
  // Regra 1: Atingiu 3 advertências no mês -> Suspenso por 15 dias
  else if (countThisMonth >= 3) {
    isSuspended = true;
    suspendedDays = 15;
    suspendedUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    user.isSuspended = true;
    user.isBanned = true;
    user.suspendedUntil = suspendedUntil;
    user.suspensionReason = `Suspensão disciplinar de 15 dias por atingir 3 advertências no mês (${countThisMonth}/3).`;
    user.banReason = user.suspensionReason;
    user.suspensionHistoryCount = (user.suspensionHistoryCount || 0) + 1;
  } else {
    // 1 ou 2 advertências (não suspende se a suspensão anterior já expirou)
    if (!user.suspendedUntil || new Date(user.suspendedUntil).getTime() <= Date.now()) {
      user.isSuspended = false;
      user.isBanned = false;
    }
  }

  const untilFormatted = suspendedUntil
    ? new Date(suspendedUntil).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : undefined;

  let message = '';
  if (isSuspended) {
    message = `🚨 CONTA SUSPENSA POR ${suspendedDays} DIAS! Você acumulou ${countThisMonth} advertências no mês e ficará suspenso até ${untilFormatted}. Motivo: ${reason}`;
  } else {
    message = `⚠️ Advertência ${countThisMonth}/3 aplicada neste mês. (Ao atingir 3 advertências no mês você será suspenso por 15 dias). Motivo: ${reason}`;
  }

  return {
    warningId,
    countThisMonth,
    totalWarnings: user.warnings.length,
    isSuspended,
    suspendedDays,
    suspendedUntil,
    untilFormatted,
    message
  };
}

export async function joinRoomServer(
  roomId: string,
  passcode: string,
  member: {
    userId: string;
    name: string;
    title: 'Irmão' | 'Irmã' | 'Administrador';
    photoUrl?: string;
    avatarConfig?: any;
    userEmail?: string;
  }
): Promise<{ success: boolean; room?: MultiplayerRoom; message?: string }> {
  const db = await ensureDb();
  if (!db.rooms) db.rooms = [...INITIAL_ROOMS_DEMO];

  // Verifica se o usuário está suspenso
  const targetUser = db.users.find(
    (u) => u.id === member.userId || (member.userEmail && u.email?.toLowerCase() === member.userEmail.toLowerCase())
  );
  const suspension = checkUserSuspension(targetUser);
  if (suspension.isSuspended) {
    return {
      success: false,
      message: `Acesso negado: Sua conta está suspensa por infrações disciplinares até ${suspension.untilFormatted || 'data determinada'} (${suspension.daysLeft} dias restantes). Motivo: ${suspension.reason}`
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
): Promise<{
  success: boolean;
  messages?: RoomChatMessage[];
  message?: string;
  alertTriggered?: boolean;
  blocked?: boolean;
  category?: string;
}> {
  const db = await ensureDb();
  if (!db.rooms) return { success: false, message: 'Nenhuma sala disponível.' };

  // Verifica se o usuário está suspenso ativamente
  const senderUser = db.users.find(
    (u) => u.id === message.userId || (message.userEmail && u.email?.toLowerCase() === message.userEmail.toLowerCase())
  );
  const suspension = checkUserSuspension(senderUser);
  if (suspension.isSuspended) {
    return {
      success: false,
      blocked: true,
      message: `🚫 Sua conta está suspensa por infrações disciplinares até ${suspension.untilFormatted || 'data determinada'} (${suspension.daysLeft} dias restantes). Motivo: ${suspension.reason}`
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

  // Análise e bloqueio automático de moderação do conteúdo
  const analysis = analyzeMessageContent(message.text);
  const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  if (analysis.isViolating) {
    // Aplica advertência e calcula regra de suspensão (3 no mês = 15 dias, 6 no mês = 30 dias)
    const warnRes = applyUserWarning(
      db,
      message.userId,
      message.userName,
      analysis.reason || 'Conteúdo impróprio',
      `Sala: ${room.name}`,
      'moderacao_automatica'
    );

    // Registra Alerta Imediato de Moderação para o Administrador Geral edi.ben.jr@gmail.com
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
      reason: `${analysis.reason} (Advertência ${warnRes.countThisMonth}/3 no mês${warnRes.isSuspended ? ` - SUSPENSO POR ${warnRes.suspendedDays} DIAS` : ''})`,
      severity: 'alta',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    if (!db.moderationAlerts) db.moderationAlerts = [];
    db.moderationAlerts.unshift(alert);
    await writeDb(db);
    console.warn(`[MODERAÇÃO BLOQUEIO] Mensagem bloqueada na sala "${room.name}" por ${message.userName}: ${analysis.reason} (${warnRes.countThisMonth}/3)`);

    // Retorna mensagem com o status da advertência e suspensão
    return {
      success: false,
      blocked: true,
      category: analysis.category,
      message: warnRes.message
    };
  }

  const newMsg: RoomChatMessage = {
    id: msgId,
    userId: message.userId,
    userName: isMasterAdmin ? `${message.userName} 🛡️` : message.userName,
    userTitle: isMasterAdmin ? 'Administrador' : (message.userTitle || 'Irmão'),
    userAvatar: message.userAvatar,
    text: message.text.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isAdmin: isMasterAdmin
  };

  room.messages.push(newMsg);
  // Mantém histórico das últimas 100 mensagens da sala
  if (room.messages.length > 100) {
    room.messages = room.messages.slice(-100);
  }

  room.lastActivity = new Date().toISOString();
  await writeDb(db);
  return { success: true, messages: room.messages, alertTriggered: false };
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

  // Verifica e expira suspensões vencidas automaticamente
  const nowTime = Date.now();
  let needSave = false;
  users.forEach((u) => {
    if (u.suspendedUntil && new Date(u.suspendedUntil).getTime() <= nowTime) {
      u.isSuspended = false;
      u.isBanned = false;
      u.suspendedUntil = null;
      u.suspensionReason = undefined;
      u.banReason = undefined;
      needSave = true;
    }
  });
  if (needSave) {
    await writeDb(db);
  }

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

  const targetRoomId = String(payload?.roomId || payload?.id || '').trim();
  const targetRoom = targetRoomId
    ? (db.rooms || []).find((r) => r.id === targetRoomId || String(r.id).trim() === targetRoomId)
    : undefined;
  const isRoomCreatorAllowed =
    Boolean(payload?.requesterId && targetRoom && targetRoom.createdBy === payload.requesterId) &&
    ['delete_room', 'clear_chat', 'kick_member'].includes(action);

  if (!isAdmin && !isRoomCreatorAllowed) {
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
      const warnRes = applyUserWarning(
        db,
        userId,
        userName || 'Participante',
        reason || 'Comportamento inadequado em desacordo com as diretrizes bíblicas.',
        roomId ? `Sala: ${roomId}` : 'Painel de Moderação',
        'administrador'
      );

      if (roomId && db.rooms) {
        const room = db.rooms.find((r) => r.id === roomId);
        if (room) {
          room.messages.push({
            id: 'msg_warn_' + Date.now(),
            userId: 'system',
            userName: '🛡️ Moderação do Sistema',
            userTitle: 'Administrador',
            text: `⚠️ ADVERTÊNCIA FORMAL para ${userName}: ${reason || 'Comportamento inadequado.'} (${warnRes.countThisMonth}/3 no mês${warnRes.isSuspended ? ` - SUSPENSO POR ${warnRes.suspendedDays} DIAS` : ''})`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
          });
        }
      }

      await writeDb(db);
      return {
        success: true,
        message: `Advertência aplicada a ${userName || userId} (${warnRes.countThisMonth}/3 no mês). ${warnRes.isSuspended ? `SUSPENSO POR ${warnRes.suspendedDays} DIAS (até ${warnRes.untilFormatted})` : ''}`
      };
    }

    // 5. Expulsar Membro da Sala
    case 'kick_member': {
      const { roomId } = payload;
      const targetUserId = payload.userId || payload.memberId;
      const room = db.rooms?.find((r) => r.id === roomId);
      if (room) {
        const removed = room.members.find((m) => m.userId === targetUserId);
        room.members = room.members.filter((m) => m.userId !== targetUserId);
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

    // 6. Banir / Suspender Usuário
    case 'ban_user': {
      const { userId, reason, days } = payload;
      const user = db.users.find((u) => u.id === userId || (u.email && u.email.toLowerCase() === String(userId).toLowerCase()));
      const suspDays = Number(days) || 15;
      if (user) {
        user.isBanned = true;
        user.isSuspended = true;
        user.suspendedUntil = new Date(Date.now() + suspDays * 24 * 60 * 60 * 1000).toISOString();
        user.suspensionReason = reason || `Suspensão disciplinar manual de ${suspDays} dias pelo Administrador.`;
        user.banReason = user.suspensionReason;
        user.suspensionHistoryCount = (user.suspensionHistoryCount || 0) + 1;
      }
      // Remove de todas as salas
      if (db.rooms) {
        db.rooms.forEach((r) => {
          r.members = r.members.filter((m) => m.userId !== userId);
        });
      }
      await writeDb(db);
      return { success: true, message: `Usuário ${user?.name || userId} suspenso do sistema por ${suspDays} dias.` };
    }

    // 7. Revogar Suspensão e Zerar Advertências
    case 'clear_warnings':
    case 'unban_user': {
      const { userId } = payload;
      const user = db.users.find((u) => u.id === userId || (u.email && u.email.toLowerCase() === String(userId).toLowerCase()));
      if (user) {
        user.isBanned = false;
        user.isSuspended = false;
        user.suspendedUntil = null;
        user.suspensionReason = undefined;
        user.banReason = undefined;
        user.warnings = [];
        user.warningCount = 0;
        await writeDb(db);
        return { success: true, message: `Suspensão revogada e advertências zeradas para ${user.name}.` };
      }
      return { success: false, message: 'Usuário não encontrado.' };
    }

    // 8. Excluir Sala Definitivamente
    case 'delete_room': {
      const targetId = String(payload.roomId || payload.id || '').trim();
      const idx = db.rooms.findIndex((r) => r.id === targetId || String(r.id).trim() === targetId);
      if (idx !== -1) {
        const removed = db.rooms.splice(idx, 1)[0];
        if (db.moderationAlerts) {
          db.moderationAlerts = db.moderationAlerts.filter((a) => a.roomId !== targetId);
        }
        await writeDb(db);
        return { success: true, message: `Sala "${removed.name}" excluída com sucesso.` };
      }
      return { success: false, message: 'Sala não encontrada no servidor.' };
    }

    // 8.1. Excluir Pessoa / Usuário Definitivamente do Sistema
    case 'delete_user': {
      const { userId } = payload;
      if (!userId) return { success: false, message: 'ID do usuário não fornecido.' };

      const user = db.users.find(
        (u) => u.id === userId || (u.email && u.email.toLowerCase() === String(userId).toLowerCase())
      );
      const targetId = user?.id || userId;
      const targetName = user?.name || userId;

      if (user?.email && user.email.trim().toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase()) {
        return { success: false, message: 'O Administrador Geral não pode ser excluído.' };
      }

      // Registra como excluído permanentemente
      if (!db.deletedUserIds) db.deletedUserIds = [];
      if (!db.deletedUserIds.includes(targetId)) db.deletedUserIds.push(targetId);
      if (typeof userId === 'string' && !db.deletedUserIds.includes(userId)) db.deletedUserIds.push(userId);

      // Remove de usuários
      db.users = db.users.filter((u) => u.id !== targetId && u.email?.toLowerCase() !== String(userId).toLowerCase());

      // Remove de progresso
      if (db.quizProgress) {
        delete db.quizProgress[targetId];
        delete db.quizProgress[userId];
      }

      // Remove de salas
      if (db.rooms) {
        db.rooms.forEach((r) => {
          r.members = r.members.filter((m) => m.userId !== targetId && m.userId !== userId);
          if (r.messages) {
            r.messages = r.messages.filter((m) => m.userId !== targetId && m.userId !== userId);
          }
        });
      }

      // Remove amizades
      if (db.friendships) {
        db.friendships = db.friendships.filter(
          (f) => f.requesterId !== targetId && f.addresseeId !== targetId && f.requesterId !== userId && f.addresseeId !== userId
        );
      }

      // Remove mensagens diretas
      if (db.directMessages) {
        db.directMessages = db.directMessages.filter(
          (m) => m.fromUserId !== targetId && m.toUserId !== targetId && m.fromUserId !== userId && m.toUserId !== userId
        );
      }

      // Remove alertas
      if (db.moderationAlerts) {
        db.moderationAlerts = db.moderationAlerts.filter((a) => a.userId !== targetId && a.userId !== userId);
      }

      await writeDb(db);
      return { success: true, message: `Usuário "${targetName}" excluído definitivamente do sistema.` };
    }

    // 8.2. Excluir Todos os Usuários de Teste / Demos
    case 'delete_test_users': {
      if (!db.deletedUserIds) db.deletedUserIds = [];

      const testIds = [
        'user_debora_vasconcelos',
        'user_lucas_ferreira',
        'user_sarah_alencar',
        'user_davi_salomao',
        'user_rebeca_mello',
        'user_samuel_prado'
      ];

      const toDelete = db.users.filter((u) => {
        if (u.email && u.email.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase()) return false;
        return (
          testIds.includes(u.id) ||
          u.id.startsWith('demo_') ||
          u.id.startsWith('seed_') ||
          (u.email && u.email.endsWith('@apostolosquiz.com'))
        );
      });

      const deletedCount = toDelete.length;
      toDelete.forEach((u) => {
        if (!db.deletedUserIds!.includes(u.id)) db.deletedUserIds!.push(u.id);
      });
      testIds.forEach((id) => {
        if (!db.deletedUserIds!.includes(id)) db.deletedUserIds!.push(id);
      });

      const deletedSet = new Set(db.deletedUserIds);
      db.users = db.users.filter((u) => !deletedSet.has(u.id));

      if (db.quizProgress) {
        Object.keys(db.quizProgress).forEach((k) => {
          if (deletedSet.has(k)) delete db.quizProgress[k];
        });
      }

      if (db.rooms) {
        db.rooms.forEach((r) => {
          r.members = r.members.filter((m) => !deletedSet.has(m.userId));
          if (r.messages) {
            r.messages = r.messages.filter((m) => !deletedSet.has(m.userId));
          }
        });
      }

      if (db.friendships) {
        db.friendships = db.friendships.filter(
          (f) => !deletedSet.has(f.requesterId) && !deletedSet.has(f.addresseeId)
        );
      }

      if (db.directMessages) {
        db.directMessages = db.directMessages.filter(
          (m) => !deletedSet.has(m.fromUserId) && !deletedSet.has(m.toUserId)
        );
      }

      if (db.moderationAlerts) {
        db.moderationAlerts = db.moderationAlerts.filter((a) => !deletedSet.has(a.userId));
      }

      await writeDb(db);
      return { success: true, message: `${deletedCount} usuários de teste foram excluídos definitivamente do sistema.` };
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

// ==========================================
// REDE SOCIAL CRISTÃ: PRESENÇA, AMIZADES E MENSAGENS DIRETAS
// ==========================================

export async function handleHeartbeatServer(payload: {
  userId: string;
  name?: string;
  title?: 'Irmão' | 'Irmã';
  gender?: 'male' | 'female';
  photoUrl?: string;
  avatarConfig?: any;
  churchName?: string;
  city?: string;
  state?: string;
  ministry?: string;
  email?: string;
}): Promise<{ success: boolean; onlineCount: number }> {
  const db = await ensureDb();
  const now = new Date().toISOString();
  let user = db.users.find((u) => u.id === payload.userId || (payload.email && u.email?.toLowerCase() === payload.email.toLowerCase()));

  if (user) {
    user.lastActiveAt = now;
    if (payload.name) user.name = payload.name;
    if (payload.title) user.title = payload.title;
    if (payload.photoUrl) user.photoUrl = payload.photoUrl;
    if (payload.avatarConfig) user.avatarConfig = payload.avatarConfig;
    if (payload.churchName) user.churchName = payload.churchName;
    if (payload.city) user.city = payload.city;
  } else if (payload.userId) {
    user = {
      id: payload.userId,
      name: payload.name || 'Irmão na Fé',
      gender: payload.gender || 'male',
      title: payload.title || 'Irmão',
      email: payload.email || '',
      photoUrl: payload.photoUrl || '/avatar_pardo_masc_adulto.jpg',
      birthDate: '1990-01-01',
      age: 30,
      cep: '',
      street: '',
      neighborhood: '',
      city: payload.city || 'São Paulo',
      state: payload.state || 'SP',
      churchName: payload.churchName || '',
      ministry: payload.ministry || 'Membro em Comunhão',
      isVip: false,
      registeredAt: now,
      lastActiveAt: now,
      avatarConfig: payload.avatarConfig
    };
    db.users.push(user);
  }

  // Mantém demos ativos apenas se NÃO tiverem sido excluídos
  const currentTime = Date.now();
  const deletedSet = new Set(db.deletedUserIds || []);
  for (let i = 0; i < 4; i++) {
    const demoId = DEMO_COMMUNITY_USERS[i]?.id;
    if (demoId && !deletedSet.has(demoId)) {
      const demo = db.users.find((u) => u.id === demoId);
      if (demo) {
        demo.lastActiveAt = new Date(currentTime - i * 35000).toISOString();
      }
    }
  }

  await writeDb(db);

  const onlineThreshold = currentTime - 120000; // 2 minutos
  const onlineCount = db.users.filter((u) => !deletedSet.has(u.id) && u.lastActiveAt && new Date(u.lastActiveAt).getTime() >= onlineThreshold).length;

  return { success: true, onlineCount };
}

export async function getCommunityOverviewServer(userId: string): Promise<any> {
  const db = await ensureDb();
  const nowTime = Date.now();
  const onlineThreshold = nowTime - 120000; // 2 minutos
  const deletedSet = new Set(db.deletedUserIds || []);

  // Atualiza atividade do chamador
  const caller = db.users.find((u) => u.id === userId);
  if (caller) {
    caller.lastActiveAt = new Date().toISOString();
  }

  // Mantém demos ativos apenas se não foram excluídos
  for (let i = 0; i < 4; i++) {
    const demoId = DEMO_COMMUNITY_USERS[i]?.id;
    if (demoId && !deletedSet.has(demoId)) {
      const demo = db.users.find((u) => u.id === demoId);
      if (demo) {
        demo.lastActiveAt = new Date(nowTime - i * 30000).toISOString();
      }
    }
  }
  await writeDb(db);

  if (!db.friendships) db.friendships = [];
  if (!db.directMessages) db.directMessages = [];

  // Mapeia todas as amizades do usuário
  const userFriendships = db.friendships.filter(
    (f) => f.requesterId === userId || f.addresseeId === userId
  );

  const acceptedFriendIds = new Set<string>();
  userFriendships
    .filter((f) => f.status === 'accepted')
    .forEach((f) => {
      acceptedFriendIds.add(f.requesterId === userId ? f.addresseeId : f.requesterId);
    });

  const pendingSentIds = new Set<string>();
  userFriendships
    .filter((f) => f.requesterId === userId && f.status === 'pending')
    .forEach((f) => pendingSentIds.add(f.addresseeId));

  const pendingReceivedIds = new Set<string>();
  userFriendships
    .filter((f) => f.addresseeId === userId && f.status === 'pending')
    .forEach((f) => pendingReceivedIds.add(f.requesterId));

  const mapToCommunityUser = (u: UserProfile): CommunityUser => {
    const isOnline = Boolean(u.lastActiveAt && new Date(u.lastActiveAt).getTime() >= onlineThreshold);
    let friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' = 'none';

    if (acceptedFriendIds.has(u.id)) {
      friendStatus = 'friends';
    } else if (pendingSentIds.has(u.id)) {
      friendStatus = 'pending_sent';
    } else if (pendingReceivedIds.has(u.id)) {
      friendStatus = 'pending_received';
    }

    const quizProg = db.quizProgress[u.id];

    return {
      id: u.id,
      name: u.name,
      title: (u.title || (u.gender === 'female' ? 'Irmã' : 'Irmão')) as any,
      gender: u.gender || 'male',
      photoUrl: u.photoUrl,
      avatarConfig: u.avatarConfig,
      churchName: u.churchName,
      city: u.city,
      state: u.state,
      ministry: u.ministry,
      isVip: u.isVip,
      isAdmin: isUserAdmin(u),
      score: quizProg?.score || 1000,
      lastActiveAt: u.lastActiveAt || u.registeredAt,
      isOnline,
      friendStatus
    };
  };

  const allCommunityUsers = db.users.filter((u) => u.id !== userId).map(mapToCommunityUser);
  const onlineUsers = allCommunityUsers.filter((u) => u.isOnline);
  const friends = allCommunityUsers.filter((u) => u.friendStatus === 'friends');

  const pendingRequestsReceived = db.friendships
    .filter((f) => f.addresseeId === userId && f.status === 'pending')
    .map((f) => {
      const reqUser = db.users.find((u) => u.id === f.requesterId);
      return {
        ...f,
        requester: reqUser ? mapToCommunityUser(reqUser) : undefined
      };
    });

  const pendingRequestsSent = db.friendships
    .filter((f) => f.requesterId === userId && f.status === 'pending')
    .map((f) => {
      const addressee = db.users.find((u) => u.id === f.addresseeId);
      return {
        ...f,
        addressee: addressee ? mapToCommunityUser(addressee) : undefined
      };
    });

  const unreadMessagesCount = db.directMessages.filter((m) => m.toUserId === userId && !m.read).length;

  return {
    success: true,
    totalUsers: db.users.length,
    onlineCount: onlineUsers.length + (caller?.lastActiveAt && new Date(caller.lastActiveAt).getTime() >= onlineThreshold ? 1 : 1),
    onlineUsers,
    allUsers: allCommunityUsers,
    friends,
    pendingRequestsReceived,
    pendingRequestsSent,
    unreadMessagesCount
  };
}

export async function handleFriendActionServer(
  action: 'send_request' | 'accept_request' | 'reject_request' | 'remove_friend',
  payload: {
    userId: string;
    targetUserId?: string;
    requestId?: string;
  }
): Promise<{ success: boolean; message?: string }> {
  const db = await ensureDb();
  if (!db.friendships) db.friendships = [];

  const user = db.users.find((u) => u.id === payload.userId);
  if (!user) return { success: false, message: 'Usuário não encontrado.' };

  if (action === 'send_request') {
    if (!payload.targetUserId) return { success: false, message: 'Irmão alvo não especificado.' };
    if (payload.userId === payload.targetUserId) return { success: false, message: 'Você não pode adicionar a si mesmo.' };

    const targetUser = db.users.find((u) => u.id === payload.targetUserId);
    if (!targetUser) return { success: false, message: 'Irmão não encontrado.' };

    const existing = db.friendships.find(
      (f) =>
        (f.requesterId === payload.userId && f.addresseeId === payload.targetUserId) ||
        (f.requesterId === payload.targetUserId && f.addresseeId === payload.userId)
    );

    if (existing) {
      if (existing.status === 'accepted') {
        return { success: false, message: 'Vocês já são amigos na fé!' };
      }
      if (existing.status === 'pending') {
        if (existing.requesterId === payload.userId) {
          return { success: false, message: 'Solicitação de amizade já enviada.' };
        } else {
          // Se o outro já enviou, aceita automaticamente
          existing.status = 'accepted';
          existing.updatedAt = new Date().toISOString();
          await writeDb(db);
          return { success: true, message: `Agora você e ${targetUser.name} são amigos na fé!` };
        }
      }
      // Se foi rejeitada antes, reabre como pendente
      existing.status = 'pending';
      existing.requesterId = payload.userId;
      existing.addresseeId = payload.targetUserId;
      existing.updatedAt = new Date().toISOString();
      await writeDb(db);
      return { success: true, message: `Pedido de amizade enviado para ${targetUser.name}!` };
    }

    const newFriendship: Friendship = {
      id: 'friend_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      requesterId: payload.userId,
      requesterName: user.name,
      requesterTitle: user.title || 'Irmão',
      requesterPhoto: user.photoUrl,
      requesterChurch: user.churchName,
      addresseeId: payload.targetUserId,
      addresseeName: targetUser.name,
      addresseeTitle: targetUser.title || 'Irmão',
      addresseePhoto: targetUser.photoUrl,
      addresseeChurch: targetUser.churchName,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.friendships.push(newFriendship);

    // Se o alvo for um dos usuários demo, aceita automaticamente após 1 segundo
    if (payload.targetUserId.startsWith('user_')) {
      newFriendship.status = 'accepted';
    }

    await writeDb(db);
    return { success: true, message: `Pedido de amizade enviado para ${targetUser.name}!` };
  }

  if (action === 'accept_request') {
    const friendship = db.friendships.find((f) => f.id === payload.requestId || (f.requesterId === payload.targetUserId && f.addresseeId === payload.userId));
    if (!friendship) return { success: false, message: 'Solicitação não encontrada.' };
    friendship.status = 'accepted';
    friendship.updatedAt = new Date().toISOString();
    await writeDb(db);
    return { success: true, message: 'Amizade cristã aceita com sucesso!' };
  }

  if (action === 'reject_request') {
    const friendship = db.friendships.find((f) => f.id === payload.requestId || (f.requesterId === payload.targetUserId && f.addresseeId === payload.userId));
    if (!friendship) return { success: false, message: 'Solicitação não encontrada.' };
    friendship.status = 'rejected';
    friendship.updatedAt = new Date().toISOString();
    await writeDb(db);
    return { success: true, message: 'Solicitação recusada.' };
  }

  if (action === 'remove_friend') {
    if (!payload.targetUserId) return { success: false, message: 'Amigo não especificado.' };
    db.friendships = db.friendships.filter(
      (f) =>
        !(
          (f.requesterId === payload.userId && f.addresseeId === payload.targetUserId) ||
          (f.requesterId === payload.targetUserId && f.addresseeId === payload.userId)
        )
    );
    await writeDb(db);
    return { success: true, message: 'Amigo removido da sua lista.' };
  }

  return { success: false, message: 'Ação de amizade inválida.' };
}

export async function getDirectMessagesServer(userId: string, otherUserId: string): Promise<DirectMessage[]> {
  const db = await ensureDb();
  if (!db.directMessages) db.directMessages = [];

  // Marca como lidas as mensagens recebidas de otherUserId
  let modified = false;
  db.directMessages.forEach((m) => {
    if (m.toUserId === userId && m.fromUserId === otherUserId && !m.read) {
      m.read = true;
      modified = true;
    }
  });

  if (modified) {
    await writeDb(db);
  }

  return db.directMessages
    .filter(
      (m) =>
        (m.fromUserId === userId && m.toUserId === otherUserId) ||
        (m.fromUserId === otherUserId && m.toUserId === userId)
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function sendDirectMessageServer(payload: {
  fromUserId: string;
  fromUserName: string;
  fromUserTitle: string;
  toUserId: string;
  text: string;
  interactionType?: 'chat' | 'paz_do_senhor' | 'orando_por_voce' | 'abencoado' | 'desafio_quiz';
}): Promise<{ success: boolean; message?: string; msg?: DirectMessage; blocked?: boolean }> {
  const db = await ensureDb();
  if (!db.directMessages) db.directMessages = [];

  const sender = db.users.find((u) => u.id === payload.fromUserId);
  const suspension = checkUserSuspension(sender);
  if (suspension.isSuspended) {
    return {
      success: false,
      blocked: true,
      message: `🚫 Sua conta está suspensa por infrações disciplinares até ${suspension.untilFormatted || 'data determinada'} (${suspension.daysLeft} dias restantes). Motivo: ${suspension.reason}`
    };
  }

  // Moderação Cristã Automática de Mensagem Direta
  const analysis = analyzeMessageContent(payload.text);
  if (analysis.isViolating) {
    // Aplica advertência e calcula regra de suspensão (3 no mês = 15 dias, 6 no mês = 30 dias)
    const warnRes = applyUserWarning(
      db,
      payload.fromUserId,
      payload.fromUserName,
      analysis.reason || 'Conteúdo impróprio em mensagem direta',
      'Mensagem Direta',
      'moderacao_automatica'
    );

    // Alerta Imediato para o Administrador Geral
    const alert: ModerationAlert = {
      id: 'alert_dm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      roomId: 'direct_message',
      roomName: `Chat Privado: ${payload.fromUserName} -> ${payload.toUserId}`,
      messageId: 'dm_' + Date.now(),
      userId: payload.fromUserId,
      userName: payload.fromUserName,
      userTitle: (payload.fromUserTitle || 'Irmão') as any,
      originalText: payload.text.trim(),
      category: analysis.category || 'nocivo',
      reason: `${analysis.reason} (Advertência ${warnRes.countThisMonth}/3 no mês${warnRes.isSuspended ? ` - SUSPENSO POR ${warnRes.suspendedDays} DIAS` : ''})`,
      severity: 'alta',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    if (!db.moderationAlerts) db.moderationAlerts = [];
    db.moderationAlerts.unshift(alert);
    await writeDb(db);

    return {
      success: false,
      blocked: true,
      message: warnRes.message
    };
  }

  const newMsg: DirectMessage = {
    id: 'dm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    fromUserId: payload.fromUserId,
    fromUserName: payload.fromUserName,
    fromUserTitle: payload.fromUserTitle,
    toUserId: payload.toUserId,
    text: payload.text.trim(),
    interactionType: payload.interactionType || 'chat',
    createdAt: new Date().toISOString(),
    read: false
  };

  db.directMessages.push(newMsg);

  // Se o destinatário for um dos usuários demo, adiciona uma resposta fraternal após enviar
  if (payload.toUserId.startsWith('user_')) {
    const demoUser = db.users.find((u) => u.id === payload.toUserId);
    if (demoUser) {
      let replyText = `Amém, ${payload.fromUserTitle} ${payload.fromUserName}! A Paz do Senhor seja convosco! Que Deus continue abençoando seus estudos bíblicos. 🙏✨`;
      if (payload.interactionType === 'paz_do_senhor') {
        replyText = `🕊️ A Paz do Senhor, ${payload.fromUserTitle} ${payload.fromUserName}! Um prazer estar em comunhão com você aqui no Apóstolos Quiz!`;
      } else if (payload.interactionType === 'orando_por_voce') {
        replyText = `🙏 Glória a Deus, meu irmão(ã)! Muito obrigado pela oração, que o Senhor recompense em dobro sua vida e família!`;
      } else if (payload.interactionType === 'desafio_quiz') {
        replyText = `⚔️ Desafio aceito em Cristo! Vamos ver quem acerta mais respostas sobre as Sagradas Escrituras!`;
      }

      const replyMsg: DirectMessage = {
        id: 'dm_reply_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        fromUserId: demoUser.id,
        fromUserName: demoUser.name,
        fromUserTitle: demoUser.title,
        toUserId: payload.fromUserId,
        text: replyText,
        interactionType: 'chat',
        createdAt: new Date(Date.now() + 500).toISOString(),
        read: false
      };
      db.directMessages.push(replyMsg);
    }
  }

  await writeDb(db);
  return { success: true, msg: newMsg };
}

