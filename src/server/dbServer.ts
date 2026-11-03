import fs from 'fs/promises';
import path from 'path';
import { UserProfile, ChurchRecord, PaymentTransaction } from '@/data/db';

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

// Garante que o arquivo de banco de dados exista no servidor
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
    console.error('Erro ao inicializar banco de dados no servidor:', err);
    return {
      users: [],
      quizProgress: {},
      churches: [],
      transactions: [],
      lastSavedAt: new Date().toISOString()
    };
  }
}

// Salva dados no arquivo JSON de forma segura
async function writeDb(db: ServerDatabaseSchema): Promise<void> {
  try {
    await fs.mkdir(DB_DIR, { recursive: true });
    db.lastSavedAt = new Date().toISOString();
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao escrever no banco do servidor:', err);
  }
}

// ==========================================
// OPERAÇÕES DE DADOS PESSOAIS (USUÁRIO)
// ==========================================

export async function saveUserProfileServer(profile: UserProfile): Promise<UserProfile> {
  const db = await ensureDb();
  const idx = db.users.findIndex(
    (u) =>
      u.id === profile.id ||
      (profile.email && u.email?.toLowerCase() === profile.email.toLowerCase())
  );

  const updatedProfile: UserProfile = {
    ...profile,
    registeredAt: profile.registeredAt || new Date().toISOString()
  };

  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...updatedProfile };
  } else {
    db.users.push(updatedProfile);
  }

  await writeDb(db);
  return updatedProfile;
}

export async function getUserProfileServer(
  userId?: string,
  email?: string
): Promise<UserProfile | null> {
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
  // Se não encontrar por chave específica, retorna o último usuário ativo
  return db.users.length > 0 ? db.users[db.users.length - 1] : null;
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
  const db = await ensureDb();
  const key = userId || 'user_default';

  const existing = db.quizProgress[key] || {
    userId: key,
    userName: progress.userName || '',
    completedModules: [],
    score: 0,
    currentLevel: 'basico',
    selectedModuleId: 1,
    lastUpdated: new Date().toISOString()
  };

  const updated: ServerQuizProgress = {
    userId: key,
    userName: progress.userName || existing.userName || '',
    completedModules: Array.from(new Set([...existing.completedModules, ...progress.completedModules])),
    score: Math.max(existing.score, progress.score),
    currentLevel: progress.currentLevel || existing.currentLevel || 'basico',
    selectedModuleId: progress.selectedModuleId || existing.selectedModuleId || 1,
    lastUpdated: new Date().toISOString()
  };

  db.quizProgress[key] = updated;
  await writeDb(db);
  return updated;
}

export async function getQuizProgressServer(userId?: string): Promise<ServerQuizProgress | null> {
  const db = await ensureDb();
  const key = userId || 'user_default';
  if (db.quizProgress[key]) {
    return db.quizProgress[key];
  }
  // Retorna o primeiro progresso registrado se houver
  const keys = Object.keys(db.quizProgress);
  if (keys.length > 0) {
    return db.quizProgress[keys[0]];
  }
  return null;
}

// Retorna resumo estatístico geral para painel administrativo
export async function getServerStats() {
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
}
