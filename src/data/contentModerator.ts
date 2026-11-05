// Módulo de Moderação Automática de Conteúdo Cristão
// Detecta conteúdo nocivo, agressivo, sexual e assédio dentro dos chats de salas
// Apóstolos - Quiz Bíblico

export type ViolationCategory = 'agressivo' | 'sexual' | 'assedio' | 'nocivo' | 'politico';

export interface ModerationAnalysis {
  isViolating: boolean;
  category?: ViolationCategory;
  reason?: string;
  severity: 'baixa' | 'media' | 'alta';
  censoredText: string;
  matchedWord?: string;
}

// 1. Dicionário de termos por categoria
// Inclui variações fonéticas e gírias comuns em português
const DICTIONARY: Record<ViolationCategory, { label: string; terms: string[]; severity: 'baixa' | 'media' | 'alta' }> = {
  sexual: {
    label: 'Conteúdo Sexual / Obsceno',
    severity: 'alta',
    terms: [
      'sexo', 'porn', 'porno', 'pornografia', 'nudes', 'nude', 'pelada', 'pelado',
      'buceta', 'boceta', 'xoxota', 'xana', 'caralho', 'piroca', 'pica', 'pauzao',
      'rola', 'boquete', 'oral', 'siririca', 'masturbacao', 'punheta', 'gozar',
      'gozada', 'orgasmo', 'penetracao', 'anal', 'vagina', 'penis', 'safada', 'safadeza',
      'putaria', 'suruba', 'ménage', 'menage', 'prostituta', 'prostituto', 'puta',
      'vagabunda', 'gemer', 'gemido', 'posicao', 'foder', 'trepar', 'transar'
    ]
  },
  assedio: {
    label: 'Assédio / Constrangimento',
    severity: 'alta',
    terms: [
      'manda nudes', 'manda foto pelada', 'manda foto do corpo', 'passa o zap gostosa',
      'quero te pegar', 'vem pro motel', 'te pago pra', 'gostosa demais', 'quero te comer',
      'vem ca minha linda', 'passa o zap gatinha', 'manda foto sem roupa', 'mostra os peitos',
      'mostra a bunda', 'safadinha', 'te quero na cama', 'sou seu macho', 'delicia de mulher',
      'vem de zap', 'solteira gata', 'te dou dinheiro se', 'te persigo', 'vou atras de voce'
    ]
  },
  agressivo: {
    label: 'Agressão / Ódio / Ameaça / Ofensas',
    severity: 'alta',
    terms: [
      'vou te matar', 'vou te bater', 'vou te quebrar', 'arrombado', 'arrombada',
      'filho da puta', 'filha da puta', 'fdp', 'vai se foder', 'vai tomar no cu',
      'vsf', 'vtnc', 'desgracado', 'desgracada', 'maldito', 'maldita', 'lixo humano',
      'cala a boca seu', 'cala boca sua', 'idiota', 'imbecil', 'otario', 'otaria',
      'babaca', 'escroto', 'escrota', 'merda', 'bosta', 'corno', 'corna', 'viadinho',
      'macaco', 'preto safado', 'vadia', 'assassino', 'morra', 'se mata', 'suicidio',
      'vagabundo', 'herege safado', 'farsante', 'falso profeta', 'seu lixo'
    ]
  },
  nocivo: {
    label: 'Conteúdo Nocivo / Blasfêmia / Tóxico',
    severity: 'media',
    terms: [
      'deus e o diabo', 'jesus era um lixo', 'satana e melhor', 'adoro o diabo',
      'lucifer e senhor', 'blasfemia', 'vendo drogas', 'compro drogas', 'maconha',
      'cocaina', 'crack', 'golpe do pix', 'hackear', 'cartao clonado', 'link suspeito'
    ]
  },
  politico: {
    label: 'Propaganda / Polarização / Movimentos Políticos',
    severity: 'alta',
    terms: [
      'lula', 'bolsonaro', 'pt', 'pl', 'psol', 'pdt', 'mbl', 'comunismo', 'comunista', 'fascismo',
      'fascista', 'esquerdista', 'direitista', 'petista', 'bolsonarista', 'eleicao', 'eleicoes',
      'voto em', 'vote em', 'vote no', 'vote na', 'candidato', 'candidata', 'partido politico',
      'urna eletronica', 'golpe militar', 'politica partidaria', 'senador', 'deputado', 'vereador',
      'prefeito', 'governador', 'presidente lula', 'presidente bolsonaro', 'tarcisio', 'boulos',
      'marcal', 'pablo marcal', 'haddad', 'faz o l', 'mito', 'esquerda vs direita', 'doutrina politica',
      'campanha eleitoral', 'manifestacao politica', 'stf', 'moraes', 'alexandre de moraes'
    ]
  }
};

/**
 * Normaliza o texto removendo acentos, espaços duplicados e leetspeak
 */
export function normalizeForModeration(input: string): string {
  if (!input) return '';

  let normalized = input.toLowerCase();

  // Substitui caracteres acentuados
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Substituições de leetspeak comuns
  normalized = normalized
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7+]/g, 't');

  return normalized;
}

/**
 * Analisa o texto de uma mensagem e identifica violações comunitárias
 */
export function analyzeMessageContent(text: string): ModerationAnalysis {
  if (!text || typeof text !== 'string') {
    return { isViolating: false, severity: 'baixa', censoredText: '' };
  }

  const raw = text.trim();
  const normalized = normalizeForModeration(raw);
  // Remove pontuações e espaços extras para detectar tentativas de camuflagem (ex: "s.e.x.o", "p o r n o")
  const stripped = normalized.replace(/[^a-z0-9]/g, '');

  // 1. Checa primeiro por assédio (combinações de frases)
  for (const term of DICTIONARY.assedio.terms) {
    const normTerm = normalizeForModeration(term);
    if (normalized.includes(normTerm)) {
      return {
        isViolating: true,
        category: 'assedio',
        reason: 'Linguagem sugestiva ou tentativa de assédio / constrangimento',
        severity: DICTIONARY.assedio.severity,
        matchedWord: term,
        censoredText: '⚠️ [Mensagem retida pela moderação comunitária por conteúdo desrespeitoso]'
      };
    }
  }

  // 2. Checa por termos sexuais explícitos
  for (const term of DICTIONARY.sexual.terms) {
    const normTerm = normalizeForModeration(term);
    const regex = new RegExp(`\\b${normTerm}\\b`, 'i');
    if (regex.test(normalized) || (normTerm.length >= 4 && stripped.includes(normTerm))) {
      return {
        isViolating: true,
        category: 'sexual',
        reason: 'Termo ou referência sexual / obscena imprópria para ambiente cristão',
        severity: DICTIONARY.sexual.severity,
        matchedWord: term,
        censoredText: '⚠️ [Mensagem bloqueada por conter conteúdo sexual / obsceno]'
      };
    }
  }

  // 3. Checa por agressão, ódio e ofensas
  for (const term of DICTIONARY.agressivo.terms) {
    const normTerm = normalizeForModeration(term);
    const regex = new RegExp(`\\b${normTerm}\\b`, 'i');
    if (regex.test(normalized) || (normTerm.length >= 4 && stripped.includes(normTerm))) {
      return {
        isViolating: true,
        category: 'agressivo',
        reason: 'Agressão verbal, xingamento pesado ou incitação à violência',
        severity: DICTIONARY.agressivo.severity,
        matchedWord: term,
        censoredText: '⚠️ [Mensagem bloqueada por agressão / ofensa verbal]'
      };
    }
  }

  // 4. Checa por conteúdo nocivo / blasfêmia
  for (const term of DICTIONARY.nocivo.terms) {
    const normTerm = normalizeForModeration(term);
    if (normalized.includes(normTerm)) {
      return {
        isViolating: true,
        category: 'nocivo',
        reason: 'Conteúdo nocivo, ilícito ou blasfêmia',
        severity: DICTIONARY.nocivo.severity,
        matchedWord: term,
        censoredText: '⚠️ [Mensagem bloqueada por conduta nociva ou blasfêmia]'
      };
    }
  }

  // 5. Checa por partidarismo, propaganda ou movimentos políticos
  for (const term of DICTIONARY.politico.terms) {
    const normTerm = normalizeForModeration(term);
    const regex = new RegExp(`\\b${normTerm}\\b`, 'i');
    if (regex.test(normalized)) {
      return {
        isViolating: true,
        category: 'politico',
        reason: 'Discussão, partidarismo ou propaganda política não permitida em ambiente cristão',
        severity: DICTIONARY.politico.severity,
        matchedWord: term,
        censoredText: '🚫 [Mensagem bloqueada: Discussão ou propaganda política não é permitida no chat bíblico]'
      };
    }
  }

  return {
    isViolating: false,
    severity: 'baixa',
    censoredText: raw
  };
}
