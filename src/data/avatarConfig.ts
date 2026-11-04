export type GenderType = 'male' | 'female';
export type EthnicityType = 'branco' | 'negro' | 'pardo' | 'indigena' | 'asiatico';
export type AgeStageType = 'crianca' | 'jovem' | 'adulto' | 'idoso';
export type OutfitType = 'rigor' | 'casual' | 'medieval' | 'vestido' | 'saia' | 'moletom';
export type HeadSizeType = 'grande' | 'media' | 'pequena';
export type HairStyleType = 'calvo' | 'curto' | 'longo' | 'coque';
export type HairColorType = 'loiro' | 'castanho' | 'preto' | 'ruivo' | 'grisalho';
export type EyeColorType = 'castanho' | 'verde' | 'azul' | 'mel' | 'mesclado';
export type BeardStyleType = 'sem_barba' | 'curta' | 'longa' | 'bigode';
export type BeardColorType = 'loiro' | 'castanho' | 'preto' | 'ruivo' | 'grisalho';
export type BodyType = 'magro' | 'atletico' | 'forte' | 'gordo';

export interface AvatarState {
  gender: GenderType;
  ethnicity: EthnicityType;
  ageStage?: AgeStageType;
  outfit: OutfitType;
  headSize: HeadSizeType;
  hairStyle: HairStyleType;
  hairColor: HairColorType;
  eyeColor: EyeColorType;
  beardStyle: BeardStyleType;
  beardColor: BeardColorType;
  bodyType: BodyType;
  birthDate: string;
  calculatedAge: number;
  imageUrl?: string;
  // Campos legados para compatibilidade
  skinTone?: string;
  bodyBuild?: string;
  noseType?: string;
  facialHair?: string;
  outfitMode?: 'biblical' | 'contemporary';
  outfitStyle?: string;
  accessory?: string;
  ageGroup?: string;
}

export function calculateAgeFromBirthDate(birthDateStr: string): number {
  if (!birthDateStr) return 40;
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return 40;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day) || year < 1900 || year > new Date().getFullYear()) {
    return 40;
  }
  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return age >= 0 && age <= 130 ? age : 40;
}

export function getAgeGroupFromAge(age: number): string {
  if (age <= 25) return 'young';
  if (age <= 45) return 'adult';
  if (age <= 60) return 'senior';
  return 'elder';
}

/**
 * 4 Faixas Etárias Oficiais
 */
export const AGE_STAGES = [
  { id: 'crianca' as AgeStageType, label: 'Criança', sublabel: 'Infantil (~8 a 10 anos)', icon: '🧒' },
  { id: 'jovem' as AgeStageType, label: 'Jovem', sublabel: 'Mocidade (~18 a 22 anos)', icon: '🧑' },
  { id: 'adulto' as AgeStageType, label: 'Adulto', sublabel: 'Maturidade (~35 a 45 anos)', icon: '👨' },
  { id: 'idoso' as AgeStageType, label: 'Idoso', sublabel: 'Melhor Idade (~65+ anos)', icon: '👴' }
];

/**
 * 5 Etnias Brasileiras (IBGE): Pardos, Brancos, Pretos, Indígenas e Amarelos
 * Padrão Coeso Solicitado:
 * - Todos os homens e meninos: Calça Jeans, Camisa Polo e Tênis
 * - Todas as mulheres e meninas: Vestido, Sandálias e Cabelos Longos
 * - Cores das roupas exclusivas e harmônicas por etnia
 */
export const ETHNICITY_PALETTE: Record<
  EthnicityType,
  {
    label: string;
    color: string;
    desc: string;
    maleImg: string;
    femaleImg: string;
    maleClothing: string;
    femaleClothing: string;
    themeColor: string;
    borderColor: string;
  }
> = {
  pardo: {
    label: 'Pardos',
    color: '#B48259',
    desc: 'Miscigenação brasileira viva e acolhedora',
    maleImg: '/avatar_pardo_masc_adulto.jpg',
    femaleImg: '/avatar_pardo_fem_adulto.jpg',
    maleClothing: 'Polo Azul Marinho, Calça Jeans e Tênis',
    femaleClothing: 'Vestido Verde Esmeralda, Sandálias e Cabelos Longos',
    themeColor: '#059669',
    borderColor: '#34D399'
  },
  branco: {
    label: 'Brancos',
    color: '#F8D5C2',
    desc: 'Descendência euro-brasileira',
    maleImg: '/avatar_branco_masc_adulto.jpg',
    femaleImg: '/avatar_branco_fem_adulto.jpg',
    maleClothing: 'Polo Vinho Bordô, Calça Jeans e Tênis',
    femaleClothing: 'Vestido Azul Royal, Sandálias e Cabelos Longos',
    themeColor: '#2563EB',
    borderColor: '#60A5FA'
  },
  negro: {
    label: 'Pretos',
    color: '#3D2314',
    desc: 'Afro-brasileiro com presença nobre e vibrante',
    maleImg: '/avatar_preto_masc_adulto.jpg',
    femaleImg: '/avatar_preto_fem_adulto.jpg',
    maleClothing: 'Polo Amarela Mostarda, Calça Jeans e Tênis',
    femaleClothing: 'Vestido Terracota Dourado, Sandálias e Cabelos Longos',
    themeColor: '#D97706',
    borderColor: '#FBBF24'
  },
  indigena: {
    label: 'Indígenas',
    color: '#C27343',
    desc: 'Povos originários do Brasil',
    maleImg: '/avatar_indigena_masc_adulto.jpg',
    femaleImg: '/avatar_indigena_fem_adulto.jpg',
    maleClothing: 'Polo Verde Oliva, Calça Jeans e Tênis',
    femaleClothing: 'Vestido Coral Terra, Sandálias e Cabelos Longos',
    themeColor: '#EA580C',
    borderColor: '#FB923C'
  },
  asiatico: {
    label: 'Amarelos',
    color: '#F2D0A4',
    desc: 'Asiático-brasileiro',
    maleImg: '/avatar_amarelo_masc_adulto.jpg',
    femaleImg: '/avatar_amarelo_fem_adulto.jpg',
    maleClothing: 'Polo Azul Aço Grafite, Calça Jeans e Tênis',
    femaleClothing: 'Vestido Lilás Suave, Sandálias e Cabelos Longos',
    themeColor: '#9333EA',
    borderColor: '#C084FC'
  }
};

/**
 * Cores de Cabelo e Barba
 */
export const HAIR_COLORS_MAP: Record<
  HairColorType,
  { label: string; color: string; border: string }
> = {
  loiro: { label: 'Loiro', color: '#EAB308', border: '#FDE047' },
  castanho: { label: 'Castanho', color: '#5C3A21', border: '#8B5A2B' },
  preto: { label: 'Preto', color: '#18181B', border: '#3F3F46' },
  ruivo: { label: 'Ruivo', color: '#B91C1C', border: '#EF4444' },
  grisalho: { label: 'Grisalho', color: '#94A3B8', border: '#E2E8F0' }
};

/**
 * Cores dos Olhos
 */
export const EYE_COLORS_MAP: Record<
  EyeColorType,
  { label: string; leftColor: string; rightColor: string }
> = {
  castanho: { label: 'Castanhos', leftColor: '#5C3A21', rightColor: '#5C3A21' },
  verde: { label: 'Verdes', leftColor: '#10B981', rightColor: '#10B981' },
  azul: { label: 'Azul', leftColor: '#3B82F6', rightColor: '#3B82F6' },
  mel: { label: 'Mel / Âmbar', leftColor: '#F59E0B', rightColor: '#F59E0B' },
  mesclado: { label: 'Mesclado (Bicolor)', leftColor: '#3B82F6', rightColor: '#F59E0B' }
};

/**
 * 6 Modelos de Roupas
 */
export const OUTFIT_MAP: Record<
  OutfitType,
  { label: string; primary: string; secondary: string; border: string; glow: string; desc: string }
> = {
  rigor: {
    label: 'A Rigor',
    primary: '#0F172A',
    secondary: '#F8FAFC',
    border: '#E2E8F0',
    glow: 'rgba(226, 232, 240, 0.45)',
    desc: 'Terno de gala refinado com camisa social branca e lapela acetinada'
  },
  casual: {
    label: 'Casual',
    primary: '#2563EB',
    secondary: '#93C5FD',
    border: '#60A5FA',
    glow: 'rgba(96, 165, 250, 0.45)',
    desc: 'Camiseta casual de algodão, calça jeans e tênis moderno'
  },
  medieval: {
    label: 'Medieval',
    primary: '#78350F',
    secondary: '#F59E0B',
    border: '#FBBF24',
    glow: 'rgba(251, 191, 36, 0.5)',
    desc: 'Túnica bíblica tradicional em linho com manto e detalhes em ouro'
  },
  vestido: {
    label: 'Vestido',
    primary: '#047857',
    secondary: '#FDE047',
    border: '#34D399',
    glow: 'rgba(52, 211, 153, 0.45)',
    desc: 'Vestido gracioso e modesto com bordados finos'
  },
  saia: {
    label: 'Saia',
    primary: '#831843',
    secondary: '#FBCFE8',
    border: '#F472B6',
    glow: 'rgba(244, 114, 182, 0.45)',
    desc: 'Conjunto clássico de saia de cintura alta com blusa suave'
  },
  moletom: {
    label: 'Moletom',
    primary: '#475569',
    secondary: '#F97316',
    border: '#94A3B8',
    glow: 'rgba(148, 163, 184, 0.45)',
    desc: 'Moletom contemporâneo com capuz caído nos ombros e cordões'
  }
};

/**
 * Escala da Cabeça
 */
export const HEAD_SIZES_MAP: Record<HeadSizeType, { label: string; scale: number; desc: string }> = {
  grande: { label: 'Cabeça Grande', scale: 1.18, desc: 'Zoom no rosto, estilo chibi e expressivo' },
  media: { label: 'Cabeça Média', scale: 1.05, desc: 'Proporção equilibrada padrão de estúdio' },
  pequena: { label: 'Cabeça Pequena', scale: 0.92, desc: 'Visão ampla da miniatura no pedestal' }
};

/**
 * Porte Físico / Corpo
 */
export const BODY_TYPES_MAP: Record<
  BodyType,
  { label: string; desc: string; iconScale: string }
> = {
  magro: { label: 'Magro', desc: 'Silhueta esguia e ombros estreitos', iconScale: 'scale-90' },
  atletico: { label: 'Atlético', desc: 'Porte atlético proporcional em V', iconScale: 'scale-100' },
  forte: { label: 'Forte', desc: 'Porte robusto musculoso com ombros largos', iconScale: 'scale-110' },
  gordo: { label: 'Gordo', desc: 'Porte corpulento com silhueta arredondada', iconScale: 'scale-115' }
};

export const AVATAR_OPTIONS = {
  gender: [
    { id: 'male' as GenderType, label: '👨 Irmão (Masculino)' },
    { id: 'female' as GenderType, label: '👩 Irmã (Feminino)' }
  ],
  ethnicity: [
    { id: 'branco' as EthnicityType, label: 'Branco(a)' },
    { id: 'negro' as EthnicityType, label: 'Negro(a)' },
    { id: 'pardo' as EthnicityType, label: 'Pardo(a)' },
    { id: 'indigena' as EthnicityType, label: 'Indígena' },
    { id: 'asiatico' as EthnicityType, label: 'Asiático(a)' }
  ],
  outfit: [
    { id: 'rigor' as OutfitType, label: 'A Rigor' },
    { id: 'casual' as OutfitType, label: 'Casual' },
    { id: 'medieval' as OutfitType, label: 'Medieval' },
    { id: 'vestido' as OutfitType, label: 'Vestido' },
    { id: 'saia' as OutfitType, label: 'Saia' },
    { id: 'moletom' as OutfitType, label: 'Moletom' }
  ],
  headSize: [
    { id: 'grande' as HeadSizeType, label: 'Grande' },
    { id: 'media' as HeadSizeType, label: 'Média' },
    { id: 'pequena' as HeadSizeType, label: 'Pequena' }
  ],
  hairStyle: [
    { id: 'calvo' as HairStyleType, label: 'Calvo' },
    { id: 'curto' as HairStyleType, label: 'Curto' },
    { id: 'longo' as HairStyleType, label: 'Longo' },
    { id: 'coque' as HairStyleType, label: 'Coque' }
  ],
  hairColor: [
    { id: 'loiro' as HairColorType, label: 'Loiro' },
    { id: 'castanho' as HairColorType, label: 'Castanho' },
    { id: 'preto' as HairColorType, label: 'Preto' },
    { id: 'ruivo' as HairColorType, label: 'Ruivo' },
    { id: 'grisalho' as HairColorType, label: 'Grisalho' }
  ],
  eyeColor: [
    { id: 'castanho' as EyeColorType, label: 'Castanhos' },
    { id: 'verde' as EyeColorType, label: 'Verdes' },
    { id: 'azul' as EyeColorType, label: 'Azul' },
    { id: 'mel' as EyeColorType, label: 'Mel' },
    { id: 'mesclado' as EyeColorType, label: 'Mesclado' }
  ],
  beardStyle: [
    { id: 'sem_barba' as BeardStyleType, label: 'Sem Barba' },
    { id: 'curta' as BeardStyleType, label: 'Curta' },
    { id: 'longa' as BeardStyleType, label: 'Longa' },
    { id: 'bigode' as BeardStyleType, label: 'Bigode' }
  ],
  beardColor: [
    { id: 'loiro' as BeardColorType, label: 'Loiro' },
    { id: 'castanho' as BeardColorType, label: 'Castanho' },
    { id: 'preto' as BeardColorType, label: 'Preto' },
    { id: 'ruivo' as BeardColorType, label: 'Ruivo' },
    { id: 'grisalho' as BeardColorType, label: 'Grisalho' }
  ],
  bodyType: [
    { id: 'magro' as BodyType, label: 'Magro' },
    { id: 'atletico' as BodyType, label: 'Atlético' },
    { id: 'forte' as BodyType, label: 'Forte' },
    { id: 'gordo' as BodyType, label: 'Gordo' }
  ],

  // Legados mantidos para compatibilidade
  skinTone: [
    { id: 'pardo_light', label: 'Pardo Claro', color: '#D2A679' },
    { id: 'pardo_medium', label: 'Pardo Médio', color: '#A67B5B' },
    { id: 'white_fair', label: 'Branca Clara', color: '#F5CBA7' },
    { id: 'black_dark', label: 'Negro Retinto', color: '#3D2314' },
    { id: 'indigenous', label: 'Indígena', color: '#C27343' },
    { id: 'asian', label: 'Asiático', color: '#F2D0A4' }
  ],
  facialHair: [
    { id: 'none', label: 'Sem Barba' },
    { id: 'stubble', label: 'Barba Curta' },
    { id: 'full_groomed', label: 'Barba Longa' },
    { id: 'goatee', label: 'Bigode' }
  ],
  outfitStyle: {
    biblical: [
      { id: 'master_navy', label: 'A Rigor' },
      { id: 'disciple_brown', label: 'Casual' },
      { id: 'evangelist_ochre', label: 'Medieval' }
    ],
    contemporary: [
      { id: 'pastor_suit', label: 'A Rigor' },
      { id: 'modest_dress', label: 'Vestido' }
    ]
  },
  accessory: [
    { id: 'none', label: 'Nenhum' },
    { id: 'scroll', label: 'Bíblia / Pergaminho' },
    { id: 'glasses', label: 'Óculos' },
    { id: 'harp', label: 'Harpa' },
    { id: 'staff', label: 'Cajado' },
    { id: 'veil', label: 'Véu' }
  ]
};

export const DEFAULT_AVATAR_STATE: AvatarState = {
  gender: 'male',
  ethnicity: 'pardo',
  ageStage: 'adulto',
  outfit: 'casual',
  headSize: 'media',
  hairStyle: 'curto',
  hairColor: 'preto',
  eyeColor: 'castanho',
  beardStyle: 'sem_barba',
  beardColor: 'preto',
  bodyType: 'atletico',
  birthDate: '1983-05-14',
  calculatedAge: 40,
  imageUrl: '/avatar_pardo_masc_adulto.jpg',
  skinTone: 'pardo_light',
  facialHair: 'stubble',
  outfitMode: 'biblical',
  outfitStyle: 'master_navy',
  accessory: 'scroll'
};

export const BIOTYPE_PRESETS = [
  {
    id: 'm1_pardo',
    category: 'Masculino',
    name: 'Irmão Pardo',
    description: 'Pardo, camisa polo, calça jeans e tênis.',
    previewImage: '/avatar_pardo_masc_adulto.jpg',
    config: {
      ...DEFAULT_AVATAR_STATE,
      gender: 'male' as GenderType,
      ethnicity: 'pardo' as EthnicityType,
      imageUrl: '/avatar_pardo_masc_adulto.jpg'
    }
  },
  {
    id: 'm2_negro',
    category: 'Masculino',
    name: 'Irmão Negro',
    description: 'Negro, camisa polo, calça jeans e tênis.',
    previewImage: '/avatar_preto_masc_adulto.jpg',
    config: {
      ...DEFAULT_AVATAR_STATE,
      gender: 'male' as GenderType,
      ethnicity: 'negro' as EthnicityType,
      imageUrl: '/avatar_preto_masc_adulto.jpg'
    }
  },
  {
    id: 'm3_branco',
    category: 'Masculino',
    name: 'Irmão Branco',
    description: 'Branco, camisa polo, calça jeans e tênis.',
    previewImage: '/avatar_branco_masc_adulto.jpg',
    config: {
      ...DEFAULT_AVATAR_STATE,
      gender: 'male' as GenderType,
      ethnicity: 'branco' as EthnicityType,
      imageUrl: '/avatar_branco_masc_adulto.jpg'
    }
  },
  {
    id: 'm4_indigena',
    category: 'Masculino',
    name: 'Irmão Indígena',
    description: 'Indígena, camisa polo, calça jeans e tênis.',
    previewImage: '/avatar_indigena_masc_adulto.jpg',
    config: {
      ...DEFAULT_AVATAR_STATE,
      gender: 'male' as GenderType,
      ethnicity: 'indigena' as EthnicityType,
      imageUrl: '/avatar_indigena_masc_adulto.jpg'
    }
  },
  {
    id: 'm5_asiatico',
    category: 'Masculino',
    name: 'Irmão Amarelo',
    description: 'Amarelo, camisa polo, calça jeans e tênis.',
    previewImage: '/avatar_amarelo_masc_adulto.jpg',
    config: {
      ...DEFAULT_AVATAR_STATE,
      gender: 'male' as GenderType,
      ethnicity: 'asiatico' as EthnicityType,
      imageUrl: '/avatar_amarelo_masc_adulto.jpg'
    }
  }
];
