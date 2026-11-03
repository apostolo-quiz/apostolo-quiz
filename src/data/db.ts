// Banco de Dados Local e Serviço de Persistência - Apóstolos Quiz Bíblico
// Suporta Membros (Irmão/Irmã), Igrejas, Ministérios, Pagamentos e Progresso

export interface UserProfile {
  id: string;
  name: string;
  gender: 'male' | 'female';
  title: 'Irmão' | 'Irmã';
  email: string;
  photoUrl: string;
  avatarConfig?: any; // Configuração visual detalhada do avatar 3D montado
  birthDate: string;
  age: number;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  churchName: string;
  ministry: string; // Ex: Pastor, Presbítero, Diácono, Diaconisa, Líder de Louvor, Membro
  isVip: boolean;
  registeredAt: string;
}

export interface ChurchRecord {
  id: string;
  name: string;
  city: string;
  state: string;
  pastorLeader: string;
  ministriesCount: {
    pastores: number;
    presbiteros: number;
    diaconos: number;
    diaconisas: number;
    louvor: number;
    membros: number;
  };
  address: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
  isLiveDiscovered?: boolean;
  category?: 'assembleia' | 'deus_e_amor' | 'batista' | 'presbiteriana' | 'quadrangular' | 'congregacao_crista' | 'adventista' | 'metodista' | 'outras';
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  userTitle: string;
  amount: number;
  prizeFund30: number; // 30% da receita retida
  operationalFund70: number; // 70% operacional
  paymentMethod: 'pix' | 'credit_card';
  status: 'approved' | 'pending';
  pixCode?: string;
  createdAt: string;
}

// Mapeamento Inicial de Congregações e seus Ministérios
export const DEFAULT_CHURCHES: ChurchRecord[] = [
  {
    id: 'church_ad_sa',
    name: 'Assembleia de Deus - Ministério Santo André',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Ministério Independente',
    ministriesCount: { pastores: 5, presbiteros: 15, diaconos: 30, diaconisas: 25, louvor: 40, membros: 800 },
    address: 'Santo André - SP',
    lat: -23.6595,
    lng: -46.5298,
    category: 'assembleia'
  },
  {
    id: 'church_ad_humaita_951',
    name: 'Assembleia de Deus - Vila Humaitá',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 3, presbiteros: 8, diaconos: 15, diaconisas: 12, louvor: 20, membros: 350 },
    address: 'Avenida Queirós Filho, 951 - Vila Humaitá',
    lat: -23.67189,
    lng: -46.50451,
    category: 'assembleia'
  },
  {
    id: 'church_ad_antonio_cardoso',
    name: 'Assembleia de Deus - 2º Subdistrito',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 2, presbiteros: 7, diaconos: 12, diaconisas: 10, louvor: 18, membros: 300 },
    address: 'Avenida Antônio Cardoso, Parque Central',
    lat: -23.64440,
    lng: -46.52379,
    category: 'assembleia'
  },
  {
    id: 'church_ad_palmares',
    name: 'Assembleia de Deus - Vila Palmares',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 2, presbiteros: 6, diaconos: 10, diaconisas: 8, louvor: 15, membros: 220 },
    address: 'Rua Virgílio Di Cicco - Vila Palmares',
    lat: -23.65317,
    lng: -46.55856,
    category: 'assembleia'
  },
  {
    id: 'church_ad_scarpelli',
    name: 'Assembleia de Deus - Vila Scarpelli',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 2, presbiteros: 5, diaconos: 11, diaconisas: 9, louvor: 14, membros: 240 },
    address: 'Rua Dom Silvério Pimenta, 370 - Vila Scarpelli',
    lat: -23.67727,
    lng: -46.54766,
    category: 'assembleia'
  },
  {
    id: 'church_ad_vitoria',
    name: 'Assembleia de Deus - Vila Vitória',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 2, presbiteros: 6, diaconos: 12, diaconisas: 10, louvor: 16, membros: 260 },
    address: 'Rua Bororé, 159 - Vila Vitória',
    lat: -23.68741,
    lng: -46.51192,
    category: 'assembleia'
  },
  {
    id: 'church_ad_tibirica',
    name: 'Assembleia de Deus - Vila Tibiriçá',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 2, presbiteros: 5, diaconos: 10, diaconisas: 8, louvor: 14, membros: 210 },
    address: 'Avenida Dom Pedro I - Vila Tibiriçá',
    lat: -23.69157,
    lng: -46.50597,
    category: 'assembleia'
  },
  {
    id: 'church_ipda_martim_francisco',
    name: 'Igreja Pentecostal Deus é Amor - IPDA (Av. Martim Francisco)',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 2, presbiteros: 6, diaconos: 14, diaconisas: 12, louvor: 18, membros: 350 },
    address: 'Avenida Martim Francisco - Vila Regina / 2º Subdistrito',
    lat: -23.6331,
    lng: -46.5165,
    category: 'deus_e_amor'
  },
  {
    id: 'church_ipda_basileia',
    name: 'Igreja Pentecostal Deus é Amor - IPDA (Parque Novo Oratório)',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 2, presbiteros: 5, diaconos: 12, diaconisas: 10, louvor: 15, membros: 280 },
    address: 'Rua Basiléia - Parque Novo Oratório',
    lat: -23.6385,
    lng: -46.5012,
    category: 'deus_e_amor'
  },
  {
    id: 'church_ipda_adriatico',
    name: 'Igreja Pentecostal Deus é Amor - IPDA (Jd. do Estádio)',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 2, presbiteros: 5, diaconos: 10, diaconisas: 9, louvor: 12, membros: 230 },
    address: 'Rua Adriático - Jardim do Estádio',
    lat: -23.7020,
    lng: -46.5192,
    category: 'deus_e_amor'
  },
  {
    id: 'church_paz_e_vida_sa',
    name: 'Igreja Paz e Vida - Santo André',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 3, presbiteros: 8, diaconos: 16, diaconisas: 14, louvor: 25, membros: 480 },
    address: 'Rua Coronel Alfredo Fláquer, 516 - Vila Assunção',
    lat: -23.6621,
    lng: -46.5312,
    category: 'outras'
  },
  {
    id: 'church_presb_indep_sa',
    name: 'Primeira Igreja Presbiteriana Independente de Santo André',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Rev. Titular',
    ministriesCount: { pastores: 3, presbiteros: 10, diaconos: 15, diaconisas: 14, louvor: 22, membros: 550 },
    address: 'Rua Coronel Francisco Amaro - Centro',
    lat: -23.6578,
    lng: -46.5332,
    category: 'presbiteriana'
  },
  {
    id: 'church_batista_1_sa',
    name: '1ª Igreja Batista de Santo André',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pr. Titular',
    ministriesCount: { pastores: 4, presbiteros: 12, diaconos: 20, diaconisas: 18, louvor: 30, membros: 700 },
    address: 'Rua São Vicente - Jardim',
    lat: -23.6542,
    lng: -46.5348,
    category: 'batista'
  },
  {
    id: 'church_batista_central_sa',
    name: 'Igreja Batista Central de Santo André',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pr. Local',
    ministriesCount: { pastores: 3, presbiteros: 9, diaconos: 18, diaconisas: 15, louvor: 24, membros: 500 },
    address: 'Avenida Industrial - Jardim',
    lat: -23.6515,
    lng: -46.5385,
    category: 'batista'
  },
  {
    id: 'church_quadrangular_sa',
    name: 'Igreja do Evangelho Quadrangular - Santo André',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 3, presbiteros: 8, diaconos: 16, diaconisas: 14, louvor: 22, membros: 420 },
    address: 'Rua José Lins do Rego - Vila Alice',
    lat: -23.6685,
    lng: -46.5355,
    category: 'quadrangular'
  },
  {
    id: 'church_bola_de_neve_sa',
    name: 'Bola de Neve Church - Santo André',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 3, presbiteros: 8, diaconos: 20, diaconisas: 18, louvor: 35, membros: 650 },
    address: 'Avenida dos Estados, 4430 - 2º Subdistrito',
    lat: -23.6358,
    lng: -46.5284,
    category: 'outras'
  },
  {
    id: 'church_ccb_jardim_sa',
    name: 'Congregação Cristã no Brasil - Jardim',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Ancião Local',
    ministriesCount: { pastores: 0, presbiteros: 0, diaconos: 15, diaconisas: 12, louvor: 40, membros: 900 },
    address: 'Travessa Brigido Tinoco - Bairro Jardim',
    lat: -23.6565,
    lng: -46.5372,
    category: 'congregacao_crista'
  },
  {
    id: 'church_adventista_central_sa',
    name: 'Igreja Adventista do Sétimo Dia Central de Santo André',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pr. Local',
    ministriesCount: { pastores: 2, presbiteros: 8, diaconos: 15, diaconisas: 12, louvor: 20, membros: 450 },
    address: 'Travessa Vereador Lourenço Rondinelli, 63 - Vila Assunção',
    lat: -23.6612,
    lng: -46.5318,
    category: 'adventista'
  },
  {
    id: 'church_metodista_sa',
    name: 'Igreja Metodista em Santo André',
    city: 'Santo André',
    state: 'SP',
    pastorLeader: 'Pastor Local',
    ministriesCount: { pastores: 2, presbiteros: 6, diaconos: 12, diaconisas: 10, louvor: 18, membros: 320 },
    address: 'Rua das Figueiras - Bairro Jardim',
    lat: -23.6535,
    lng: -46.5360,
    category: 'metodista'
  },
  {
    id: 'church_ipda_sede',
    name: 'Igreja Pentecostal Deus é Amor - Sede Mundial IPDA',
    city: 'São Paulo',
    state: 'SP',
    pastorLeader: 'Diretoria IPDA',
    ministriesCount: { pastores: 20, presbiteros: 50, diaconos: 100, diaconisas: 90, louvor: 150, membros: 5000 },
    address: 'Av. do Estado, 3158 - Baixada do Glicério',
    lat: -23.5535,
    lng: -46.6260,
    category: 'deus_e_amor'
  },
  {
    id: 'church_ad_belem',
    name: 'Assembleia de Deus - Ministério do Belém (Sede)',
    city: 'São Paulo',
    state: 'SP',
    pastorLeader: 'Pr. José Wellington Bezerra da Costa',
    ministriesCount: { pastores: 15, presbiteros: 40, diaconos: 80, diaconisas: 70, louvor: 120, membros: 3500 },
    address: 'Rua Conselheiro Cotegipe, 273 - Belenzinho',
    lat: -23.5412,
    lng: -46.5955,
    category: 'assembleia'
  },
  {
    id: 'church_ad_madureira',
    name: 'Assembleia de Deus - Madureira (Sede Estadual)',
    city: 'São Paulo',
    state: 'SP',
    pastorLeader: 'Bispo Samuel Ferreira',
    ministriesCount: { pastores: 10, presbiteros: 35, diaconos: 60, diaconisas: 55, louvor: 90, membros: 2800 },
    address: 'Av. Conde de Frontin, 700 - Penha',
    lat: -23.5350,
    lng: -46.5410,
    category: 'assembleia'
  }
];

// Funções de busca de CEP via API Oficial ViaCEP
export async function fetchViaCep(rawCep: string): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  error?: boolean;
}> {
  const clean = rawCep.replace(/\D/g, '');
  if (clean.length !== 8) {
    return { street: '', neighborhood: '', city: '', state: '', error: true };
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    const data = await res.json();
    if (data.erro) {
      return { street: '', neighborhood: '', city: '', state: '', error: true };
    }
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || '',
      error: false
    };
  } catch (err) {
    return { street: '', neighborhood: '', city: '', state: '', error: true };
  }
}

// Helpers de Banco Local (LocalStorage)
export function getSavedUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('apostolos_user_profile');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('apostolos_user_profile', JSON.stringify(profile));
  localStorage.setItem('apostolos_student_name', profile.name);
  if (profile.isVip) {
    localStorage.setItem('apostolos_advanced_unlocked', 'true');
  }
  // Sincroniza em segundo plano com o banco de dados no servidor
  syncUserProfileServer(profile).catch(() => {});
}

// ==========================================
// SERVIÇOS DE PERSISTÊNCIA NO SERVIDOR (BACKEND)
// ==========================================

export function getServerApiUrl(endpoint: string): string {
  if (typeof window === 'undefined') {
    return endpoint;
  }
  const customUrl = localStorage.getItem('apostolos_server_api_url') || process.env.NEXT_PUBLIC_SERVER_API_URL;
  if (customUrl) {
    return `${customUrl.replace(/\/$/, '')}${endpoint}`;
  }
  // Em produção (Vercel/Web), usa as rotas de API nativas do Next.js
  return endpoint;
}

export async function syncUserProfileServer(profile: UserProfile): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(getServerApiUrl('/api/profile'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile })
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    return false;
  }
}

export async function fetchUserProfileServer(userId?: string, email?: string): Promise<UserProfile | null> {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (email) params.set('email', email);
    const res = await fetch(getServerApiUrl(`/api/profile?${params.toString()}`));
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.profile : null;
  } catch (err) {
    return null;
  }
}

export async function syncQuizProgressServer(
  userId: string,
  progress: {
    completedModules: number[];
    score: number;
    currentLevel?: 'basico' | 'medio' | 'avancado';
    selectedModuleId?: number;
    userName?: string;
  }
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch(getServerApiUrl('/api/progress'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        ...progress
      })
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    return false;
  }
}

export async function fetchQuizProgressServer(userId?: string): Promise<any | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(getServerApiUrl(`/api/progress?userId=${userId || ''}`));
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.progress : null;
  } catch (err) {
    return null;
  }
}

export async function fullServerSync(
  profile?: UserProfile,
  progress?: any
): Promise<{ profile?: UserProfile; progress?: any } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(getServerApiUrl('/api/sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, progress })
    });
    const data = await res.json();
    if (data.success) {
      return { profile: data.profile, progress: data.progress };
    }
    return null;
  } catch (err) {
    return null;
  }
}

export function getSavedChurches(): ChurchRecord[] {
  if (typeof window === 'undefined') return DEFAULT_CHURCHES;
  const raw = localStorage.getItem('apostolos_churches_db');
  if (!raw) {
    localStorage.setItem('apostolos_churches_db', JSON.stringify(DEFAULT_CHURCHES));
    return DEFAULT_CHURCHES;
  }
  try {
    const list: ChurchRecord[] = JSON.parse(raw);
    // Assegura que todas as congregações padrão existam na lista
    let updated = false;
    for (const def of DEFAULT_CHURCHES) {
      if (!list.some((c) => c.name.toLowerCase() === def.name.toLowerCase())) {
        list.push(def);
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem('apostolos_churches_db', JSON.stringify(list));
    }
    return list;
  } catch (e) {
    return DEFAULT_CHURCHES;
  }
}

export function registerNewChurch(church: ChurchRecord): void {
  if (typeof window === 'undefined') return;
  const list = getSavedChurches();
  const exists = list.some((c) => c.name.toLowerCase() === church.name.toLowerCase());
  if (!exists) {
    list.push(church);
    localStorage.setItem('apostolos_churches_db', JSON.stringify(list));
  }
}

export function getSavedTransactions(): PaymentTransaction[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem('apostolos_transactions');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveTransaction(t: PaymentTransaction): void {
  if (typeof window === 'undefined') return;
  const list = getSavedTransactions();
  list.unshift(t);
  localStorage.setItem('apostolos_transactions', JSON.stringify(list));
}

// ==========================================
// SERVIÇO DE GEOLOCALIZAÇÃO REAL E MAPEAMENTO
// ==========================================

// Cálculo de Distância Geográfica Real (Fórmula de Haversine)
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Reverse Geocoding por GPS (Transforma Latitude/Longitude em Endereço Real)
export async function reverseGeocodeGps(
  lat: number,
  lon: number
): Promise<{
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  fullAddress: string;
}> {
  try {
    // Usa o proxy interno para evitar erro de CORS do navegador
    let res = await fetch(`/api/nominatim/reverse?lat=${lat}&lon=${lon}`).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(`http://localhost:3001/api/nominatim/reverse?lat=${lat}&lon=${lon}`).catch(() => null);
    }
    if (res && res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      return {
        street: addr.road || addr.street || '',
        neighborhood: addr.suburb || addr.neighbourhood || addr.quarter || '',
        city: addr.city || addr.town || addr.municipality || 'Santo André',
        state: addr.state ? addr.state.substring(0, 2).toUpperCase() : 'SP',
        cep: addr.postcode ? addr.postcode.replace(/\D/g, '') : '',
        fullAddress: data.display_name || ''
      };
    }
    return {
      street: '',
      neighborhood: '',
      city: 'Santo André',
      state: 'SP',
      cep: '',
      fullAddress: ''
    };
  } catch (e) {
    return {
      street: '',
      neighborhood: '',
      city: 'Santo André',
      state: 'SP',
      cep: '',
      fullAddress: ''
    };
  }
}

// Cache em memória para buscas rápidas e sem repetição
const churchesMemoryCache: Record<string, ChurchRecord[]> = {};

// Helper para categorizar a congregação
export function categorizeChurch(name: string): ChurchRecord['category'] {
  const n = (name || '').toLowerCase();
  if (n.includes('assembl') || n.includes('ad ')) return 'assembleia';
  if (n.includes('deus é amor') || n.includes('deus e amor') || n.includes('ipda')) return 'deus_e_amor';
  if (n.includes('batist')) return 'batista';
  if (n.includes('presbiterian')) return 'presbiteriana';
  if (n.includes('quadrangular')) return 'quadrangular';
  if (n.includes('congrega') || n.includes('ccb')) return 'congregacao_crista';
  if (n.includes('adventist')) return 'adventista';
  if (n.includes('metodist')) return 'metodista';
  return 'outras';
}

// Mapeamento Abrangente de TODAS as Igrejas Evangélicas nas Proximidades
export async function searchAllNearbyEvangelicalChurches(
  city: string,
  state: string,
  userLat?: number,
  userLng?: number,
  specificQuery?: string
): Promise<ChurchRecord[]> {
  const currentCity = (city || 'Santo André').trim();
  const currentState = (state || 'SP').trim();
  const cacheKey = `${currentCity.toLowerCase()}_${currentState.toLowerCase()}_${specificQuery ? specificQuery.toLowerCase().trim() : 'all'}`;

  // 1. Checa cache em memória
  if (churchesMemoryCache[cacheKey] && churchesMemoryCache[cacheKey].length > 0) {
    return churchesMemoryCache[cacheKey];
  }

  // 2. Checa localStorage no navegador
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`apostolos_churches_cache_${cacheKey}`);
      if (cached) {
        const parsed: ChurchRecord[] = JSON.parse(cached);
        if (parsed.length > 0) {
          churchesMemoryCache[cacheKey] = parsed;
          return parsed;
        }
      }
    } catch (e) {
      // Ignora erro de cache local
    }
  }

  const queries: string[] = [];
  if (specificQuery && specificQuery.trim().length > 1) {
    queries.push(`${specificQuery.trim()} ${currentCity} ${currentState}`);
  } else {
    queries.push(`Igreja Evangélica ${currentCity} ${currentState}`);
  }

  const excludeWords = [
    'catolica',
    'católica',
    'paróquia',
    'paroquia',
    'padre',
    'santo',
    'santa',
    'senhora',
    'diocese',
    'santuario',
    'santuário',
    'imaculada',
    'judas',
    'francisco',
    'largo'
  ];

  const results: ChurchRecord[] = [];
  const seenCoords = new Set<string>();

  // Primeiro adiciona as congregações padrão que pertencem à mesma cidade
  const preMapped = DEFAULT_CHURCHES.filter(
    (c) =>
      c.city.toLowerCase() === currentCity.toLowerCase() &&
      c.state.toUpperCase() === currentState.toUpperCase()
  );

  for (const pm of preMapped) {
    let dist = pm.distanceKm;
    if (dist === undefined && userLat && userLng && pm.lat && pm.lng) {
      dist = calculateDistanceKm(userLat, userLng, pm.lat, pm.lng);
    }
    const key = pm.lat && pm.lng ? `${pm.lat.toFixed(3)}_${pm.lng.toFixed(3)}` : pm.name.toLowerCase();
    seenCoords.add(key);
    results.push({ ...pm, distanceKm: dist, category: categorizeChurch(pm.name) });
  }

  try {
    const fetchPromises = queries.map(async (q) => {
      try {
        const queryParam = encodeURIComponent(q);
        // Usa o proxy interno para evitar bloqueio de CORS no navegador
        let res = await fetch(`/api/nominatim/search?q=${queryParam}&limit=15`).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(`http://localhost:3001/api/nominatim/search?q=${queryParam}&limit=15`).catch(() => null);
        }
        if (res && res.ok) {
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        }
        return [];
      } catch (err) {
        return [];
      }
    });

    const settled = await Promise.allSettled(fetchPromises);

    settled.forEach((outcome) => {
      if (outcome.status !== 'fulfilled') return;
      const data = outcome.value;

      data.forEach((item: any, idx: number) => {
        const rawName = item.name || (item.display_name ? item.display_name.split(',')[0] : '');
        if (!rawName) return;

        const lowerName = rawName.toLowerCase();
        const lowerFull = (item.display_name || '').toLowerCase();

        // Filtra templos católicos ou não-evangélicos
        const isExcluded = excludeWords.some((w) => {
          if (w === 'santo' && (lowerName.includes('santo andré') || lowerFull.includes('santo andré'))) {
            return false;
          }
          return lowerName.includes(w) || lowerFull.includes(`paróquia ${w}`);
        });
        if (isExcluded) return;

        const addr = item.address || {};
        const road = addr.road || addr.street || '';
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || '';
        const houseNumber = addr.house_number || '';
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        if (isNaN(lat) || isNaN(lng)) return;

        const coordKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
        if (seenCoords.has(coordKey)) return;
        seenCoords.add(coordKey);

        let finalName = rawName;
        const low = finalName.toLowerCase();
        if (
          !low.startsWith('igreja') &&
          !low.startsWith('assembleia') &&
          !low.startsWith('assembléia') &&
          !low.startsWith('congregação') &&
          !low.startsWith('comunidade') &&
          !low.startsWith('bola') &&
          !low.startsWith('paz')
        ) {
          finalName = `Igreja ${finalName}`;
        }

        // Especifica bairro e rua para congregações homônimas (ex: Assembleia de Deus)
        if (
          (low === 'assembleia de deus' || low === 'assembléia de deus' || low === 'deus é amor') &&
          (suburb || road)
        ) {
          finalName = `${finalName} - ${suburb || road}${houseNumber ? ', ' + houseNumber : ''}`;
        }

        const distance =
          userLat && userLng ? calculateDistanceKm(userLat, userLng, lat, lng) : undefined;

        const fullStreetAddr = `${road ? road + (houseNumber ? ', ' + houseNumber : '') + ', ' : ''}${
          suburb ? suburb : currentCity
        }`;

        results.push({
          id: `live_church_${lat.toFixed(4)}_${lng.toFixed(4)}_${idx}`,
          name: finalName,
          city: addr.city || addr.town || currentCity,
          state: (addr.state || currentState).substring(0, 2).toUpperCase(),
          pastorLeader: 'Pastor Local Registrado',
          address: fullStreetAddr,
          lat,
          lng,
          distanceKm: distance,
          isLiveDiscovered: true,
          category: categorizeChurch(finalName),
          ministriesCount: {
            pastores: 2,
            presbiteros: 6,
            diaconos: 12,
            diaconisas: 10,
            louvor: 16,
            membros: 250
          }
        });
      });
    });
  } catch (err) {
    // Continua com o que tem
  }

  // Ordena por distância física (mais próxima primeiro)
  results.sort((a, b) => {
    if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
      return a.distanceKm - b.distanceKm;
    }
    if (a.distanceKm !== undefined) return -1;
    if (b.distanceKm !== undefined) return 1;
    return 0;
  });

  // Salva no cache
  if (results.length > 0) {
    churchesMemoryCache[cacheKey] = results;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`apostolos_churches_cache_${cacheKey}`, JSON.stringify(results));
      } catch (e) {}
    }
  }

  return results;
}

// Busca ao Vivo de Igrejas nas Redondezas via API Pública de Geocodificação (OpenStreetMap / Nominatim)
export async function searchLiveOsmChurches(
  query: string,
  city: string,
  state: string,
  userLat?: number,
  userLng?: number
): Promise<ChurchRecord[]> {
  return searchAllNearbyEvangelicalChurches(city, state, userLat, userLng, query);
}

// ==========================================
// CLIENT-SIDE LEADERBOARD (RANQUEAMENTO)
// ==========================================

export interface LeaderboardEntry {
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
  isCurrentUser?: boolean;
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch(getServerApiUrl('/api/leaderboard'));
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.leaderboard : [];
  } catch (err) {
    return [];
  }
}

