'use client';

import React from 'react';
import { UserProfile } from '@/data/db';
import { AvatarState } from '@/data/avatarConfig';
import DynamicCharacterAvatar from './DynamicCharacterAvatar';
import {
  BookOpen,
  Trophy,
  Award,
  Sparkles,
  Flame,
  Crown,
  Compass,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Church,
  User,
  Users,
  Share2
} from 'lucide-react';

interface Props {
  userProfile: UserProfile | null;
  avatar: AvatarState;
  score: number;
  completedModulesCount?: number;
  selectedLevel: 'basico' | 'medio' | 'avancado';
  onSelectLevel: (lvl: 'basico' | 'medio' | 'avancado') => void;
  onStartQuiz: () => void;
  onOpenRanking: () => void;
  onOpenAvatar: () => void;
  onOpenChurches: () => void;
  onOpenRooms?: () => void;
  onOpenModules?: () => void;
  onOpenInvite?: () => void;
  onOpenCommunity?: () => void;
  onlineCount?: number;
  totalUsersCount?: number;
}

export default function HomeJourneyView({
  userProfile,
  avatar,
  score,
  selectedLevel,
  onSelectLevel,
  onStartQuiz,
  onOpenRanking,
  onOpenAvatar,
  onOpenChurches,
  onOpenRooms,
  onOpenInvite,
  onOpenCommunity,
  onlineCount = 1,
  totalUsersCount = 1
}: Props) {
  const title = userProfile?.title || (avatar.gender === 'male' ? 'Irmão' : 'Irmã');
  const displayName = userProfile?.name || 'Visitante da Fé';

  return (
    <div className="space-y-5 pb-16 animate-in fade-in duration-300">
      {/* 1. Hero Card: "Pronto para essa Jornada?" */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 p-5 sm:p-7 shadow-2xl bg-gradient-to-b from-amber-950/40 via-zinc-950 to-zinc-950 text-center sm:text-left">
        {/* Glow de fundo */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Avatar do Participante */}
          <button
            onClick={onOpenAvatar}
            className="group relative cursor-pointer shrink-0 transition-transform hover:scale-105 active:scale-95"
            title="Clique para editar seu avatar 3D"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-3 border-amber-400 shadow-[0_0_25px_rgba(234,179,8,0.35)] bg-black/70 flex items-center justify-center">
              {userProfile?.photoUrl && userProfile.photoUrl.startsWith('data:') ? (
                <img src={userProfile.photoUrl} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <DynamicCharacterAvatar avatar={avatar} size="full" showPedestal={false} />
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-amber-500 text-zinc-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> 3D
            </span>
          </button>

          {/* Texto de Boas-Vindas */}
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              <span>Jornada Bíblica • Gênesis a Apocalipse</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black tracking-tight text-white drop-shadow-md">
              Pronto para essa Jornada?
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-xl">
              A paz do Senhor, <strong className="text-amber-300">{title} {displayName}</strong>! Teste seus conhecimentos bíblicos, acumule pontos por agilidade e concorra no ranking dos irmãos.
            </p>
          </div>
        </div>
      </div>

      {/* 1.1 Banner de Indicação Bíblica Individual (Baixar APK ou Play Store) */}
      {onOpenInvite && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-950/80 via-zinc-950 to-zinc-950 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
              <Share2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3" /> Ganhe +200 XP por Indicação
              </div>
              <h3 className="text-base sm:text-lg font-serif font-black text-white">
                Convide Irmãos da sua Igreja!
              </h3>
              <p className="text-xs text-zinc-300 max-w-md">
                Compartilhe seu link exclusivo com download direto do APK Android ou via Google Play Store.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenInvite}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer shrink-0"
          >
            <Share2 className="w-4 h-4" />
            <span>Gerar Convite Individual</span>
          </button>
        </div>
      )}

      {/* 1.2 Banner da Rede Social Cristã & Discípulos Online */}
      {onOpenCommunity && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/70 via-zinc-950 to-zinc-950 p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
              <Users className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{onlineCount} Irmãos Online Agora</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-bold hidden sm:inline">
                  • {totalUsersCount} Discípulos Cadastrados
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-serif font-black text-white">
                Comunidade & Amizades na Fé
              </h3>
              <p className="text-xs text-zinc-300 max-w-md">
                Conecte-se como amigos, troque saudações fraternais, converse em bate-papo privado e dispute Duelos Bíblicos!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCommunity}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer shrink-0"
          >
            <Users className="w-4 h-4" />
            <span>Ver Irmãos Online & Chat</span>
          </button>
        </div>
      )}

      {/* 2. Seleção de Nível Bíblico (Básico / Médio / Avançado) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Escolha o seu Nível Bíblico</span>
          </h3>
          <span className="text-[11px] text-zinc-400 font-medium">100 Questões por Nível</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Nível 1: Básico (Infantil) */}
          <div
            onClick={() => onSelectLevel('basico')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedLevel === 'basico'
                ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
                : 'bg-zinc-900/90 border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-850'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Nível 1 • Básico
              </span>
              {selectedLevel === 'basico' && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <h4 className="text-base font-black text-white mb-1">Iniciante / Infantil</h4>
            <p className="text-xs text-zinc-300 leading-relaxed mb-3">
              Grandes histórias bíblicas, heróis da fé, milagres e ensinamentos de Jesus em linguagem acessível.
            </p>
            <div className="text-[11px] text-emerald-300 font-bold flex items-center justify-between pt-2 border-t border-zinc-800">
              <span>100 Questões</span>
              <span>Livre e Gratuito</span>
            </div>
          </div>

          {/* Nível 2: Médio (Infanto-Juvenil) */}
          <div
            onClick={() => onSelectLevel('medio')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedLevel === 'medio'
                ? 'bg-sky-950/80 border-sky-400 ring-2 ring-sky-400/50 shadow-[0_0_25px_rgba(14,165,233,0.25)]'
                : 'bg-zinc-900/90 border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-850'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40">
                Nível 2 • Médio
              </span>
              {selectedLevel === 'medio' && (
                <CheckCircle2 className="w-5 h-5 text-sky-400" />
              )}
            </div>
            <h4 className="text-base font-black text-white mb-1">Infanto-Juvenil</h4>
            <p className="text-xs text-zinc-300 leading-relaxed mb-3">
              Cronologia bíblica, profetas de Israel, viagens apostólicas e parábolas com detalhes enriquecedores.
            </p>
            <div className="text-[11px] text-sky-300 font-bold flex items-center justify-between pt-2 border-t border-zinc-800">
              <span>100 Questões</span>
              <span>Livre e Gratuito</span>
            </div>
          </div>

          {/* Nível 3: Avançado (Adulto) */}
          <div
            onClick={() => onSelectLevel('avancado')}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
              selectedLevel === 'avancado'
                ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-850'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Nível 3 • Avançado
              </span>
              {selectedLevel === 'avancado' && (
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <h4 className="text-base font-black text-white mb-1">Adulto / Teológico</h4>
            <p className="text-xs text-zinc-300 leading-relaxed mb-3">
              Profecias de Daniel e Apocalipse, teologia paulina, alianças bíblicas e exegese das Escrituras.
            </p>
            <div className="text-[11px] text-amber-300 font-bold flex items-center justify-between pt-2 border-t border-zinc-800">
              <span>100 Questões</span>
              <span>Certificação Teológica</span>
            </div>
          </div>
        </div>

        {/* Botão Principal de Início da Jornada */}
        <div className="pt-2">
          <button
            onClick={onStartQuiz}
            className="w-full py-4 sm:py-4.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.35)] hover:brightness-110 active:scale-[0.99] transition cursor-pointer"
          >
            <span>Iniciar Jornada no Nível {selectedLevel === 'basico' ? 'Básico' : selectedLevel === 'medio' ? 'Médio' : 'Avançado'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* NOVO: Card de Salas Bíblicas e Disputa com até 20 Amigos */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/70 via-zinc-900 to-zinc-950 border-2 border-amber-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-400/60 text-amber-300 shrink-0">
              <Users className="w-8 h-8 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-400" /> Salas de Disputa • Até 20 Amigos
              </div>
              <h4 className="text-lg sm:text-xl font-serif font-black text-white">
                Disputa Bíblica com Palavra-Chave
              </h4>
              <p className="text-xs text-zinc-300 max-w-lg leading-relaxed">
                Crie um grupo como <strong>"Herdeiros com Cristo"</strong> (palavra-chave: <strong>"Nova Aliança"</strong>), convide seus amigos, dispute com temporizador de 1 minuto, intervalo de 20s e chat exclusivo da sala!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenRooms}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition cursor-pointer shrink-0"
          >
            <Users className="w-4 h-4" />
            <span>Abrir Salas de Disputa</span>
          </button>
        </div>
      </div>

      {/* 3. Métricas de Uso e Desempenho Espiritual */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wider flex items-center gap-2 px-1">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Métricas de Uso e Progresso</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Métrica 1: Bíblia Sagrada */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl text-center space-y-1">
            <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-center gap-1">
              <BookOpen className="w-3 h-3 text-amber-400" /> Bíblia Sagrada
            </div>
            <div className="text-lg sm:text-xl font-black text-amber-300">
              300 <span className="text-xs text-zinc-400 font-normal">Questões</span>
            </div>
            <p className="text-[10px] text-zinc-400">Gênesis a Apocalipse</p>
          </div>

          {/* Métrica 2: Gamificação e XP */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl text-center space-y-1">
            <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" /> XP Total
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-400">
              {score}
            </div>
            <p className="text-[10px] text-zinc-400">Pontos da Fé</p>
          </div>

          {/* Métrica 3: Temporizador & Bônus */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl text-center space-y-1">
            <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-sky-400" /> Bônus Tempo
            </div>
            <div className="text-lg sm:text-xl font-black text-sky-300">
              Até +0.50
            </div>
            <p className="text-[10px] text-zinc-400">Por questão rápida</p>
          </div>

          {/* Métrica 4: Congregação */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-2xl text-center space-y-1">
            <div className="text-zinc-400 text-[10px] uppercase font-bold flex items-center justify-center gap-1">
              <Church className="w-3 h-3 text-amber-400" /> Igreja
            </div>
            <div className="text-xs sm:text-sm font-black text-zinc-200 truncate" title={userProfile?.churchName || 'Igreja Local'}>
              {userProfile?.churchName ? userProfile.churchName.split(' ')[0] : 'Sede Central'}
            </div>
            <p className="text-[10px] text-zinc-400 truncate">{userProfile?.city || 'Brasil'}</p>
          </div>
        </div>
      </div>

      {/* 4. Gamificação e Ranking dos Irmãos */}
      <div className="bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300 shrink-0">
              <Trophy className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-black text-white">Gamificação e Ranking Geral</h4>
              <p className="text-xs text-zinc-300">
                Sua pontuação atual é <strong className="text-amber-300">{score} XP</strong>. Concorra com irmãos de todo o Brasil!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenRanking}
            className="px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer self-stretch sm:self-auto"
          >
            <Trophy className="w-4 h-4" />
            <span>Ver Ranking Geral</span>
          </button>
        </div>
      </div>

      {/* 5. Atalhos Rápidos da Fraternidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
        <button
          onClick={onOpenRooms}
          className="p-3.5 rounded-2xl bg-zinc-900/90 border border-amber-500/40 hover:border-amber-400 flex items-center gap-3 text-left transition cursor-pointer group shadow-lg"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 group-hover:bg-amber-500/30 transition">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-black text-white group-hover:text-amber-300 transition">Salas de Disputa</div>
            <div className="text-[10px] text-zinc-400">Até 20 amigos com chave</div>
          </div>
        </button>

        <button
          onClick={onOpenAvatar}
          className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 flex items-center gap-3 text-left transition cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300 group-hover:bg-amber-500/20 transition">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white group-hover:text-amber-300 transition">Meu Avatar 3D</div>
            <div className="text-[10px] text-zinc-400">Personalizar personagem</div>
          </div>
        </button>

        <button
          onClick={onStartQuiz}
          className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 flex items-center gap-3 text-left transition cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300 group-hover:bg-amber-500/20 transition">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-black text-white group-hover:text-amber-300 transition">Quiz da Bíblia</div>
            <div className="text-[10px] text-zinc-400">Gênesis a Apocalipse</div>
          </div>
        </button>

        <button
          onClick={onOpenChurches}
          className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 flex items-center gap-3 text-left transition cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300 group-hover:bg-amber-500/20 transition">
            <Church className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black text-white group-hover:text-amber-300 transition">Igrejas Próximas</div>
            <div className="text-[10px] text-zinc-400">Mapeamento ministerial</div>
          </div>
        </button>
      </div>
    </div>
  );
}
