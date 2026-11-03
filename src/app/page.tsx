'use client';

import React, { useState, useEffect } from 'react';
import CharacterCreator from '@/components/CharacterCreator';
import QuizArena from '@/components/QuizArena';
import ChurchDirectory from '@/components/ChurchDirectory';
import RegistrationModal from '@/components/RegistrationModal';
import { BIOTYPE_PRESETS, AvatarState } from '@/data/avatarConfig';
import DynamicCharacterAvatar from '@/components/DynamicCharacterAvatar';
import BackgroundMusicPlayer from '@/components/BackgroundMusicPlayer';
import BrazilDonationBanner from '@/components/BrazilDonationBanner';
import LeaderboardView from '@/components/LeaderboardView';
import { ALL_27_MODULES } from '@/data/modulesQuizData';
import { UserProfile, getSavedUserProfile, saveUserProfile, fullServerSync } from '@/data/db';
import { getSupabase } from '@/lib/supabase';
import { Scroll, User, Users, Trophy, BookOpen, Crown, Award, Church, Edit3, Cloud, Sparkles } from 'lucide-react';

const APOSTLES_LIST = [
  { name: 'Pedro', side: 'Esquerda de Jesus (1º)', tunic: 'Azul-Marinho e Ocre', desc: 'Forte e robusto, pescador da Galileia, calçando sandálias de couro.' },
  { name: 'João', side: 'Direita de Jesus (1º)', tunic: 'Verde-Esmeralda e Vinho', desc: 'Jovem de porte atlético, o discípulo amado.' },
  { name: 'Tiago Maior', side: 'Esquerda (2º)', tunic: 'Terracota e Marrom', desc: 'Irmão de João, porte imponente e olhar firme.' },
  { name: 'André', side: 'Direita (2º)', tunic: 'Turquesa Escuro', desc: 'Irmão de Pedro, ombros largos e barba espessa.' },
  { name: 'Filipe', side: 'Esquerda (3º)', tunic: 'Mostarda e Linho', desc: 'Natural de Betsaida, feições nobres e serenas.' },
  { name: 'Bartolomeu', side: 'Direita (3º)', tunic: 'Púrpura Real', desc: 'Natanael, íntegro e sem dolo.' },
  { name: 'Mateus', side: 'Esquerda (4º)', tunic: 'Vinho e Dourado', desc: 'Autor do Evangelho, veste túnica longa detalhada.' },
  { name: 'Tomé', side: 'Direita (4º)', tunic: 'Cinza-Pedra e Azul', desc: 'Porte robusto, olhar analítico e leal.' },
  { name: 'Tiago Menor', side: 'Esquerda (5º)', tunic: 'Verde-Oliva', desc: 'Filho de Alfeu, firme na fé.' },
  { name: 'Tadeu', side: 'Direita (5º)', tunic: 'Ocre Dourado', desc: 'Judas Tadeu, porte forte e acolhedor.' },
  { name: 'Simão Zelote', side: 'Esquerda (6º)', tunic: 'Vermelho-Carmim', desc: 'Zeloso pelas Escrituras, totalmente pacífico.' },
  { name: 'Matias', side: 'Direita (6º)', tunic: 'Linho Branco e Marrom', desc: 'Escolhido para completar os 12 em Atos 1.' },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'ranking' | 'avatar' | 'modules' | 'apostles' | 'churches'>('quiz');
  const [score, setScore] = useState(1500);
  const [avatar, setAvatar] = useState<AvatarState>(BIOTYPE_PRESETS[0].config);
  const [completedModules, setCompletedModules] = useState<number[]>([1]);

  // Perfil do Irmão / Irmã
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [serverSyncStatus, setServerSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = getSavedUserProfile();
      const savedMods = localStorage.getItem('apostolos_completed_modules');
      const savedAvatar = localStorage.getItem('apostolos_avatar_state');

      // Restaura o avatar personalizado do Irmão / Irmã
      if (savedAvatar) {
        try {
          const parsedAv = JSON.parse(savedAvatar);
          if (parsedAv && parsedAv.gender) {
            setAvatar(parsedAv);
          }
        } catch (e) {}
      } else if (savedProfile?.avatarConfig) {
        setAvatar(savedProfile.avatarConfig);
      }

      let initialMods: number[] = [];
      if (savedMods) {
        try {
          const parsed = JSON.parse(savedMods);
          if (Array.isArray(parsed) && parsed.length > 0) {
            initialMods = parsed;
            setCompletedModules(parsed);
          }
        } catch (e) {}
      }

      if (savedProfile) {
        setUserProfile(savedProfile);
        setAvatar((prev) => ({
          ...prev,
          gender: savedProfile.gender,
          calculatedAge: savedProfile.age,
          birthDate: savedProfile.birthDate,
          ...(savedProfile.avatarConfig || {})
        }));
      } else {
        // Antes de abrir a gamificação, deve-se abrir o cadastro simples
        setShowRegistrationModal(true);
      }

      // Sincroniza dados pessoais e nível de progresso do QUIZ com o banco de dados no servidor
      fullServerSync(savedProfile || undefined, {
        userId: savedProfile?.id,
        completedModules: initialMods,
        score
      })
        .then((res) => {
          if (res?.profile) {
            const p = res.profile;
            setUserProfile(p);
            saveUserProfile(p);
            setAvatar((prev) => ({
              ...prev,
              gender: p.gender,
              calculatedAge: p.age,
              birthDate: p.birthDate,
              ...(p.avatarConfig || {})
            }));
          }
          if (res?.progress) {
            if (Array.isArray(res.progress.completedModules) && res.progress.completedModules.length > 0) {
              setCompletedModules(res.progress.completedModules);
              localStorage.setItem('apostolos_completed_modules', JSON.stringify(res.progress.completedModules));
            }
            if (res.progress.score) {
              setScore((prev) => Math.max(prev, res.progress.score));
            }
          }
          setServerSyncStatus('synced');
        })
        .catch(() => {
          setServerSyncStatus('offline');
        });

      // Escuta autenticação do Google via Supabase
      const sb = getSupabase();
      let authSub: any = null;
      if (sb) {
        sb.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && !savedProfile) {
            const u = session.user;
            const meta = u.user_metadata || {};
            const googleEmail = u.email || '';
            const googleName = meta.full_name || meta.name || googleEmail.split('@')[0] || '';
            const googleAvatar = meta.avatar_url || meta.picture || '';

            const tempProfile: UserProfile = {
              id: u.id,
              name: googleName,
              gender: 'male',
              title: 'Irmão',
              email: googleEmail,
              photoUrl: googleAvatar || '/avatar_irmao_casual.jpg',
              birthDate: '1990-01-01',
              age: 34,
              cep: '',
              street: '',
              neighborhood: '',
              city: 'São Paulo',
              state: 'SP',
              churchName: '',
              ministry: 'Membro em Comunhão',
              isVip: false,
              registeredAt: new Date().toISOString()
            };
            setUserProfile(tempProfile);
            saveUserProfile(tempProfile);
            fullServerSync(tempProfile).catch(() => {});
            setShowRegistrationModal(false);
          }
        });

        const {
          data: { subscription }
        } = sb.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const u = session.user;
            const meta = u.user_metadata || {};
            const googleEmail = u.email || '';
            const googleName = meta.full_name || meta.name || googleEmail.split('@')[0] || '';
            const googleAvatar = meta.avatar_url || meta.picture || '';

            setUserProfile((prev) => {
              if (!prev) {
                const tempProfile: UserProfile = {
                  id: u.id,
                  name: googleName,
                  gender: 'male',
                  title: 'Irmão',
                  email: googleEmail,
                  photoUrl: googleAvatar || '/avatar_irmao_casual.jpg',
                  birthDate: '1990-01-01',
                  age: 34,
                  cep: '',
                  street: '',
                  neighborhood: '',
                  city: 'São Paulo',
                  state: 'SP',
                  churchName: '',
                  ministry: 'Membro em Comunhão',
                  isVip: false,
                  registeredAt: new Date().toISOString()
                };
                saveUserProfile(tempProfile);
                fullServerSync(tempProfile).catch(() => {});
                return tempProfile;
              }
              return prev;
            });
            setShowRegistrationModal(false);
          }
        });
        authSub = subscription;
      }

      return () => {
        authSub?.unsubscribe();
      };
    }
  }, []);

  const handleProfileRegistered = (profile: UserProfile) => {
    const profileWithAvatar: UserProfile = {
      ...profile,
      avatarConfig: avatar
    };
    setUserProfile(profileWithAvatar);
    saveUserProfile(profileWithAvatar);
    setShowRegistrationModal(false);
    setAvatar((prev) => ({
      ...prev,
      gender: profile.gender,
      calculatedAge: profile.age,
      birthDate: profile.birthDate
    }));

    // Sincroniza imediatamente com o servidor
    fullServerSync(profileWithAvatar, {
      userId: profile.id,
      completedModules,
      score,
      userName: profile.name
    })
      .then(() => setServerSyncStatus('synced'))
      .catch(() => setServerSyncStatus('offline'));
  };

  const title = userProfile?.title || (avatar.gender === 'male' ? 'Irmão' : 'Irmã');
  const displayName = userProfile?.name || 'Visitante da Fé';

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between select-none">
      {/* Modal de Cadastro Inicial ou Edição de Perfil */}
      {showRegistrationModal && (
        <RegistrationModal
          initialProfile={userProfile}
          onRegistered={handleProfileRegistered}
          onClose={userProfile ? () => setShowRegistrationModal(false) : undefined}
          avatar={avatar}
          onOpenAvatarCustomizer={() => {
            setShowRegistrationModal(false);
            setActiveTab('avatar');
          }}
        />
      )}

      {/* Cabeçalho com o LOGO OFICIAL Retangular */}
      <header className="relative border-b border-amber-500/20 bg-gradient-to-b from-black via-zinc-950 to-zinc-950 pb-3">
        {/* Banner do Logo: 100% no smartphone e 50% centralizado com 25% de margem lateral em computadores */}
        <div className="w-full">
          <div
            onClick={() => setActiveTab('quiz')}
            className="w-full md:w-1/2 mx-auto cursor-pointer group relative overflow-hidden md:rounded-2xl md:border-2 md:border-amber-500/40 md:shadow-[0_0_35px_rgba(234,179,8,0.25)] transition duration-300 md:hover:scale-[1.01] md:mt-3"
          >
            <div className="relative aspect-[16/9] w-full bg-black flex items-center justify-center">
              <img
                src="/logo.jpg"
                alt="Logo Oficial Apóstolos - Quiz Bíblico"
                className="w-full h-full object-cover group-hover:brightness-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3">
                <span className="bg-amber-500 text-zinc-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md tracking-wider">
                  OFICIAL
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Título e Módulos */}
        <div className="max-w-3xl mx-auto px-4 text-center mt-3">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-black tracking-wider bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-md">
            APÓSTOLOS - QUIZ BÍBLICO
          </h1>
          <p className="text-[10px] sm:text-[11px] md:text-xs font-serif font-bold tracking-[0.2em] text-amber-300/90 uppercase mt-0.5">
            27 Módulos Teológicos • Certificação Oficial de Teologia Básica
          </p>
        </div>

        {/* Barra de Status do Irmão / Irmã */}
        <div className="max-w-3xl mx-auto mt-3 flex items-center justify-between bg-zinc-900/95 border border-amber-500/30 rounded-xl px-4 py-2 text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('avatar')}
              className="flex items-center gap-2 hover:opacity-80 transition cursor-pointer text-left"
              title="Clique para trocar características e roupas do seu avatar 3D"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 bg-black/60 flex items-center justify-center">
                {userProfile?.photoUrl && userProfile.photoUrl.startsWith('data:') ? (
                  <img src={userProfile.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <DynamicCharacterAvatar avatar={avatar} size="sm" showPedestal={false} />
                )}
              </div>
              <span className="text-zinc-200 font-bold truncate max-w-[120px] sm:max-w-xs flex items-center gap-1">
                <span className="text-amber-400">{title}:</span> {displayName}
              </span>
            </button>

            {/* Atalho para Mudar Avatar */}
            <button
              onClick={() => setActiveTab('avatar')}
              className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full hover:bg-amber-500/30 transition flex items-center gap-1 cursor-pointer"
              title="Personalizar seu avatar bíblico quando e como quiser"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Mudar Avatar</span>
            </button>

            <button
              onClick={() => setShowRegistrationModal(true)}
              className="text-[10px] text-zinc-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
              title="Editar dados cadastrais"
            >
              <Edit3 className="w-3 h-3 text-zinc-500 hover:text-amber-400 inline" />
              <span className="hidden sm:inline">Perfil</span>
            </button>

            {userProfile?.isVip && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> PRO
              </span>
            )}

            {/* Indicador de Conexão e Sincronização com o Servidor */}
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                serverSyncStatus === 'synced'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : serverSyncStatus === 'syncing'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
              title={
                serverSyncStatus === 'synced'
                  ? 'Seus dados e progresso do Quiz estão salvos com segurança no servidor!'
                  : 'Sincronizando com o servidor...'
              }
            >
              <Cloud className="w-2.5 h-2.5" />
              {serverSyncStatus === 'synced' ? 'Servidor Conectado' : serverSyncStatus === 'syncing' ? 'Sincronizando...' : 'Local'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('modules')}
              className="text-[11px] text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{completedModules.length}/27 Módulos</span>
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 rounded-full text-amber-300 font-extrabold shrink-0 transition cursor-pointer"
              title="Abrir Ranking Oficial dos Irmãos"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{score} XP</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Central Conforme Aba Ativa */}
      <section className="flex-1 max-w-3xl w-full mx-auto px-4 py-4 overflow-y-auto">
        {/* Ícone Pequeno de Doação Escrito - Visível em Todos os Painéis */}
        <BrazilDonationBanner className="mb-2" />

        {activeTab === 'ranking' && (
          <LeaderboardView
            userProfile={userProfile}
            currentScore={score}
            completedModulesCount={completedModules.length}
            onGoToQuiz={() => setActiveTab('quiz')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizArena
            score={score}
            setScore={setScore}
            completedModules={completedModules}
            setCompletedModules={setCompletedModules}
            userProfile={userProfile}
            avatar={avatar}
            onOpenAvatarCreator={() => setActiveTab('avatar')}
            onOpenRegistration={() => setShowRegistrationModal(true)}
            onOpenLeaderboard={() => setActiveTab('ranking')}
          />
        )}

        {activeTab === 'avatar' && (
          <CharacterCreator
            avatar={avatar}
            setAvatar={setAvatar}
            onFinish={() => setActiveTab('quiz')}
            onSaveNotification={(savedAvatar) => {
              const current = savedAvatar || avatar;
              if (userProfile) {
                const updated: UserProfile = {
                  ...userProfile,
                  avatarConfig: current,
                  gender: current.gender,
                  photoUrl: current.imageUrl || userProfile.photoUrl
                };
                setUserProfile(updated);
                saveUserProfile(updated);
                fullServerSync(updated).catch(() => {});
              }
            }}
          />
        )}

        {/* Mapeamento de Igrejas e Ministérios */}
        {activeTab === 'churches' && <ChurchDirectory />}

        {/* Guia dos 27 Módulos Teológicos */}
        {activeTab === 'modules' && (
          <div className="space-y-4 pb-14">
            <div className="bg-amber-950/40 border-2 border-amber-500/40 rounded-2xl p-5 text-center">
              <BookOpen className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <h2 className="text-lg font-black text-amber-200 uppercase tracking-wide">
                Grade Curricular: 27 Livros de Teologia
              </h2>
              <p className="text-xs text-zinc-300 max-w-lg mx-auto mt-1">
                Conteúdo doutrinário completo. Cada módulo inclui os níveis{' '}
                <strong className="text-emerald-300">Básico (Livre)</strong>,{' '}
                <strong className="text-sky-300">Médio (Livre)</strong> e{' '}
                <strong className="text-amber-400">Avançado (Pago / R$ 10,00)</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_27_MODULES.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setActiveTab('quiz')}
                  className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/60 p-3.5 rounded-xl transition cursor-pointer group"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-300 text-xs group-hover:text-amber-200">
                      {m.title}
                    </span>
                    <span className="text-[10px] uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                      {m.bgScene.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{m.subtitle}</p>
                  <div className="mt-2 text-[10px] text-zinc-500 flex items-center justify-between">
                    <span>36 Questões (12 B, 12 M, 12 A)</span>
                    <span className="text-amber-400 group-hover:underline">Jogar Módulo →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aba dos 12 Apóstolos e Jesus Glorificado */}
        {activeTab === 'apostles' && (
          <div className="space-y-4 pb-14">
            <div className="relative overflow-hidden rounded-2xl border-2 border-amber-500/50 p-6 text-center shadow-2xl bg-zinc-950">
              <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-amber-400 mb-3 shadow-[0_0_25px_rgba(234,179,8,0.5)]">
                <img
                  src="/jesus.jpeg"
                  alt="Jesus Cristo Glorificado"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-lg font-black text-amber-200 uppercase tracking-wide">
                Jesus Cristo ao Centro (Apocalipse 1:14-15)
              </h3>
              <p className="text-xs text-zinc-300 mt-1 max-w-lg mx-auto leading-relaxed">
                Cabelos brancos como a lã, olhos brilhando como chamas de fogo e pés como bronze
                reluzente refinado em fornalha. O Mestre pacífico e eterno ladeado por exatamente 6
                apóstolos à esquerda e 6 à direita.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {APOSTLES_LIST.map((ap, i) => (
                <div key={i} className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-400 text-sm">{ap.name}</span>
                    <span className="text-[10px] uppercase bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      {ap.side}
                    </span>
                  </div>
                  <div className="text-xs text-amber-200/80 mt-1">Túnica: {ap.tunic}</div>
                  <p className="text-xs text-zinc-400 mt-1">{ap.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Reprodutor de Áudio de Fundo em Looping (Play, Pause, Parar) */}
      <BackgroundMusicPlayer />

      {/* Menu de Navegação Inferior (6 Abas Modernas com Ranking) */}
      <nav className="sticky bottom-0 bg-zinc-950/95 backdrop-blur-md border-t border-amber-500/30 px-2 py-2.5 z-40">
        <div className="max-w-xl mx-auto grid grid-cols-6 gap-1">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex flex-col items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase transition cursor-pointer ${
              activeTab === 'quiz' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Scroll className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Quiz</span>
          </button>

          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex flex-col items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase transition cursor-pointer ${
              activeTab === 'ranking' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Ranking</span>
          </button>

          <button
            onClick={() => setActiveTab('avatar')}
            className={`flex flex-col items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase transition cursor-pointer ${
              activeTab === 'avatar' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Meu 3D</span>
          </button>

          <button
            onClick={() => setActiveTab('churches')}
            className={`flex flex-col items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase transition cursor-pointer ${
              activeTab === 'churches' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Church className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Igrejas</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`flex flex-col items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase transition cursor-pointer ${
              activeTab === 'modules' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>27 Livros</span>
          </button>

          <button
            onClick={() => setActiveTab('apostles')}
            className={`flex flex-col items-center gap-1 text-[8px] sm:text-[10px] font-black uppercase transition cursor-pointer ${
              activeTab === 'apostles' ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Apóstolos</span>
          </button>
        </div>
      </nav>
    </main>
  );
}
