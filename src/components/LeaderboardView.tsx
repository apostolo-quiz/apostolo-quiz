'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Star, Flame, User, BookOpen, MapPin, Sparkles, RefreshCw, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { LeaderboardEntry, fetchLeaderboard, UserProfile } from '@/data/db';
import DynamicCharacterAvatar from './DynamicCharacterAvatar';
import { BIOTYPE_PRESETS, AvatarState } from '@/data/avatarConfig';

interface Props {
  userProfile?: UserProfile | null;
  currentScore: number;
  completedModulesCount: number;
  onGoToQuiz: () => void;
}

export default function LeaderboardView({
  userProfile,
  currentScore,
  completedModulesCount,
  onGoToQuiz
}: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<'all' | 'basico' | 'medio' | 'avancado'>('all');

  const loadData = () => {
    setLoading(true);
    fetchLeaderboard()
      .then((data) => {
        // Encontra ou insere o usuário atual no ranking
        const currentUserId = userProfile?.id || 'current_user';
        const currentName = userProfile?.name || 'Você (Visitante da Fé)';
        const currentTitle = userProfile?.title || (userProfile?.gender === 'female' ? 'Irmã' : 'Irmão');
        const currentChurch = userProfile?.churchName || 'Sua Igreja';
        const currentCity = userProfile?.city || 'Brasil';
        const currentState = userProfile?.state || 'BR';

        let list = [...data];
        const existingIdx = list.findIndex((x) => x.userId === currentUserId || (userProfile?.email && x.userId === userProfile.id));

        const userGrade = Math.min(10, Math.max(1.0, Number((currentScore / 350).toFixed(1))));

        if (existingIdx >= 0) {
          list[existingIdx] = {
            ...list[existingIdx],
            userName: currentName,
            title: currentTitle,
            score: Math.max(list[existingIdx].score, currentScore),
            grade: userGrade,
            completedModulesCount: Math.max(list[existingIdx].completedModulesCount, completedModulesCount),
            churchName: currentChurch,
            city: currentCity,
            state: currentState,
            photoUrl: userProfile?.photoUrl || list[existingIdx].photoUrl,
            avatarConfig: userProfile?.avatarConfig || list[existingIdx].avatarConfig,
            isCurrentUser: true
          };
        } else {
          list.push({
            userId: currentUserId,
            userName: currentName,
            title: currentTitle,
            churchName: currentChurch,
            city: currentCity,
            state: currentState,
            score: currentScore,
            grade: userGrade,
            completedModulesCount,
            currentLevel: 'basico',
            photoUrl: userProfile?.photoUrl,
            avatarConfig: userProfile?.avatarConfig,
            lastUpdated: new Date().toISOString(),
            isCurrentUser: true
          });
        }

        // Ordena por pontuação decrescente
        list.sort((a, b) => b.score - a.score);

        // Atribui posições
        const ranked = list.map((entry, idx) => ({
          ...entry,
          rank: idx + 1,
          isCurrentUser: entry.userId === currentUserId || entry.isCurrentUser
        }));

        setLeaderboard(ranked);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [currentScore, completedModulesCount, userProfile]);

  const filtered = leaderboard.filter((entry) => {
    if (levelFilter === 'all') return true;
    return entry.currentLevel === levelFilter;
  });

  const currentUserEntry = leaderboard.find((x) => x.isCurrentUser);
  const topThree = filtered.slice(0, 3);
  const restOfList = filtered.slice(3);

  return (
    <div className="space-y-5 pb-16 font-sans">
      {/* Banner Principal de Ranqueamento Geral */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 p-5 shadow-2xl text-center">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Ranking Oficial da Gamificação Bíblica</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-amber-200 uppercase tracking-wide">
            Quadro de Honra e Mérito dos Irmãos
          </h2>

          <p className="text-xs text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Pontuação de <strong className="text-amber-400">0 a 10</strong> calculada com{' '}
            <strong className="text-emerald-400">Temporizador Progressivo</strong>: respostas rápidas
            garantem bônus de agilidade e sabedoria teológica!
          </p>

          {/* Cards de Resumo do Usuário Atual */}
          {currentUserEntry && (
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto pt-3">
              <div className="bg-zinc-900/90 border border-amber-500/30 rounded-xl p-2.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Sua Posição</span>
                <span className="text-lg sm:text-xl font-black text-amber-300">
                  {currentUserEntry.rank}º Lugar
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-emerald-500/30 rounded-xl p-2.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Sua Nota</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400">
                  {currentUserEntry.grade.toFixed(1)} / 10
                </span>
              </div>
              <div className="bg-zinc-900/90 border border-yellow-500/30 rounded-xl p-2.5">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Total XP</span>
                <span className="text-lg sm:text-xl font-black text-yellow-300">
                  {currentUserEntry.score}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtros e Botão de Atualizar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              levelFilter === 'all'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Geral Brasil
          </button>
          <button
            onClick={() => setLevelFilter('basico')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              levelFilter === 'basico'
                ? 'bg-emerald-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Básico (Infantil)
          </button>
          <button
            onClick={() => setLevelFilter('medio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              levelFilter === 'medio'
                ? 'bg-sky-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Médio
          </button>
          <button
            onClick={() => setLevelFilter('avancado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              levelFilter === 'avancado'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Avançado (PRO)
          </button>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 px-2.5 py-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          title="Atualizar Ranking"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* PÓDIO DOS 3 PRIMEIROS COLOCADOS */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 items-end pt-6 pb-2">
          {/* 2º LUGAR (Prata) */}
          <div className="order-1 bg-gradient-to-t from-zinc-900 to-zinc-800/60 border-2 border-slate-400/50 rounded-2xl p-3 text-center shadow-lg relative flex flex-col items-center">
            <div className="absolute -top-4 w-8 h-8 rounded-full bg-slate-300 text-zinc-950 border-2 border-white font-black text-xs flex items-center justify-center shadow-md">
              2º
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-slate-300 my-2 shadow flex items-center justify-center bg-black/60">
              {topThree[1].avatarConfig ? (
                <DynamicCharacterAvatar avatar={topThree[1].avatarConfig} size="full" showPedestal={false} />
              ) : topThree[1].photoUrl?.startsWith('data:') ? (
                <img src={topThree[1].photoUrl} alt="2º" className="w-full h-full object-cover" />
              ) : (
                <DynamicCharacterAvatar
                  avatar={{ ...BIOTYPE_PRESETS[0].config, gender: 'female', ethnicity: 'negro', ageStage: 'jovem', outfit: 'casual', framing: 'face' }}
                  size="full"
                  showPedestal={false}
                />
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-200 truncate w-full">{topThree[1].userName}</h4>
            <span className="text-[10px] text-zinc-400 truncate w-full">{topThree[1].city}-{topThree[1].state}</span>
            <div className="mt-2 text-xs font-black text-slate-300">{topThree[1].score} XP</div>
            <span className="text-[10px] text-emerald-400 font-bold">Nota {topThree[1].grade.toFixed(1)}</span>
          </div>

          {/* 1º LUGAR (Ouro - Centro Elevado) */}
          <div className="order-2 bg-gradient-to-t from-zinc-900 to-amber-950/60 border-2 border-yellow-400 rounded-2xl p-3.5 text-center shadow-[0_0_25px_rgba(234,179,8,0.35)] relative flex flex-col items-center -translate-y-2">
            <div className="absolute -top-5 w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 text-zinc-950 border-2 border-white font-black text-sm flex items-center justify-center shadow-lg">
              <Crown className="w-5 h-5 text-zinc-950 fill-yellow-600" />
            </div>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-yellow-400 my-2 shadow-[0_0_15px_rgba(234,179,8,0.5)] flex items-center justify-center bg-black/60">
              {topThree[0].avatarConfig ? (
                <DynamicCharacterAvatar avatar={topThree[0].avatarConfig} size="full" showPedestal={false} />
              ) : topThree[0].photoUrl?.startsWith('data:') ? (
                <img src={topThree[0].photoUrl} alt="1º" className="w-full h-full object-cover" />
              ) : (
                <DynamicCharacterAvatar
                  avatar={{ ...BIOTYPE_PRESETS[0].config, gender: 'male', ethnicity: 'pardo', ageStage: 'adulto', outfit: 'casual', framing: 'face' }}
                  size="full"
                  showPedestal={false}
                />
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-black text-yellow-200 truncate w-full">{topThree[0].userName}</h4>
            <span className="text-[10px] text-zinc-300 truncate w-full">{topThree[0].city}-{topThree[0].state}</span>
            <div className="mt-2 text-sm sm:text-base font-black text-amber-400">{topThree[0].score} XP</div>
            <span className="text-[11px] text-emerald-300 font-black">Nota {topThree[0].grade.toFixed(1)} ⭐</span>
          </div>

          {/* 3º LUGAR (Bronze) */}
          <div className="order-3 bg-gradient-to-t from-zinc-900 to-zinc-800/60 border-2 border-amber-700/60 rounded-2xl p-3 text-center shadow-lg relative flex flex-col items-center">
            <div className="absolute -top-4 w-8 h-8 rounded-full bg-amber-700 text-amber-100 border-2 border-amber-400 font-black text-xs flex items-center justify-center shadow-md">
              3º
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-amber-600 my-2 shadow flex items-center justify-center bg-black/60">
              {topThree[2].avatarConfig ? (
                <DynamicCharacterAvatar avatar={topThree[2].avatarConfig} size="full" showPedestal={false} />
              ) : topThree[2].photoUrl?.startsWith('data:') ? (
                <img src={topThree[2].photoUrl} alt="3º" className="w-full h-full object-cover" />
              ) : (
                <DynamicCharacterAvatar
                  avatar={{ ...BIOTYPE_PRESETS[0].config, gender: 'male', ethnicity: 'branco', ageStage: 'jovem', outfit: 'casual', framing: 'face' }}
                  size="full"
                  showPedestal={false}
                />
              )}
            </div>
            <h4 className="text-xs font-bold text-amber-200 truncate w-full">{topThree[2].userName}</h4>
            <span className="text-[10px] text-zinc-400 truncate w-full">{topThree[2].city}-{topThree[2].state}</span>
            <div className="mt-2 text-xs font-black text-amber-300">{topThree[2].score} XP</div>
            <span className="text-[10px] text-emerald-400 font-bold">Nota {topThree[2].grade.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* TABELA GERAL DE TODOS OS IRMÃOS */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-400">
          <span>Participante</span>
          <div className="flex items-center gap-4">
            <span>Nota (0-10)</span>
            <span>Pontuação</span>
          </div>
        </div>

        <div className="divide-y divide-zinc-800/70">
          {filtered.map((entry) => {
            const isUser = entry.isCurrentUser;
            return (
              <div
                key={entry.userId}
                className={`p-3 flex items-center justify-between transition ${
                  isUser
                    ? 'bg-amber-500/15 border-l-4 border-amber-400 font-bold'
                    : 'hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Posição */}
                  <span
                    className={`w-6 text-center text-xs font-black ${
                      entry.rank === 1
                        ? 'text-yellow-400'
                        : entry.rank === 2
                        ? 'text-slate-300'
                        : entry.rank === 3
                        ? 'text-amber-600'
                        : 'text-zinc-500'
                    }`}
                  >
                    #{entry.rank}
                  </span>

                  {/* Avatar Mini */}
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-500/40 shrink-0 bg-black/60 flex items-center justify-center">
                    {entry.avatarConfig ? (
                      <DynamicCharacterAvatar avatar={entry.avatarConfig} size="full" showPedestal={false} />
                    ) : entry.photoUrl?.startsWith('data:') ? (
                      <img src={entry.photoUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <DynamicCharacterAvatar
                        avatar={{ ...BIOTYPE_PRESETS[0].config, gender: 'male', ethnicity: 'pardo', ageStage: 'adulto', outfit: 'casual', framing: 'face' }}
                        size="full"
                        showPedestal={false}
                      />
                    )}
                  </div>

                  {/* Nome e Igreja */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                        {entry.title}: {entry.userName}
                      </span>
                      {isUser && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 text-[9px] font-black uppercase">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
                      <span>{entry.churchName}</span>
                      <span>•</span>
                      <span>{entry.city}-{entry.state}</span>
                    </div>
                  </div>
                </div>

                {/* Nota e Score */}
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-black text-emerald-400">
                      {entry.grade.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-zinc-500 block">/ 10</span>
                  </div>

                  <div className="w-16 sm:w-20">
                    <span className="text-xs sm:text-sm font-black text-amber-400">
                      {entry.score}
                    </span>
                    <span className="text-[9px] text-zinc-400 block font-mono">XP</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botão de Ação para Jogar e Subir no Ranking */}
      <div className="text-center pt-2">
        <button
          onClick={onGoToQuiz}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-zinc-950" />
          <span>Responder Questões e Subir no Ranking</span>
          <ArrowUpRight className="w-4 h-4 text-zinc-950" />
        </button>
      </div>
    </div>
  );
}
