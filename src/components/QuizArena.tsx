'use client';

import React, { useState, useEffect } from 'react';
import { QuizQuestion } from '@/data/modulesQuizData';
import { BASIC_KIDS_100_QUESTIONS } from '@/data/basicKidsQuestions';
import { MEDIUM_YOUTH_100_QUESTIONS } from '@/data/mediumYouthQuestions';
import { ADVANCED_ADULT_100_QUESTIONS } from '@/data/advancedAdultQuestions';
import {
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Compass,
  Trophy,
  Clock,
  Timer,
  Zap,
  Flame,
  Send,
  Check,
  Users
} from 'lucide-react';

import DynamicCharacterAvatar from './DynamicCharacterAvatar';
import { AvatarState } from '@/data/avatarConfig';
import { UserProfile, syncQuizProgressServer } from '@/data/db';

// Função de cálculo de bônus do Temporizador Progressivo
export function calculateTimeBonus(secondsElapsed: number, lvl: 'basico' | 'medio' | 'avancado' = 'basico'): number {
  if (lvl === 'avancado') {
    // Nível Avançado: tolerância de 30 segundos para leitura tranquila das questões e alternativas profundas
    if (secondsElapsed <= 30) return 0.50;
    if (secondsElapsed <= 40) return 0.45;
    if (secondsElapsed <= 50) return 0.40;
    if (secondsElapsed <= 60) return 0.35;
    if (secondsElapsed <= 70) return 0.30;
    if (secondsElapsed <= 80) return 0.25;
    if (secondsElapsed <= 90) return 0.20;
    if (secondsElapsed <= 100) return 0.15;
    if (secondsElapsed <= 110) return 0.10;
    if (secondsElapsed <= 120) return 0.05;
    return 0.00; // após 2 minutos
  }

  // Níveis Básico e Médio: redução padrão a cada 10 segundos
  if (secondsElapsed <= 10) return 0.50;
  if (secondsElapsed <= 20) return 0.45;
  if (secondsElapsed <= 30) return 0.40;
  if (secondsElapsed <= 40) return 0.35;
  if (secondsElapsed <= 50) return 0.30;
  if (secondsElapsed <= 60) return 0.25; // 1m
  if (secondsElapsed <= 70) return 0.20; // 1m10s
  if (secondsElapsed <= 80) return 0.15; // 1m20s
  if (secondsElapsed <= 90) return 0.10; // 1m30s
  if (secondsElapsed <= 100) return 0.05; // 1m40s
  return 0.00;
}

interface Props {
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  completedModules?: number[];
  setCompletedModules?: React.Dispatch<React.SetStateAction<number[]>>;
  userProfile?: UserProfile | null;
  onOpenRegistration?: () => void;
  avatar?: AvatarState;
  onOpenAvatarCreator?: () => void;
  onOpenLeaderboard?: () => void;
  initialLevel?: 'basico' | 'medio' | 'avancado';
  onLevelChange?: (lvl: 'basico' | 'medio' | 'avancado') => void;
  onOpenRooms?: () => void;
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
  onOpenLeaderboard,
  initialLevel = 'basico',
  onLevelChange,
  onOpenRooms,
}: Props) {
  const [level, setLevel] = useState<'basico' | 'medio' | 'avancado'>(initialLevel);
  const [showRestartModal, setShowRestartModal] = useState<boolean>(false);

  useEffect(() => {
    if (initialLevel && initialLevel !== level) {
      setLevel(initialLevel);
    }
  }, [initialLevel]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(100);

  // Temporizador Progressivo e Sistema de Pontuação de 0 a 10
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [lastQuestionTimeBonus, setLastQuestionTimeBonus] = useState<number | null>(null);
  const [lastQuestionEarnedPoints, setLastQuestionEarnedPoints] = useState<number | null>(null);
  const [roundEarnedPoints, setRoundEarnedPoints] = useState<number>(0);
  const [totalTimeSpentRound, setTotalTimeSpentRound] = useState<number>(0);

  // Helper de persistência contínua de progresso local e no servidor
  const saveProgressSnapshot = (
    idx: number,
    roundPts: number,
    correctCount: number,
    totalTime: number,
    questions: QuizQuestion[]
  ) => {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        level,
        currentIndex: idx,
        roundEarnedPoints: roundPts,
        correctAnswersCount: correctCount,
        totalTimeSpentRound: totalTime,
        activeQuestions: questions,
        isFinished: false,
        timestamp: Date.now()
      };
      localStorage.setItem('apostolos_saved_progress_' + level, JSON.stringify(payload));
      syncQuizProgressServer(userProfile?.id || 'user_guest', {
        currentLevel: level,
        score,
        roundEarnedPoints: roundPts,
        correctAnswersCount: correctCount,
        currentIndex: idx,
        userName: userProfile?.name || 'Irmão(ã)'
      });
    } catch (e) {}
  };

  // Temporizador que corre enquanto a questão estiver sendo respondida (para apenas após o envio)
  useEffect(() => {
    if (isFinished || isSubmitted) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, isSubmitted, currentIndex]);

  // Obter o pool de 100 questões puro de Gênesis a Apocalipse de acordo com o nível bíblico
  const getBaseQuestionsForLevel = (lvl: 'basico' | 'medio' | 'avancado'): QuizQuestion[] => {
    if (lvl === 'basico') return BASIC_KIDS_100_QUESTIONS;
    if (lvl === 'medio') return MEDIUM_YOUTH_100_QUESTIONS;
    return ADVANCED_ADULT_100_QUESTIONS;
  };

  // Inicializa, restaura ou re-embaralha as questões sempre que o nível ou quantidade mudar
  useEffect(() => {
    // 1. Tentar restaurar progresso salvo anteriormente para este nível
    if (typeof window !== 'undefined') {
      try {
        const savedRaw = localStorage.getItem('apostolos_saved_progress_' + level);
        if (savedRaw) {
          const saved = JSON.parse(savedRaw);
          if (
            saved &&
            Array.isArray(saved.activeQuestions) &&
            saved.activeQuestions.length > 0 &&
            typeof saved.currentIndex === 'number' &&
            saved.currentIndex < saved.activeQuestions.length &&
            !saved.isFinished
          ) {
            setActiveQuestions(saved.activeQuestions);
            setCurrentIndex(saved.currentIndex);
            setCorrectAnswersCount(saved.correctAnswersCount || 0);
            setRoundEarnedPoints(saved.roundEarnedPoints || 0);
            setTotalTimeSpentRound(saved.totalTimeSpentRound || 0);
            setSelectedOption(null);
            setIsSubmitted(false);
            setIsFinished(false);
            setSecondsElapsed(0);
            setLastQuestionTimeBonus(null);
            setLastQuestionEarnedPoints(null);
            return;
          }
        }
      } catch (e) {}
    }

    // 2. Se não houver progresso salvo válido, inicializa novo quiz embaralhado
    const fullPool = getBaseQuestionsForLevel(level);
    const shuffledAll = getShuffledQuiz(fullPool);
    const rawList = questionCount >= 100 ? shuffledAll : shuffledAll.slice(0, questionCount);
    setActiveQuestions(rawList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsFinished(false);
    setCorrectAnswersCount(0);
    setSecondsElapsed(0);
    setRoundEarnedPoints(0);
    setTotalTimeSpentRound(0);
    setLastQuestionTimeBonus(null);
    setLastQuestionEarnedPoints(null);
  }, [level, questionCount]);

  const questionList: QuizQuestion[] =
    activeQuestions.length > 0 ? activeQuestions : getBaseQuestionsForLevel(level);
  const currentQ: QuizQuestion = questionList[currentIndex] || questionList[0];

  const handleSelectLevel = (newLevel: 'basico' | 'medio' | 'avancado') => {
    setLevel(newLevel);
    onLevelChange?.(newLevel);
  };

  // Escolhe a resposta sem enviar e sem mudar a cor (permite alterar a escolha antes de enviar)
  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  // Enviar a resposta escolhida: trava o tempo e atribui pontuação SOMENTE se correta
  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;
    setIsSubmitted(true);
    const timeSpent = secondsElapsed;
    const newTotalTime = totalTimeSpentRound + timeSpent;
    setTotalTimeSpentRound(newTotalTime);

    let nextRoundPoints = roundEarnedPoints;
    let nextCorrectCount = correctAnswersCount;

    // Pontuação estritamente SOMENTE para respostas corretas (considerando bônus de 30s no avançado)
    if (selectedOption === currentQ.correctIndex) {
      const bonus = calculateTimeBonus(timeSpent, level);
      const points = 1.0 + bonus;
      setLastQuestionTimeBonus(bonus);
      setLastQuestionEarnedPoints(points);
      nextRoundPoints += points;
      setRoundEarnedPoints(nextRoundPoints);

      // Converte pontos com bônus para a gamificação de XP
      const gainedXP = Math.round(currentQ.xp * (1 + bonus));
      setScore((prev) => prev + gainedXP);
      nextCorrectCount += 1;
      setCorrectAnswersCount(nextCorrectCount);
    } else {
      // Resposta incorreta: ZERO pontos
      setLastQuestionTimeBonus(0);
      setLastQuestionEarnedPoints(0);
    }

    // Salva o progresso imediatamente após a resposta
    saveProgressSnapshot(currentIndex, nextRoundPoints, nextCorrectCount, newTotalTime, questionList);
  };

  const handleNext = () => {
    if (currentIndex + 1 < questionList.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsSubmitted(false);
      setSecondsElapsed(0);
      setLastQuestionTimeBonus(null);
      setLastQuestionEarnedPoints(null);
      // Salva snapshot do avanço para a próxima questão
      saveProgressSnapshot(nextIdx, roundEarnedPoints, correctAnswersCount, totalTimeSpentRound, questionList);
    } else {
      setIsFinished(true);
      if (typeof window !== 'undefined') {
        try {
          // Remove progresso em andamento pois o nível foi concluído
          localStorage.removeItem('apostolos_saved_progress_' + level);
          // Sincroniza o progresso e XP no banco de dados do servidor
          syncQuizProgressServer(userProfile?.id || 'user_guest', {
            score: score,
            currentLevel: level,
            userName: userProfile?.name || 'Irmão(ã)'
          });
        } catch (e) {}
      }
    }
  };

  const handleRestart = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('apostolos_saved_progress_' + level);
      } catch (e) {}
    }
    const fullPool = getBaseQuestionsForLevel(level);
    const shuffledAll = getShuffledQuiz(fullPool);
    const rawList = questionCount >= 100 ? shuffledAll : shuffledAll.slice(0, questionCount);
    setActiveQuestions(rawList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsFinished(false);
    setCorrectAnswersCount(0);
    setSecondsElapsed(0);
    setRoundEarnedPoints(0);
    setTotalTimeSpentRound(0);
    setLastQuestionTimeBonus(null);
    setLastQuestionEarnedPoints(null);
  };

  // Letras das opções: 4 alternativas bíblicas (A-D)
  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

  // Cenário de fundo bíblico dinâmico de acordo com o nível
  const bgImage = level === 'avancado' ? '/bg_biblico.jpg' : '/bg_galileia.jpg';

  return (
    <div className="space-y-5 pb-16">
      {/* Cabeçalho da Jornada Bíblica */}
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
                  Quiz Bíblico Oficial: Gênesis a Apocalipse
                </span>
                <div className="text-[11px] text-zinc-300 italic">
                  100% Bíblia Sagrada • 300 Questões de Fé e Sabedoria
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
                  <DynamicCharacterAvatar avatar={avatar} size="full" showPedestal={false} />
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

          {/* Atalho para Disputa em Salas com até 20 amigos */}
          {onOpenRooms && (
            <button
              onClick={onOpenRooms}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 hover:from-amber-500/30 border border-amber-500/50 text-amber-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Disputar em Grupo de até 20 Amigos com Palavra-Chave</span>
            </button>
          )}

          {/* Seleção de Nível Bíblico (100% Puro e Gratuito de Gênesis a Apocalipse) */}
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <span className="text-xs sm:text-sm uppercase tracking-wider font-extrabold text-amber-300">
                Nível Bíblico (Gênesis a Apocalipse):
              </span>
              <span className="text-xs text-zinc-300 font-mono font-bold">
                {questionList.length} Questões • 4 Alternativas (A-D)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => handleSelectLevel('basico')}
                className={`py-3 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 transition cursor-pointer text-center ${
                  level === 'basico'
                    ? 'bg-emerald-600/40 border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                }`}
              >
                👶 1. Iniciante (Infantil)
              </button>

              <button
                onClick={() => handleSelectLevel('medio')}
                className={`py-3 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 transition cursor-pointer text-center ${
                  level === 'medio'
                    ? 'bg-sky-600/40 border-sky-400 text-sky-100 shadow-[0_0_20px_rgba(14,165,233,0.35)] ring-1 ring-sky-400'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                }`}
              >
                📖 2. Médio (Infanto-Juvenil)
              </button>

              <button
                onClick={() => handleSelectLevel('avancado')}
                className={`py-3 px-3 sm:px-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider border-2 transition cursor-pointer text-center ${
                  level === 'avancado'
                    ? 'bg-amber-600/40 border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-400'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
                }`}
              >
                👑 3. Avançado (Adulto)
              </button>
            </div>

            {/* Seletor de Quantidade de Questões (10, 25 ou 100 Completo) */}
            <div className="mt-3 p-2.5 sm:p-3 bg-zinc-950 border-2 border-amber-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold">
                <span>📜 Extensão da Rodada:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuestionCount(10)}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                    questionCount === 10
                      ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                      : 'bg-zinc-900 border border-amber-500/40 text-amber-300 hover:bg-zinc-800'
                  }`}
                >
                  10 Rápidas
                </button>
                <button
                  onClick={() => setQuestionCount(25)}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                    questionCount === 25
                      ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                      : 'bg-zinc-900 border border-amber-500/40 text-amber-300 hover:bg-zinc-800'
                  }`}
                >
                  25 Jornada
                </button>
                <button
                  onClick={() => setQuestionCount(100)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                    questionCount === 100
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-zinc-900 border border-amber-500/40 text-amber-300 hover:bg-zinc-800'
                  }`}
                >
                  ★ 100 Completo (Maratona)
                </button>
              </div>
            </div>
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
            Você respondeu com êxito todas as <strong className="text-amber-400">{questionList.length} questões bíblicas</strong> do nível{' '}
            <strong className="text-amber-300">
              {level === 'basico' ? '1. Iniciante (Básico Infantil)' : level === 'medio' ? '2. Médio (Infanto-Juvenil)' : '3. Avançado (Adulto)'}
            </strong> de Gênesis a Apocalipse, crescendo na sabedoria e no conhecimento da Palavra de Deus!
          </p>

          <div className="bg-zinc-950/80 border border-amber-500/30 rounded-xl p-4 max-w-sm mx-auto space-y-1">
            <div className="text-sm text-zinc-300">
              Acertos: <strong className="text-emerald-400 text-base">{correctAnswersCount}</strong> de {questionList.length} questões (
              {Math.round((correctAnswersCount / (questionList.length || 1)) * 100)}%)
            </div>
            {/* Sistema de Nota Teológica de 0 a 10 e Bônus de Tempo */}
            {(() => {
              const maxPoints = (questionList.length || 1) * 1.5;
              const finalGrade = Math.min(10, Math.max(0, Number(((roundEarnedPoints / maxPoints) * 10).toFixed(1))));
              const avgSeconds = questionList.length > 0 ? (totalTimeSpentRound / questionList.length).toFixed(1) : '0';

              return (
                <div className="pt-2 border-t border-zinc-800 space-y-1 text-left">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-bold uppercase">Sua Nota (0 a 10):</span>
                    <span className="text-lg font-black text-emerald-400">{finalGrade.toFixed(1)} / 10</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-300">
                    <span>Pontos de Tempo Acumulados:</span>
                    <strong className="text-amber-300">+{roundEarnedPoints.toFixed(2)} pts</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-300">
                    <span>Tempo Médio por Questão:</span>
                    <strong className="text-sky-300">{avgSeconds}s</strong>
                  </div>
                </div>
              );
            })()}
            <div className="text-2xl font-black text-amber-400 pt-2">
              Sua Pontuação Total: {score} XP
            </div>
            {level === 'avancado' && (
              <div className="text-[11px] text-amber-300/80 italic mt-1">
                ★ Desempenho registrado para elegibilidade de mérito teológico.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onOpenLeaderboard && (
              <button
                onClick={onOpenLeaderboard}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black uppercase text-xs inline-flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-zinc-950" /> Ver Ranking dos Irmãos
              </button>
            )}
            <button
              onClick={handleRestart}
              className="px-6 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold uppercase text-xs inline-flex items-center justify-center gap-2 shadow-lg hover:bg-zinc-700 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Refazer este Nível
            </button>
            <button
              onClick={() => {
                if (level === 'basico') setLevel('medio');
                else if (level === 'medio') setLevel('avancado');
                else setLevel('basico');
              }}
              className="px-6 py-3 rounded-xl bg-zinc-800 border border-amber-500/40 text-amber-300 font-bold uppercase text-xs inline-flex items-center justify-center gap-2 hover:bg-zinc-700 transition cursor-pointer"
            >
              {level === 'basico' ? 'Avançar para Nível Médio' : level === 'medio' ? 'Avançar para Nível Adulto' : 'Voltar ao Nível Básico'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
          {/* Cabeçalho da Questão */}
          <div className="flex justify-between items-center text-xs sm:text-sm text-amber-400 font-extrabold uppercase tracking-wider mb-2.5">
            <span className="flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-none">
              <BookOpen className="w-5 h-5 shrink-0 text-amber-300" />
              {level === 'basico'
                ? 'Nível 1 • Infantil (Gênesis a Apocalipse)'
                : level === 'medio'
                ? 'Nível 2 • Infanto-Juvenil (Gênesis a Apocalipse)'
                : 'Nível 3 • Adulto (Gênesis a Apocalipse)'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRestartModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-amber-200 bg-amber-950/60 border border-amber-500/50 hover:bg-red-950 hover:border-red-500 hover:text-red-200 transition cursor-pointer shadow-sm active:scale-95"
                title="Reiniciar este nível a qualquer momento"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400 hover:text-red-400" />
                <span className="hidden xs:inline">Reiniciar</span>
              </button>
              <span className="bg-amber-500/25 text-amber-300 px-3 py-1 rounded-full text-xs sm:text-sm font-black border border-amber-500/40 shrink-0">
                Questão {currentIndex + 1} de {questionList.length}
              </span>
            </div>
          </div>

          {/* Modal de Confirmação para Reiniciar o Nível a Qualquer Momento */}
          {showRestartModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-zinc-950 border-2 border-amber-500/80 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <RotateCcw className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-amber-200">Reiniciar Nível?</h3>
                  <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
                    Deseja recomeçar a jornada neste nível bíblico? O progresso da rodada atual será reiniciado para a Questão 1.
                  </p>
                </div>
                <div className="flex gap-2.5 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRestartModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition cursor-pointer"
                  >
                    Continuar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRestartModal(false);
                      handleRestart();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg transition cursor-pointer active:scale-95"
                  >
                    Sim, Reiniciar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Barra de Progresso das Questões */}
          <div className="w-full bg-zinc-950 rounded-full h-2 sm:h-2.5 mb-3 border border-zinc-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-400 h-2 sm:h-2.5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${((currentIndex + 1) / questionList.length) * 100}%` }}
            />
          </div>

          {/* Temporizador Progressivo com Regra de 30s no Nível Avançado */}
          {(() => {
            const isAdv = level === 'avancado';
            const isGraceReading = isAdv && secondsElapsed <= 30;
            const isTopBonus = !isAdv && secondsElapsed <= 10;
            const isGoodBonus = isAdv ? secondsElapsed <= 70 : secondsElapsed <= 50;
            const isAnyBonus = isAdv ? secondsElapsed <= 120 : secondsElapsed <= 100;
            const currentBonusVal = calculateTimeBonus(secondsElapsed, level);

            return (
              <div className="flex items-center justify-between bg-zinc-950 border-2 border-amber-500/40 rounded-2xl px-3.5 sm:px-4 py-2.5 mb-3 text-xs sm:text-sm shadow-inner">
                <div className="flex items-center gap-2">
                  <Clock
                    className={`w-5 h-5 ${
                      isGraceReading || isTopBonus
                        ? 'text-emerald-400 animate-pulse'
                        : isGoodBonus
                        ? 'text-yellow-400'
                        : 'text-amber-500'
                    }`}
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-extrabold text-white text-xs sm:text-sm">
                      ⏱️ {Math.floor(secondsElapsed / 60)}m {String(secondsElapsed % 60).padStart(2, '0')}s
                    </span>
                    {isGraceReading && (
                      <span className="text-[10px] text-emerald-300 font-sans font-bold bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-500/50 shadow-sm animate-pulse">
                        30s Leitura Atenta (+0.50)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-300 uppercase font-extrabold hidden sm:inline">
                    {isGraceReading ? '📖 Bônus Leitura:' : 'Bônus de Tempo:'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-black text-xs sm:text-sm border transition-all ${
                      isGraceReading || isTopBonus
                        ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : isGoodBonus
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400'
                        : isAnyBonus
                        ? 'bg-sky-500/25 text-sky-200 border-sky-400'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                    title={
                      isGraceReading
                        ? 'Nível Avançado: Os primeiros 30 segundos mantêm o bônus máximo (+0.50) para você ler a pergunta e as 4 opções teológicas com total calma!'
                        : 'Bônus adicionado se responder agora com acerto'
                    }
                  >
                    +{currentBonusVal.toFixed(2)} pts
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Enunciado de Alto Contraste e Letras Grandes para Todas as Idades */}
          <div className="bg-zinc-950 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-6 my-3.5 shadow-xl">
            <p className="text-base sm:text-lg md:text-xl font-extrabold text-amber-100 text-center leading-relaxed tracking-wide drop-shadow-sm">
              {currentQ.question}
            </p>
          </div>

          {/* Grid de Opções: 4 Alternativas com Alto Contraste e Letras Grandes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {currentQ.options.map((option, idx) => {
              const letter = OPTION_LETTERS[idx] || `${idx + 1}`;
              let btnStyle = '';

              if (isSubmitted) {
                // Revelação doutrinária somente APÓS o envio da resposta
                if (idx === currentQ.correctIndex) {
                  btnStyle =
                    'bg-emerald-950 border-emerald-400 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400';
                } else if (idx === selectedOption) {
                  btnStyle = 'bg-red-950 border-red-400 text-red-100 ring-2 ring-red-400';
                } else {
                  btnStyle = 'bg-zinc-950/80 border-zinc-800 text-zinc-500 opacity-40';
                }
              } else {
                // NÃO mudar a cor ao escolher a resposta (mantém o visual limpo, neutro e escuro)
                if (selectedOption === idx) {
                  btnStyle =
                    'bg-zinc-900 border-amber-400 text-white ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
                } else {
                  btnStyle =
                    'bg-zinc-900/95 border-zinc-700 text-white hover:border-amber-400/60 hover:bg-zinc-850 shadow-md';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitted}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 sm:p-4.5 rounded-2xl border-2 text-left font-bold text-sm sm:text-base flex items-center justify-between transition-all duration-200 cursor-pointer active:scale-[0.99] ${btnStyle}`}
                >
                  <span className="leading-relaxed flex items-start gap-2.5">
                    <span
                      className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-black text-sm sm:text-base flex items-center justify-center shadow-inner transition-colors ${
                        selectedOption === idx && !isSubmitted
                          ? 'bg-amber-400 text-zinc-950 border-2 border-amber-300'
                          : 'bg-amber-500/20 border border-amber-400/60 text-amber-300'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="pt-0.5">{option}</span>
                  </span>

                  {/* Indicador de Seleção Neutro (sem spoiler de cores antes do envio) */}
                  {!isSubmitted && (
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2 transition-all ${
                        selectedOption === idx
                          ? 'border-amber-400 bg-amber-400 text-zinc-950'
                          : 'border-zinc-600 bg-zinc-800'
                      }`}
                    >
                      {selectedOption === idx && <span className="w-2 h-2 rounded-full bg-zinc-950" />}
                    </span>
                  )}

                  {/* Indicadores de Correção após o Envio */}
                  {isSubmitted && idx === currentQ.correctIndex && (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 shrink-0 ml-2 animate-bounce" />
                  )}
                  {isSubmitted && selectedOption === idx && idx !== currentQ.correctIndex && (
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Botão de Envio (Escolher a resposta e enviar) */}
          {!isSubmitted && (
            <div className="mt-4 pt-3.5 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs sm:text-sm text-zinc-300 font-medium text-center sm:text-left">
                {selectedOption === null ? (
                  <span className="text-zinc-400">
                    👉 Toque em uma das 4 alternativas acima e clique em <strong>Enviar Resposta</strong>.
                  </span>
                ) : (
                  <span className="text-amber-300 font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Alternativa <strong>{OPTION_LETTERS[selectedOption]}</strong> selecionada. Pronto para enviar!
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className={`w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl ${
                  selectedOption !== null
                    ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 shadow-amber-500/30 hover:brightness-110 active:scale-98 cursor-pointer ring-2 ring-amber-400'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Send className="w-5 h-5" />
                <span>Enviar Resposta</span>
              </button>
            </div>
          )}

          {/* Justificativa e Próxima Questão (Apenas após o Envio) */}
          {isSubmitted && (
            <div className="mt-4 pt-3.5 border-t border-zinc-800 space-y-3.5">
              {/* Feedback de Pontos: Pontuação SOMENTE para respostas corretas */}
              {selectedOption === currentQ.correctIndex ? (
                <div className="bg-emerald-950 border-2 border-emerald-400 rounded-2xl p-3.5 sm:p-4 text-center shadow-xl animate-in zoom-in-95">
                  <div className="text-emerald-300 font-black text-sm sm:text-base flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    <span>Resposta Correta! +{lastQuestionEarnedPoints?.toFixed(2)} Pontos</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-200 font-semibold mt-1">
                    1.0 ponto base + {lastQuestionTimeBonus?.toFixed(2)} bônus de tempo ({secondsElapsed}s)
                  </p>
                </div>
              ) : (
                <div className="bg-red-950 border-2 border-red-400 rounded-2xl p-3.5 sm:p-4 text-center shadow-xl animate-in zoom-in-95">
                  <div className="text-red-300 font-black text-sm sm:text-base flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                    <span>Resposta Incorreta (0 pontos)</span>
                  </div>
                  <p className="text-xs sm:text-sm text-red-200 font-semibold mt-1">
                    Pontuação somente para respostas corretas. A resposta bíblica correta está destacada em verde acima.
                  </p>
                </div>
              )}

              {/* Caixa Doutrinária com Letras Maiores e Confortáveis */}
              <div className="bg-zinc-950 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 space-y-2 shadow-lg">
                <div className="font-black text-amber-300 text-sm sm:text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{currentQ.reference}</span>
                  <span className="text-xs text-amber-400/80 font-mono">(+{currentQ.xp} XP)</span>
                </div>
                <p className="text-zinc-100 leading-relaxed text-sm sm:text-base font-medium">
                  {currentQ.explanation}
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={handleNext}
                  className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-98 transition cursor-pointer"
                >
                  <span>{currentIndex + 1 < questionList.length ? 'Próxima Questão' : 'Finalizar Nível'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rodapé Puro e Cristão */}
      <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-zinc-500 text-center sm:text-left">
        <span>Apóstolos Quiz • Bíblia Sagrada (Gênesis a Apocalipse)</span>
        <span className="text-amber-500/80">300 Questões Bíblicas • 100% Livre e Gratuito</span>
      </div>
    </div>
  );
}
