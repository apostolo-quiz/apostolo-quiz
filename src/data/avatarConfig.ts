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
  framing?: 'face' | 'full';
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
    femaleClothing: 'Vestido Chocolate, Sandálias e Cabelos Longos',
    themeColor: '#059669',
    borderColor: '#34D399'
  },
  branco: {
    label: 'Brancos',
    color: '#F8D5C2',
    desc: 'Descendência euro-brasileira',
    maleImg: '/avatar_branco_masc_adulto.jpg',
    femaleImg: '/avatar_branco_fem_adulto.jpg',
    maleClothing: 'Polo Azul Celeste, Calça Jeans e Tênis',
    femaleClothing: 'Vestido Coral Suave, Sandálias e Cabelos Longos',
    themeColor: '#2563EB',
    borderColor: '#60A5FA'
  },
  negro: {
    label: 'Pretos',
    color: '#3D2314',
    desc: 'Afro-brasileiro com presença nobre e vibrante',
    maleImg: '/avatar_preto_masc_adulto.jpg',
    femaleImg: '/avatar_preto_fem_adulto.jpg',
    maleClothing: 'Polo Vinho Bordô, Calça Jeans e Tênis',
    femaleClothing: 'Vestido Grafite Elegante, Sandálias e Cabelos Longos',
    themeColor: '#D97706',
    borderColor: '#FBBF24'
  },
  indigena: {
    label: 'Indígenas',
    color: '#C27343',
    desc: 'Povos originários do Brasil',
    maleImg: '/avatar_indigena_masc_adulto.jpg',
    femaleImg: '/avatar_indigena_fem_adulto.jpg',
    maleClothing: 'Polo Vinho Bordô, Calça Jeans e Tênis',
    femaleClothing: 'Vestido Terracota Coral, Sandálias e Cabelos Longos',
    themeColor: '#EA580C',
    borderColor: '#FB923C'
  },
  asiatico: {
    label: 'Amarelos',
    color: '#F2D0A4',
    desc: 'Asiático-brasileiro',
    maleImg: '/avatar_amarelo_masc_adulto.jpg',
    femaleImg: '/avatar_amarelo_fem_adulto.jpg',
    maleClothing: 'Polo Verde Oliva, Calça Jeans e Tênis',
    femaleClothing: 'Vestido Dourado Suave, Sandálias e Cabelos Longos',
    themeColor: '#9333EA',
    borderColor: '#C084FC'
  }
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
