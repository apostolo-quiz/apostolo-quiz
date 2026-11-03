'use client';

import React, { useState, useEffect } from 'react';
import { ALL_27_MODULES, QuizModule, QuizQuestion } from '@/data/modulesQuizData';
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
  Flame
} from 'lucide-react';

import DynamicCharacterAvatar from './DynamicCharacterAvatar';
import { AvatarState } from '@/data/avatarConfig';
import { UserProfile, syncQuizProgressServer } from '@/data/db';

// Função de cálculo de bônus do Temporizador Progressivo solicitado
export function calculateTimeBonus(secondsElapsed: number): number {
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
  return 0.00; // após esse tempo, não terá pontuação por tempo
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
}: Props) {
  const [selectedModuleId, setSelectedModuleId] = useState<number>(1);
  const [level, setLevel] = useState<'basico' | 'medio' | 'avancado'>('basico');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
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

  // Temporizador que corre enquanto a questão estiver sendo respondida
  useEffect(() => {
    if (isFinished || selectedOption !== null) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, selectedOption, currentIndex]);

  const currentModule: QuizModule =
    ALL_27_MODULES.find((m) => m.id === selectedModuleId) || ALL_27_MODULES[0];

  // Obter o pool de 100 questões puro de Gênesis a Apocalipse de acordo com o nível bíblico
  const getBaseQuestionsForLevel = (lvl: 'basico' | 'medio' | 'avancado'): QuizQuestion[] => {
    if (lvl === 'basico') return BASIC_KIDS_100_QUESTIONS;
    if (lvl === 'medio') return MEDIUM_YOUTH_100_QUESTIONS;
    return ADVANCED_ADULT_100_QUESTIONS;
  };

  // Inicializa e re-embaralha as questões sempre que o nível ou quantidade mudar
  useEffect(() => {
    const fullPool = getBaseQuestionsForLevel(level);
    const shuffledAll = getShuffledQuiz(fullPool);
    const rawList = questionCount >= 100 ? shuffledAll : shuffledAll.slice(0, questionCount);
    setActiveQuestions(rawList);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsFinished(false);
    setCorrectAnswersCount(0);
    setSecondsElapsed(0);
    setRoundEarnedPoints(0);
    setTotalTimeSpentRound(0);
    setLastQuestionTimeBonus(null);
    setLastQuestionEarnedPoints(null);
  }, [selectedModuleId, level, questionCount]);

  const questionList: QuizQuestion[] =
    activeQuestions.length > 0 ? activeQuestions : getBaseQuestionsForLevel(level);
  const currentQ: QuizQuestion = questionList[currentIndex] || questionList[0];

  const handleSelectLevel = (newLevel: 'basico' | 'medio' | 'avancado') => {
    setLevel(newLevel);
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    const timeSpent = secondsElapsed;
    setTotalTimeSpentRound((prev) => prev + timeSpent);

    if (idx === currentQ.correctIndex) {
      const bonus = calculateTimeBonus(timeSpent);
      const points = 1.0 + bonus;
      setLastQuestionTimeBonus(bonus);
      setLastQuestionEarnedPoints(points);
      setRoundEarnedPoints((prev) => prev + points);

      // Converte pontos com bônus para a gamificação de XP
      const gainedXP = Math.round(currentQ.xp * (1 + bonus));
      setScore((prev) => prev + gainedXP);
      setCorrectAnswersCount((prev) => prev + 1);
    } else {
      setLastQuestionTimeBonus(0);
      setLastQuestionEarnedPoints(0);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questionList.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setSecondsElapsed(0);
      setLastQuestionTimeBonus(null);
      setLastQuestionEarnedPoints(null);
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
            userName: userProfile?.name || 'Irmão(ã)'
          });
        } catch (e) {}
      }
    }
  };

  const handleRestart = () => {
    const fullPool = getBaseQuestionsForLevel(level);
    const shuffledAll = getShuffledQuiz(fullPool);
    const rawList = questionCount >= 100 ? shuffledAll : shuffledAll.slice(0, questionCount);
    setActiveQuestions(rawList);
    setCurrentIndex(0);
    setSelectedOption(null);
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

  // Cenário de fundo dinâmico de acordo com o módulo
  const bgImage = selectedModuleId % 2 === 0 ? '/bg_galileia.jpg' : '/bg_biblico.jpg';

  return (
    <div className="space-y-5 pb-16">
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

          {/* Seleção de Nível Bíblico (100% Puro e Gratuito de Gênesis a Apocalipse) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-300">
                Escolha o Nível Bíblico (Gênesis a Apocalipse):
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {questionList.length} Questões • 4 Alternativas (A-D)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => handleSelectLevel('basico')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition cursor-pointer text-center ${
                  level === 'basico'
                    ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                👶 1. Iniciante (Infantil)
              </button>

              <button
                onClick={() => handleSelectLevel('medio')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition cursor-pointer text-center ${
                  level === 'medio'
                    ? 'bg-sky-600/30 border-sky-400 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                📖 2. Médio (Infanto-Juvenil)
              </button>

              <button
                onClick={() => handleSelectLevel('avancado')}
                className={`py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition cursor-pointer text-center ${
                  level === 'avancado'
                    ? 'bg-amber-600/30 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'bg-zinc-900/80 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                👑 3. Avançado (Adulto)
              </button>
            </div>

            {/* Seletor de Quantidade de Questões (10, 25 ou 100 Completo) */}
            <div className="mt-2.5 p-2 bg-zinc-900/90 border border-amber-500/30 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <span>📜 Extensão da Rodada:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setQuestionCount(10)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    questionCount === 10
                      ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                      : 'bg-zinc-900 border border-amber-500/30 text-amber-300 hover:bg-zinc-800'
                  }`}
                >
                  10 Rápidas
                </button>
                <button
                  onClick={() => setQuestionCount(25)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    questionCount === 25
                      ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                      : 'bg-zinc-900 border border-amber-500/30 text-amber-300 hover:bg-zinc-800'
                  }`}
                >
                  25 Jornada
                </button>
                <button
                  onClick={() => setQuestionCount(100)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    questionCount === 100
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'bg-zinc-900 border border-amber-500/30 text-amber-300 hover:bg-zinc-800'
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
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-2xl p-5 shadow-2xl relative">
          {/* Cabeçalho da Questão */}
          <div className="flex justify-between items-center text-xs text-amber-400 font-bold uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-none">
              <BookOpen className="w-4 h-4 shrink-0" />
              {level === 'basico'
                ? 'Nível Iniciante • Infantil (Gênesis a Apocalipse)'
                : level === 'medio'
                ? 'Nível Médio • Infanto-Juvenil (Gênesis a Apocalipse)'
                : 'Nível Avançado • Adulto (Gênesis a Apocalipse)'}
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

          {/* Barra de Progresso das Questões */}
          <div className="w-full bg-zinc-950 rounded-full h-1.5 mb-2.5 border border-zinc-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questionList.length) * 100}%` }}
            />
          </div>

          {/* Temporizador Progressivo com Bônus Decrescente a Cada 10 Segundos */}
          <div className="flex items-center justify-between bg-zinc-950/90 border border-amber-500/30 rounded-xl px-3 py-1.5 mb-2.5 text-xs shadow-inner">
            <div className="flex items-center gap-2">
              <Clock
                className={`w-4 h-4 ${
                  secondsElapsed <= 10
                    ? 'text-emerald-400 animate-pulse'
                    : secondsElapsed <= 50
                    ? 'text-yellow-400'
                    : 'text-amber-500'
                }`}
              />
              <span className="font-mono font-bold text-zinc-200">
                ⏱️ {Math.floor(secondsElapsed / 60)}m {String(secondsElapsed % 60).padStart(2, '0')}s
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-400 uppercase font-bold hidden sm:inline">
                Bônus de Tempo:
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-black text-xs border transition-all ${
                  secondsElapsed <= 10
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : secondsElapsed <= 50
                    ? 'bg-amber-500/25 text-amber-300 border-amber-400'
                    : secondsElapsed <= 100
                    ? 'bg-sky-500/20 text-sky-300 border-sky-400'
                    : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}
                title="Bônus adicionado se responder agora com acerto"
              >
                +{calculateTimeBonus(secondsElapsed).toFixed(2)} pts
              </span>
            </div>
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
              {/* Feedback de Pontos e Bônus de Tempo */}
              {selectedOption === currentQ.correctIndex ? (
                <div className="bg-emerald-950/80 border-2 border-emerald-500/60 rounded-xl p-2.5 text-center shadow-lg animate-in zoom-in-95">
                  <div className="text-emerald-300 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Resposta Correta! +{lastQuestionEarnedPoints?.toFixed(2)} Pontos</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5">
                    1.0 ponto base + {lastQuestionTimeBonus?.toFixed(2)} bônus de velocidade ({secondsElapsed}s)
                  </p>
                </div>
              ) : (
                <div className="bg-red-950/80 border-2 border-red-500/60 rounded-xl p-2.5 text-center shadow-lg animate-in zoom-in-95">
                  <div className="text-red-300 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5">
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span>Resposta Incorreta (0 pontos)</span>
                  </div>
                  <p className="text-[11px] text-red-200/90 mt-0.5">
                    Tempo: {secondsElapsed}s. A alternativa bíblica correta está destacada em verde acima.
                  </p>
                </div>
              )}

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

      {/* Rodapé Puro e Cristão */}
      <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px] text-zinc-500 text-center sm:text-left">
        <span>Apóstolos Quiz • Bíblia Sagrada (Gênesis a Apocalipse)</span>
        <span className="text-amber-500/80">300 Questões Bíblicas • 100% Livre e Gratuito</span>
      </div>
    </div>
  );
}
