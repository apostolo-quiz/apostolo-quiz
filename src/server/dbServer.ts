import fs from 'fs/promises';
import path from 'path';
import { UserProfile, ChurchRecord, PaymentTransaction } from '@/data/db';
import { getSupabase } from '@/lib/supabase';

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
      return parsed;
    } catch {
      const initial: ServerDatabaseSchema = {
        users: [],
        quizProgress: {},
        churches: [],
        transactions: [],
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
