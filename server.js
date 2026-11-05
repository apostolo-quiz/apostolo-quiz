// Servidor de Banco de Dados Backend - Apóstolos Quiz Bíblico
// Persiste Dados Pessoais (Irmão/Irmã) e Nível de Progresso do Quiz em disco

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'server-data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const ADMIN_MASTER_EMAIL = 'edi.ben.jr@gmail.com';

// Moderação de Conteúdo Comunitário Cristão
const MODERATION_TERMS = {
  sexual: [
    'sexo', 'porn', 'porno', 'pornografia', 'nudes', 'nude', 'pelada', 'pelado',
    'buceta', 'boceta', 'xoxota', 'xana', 'caralho', 'piroca', 'pica', 'pauzao',
    'rola', 'boquete', 'oral', 'siririca', 'masturbacao', 'punheta', 'gozar',
    'gozada', 'orgasmo', 'penetracao', 'anal', 'vagina', 'penis', 'safada', 'safadeza',
    'putaria', 'suruba', 'menage', 'prostituta', 'prostituto', 'puta',
    'vagabunda', 'gemer', 'gemido', 'foder', 'trepar', 'transar'
  ],
  assedio: [
    'manda nudes', 'manda foto pelada', 'manda foto do corpo', 'passa o zap gostosa',
    'quero te pegar', 'vem pro motel', 'te pago pra', 'gostosa demais', 'quero te comer',
    'vem ca minha linda', 'passa o zap gatinha', 'manda foto sem roupa', 'mostra os peitos',
    'mostra a bunda', 'safadinha', 'te quero na cama', 'sou seu macho', 'delicia de mulher',
    'vem de zap', 'solteira gata', 'te dou dinheiro se', 'te persigo', 'vou atras de voce'
  ],
  agressivo: [
    'vou te matar', 'vou te bater', 'vou te quebrar', 'arrombado', 'arrombada',
    'filho da puta', 'filha da puta', 'fdp', 'vai se foder', 'vai tomar no cu',
    'vsf', 'vtnc', 'desgracado', 'desgracada', 'maldito', 'maldita', 'lixo humano',
    'cala a boca seu', 'cala boca sua', 'idiota', 'imbecil', 'otario', 'otaria',
    'babaca', 'escroto', 'escrota', 'merda', 'bosta', 'corno', 'corna', 'viadinho',
    'macaco', 'preto safado', 'vadia', 'assassino', 'morra', 'se mata', 'suicidio'
  ],
  nocivo: [
    'deus e o diabo', 'jesus era um lixo', 'satana e melhor', 'adoro o diabo',
    'lucifer e senhor', 'blasfemia', 'vendo drogas', 'compro drogas', 'maconha',
    'cocaina', 'crack', 'golpe do pix', 'hackear', 'cartao clonado', 'link suspeito'
  ]
};

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7+]/g, 't');
}

function analyzeModeration(text) {
  if (!text || typeof text !== 'string') return { isViolating: false };
  const raw = text.trim();
  const normalized = normalizeText(raw);
  const stripped = normalized.replace(/[^a-z0-9]/g, '');

  for (const term of MODERATION_TERMS.assedio) {
    if (normalized.includes(normalizeText(term))) {
      return {
        isViolating: true,
        category: 'assedio',
        reason: 'Linguagem sugestiva ou tentativa de assédio / constrangimento',
        censoredText: '⚠️ [Mensagem retida pela moderação comunitária por conteúdo desrespeitoso]'
      };
    }
  }

  for (const term of MODERATION_TERMS.sexual) {
    const norm = normalizeText(term);
    const regex = new RegExp(`\\b${norm}\\b`, 'i');
    if (regex.test(normalized) || (norm.length >= 4 && stripped.includes(norm))) {
      return {
        isViolating: true,
        category: 'sexual',
        reason: 'Termo ou referência sexual / obscena imprópria para ambiente cristão',
        censoredText: '⚠️ [Mensagem bloqueada por conter conteúdo sexual / obsceno]'
      };
    }
  }

  for (const term of MODERATION_TERMS.agressivo) {
    const norm = normalizeText(term);
    const regex = new RegExp(`\\b${norm}\\b`, 'i');
    if (regex.test(normalized) || (norm.length >= 4 && stripped.includes(norm))) {
      return {
        isViolating: true,
        category: 'agressivo',
        reason: 'Agressão verbal, xingamento pesado ou incitação à violência',
        censoredText: '⚠️ [Mensagem bloqueada por agressão / ofensa verbal]'
      };
    }
  }

  for (const term of MODERATION_TERMS.nocivo) {
    if (normalized.includes(normalizeText(term))) {
      return {
        isViolating: true,
        category: 'nocivo',
        reason: 'Conteúdo nocivo, ilícito ou blasfêmia',
        censoredText: '⚠️ [Mensagem bloqueada por conduta nociva ou blasfêmia]'
      };
    }
  }

  return { isViolating: false, censoredText: raw };
}

// Garante que a pasta e o arquivo de banco de dados existam
function getDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = {
        users: [],
        quizProgress: {},
        churches: [],
        transactions: [],
        lastSavedAt: new Date().toISOString()
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(raw);
    if (!db.users) db.users = [];
    if (!db.quizProgress) db.quizProgress = {};
    if (!db.churches) db.churches = [];
    if (!db.transactions) db.transactions = [];
    if (!db.rooms) db.rooms = [];
    if (!db.moderationAlerts) db.moderationAlerts = [];
    return db;
  } catch (err) {
    console.error('[DATABASE] Erro ao ler banco de dados:', err);
    return { users: [], quizProgress: {}, churches: [], transactions: [], rooms: [], moderationAlerts: [], lastSavedAt: new Date().toISOString() };
  }
}

function saveDatabase(db) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastSavedAt = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[DATABASE] Erro ao salvar banco de dados:', err);
    return false;
  }
}

// Configuração dos cabeçalhos CORS
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
}

// Parser de corpo JSON
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  // Responde preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  console.log(`[API SERVER] ${req.method} ${pathname}`);

  try {
    // 1. Verificação de Saúde
    if (pathname === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', serverTime: new Date().toISOString() }));
      return;
    }

    // 2. Rota: /api/profile (Dados Pessoais do Usuário)
    if (pathname === '/api/profile') {
      const db = getDatabase();

      if (req.method === 'GET') {
        const userId = parsedUrl.searchParams.get('userId');
        const email = parsedUrl.searchParams.get('email');

        let profile = null;
        if (userId) {
          profile = db.users.find((u) => u.id === userId);
        }
        if (!profile && email) {
          profile = db.users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
        }
        if (!profile && db.users.length > 0) {
          profile = db.users[db.users.length - 1];
        }

        if (profile) {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, profile }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ success: false, message: 'Perfil não encontrado' }));
        }
        return;
      }

      if (req.method === 'POST') {
        const body = await readRequestBody(req);
        const profile = body.profile || body;

        if (!profile || !profile.name) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Nome do usuário é obrigatório' }));
          return;
        }

        const idx = db.users.findIndex(
          (u) =>
            u.id === profile.id ||
            (profile.email && u.email && u.email.toLowerCase() === profile.email.toLowerCase())
        );

        const updatedProfile = {
          ...profile,
          registeredAt: profile.registeredAt || new Date().toISOString()
        };

        if (idx !== -1) {
          db.users[idx] = { ...db.users[idx], ...updatedProfile };
        } else {
          db.users.push(updatedProfile);
        }

        saveDatabase(db);
        console.log(`[DATABASE] Perfil salvo com sucesso: ${updatedProfile.name} (${updatedProfile.title})`);

        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            message: 'Dados pessoais gravados com sucesso no servidor!',
            profile: updatedProfile
          })
        );
        return;
      }
    }

    // 3. Rota: /api/progress (Nível de Progresso do Quiz)
    if (pathname === '/api/progress') {
      const db = getDatabase();

      if (req.method === 'GET') {
        const userId = parsedUrl.searchParams.get('userId') || 'user_default';
        const progress = db.quizProgress[userId] || Object.values(db.quizProgress)[0] || {
          userId,
          completedModules: [],
          score: 0,
          currentLevel: 'basico',
          selectedModuleId: 1,
          lastUpdated: new Date().toISOString()
        };

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, progress }));
        return;
      }

      if (req.method === 'POST') {
        const body = await readRequestBody(req);
        const userId = body.userId || 'user_default';
        const existing = db.quizProgress[userId] || {
          userId,
          userName: body.userName || '',
          completedModules: [],
          score: 0,
          currentLevel: 'basico',
          selectedModuleId: 1,
          lastUpdated: new Date().toISOString()
        };

        const incomingMods = Array.isArray(body.completedModules) ? body.completedModules : [];
        const mergedMods = Array.from(new Set([...existing.completedModules, ...incomingMods]));

        const updated = {
          userId,
          userName: body.userName || existing.userName || '',
          completedModules: mergedMods,
          score: Math.max(existing.score || 0, Number(body.score) || 0),
          currentLevel: body.currentLevel || existing.currentLevel || 'basico',
          selectedModuleId: Number(body.selectedModuleId) || existing.selectedModuleId || 1,
          lastUpdated: new Date().toISOString()
        };

        db.quizProgress[userId] = updated;
        saveDatabase(db);
        console.log(`[DATABASE] Progresso salvo para usuário ${userId}: ${updated.completedModules.length} módulos concluídos, ${updated.score} XP`);

        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            message: 'Nível de progresso do Quiz salvo no servidor com sucesso!',
            progress: updated
          })
        );
        return;
      }
    }

    // 4. Rota: /api/sync (Sincronização Completa de Perfil e Progresso)
    if (pathname === '/api/sync') {
      const db = getDatabase();

      if (req.method === 'GET') {
        const userId = parsedUrl.searchParams.get('userId');
        const email = parsedUrl.searchParams.get('email');

        let profile = null;
        if (userId) profile = db.users.find((u) => u.id === userId);
        if (!profile && email) profile = db.users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (!profile && db.users.length > 0) profile = db.users[db.users.length - 1];

        const pKey = (profile && profile.id) || userId || 'user_default';
        const progress = db.quizProgress[pKey] || Object.values(db.quizProgress)[0] || null;

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, profile, progress, serverTime: new Date().toISOString() }));
        return;
      }

      if (req.method === 'POST') {
        const body = await readRequestBody(req);
        let savedProfile = null;
        let savedProgress = null;

        if (body.profile && body.profile.name) {
          const profile = body.profile;
          const idx = db.users.findIndex(
            (u) =>
              u.id === profile.id ||
              (profile.email && u.email && u.email.toLowerCase() === profile.email.toLowerCase())
          );
          if (idx !== -1) {
            db.users[idx] = { ...db.users[idx], ...profile };
          } else {
            db.users.push(profile);
          }
          savedProfile = profile;
        }

        if (body.progress) {
          const progress = body.progress;
          const uId = progress.userId || (savedProfile && savedProfile.id) || 'user_default';
          const existing = db.quizProgress[uId] || {
            userId: uId,
            completedModules: [],
            score: 0,
            currentLevel: 'basico',
            selectedModuleId: 1
          };

          const incomingMods = Array.isArray(progress.completedModules) ? progress.completedModules : [];
          const updated = {
            userId: uId,
            userName: (savedProfile && savedProfile.name) || progress.userName || existing.userName || '',
            completedModules: Array.from(new Set([...existing.completedModules, ...incomingMods])),
            score: Math.max(existing.score || 0, Number(progress.score) || 0),
            currentLevel: progress.currentLevel || existing.currentLevel || 'basico',
            selectedModuleId: Number(progress.selectedModuleId) || existing.selectedModuleId || 1,
            lastUpdated: new Date().toISOString()
          };
          db.quizProgress[uId] = updated;
          savedProgress = updated;
        }

        saveDatabase(db);
        console.log('[DATABASE] Sincronização geral concluída com sucesso!');

        res.writeHead(200);
        res.end(
          JSON.stringify({
            success: true,
            message: 'Dados pessoais e progresso do Quiz sincronizados com o servidor!',
            profile: savedProfile,
            progress: savedProgress,
            syncedAt: new Date().toISOString()
          })
        );
        return;
      }
    }

    // 5. Proxy para busca de igrejas no Nominatim (evita bloqueio de CORS)
    if (pathname === '/api/nominatim/search') {
      const q = parsedUrl.searchParams.get('q');
      const limit = parsedUrl.searchParams.get('limit') || '15';
      if (!q) {
        res.writeHead(200);
        res.end(JSON.stringify([]));
        return;
      }
      const targetUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=${limit}`;
      const options = {
        headers: {
          'User-Agent': 'ApostolosQuizApp/1.0 (contato@apostolosquiz.com)',
          'Accept-Language': 'pt-BR,pt;q=0.9'
        }
      };
      https.get(targetUrl, options, (extRes) => {
        let data = '';
        extRes.on('data', (chunk) => (data += chunk));
        extRes.on('end', () => {
          try {
            if (extRes.statusCode === 200) {
              const parsed = JSON.parse(data);
              res.writeHead(200);
              res.end(JSON.stringify(Array.isArray(parsed) ? parsed : []));
            } else {
              res.writeHead(200);
              res.end(JSON.stringify([]));
            }
          } catch (e) {
            res.writeHead(200);
            res.end(JSON.stringify([]));
          }
        });
      }).on('error', (err) => {
        console.error('[NOMINATIM PROXY SEARCH ERROR]', err);
        res.writeHead(200);
        res.end(JSON.stringify([]));
      });
      return;
    }

    // 6. Proxy para geocodificação reversa no Nominatim
    if (pathname === '/api/nominatim/reverse') {
      const lat = parsedUrl.searchParams.get('lat');
      const lon = parsedUrl.searchParams.get('lon');
      if (!lat || !lon) {
        res.writeHead(200);
        res.end(JSON.stringify({}));
        return;
      }
      const targetUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
      const options = {
        headers: {
          'User-Agent': 'ApostolosQuizApp/1.0 (contato@apostolosquiz.com)',
          'Accept-Language': 'pt-BR,pt;q=0.9'
        }
      };
      https.get(targetUrl, options, (extRes) => {
        let data = '';
        extRes.on('data', (chunk) => (data += chunk));
        extRes.on('end', () => {
          try {
            if (extRes.statusCode === 200) {
              const parsed = JSON.parse(data);
              res.writeHead(200);
              res.end(JSON.stringify(parsed || {}));
            } else {
              res.writeHead(200);
              res.end(JSON.stringify({}));
            }
          } catch (e) {
            res.writeHead(200);
            res.end(JSON.stringify({}));
          }
        });
      }).on('error', (err) => {
        console.error('[NOMINATIM PROXY REVERSE ERROR]', err);
        res.writeHead(200);
        res.end(JSON.stringify({}));
      });
      return;
    }

    // 6. Rota: /api/rooms (Salas de Disputa em Grupo até 20 amigos)
    if (pathname === '/api/rooms') {
      const db = getDatabase();
      if (req.method === 'GET') {
        const sanitized = (db.rooms || []).map((r) => ({
          id: r.id,
          name: r.name,
          createdBy: r.createdBy,
          createdByName: r.createdByName,
          creatorTitle: r.creatorTitle,
          membersCount: (r.members || []).length,
          maxMembers: r.maxMembers || 20,
          status: r.status,
          level: r.level,
          totalQuestions: r.totalQuestions,
          currentQuestionIndex: r.currentQuestionIndex,
          hasPasscode: Boolean(r.passcode),
          createdAt: r.createdAt
        }));
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, rooms: sanitized }));
        return;
      }

      if (req.method === 'POST') {
        const body = await readRequestBody(req);
        if (!body.name || !body.passcode) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Nome e palavra-chave são obrigatórios' }));
          return;
        }

        const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newRoom = {
          id: roomId,
          name: body.name.trim(),
          passcode: body.passcode.trim(),
          createdBy: body.createdBy || 'user_guest',
          createdByName: body.createdByName || 'Irmão Criador',
          creatorTitle: body.creatorTitle || 'Irmão',
          maxMembers: Math.min(20, Math.max(2, body.maxMembers || 20)),
          members: [
            {
              userId: body.createdBy || 'user_guest',
              name: body.createdByName || 'Irmão Criador',
              title: body.creatorTitle || 'Irmão',
              score: 0,
              joinedAt: new Date().toISOString()
            }
          ],
          messages: [
            {
              id: 'msg_init_' + Date.now(),
              userId: 'system',
              userName: 'Apóstolos Quiz',
              userTitle: 'Irmão',
              text: `Sala criada com sucesso! Palavra-chave definida: "${body.passcode.trim()}". Compartilhe com até 20 amigos!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSystem: true
            }
          ],
          status: 'waiting',
          level: body.level || 'basico',
          currentQuestionIndex: 0,
          totalQuestions: 10,
          questions: [],
          questionTimeLimit: 60,
          questionSecondsElapsed: 0,
          intermissionTimeLimit: 20,
          intermissionSecondsElapsed: 0,
          timeInterruptedBy: null,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        };

        if (!db.rooms) db.rooms = [];
        db.rooms.unshift(newRoom);
        saveDatabase(db);

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, room: newRoom }));
        return;
      }
    }

    // 7. Rota: /api/rooms/:id, /api/rooms/:id/join, /api/rooms/:id/action
    if (pathname.startsWith('/api/rooms/')) {
      const db = getDatabase();
      const parts = pathname.split('/').filter(Boolean); // ['api', 'rooms', roomId, subAction]
      const roomId = parts[2];
      const subAction = parts[3];

      const room = (db.rooms || []).find((r) => r.id === roomId);
      if (!room) {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: 'Sala não encontrada' }));
        return;
      }

      // Detalhes da sala
      if (!subAction && req.method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, room }));
        return;
      }

      // Entrar na sala com palavra-chave
      if (subAction === 'join' && req.method === 'POST') {
        const body = await readRequestBody(req);
        const { passcode, member, userEmail } = body;

        const senderEmail = userEmail || member?.email || '';
        const isMasterAdmin =
          senderEmail.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase() ||
          member?.userId === 'user_1793666097873';

        // Checa se está banido
        const foundUser = (db.users || []).find((u) => u.id === member.userId || (u.email && u.email.toLowerCase() === senderEmail.toLowerCase()));
        if (foundUser?.isBanned) {
          res.writeHead(403);
          res.end(JSON.stringify({ success: false, message: 'Seu usuário está suspenso pela moderação comunitária.' }));
          return;
        }

        const cleanInput = (passcode || '').trim().toLowerCase();
        const cleanTarget = (room.passcode || '').trim().toLowerCase();

        if (!isMasterAdmin && cleanInput !== cleanTarget) {
          res.writeHead(403);
          res.end(JSON.stringify({ success: false, message: 'Palavra-chave incorreta! Digite a palavra-chave exata.' }));
          return;
        }

        const already = (room.members || []).find((m) => m.userId === member.userId);
        if (!already && (room.members || []).length >= (room.maxMembers || 20) && !isMasterAdmin) {
          res.writeHead(403);
          res.end(JSON.stringify({ success: false, message: 'Limite de 20 membros atingido.' }));
          return;
        }

        if (!already) {
          room.members.push({
            userId: member.userId,
            name: isMasterAdmin ? `${member.name} (Admin)` : member.name,
            title: isMasterAdmin ? 'Irmão' : (member.title || 'Irmão'),
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
            text: isMasterAdmin
              ? `🛡️ O Administrador do Sistema entrou na sala com acesso de supervisão.`
              : `🔔 ${member.title || 'Irmão(ã)'} ${member.name} entrou no grupo!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
          });
        }
        saveDatabase(db);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, room }));
        return;
      }

      // Ações na sala
      if (subAction === 'action' && req.method === 'POST') {
        const body = await readRequestBody(req);
        const { action, payload } = body;

        if (action === 'send_message') {
          const senderEmail = payload.userEmail || '';
          const isMasterAdmin =
            senderEmail.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase() ||
            payload.userId === 'user_1793666097873';

          const foundUser = (db.users || []).find((u) => u.id === payload.userId || (u.email && u.email.toLowerCase() === senderEmail.toLowerCase()));
          if (foundUser?.isBanned) {
            res.writeHead(403);
            res.end(JSON.stringify({ success: false, message: 'Você foi suspenso pela moderação e não pode enviar mensagens.' }));
            return;
          }

          const rawText = (payload.text || '').trim();
          const analysis = analyzeModeration(rawText);
          let finalText = rawText;

          const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

          if (analysis.isViolating) {
            finalText = analysis.censoredText;
            if (!db.moderationAlerts) db.moderationAlerts = [];
            db.moderationAlerts.unshift({
              id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              roomId: room.id,
              roomName: room.name,
              messageId: msgId,
              userId: payload.userId,
              userName: payload.userName,
              userTitle: payload.userTitle || 'Irmão',
              originalText: rawText,
              category: analysis.category || 'nocivo',
              reason: analysis.reason || 'Conteúdo impróprio',
              createdAt: new Date().toISOString(),
              status: 'pending'
            });
            console.warn(`[MODERAÇÃO BACKEND] Alerta na sala "${room.name}" por ${payload.userName}: ${analysis.reason}`);
          }

          const newMsg = {
            id: msgId,
            userId: payload.userId,
            userName: isMasterAdmin ? `${payload.userName} 🛡️` : payload.userName,
            userTitle: isMasterAdmin ? 'Administrador' : (payload.userTitle || 'Irmão'),
            userAvatar: payload.userAvatar,
            text: finalText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAdmin: isMasterAdmin,
            flagged: analysis.isViolating,
            flagCategory: analysis.category,
            flagReason: analysis.reason,
            originalText: analysis.isViolating ? rawText : undefined
          };
          room.messages.push(newMsg);
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, messages: room.messages, alertTriggered: analysis.isViolating }));
          return;
        }

        if (action === 'interrupt_timer') {
          const memberName = payload.userName || 'Um membro';
          room.timeInterruptedBy = memberName;
          room.status = 'intermission';
          room.intermissionExpiresAt = Date.now() + 20000;
          room.messages.push({
            id: 'msg_interrupt_' + Date.now(),
            userId: 'system',
            userName: 'Apóstolos Quiz',
            userTitle: 'Irmão',
            text: `⚡ ${memberName} interrompeu o tempo! Próxima questão em 20 segundos.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
          });
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, room }));
          return;
        }

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, room }));
        return;
      }
    }

    // 8. Rota: /api/admin/overview e /api/admin/action (Poderes Plenos do Administrador)
    if (pathname === '/api/admin/overview') {
      const email = parsedUrl.searchParams.get('email') || '';
      if (email.toLowerCase() !== ADMIN_MASTER_EMAIL.toLowerCase()) {
        res.writeHead(403);
        res.end(JSON.stringify({ success: false, message: 'Acesso restrito ao Administrador do Sistema.' }));
        return;
      }
      const db = getDatabase();
      const adminUser = (db.users || []).find((u) => u.email?.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase());
      if (adminUser) {
        adminUser.isAdmin = true;
        adminUser.role = 'admin';
      }
      const alerts = db.moderationAlerts || [];
      const rooms = db.rooms || [];
      const users = db.users || [];
      res.writeHead(200);
      res.end(
        JSON.stringify({
          success: true,
          alerts,
          rooms,
          users,
          stats: {
            totalUsers: users.length,
            totalRooms: rooms.length,
            pendingAlerts: alerts.filter((a) => a.status === 'pending').length
          }
        })
      );
      return;
    }

    if (pathname === '/api/admin/action' && req.method === 'POST') {
      const body = await readRequestBody(req);
      const { action, payload, adminEmail } = body;
      if (!adminEmail || adminEmail.toLowerCase() !== ADMIN_MASTER_EMAIL.toLowerCase()) {
        res.writeHead(403);
        res.end(JSON.stringify({ success: false, message: 'Acesso restrito ao Administrador do Sistema.' }));
        return;
      }
      const db = getDatabase();
      if (!db.moderationAlerts) db.moderationAlerts = [];
      if (!db.rooms) db.rooms = [];

      if (action === 'resolve_alert') {
        const alert = db.moderationAlerts.find((a) => a.id === payload.alertId);
        if (alert) {
          alert.status = 'resolved';
          alert.actionTaken = payload.actionTaken || 'Resolvido pelo Administrador';
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Alerta marcado como resolvido.' }));
          return;
        }
      }

      if (action === 'dismiss_alert') {
        const alert = db.moderationAlerts.find((a) => a.id === payload.alertId);
        if (alert) {
          alert.status = 'dismissed';
          alert.actionTaken = 'Dispensado (Falso Positivo)';
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Alerta dispensado.' }));
          return;
        }
      }

      if (action === 'delete_message') {
        const { roomId, messageId } = payload;
        const room = db.rooms.find((r) => r.id === roomId);
        if (room) {
          room.messages = room.messages.filter((m) => m.id !== messageId);
          const alert = db.moderationAlerts.find((a) => a.messageId === messageId);
          if (alert) {
            alert.status = 'resolved';
            alert.actionTaken = 'Mensagem apagada pelo Administrador';
          }
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Mensagem apagada com sucesso da sala.' }));
          return;
        }
      }

      if (action === 'warn_user') {
        const { roomId, userId, userName, reason } = payload;
        const room = db.rooms.find((r) => r.id === roomId);
        if (room) {
          room.messages.push({
            id: 'msg_warn_' + Date.now(),
            userId: 'system',
            userName: '🛡️ Moderação do Sistema',
            userTitle: 'Administrador',
            text: `⚠️ ADVERTÊNCIA FORMAL para ${userName}: ${reason || 'Comportamento inadequado. Mantenha o respeito e a santidade.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSystem: true
          });
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: `Advertência enviada para ${userName}.` }));
          return;
        }
      }

      if (action === 'kick_member') {
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
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Membro expulso da sala.' }));
          return;
        }
      }

      if (action === 'ban_user') {
        const { userId, reason } = payload;
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          user.isBanned = true;
          user.banReason = reason || 'Violação recorrente das diretrizes comunitárias';
        }
        db.rooms.forEach((r) => {
          r.members = r.members.filter((m) => m.userId !== userId);
        });
        saveDatabase(db);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: `Usuário suspenso do sistema.` }));
        return;
      }

      if (action === 'unban_user') {
        const { userId } = payload;
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          user.isBanned = false;
          user.banReason = undefined;
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: `Suspensão revogada para ${user.name}.` }));
          return;
        }
      }

      if (action === 'delete_room') {
        const { roomId } = payload;
        const idx = db.rooms.findIndex((r) => r.id === roomId);
        if (idx !== -1) {
          const removed = db.rooms.splice(idx, 1)[0];
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: `Sala "${removed.name}" excluída com sucesso.` }));
          return;
        }
      }

      if (action === 'delete_user') {
        const { userId } = payload;
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          if (user.email && user.email.trim().toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase()) {
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: 'O Administrador Geral não pode ser excluído.' }));
            return;
          }
          db.users = db.users.filter((u) => u.id !== userId);
          db.rooms.forEach((r) => {
            r.members = r.members.filter((m) => m.userId !== userId);
          });
          if (db.leaderboard) {
            db.leaderboard = db.leaderboard.filter((lb) => lb.userId !== userId);
          }
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: `Usuário "${user.name}" excluído definitivamente do sistema.` }));
          return;
        }
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, message: 'Usuário não encontrado.' }));
        return;
      }

      if (action === 'clear_chat') {
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
          saveDatabase(db);
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, message: 'Histórico do chat limpo com sucesso.' }));
          return;
        }
      }

      res.writeHead(400);
      res.end(JSON.stringify({ success: false, message: 'Ação não reconhecida.' }));
      return;
    }

    // Rota não encontrada
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, message: `Rota ${pathname} não encontrada no servidor backend.` }));
  } catch (err) {
    console.error('[API SERVER] Erro interno:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: String(err) }));
  }
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SERVIDOR DE BANCO DE DADOS ATIVO NA PORTA ${PORT}`);
  console.log(`📁 Armazenamento: ${DB_FILE}`);
  console.log(`📡 Endpoints disponíveis:`);
  console.log(`   - GET/POST http://localhost:${PORT}/api/profile`);
  console.log(`   - GET/POST http://localhost:${PORT}/api/progress`);
  console.log(`   - GET/POST http://localhost:${PORT}/api/sync`);
  console.log(`   - GET      http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
