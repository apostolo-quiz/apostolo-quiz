'use client';

import React, { useState, useEffect } from 'react';
import { ALL_27_MODULES, QuizModule, QuizQuestion } from '@/data/modulesQuizData';
import { BASIC_KIDS_100_QUESTIONS } from '@/data/basicKidsQuestions';
import {
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Lock,
  Unlock,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  QrCode,
  Copy,
  Check,
  Compass,
  Trophy,
  DollarSign,
  PieChart,
  EyeOff,
  Eye
} from 'lucide-react';

import PaymentGateway from './PaymentGateway';
import DynamicCharacterAvatar from './DynamicCharacterAvatar';
import BrazilDonationBanner from './BrazilDonationBanner';
import DonationModal from './DonationModal';
import { AvatarState } from '@/data/avatarConfig';
import { UserProfile, syncQuizProgressServer } from '@/data/db';

interface Props {
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  completedModules?: number[];
  setCompletedModules?: React.Dispatch<React.SetStateAction<number[]>>;
  userProfile?: UserProfile | null;
  onOpenRegistration?: () => void;
  avatar?: AvatarState;
  onOpenAvatarCreator?: () => void;
}

// Função de embaralhamento dinâmico (Fisher-Yates) para questões e alternativas
function shuffleQuestionWithOptions(q: QuizQuestion): QuizQuestion {
  const correctOptionText = q.options[q.correctIndex];
  // Embaralha as alternativas
  const shuffledOpts = [...q.options];
  for (let i = shuffledOpts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOpts[i], shuffledOpts[j]] = [shuffledOpts[j], shuffledOpts[i]];
  }
  const newCorrectIndex = shuffledOpts.indexOf(correctOptionText);
  return {
    ...q,
    options: shuffledOpts,
    correctIndex: newCorrectIndex,
  };
}

function getShuffledQuiz(questions: QuizQuestion[]): QuizQuestion[] {
  // Embaralha a ordem das questões e das alternativas
  const shuffledList = questions.map(shuffleQuestionWithOptions);
  for (let i = shuffledList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
  }
  return shuffledList;
}

export default function QuizArena({
  score,
  setScore,
  completedModules = [],
  setCompletedModules,
  userProfile,
  onOpenRegistration,
  avatar,
  onOpenAvatarCreator,
}: Props) {
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
  const [level, setLevel] = useState<'basico' | 'medio' | 'avancado'>('basico');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [kidsQuestionCount, setKidsQuestionCount] = useState<number>(100);

  // Sistema de Desbloqueio Pago do Nível Avançado (R$ 10,00 por usuário registrado)
  const [isAdvancedUnlocked, setIsAdvancedUnlocked] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  // Gestão Interna de Premiações (30% da receita do nível avançado separada)
  const [registeredStudentsCount, setRegisteredStudentsCount] = useState(1);
  const [showAdminFund, setShowAdminFund] = useState(false);

  // Identifica se está rodando em localhost / ambiente de teste (inicia como false para hidratação SSR consistente)
  const [isDevOrLocalhost, setIsDevOrLocalhost] = useState(false);

  // Carrega status de desbloqueio salvo no dispositivo (ou libera automaticamente em localhost)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('192.168.') ||
        window.location.hostname === '';
      setIsDevOrLocalhost(isLocal);

      const unlocked = localStorage.getItem('apostolos_advanced_unlocked');
      const savedName = localStorage.getItem('apostolos_student_name');
      const savedCount = localStorage.getItem('apostolos_students_count');

      // Em localhost ou se já desbloqueado ou VIP, libera o nível avançado imediatamente
      if (isLocal || unlocked === 'true' || userProfile?.isVip) {
        setIsAdvancedUnlocked(true);
        localStorage.setItem('apostolos_advanced_unlocked', 'true');
      }
      if (savedName) {
        setStudentName(savedName);
      }
      if (savedCount) {
        setRegisteredStudentsCount(Number(savedCount));
      }
    }
  }, [userProfile]);

  const currentModule: QuizModule =
    ALL_27_MODULES.find((m) => m.id === selectedModuleId) || ALL_27_MODULES[0];

  // Inicializa e re-embaralha as questões sempre que o módulo, nível ou quantidade mudar
  useEffect(() => {
    let rawList: QuizQuestion[];
    if (level === 'basico') {
      const shuffledAll = getShuffledQuiz(BASIC_KIDS_100_QUESTIONS);
      rawList = kidsQuestionCount >= 100 ? shuffledAll : shuffledAll.slice(0, kidsQuestionCount);
    } else {
      rawList = getShuffledQuiz(currentModule.levels[level] || currentModule.levels.basico);
    }
    setActiveQuestions(rawList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsFinished(false);
    setCorrectAnswersCount(0);
  }, [selectedModuleId, level, kidsQuestionCount]);

  const questionList: QuizQuestion[] =
    activeQuestions.length > 0
      ? activeQuestions
      : level === 'basico'
      ? BASIC_KIDS_100_QUESTIONS
      : currentModule.levels[level] || currentModule.levels.basico;
  const currentQ: QuizQuestion = questionList[currentIndex] || questionList[0];

  const handleSelectLevel = (newLevel: 'basico' | 'medio' | 'avancado') => {
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('192.168.') ||
        window.location.hostname === '');

    if (newLevel === 'avancado' && !isAdvancedUnlocked && !isLocal && !userProfile?.isVip) {
      setShowPaymentModal(true);
      return;
    }
    setLevel(newLevel);
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === currentQ.correctIndex) {
      setScore((prev) => prev + currentQ.xp);
      setCorrectAnswersCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questionList.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
      // Salva o módulo como concluído para o certificado
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('apostolos_completed_modules');
          const list: number[] = raw ? JSON.parse(raw) : [];
          if (!list.includes(selectedModuleId)) {
            list.push(selectedModuleId);
            localStorage.setItem('apostolos_completed_modules', JSON.stringify(list));
            if (setCompletedModules) {
              setCompletedModules(list);
            }
          }
          // Sincroniza o nível de progresso e XP no banco de dados do servidor
          syncQuizProgressServer(userProfile?.id || 'user_guest', {
            completedModules: list,
            score: score,
            currentLevel: level,
            selectedModuleId,
            userName: userProfile?.name || studentName
          });
        } catch (e) {}
      }
    }
  };

  const handleRestart = () => {
    let rawList: QuizQuestion[];
    if (level === 'basico') {
      const shuffledAll = getShuffledQuiz(BASIC_KIDS_100_QUESTIONS);
      rawList = kidsQuestionCount >= 100 ? shuffledAll : shuffledAll.slice(0, kidsQuestionCount);
    } else {
      rawList = getShuffledQuiz(currentModule.levels[level] || currentModule.levels.basico);
    }
    setActiveQuestions(rawList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsFinished(false);
    setCorrectAnswersCount(0);
  };

  const handleUnlockAdvanced = () => {
    if (!studentName.trim()) {
      alert('Por favor, informe o seu Nome Completo para registrar a inscrição.');
      return;
    }
    setIsAdvancedUnlocked(true);
    const newCount = registeredStudentsCount + 1;
    setRegisteredStudentsCount(newCount);

    localStorage.setItem('apostolos_advanced_unlocked', 'true');
    localStorage.setItem('apostolos_student_name', studentName.trim());
    localStorage.setItem('apostolos_students_count', String(newCount));

    setShowPaymentModal(false);
    setLevel('avancado');
  };

  const copyPixCode = () => {
    const pixPayload =
      '00020126580014br.gov.bcb.pix0136pix-apostolos-quiz@teologia.com.br520400005303986540510.005802BR5925APOSTOLOS QUIZ BIBLICO6009SAO PAULO62070503***6304ABCD';
    navigator.clipboard.writeText(pixPayload);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  // Letras das opções: 4 para Básico, 6 para Médio, 8 para Avançado
  const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // Cenário de fundo dinâmico de acordo com o módulo
  const bgImage = selectedModuleId % 2 === 0 ? '/bg_galileia.jpg' : '/bg_biblico.jpg';

  // Cálculos do Fundo de Premiações (30% reservado confidencialmente)
  const totalRevenue = registeredStudentsCount * 10;
  const prizePool30 = totalRevenue * 0.3;
  const operationalFund70 = totalRevenue * 0.7;

  return (
    <div className="space-y-5 pb-16">
      {/* Banner Fixo no Quiz com as Cores da Bandeira do Brasil - Faça uma Doação / Fortaleça Nosso Projeto */}
      <BrazilDonationBanner
        variant="banner"
        onOpenDonation={() => setShowDonationModal(true)}
      />

      {/* Modal Oficial de Doação Voluntária */}
      <DonationModal
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
      />

      {/* Seletor de Módulo e Cenário Bíblico */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/40 p-5 shadow-2xl bg-zinc-950">
        {/* Imagem de Fundo Bíblica com Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

        <div className="relative z-10 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
                <Compass className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Cenário Bíblico: {currentModule.bgScene.name}
                </span>
                <div className="text-[11px] text-zinc-300 italic">
                  {currentModule.bgScene.atmosphere}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {avatar && (
                <button
                  type="button"
                  onClick={onOpenAvatarCreator}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-amber-400 bg-black/60 shrink-0 hover:scale-110 transition cursor-pointer flex items-center justify-center shadow-md shadow-amber-500/20"
                  title="Clique para trocar características, cabelos e roupas do seu avatar 3D"
                >
                  <DynamicCharacterAvatar avatar={avatar} size="sm" showPedestal={false} />
                </button>
              )}

              <button
                type="button"
                onClick={onOpenRegistration}
                className="text-xs bg-amber-950/70 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-full font-bold hover:border-amber-400 transition cursor-pointer flex items-center gap-1.5"
              >
                <span>
                  {userProfile
                    ? `${userProfile.title}: ${userProfile.name}`
                    : studentName
                    ? `Irmão(ã): ${studentName}`
                    : 'Irmão(ã) Visitante'}
                </span>
                <span className="text-[10px] text-zinc-400">(Perfil)</span>
              </button>

              {onOpenAvatarCreator && (
                <button
                  type="button"
                  onClick={onOpenAvatarCreator}
                  className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full hover:bg-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                  title="Alterar aparência, corte de cabelo, túnicas e roupas do personagem quando quiser"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Mudar</span> Visual
                </button>
              )}
            </div>
          </div>

          {/* Dropdown com os 27 Módulos Teológicos */}
          <div className="relative">
            <label className="block text-[11px] uppercase tracking-wider font-bold text-amber-400 mb-1">
              Escolha o Módulo Teológico (27 Livros Disponíveis):
            </label>
            <div className="relative">
              <select
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(Number(e.target.value));
                  setCurrentIndex(0);
                  setSelectedOption(null);
                  setIsFinished(false);
                  setCorrectAnswersCount(0);
                }}
                className="w-full bg-zinc-900/95 border-2 border-amber-500/50 rounded-xl px-4 py-3 text-sm font-bold text-amber-200 appearance-none focus:outline-hidden focus:border-amber-400 pr-10 shadow-lg cursor-pointer"
              >
                {ALL_27_MODULES.map((mod) => (
                  <option key={mod.id} value={mod.id} className="bg-zinc-950 text-zinc-100 py-1">
                    {mod.title} — {mod.subtitle}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-amber-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Seleção de Nível: Básico (4 opções), Médio (6 opções) e Avançado (8 opções + Premiação) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400">
                {level === 'basico' ? 'Nível 1 Infantil (100 Histórias Bíblicas):' : 'Escolha o Nível do Módulo:'}
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">
                {level === 'basico' ? `${questionList.length} Q • 4 Opções (A-D)` : level === 'medio' ? '6 Opções (A-F)' : '8 Opções (A-H)'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectLevel('basico')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition cursor-pointer ${
                  level === 'basico'
                    ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                👶 1. Básico (100 Infantis)
              </button>

              <button
                onClick={() => handleSelectLevel('medio')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition cursor-pointer ${
                  level === 'medio'
                    ? 'bg-sky-600/30 border-sky-400 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.2)]'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                2. Médio (Livre)
              </button>

              <button
                onClick={() => handleSelectLevel('avancado')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  level === 'avancado'
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                    : isAdvancedUnlocked || isDevOrLocalhost
                    ? 'bg-zinc-900 border-amber-500/50 text-amber-300 hover:border-amber-400'
                    : 'bg-zinc-950 border-amber-500/40 text-amber-400/90'
                }`}
              >
                {isAdvancedUnlocked || isDevOrLocalhost ? (
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>
                  3. Avançado{' '}
                  {isAdvancedUnlocked || isDevOrLocalhost ? '(Liberado)' : '(R$ 10)'}
                </span>
              </button>
            </div>

            {level === 'basico' && (
              <div className="mt-2.5 p-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                  <span>📖 Modo Histórias:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setKidsQuestionCount(10)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      kidsQuestionCount === 10
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                        : 'bg-zinc-900 border border-emerald-500/30 text-emerald-300 hover:bg-zinc-800'
                    }`}
                  >
                    10 Rápidas
                  </button>
                  <button
                    onClick={() => setKidsQuestionCount(25)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      kidsQuestionCount === 25
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                        : 'bg-zinc-900 border border-emerald-500/30 text-emerald-300 hover:bg-zinc-800'
                    }`}
                  >
                    25 Jornada
                  </button>
                  <button
                    onClick={() => setKidsQuestionCount(100)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      kidsQuestionCount === 100
                        ? 'bg-emerald-500 text-zinc-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-zinc-900 border border-emerald-500/30 text-emerald-300 hover:bg-zinc-800'
                    }`}
                  >
                    ★ 100 Completo (Maratona)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Arena da Questão */}
      {isFinished ? (
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/50 rounded-2xl p-8 text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center">
            <Award className="w-10 h-10 text-amber-300" />
          </div>
          <h2 className="text-2xl font-black text-amber-200 uppercase tracking-wider">
            Nível Concluído com Sucesso!
          </h2>
          <p className="text-zinc-300 text-xs md:text-sm max-w-md mx-auto">
            {level === 'basico' ? (
              <>Você respondeu todas as <strong className="text-emerald-400">{questionList.length} histórias bíblicas infantis</strong> com grande sabedoria e amor!</>
            ) : (
              <>Você respondeu todas as {questionList.length} questões do módulo{' '}
              <strong className="text-amber-400">{currentModule.title}</strong> (Nível{' '}
              <span className="capitalize text-amber-300">{level}</span>).</>
            )}
          </p>

          <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-4 max-w-sm mx-auto space-y-1">
            <div className="text-sm text-zinc-300">
              Acertos: <strong className="text-emerald-400 text-base">{correctAnswersCount}</strong> de {questionList.length} questões (
              {Math.round((correctAnswersCount / (questionList.length || 1)) * 100)}%)
            </div>
            <div className="text-2xl font-black text-amber-400">
              Sua Pontuação Total: {score} XP
            </div>
            {level === 'avancado' && (
              <div className="text-[11px] text-amber-300/80 italic mt-1">
                ★ Desempenho registrado para elegibilidade de mérito teológico.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold uppercase text-xs inline-flex items-center justify-center gap-2 shadow-lg hover:bg-zinc-700 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Refazer este Nível
            </button>
            <button
              onClick={() => {
                if (selectedModuleId < 27) {
                  setSelectedModuleId((prev) => prev + 1);
                } else {
                  setSelectedModuleId(1);
                }
                setCurrentIndex(0);
                setSelectedOption(null);
                setIsFinished(false);
                setCorrectAnswersCount(0);
              }}
              className="px-6 py-3 rounded-xl bg-zinc-800 border border-amber-500/40 text-amber-300 font-bold uppercase text-xs inline-flex items-center justify-center gap-2 hover:bg-zinc-700 transition cursor-pointer"
            >
              Próximo Módulo <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-2xl p-5 shadow-2xl relative">
          {/* Cabeçalho da Questão */}
          <div className="flex justify-between items-center text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none">
              <BookOpen className="w-4 h-4 shrink-0" /> {level === 'basico' ? 'Histórias Bíblicas Infantis' : currentModule.title}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full items-center gap-1 font-mono">
                🔀 Modo Aleatório
              </span>
              <span className="bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] border border-amber-500/30 shrink-0">
                Questão {currentIndex + 1} de {questionList.length}
              </span>
            </div>
          </div>

          {/* Barra de Progresso das 12 Questões */}
          <div className="w-full bg-zinc-950 rounded-full h-1.5 mb-3 border border-zinc-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questionList.length) * 100}%` }}
            />
          </div>

          {/* Enunciado */}
          <div className="bg-black/60 border border-amber-500/30 rounded-xl p-4 my-3">
            <p className="text-sm md:text-base font-bold text-amber-100 text-center leading-snug">
              {currentQ.question}
            </p>
          </div>

          {/* Grid de Opções: 4 no Básico, 6 no Médio e 8 no Avançado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
            {currentQ.options.map((option, idx) => {
              const letter = OPTION_LETTERS[idx] || `${idx + 1}`;
              let btnStyle =
                'bg-zinc-900/90 border-zinc-700 text-zinc-100 hover:border-amber-400 hover:bg-zinc-800/80';

              if (selectedOption !== null) {
                if (idx === currentQ.correctIndex) {
                  btnStyle =
                    'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                } else if (idx === selectedOption) {
                  btnStyle = 'bg-red-950/90 border-red-400 text-red-100';
                } else {
                  btnStyle = 'bg-zinc-950/60 border-zinc-800 text-zinc-500 opacity-50';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-3 rounded-xl border-2 text-left font-semibold text-xs flex items-center justify-between transition cursor-pointer ${btnStyle}`}
                >
                  <span className="leading-snug">
                    <strong className="text-amber-400 mr-2 text-sm">{letter}:</strong> {option}
                  </span>
                  {selectedOption !== null && idx === currentQ.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {selectedOption === idx && idx !== currentQ.correctIndex && (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Justificativa e Próxima Questão */}
          {selectedOption !== null && (
            <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3">
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {currentQ.reference} (+{currentQ.xp} XP)
                </div>
                <p className="text-zinc-300 leading-relaxed text-[11px]">
                  {currentQ.explanation}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 hover:brightness-110 transition cursor-pointer"
                >
                  {currentIndex + 1 < questionList.length ? 'Próxima Questão' : 'Finalizar Nível'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gateway de Pagamento Seguro do Nível Avançado (R$ 10,00) */}
      {showPaymentModal && (
        <PaymentGateway
          profile={userProfile || null}
          onSuccess={() => {
            setIsAdvancedUnlocked(true);
            setShowPaymentModal(false);
            setLevel('avancado');
            setCurrentIndex(0);
            setSelectedOption(null);
            setIsFinished(false);
            setCorrectAnswersCount(0);
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Painel Administrativo Discreto do Fundo de Premiações (30%) */}
      <div className="pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <button
            onClick={() => setShowAdminFund(!showAdminFund)}
            className="flex items-center gap-1.5 hover:text-amber-400 transition cursor-pointer"
          >
            {showAdminFund ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Controle Administrativo Interno</span>
          </button>
          <span>Apóstolos Quiz v1.0</span>
        </div>

        {showAdminFund && (
          <div className="mt-3 bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <PieChart className="w-4 h-4" /> Gestão Interna de Receitas & Fundo de Premiações (30%)
            </div>
            <p className="text-[11px] text-zinc-400">
              Conforme as diretrizes internas, 30% da receita arrecadada no nível avançado (R$ 10,00 por participante) é retida confidencialmente para o pagamento das premiações de mérito aos irmãos e irmãs de maior pontuação.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] uppercase text-zinc-500 font-bold block">Inscrições Registradas</span>
                <span className="text-sm font-black text-zinc-200">{registeredStudentsCount} Participante(s)</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-lg border border-amber-500/30">
                <span className="text-[10px] uppercase text-amber-400 font-bold block">Fundo Premiação (30%)</span>
                <span className="text-sm font-black text-amber-300">R$ {prizePool30.toFixed(2)}</span>
              </div>
              <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] uppercase text-zinc-500 font-bold block">Fundo Operacional (70%)</span>
                <span className="text-sm font-black text-zinc-300">R$ {operationalFund70.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
