// Servidor de Banco de Dados Backend - Apóstolos Quiz Bíblico
// Persiste Dados Pessoais (Irmão/Irmã) e Nível de Progresso do Quiz em disco

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'server-data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

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
    return db;
  } catch (err) {
    console.error('[DATABASE] Erro ao ler banco de dados:', err);
    return { users: [], quizProgress: {}, churches: [], transactions: [], lastSavedAt: new Date().toISOString() };
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
