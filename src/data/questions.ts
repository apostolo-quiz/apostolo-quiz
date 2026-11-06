export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  reference: string;
  explanation: string;
  xp: number;
}

export interface Question {
  id: number;
  apostleRef: string;
  question: string;
  options: string[];
  correctIndex: number;
  reference: string;
  xp: number;
}

export const BIBLICAL_QUESTIONS: Question[] = [
  {
    id: 1,
    apostleRef: 'Apóstolo Pedro',
    question: 'Qual foi o discípulo que andou sobre as águas em direção a Jesus no Mar da Galileia?',
    options: ['Pedro', 'João', 'Tiago Maior', 'André'],
    correctIndex: 0,
    reference: 'Mateus 14:29',
    xp: 250
  },
  {
    id: 2,
    apostleRef: 'Visão de Patmos (Jesus Glorificado)',
    question: 'Segundo Apocalipse 1:14-15, como João descreve os cabelos, os olhos e os pés de Jesus glorificado?',
    options: [
      'Cabelos pretos, olhos serenos e pés de barro',
      'Cabelos brancos como lã, olhos como chama de fogo e pés como bronze reluzente',
      'Cabelos dourados, olhos azuis e sandálias de ouro',
      'Cabelos grisalhos, olhos brilhantes e pés como ferro'
    ],
    correctIndex: 1,
    reference: 'Apocalipse 1:14-15',
    xp: 350
  },
  {
    id: 3,
    apostleRef: 'Apóstolo João e Tiago',
    question: 'Qual nome Jesus deu aos irmãos Tiago e João devido ao temperamento forte deles?',
    options: ['Filhos da Promessa', 'Boanerges (Filhos do Trovão)', 'Colunas de Jerusalém', 'Pescadores de Almas'],
    correctIndex: 1,
    reference: 'Marcos 3:17',
    xp: 300
  },
  {
    id: 4,
    apostleRef: 'Apóstolo Matias',
    question: 'Quem foi escolhido por sorteio entre os discípulos para substituir Judas Iscariotes e completar os 12 Apóstolos?',
    options: ['Barnabé', 'Paulo de Tarso', 'Matias', 'José, chamado Barsabás'],
    correctIndex: 2,
    reference: 'Atos 1:26',
    xp: 400
  }
];
