'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  KeyRound,
  PlusCircle,
  Play,
  Zap,
  Timer,
  Clock,
  Send,
  MessageSquare,
  Award,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Crown,
  Volume2,
  LogOut,
  RotateCcw,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, isUserAdmin, performAdminActionClient } from '@/data/db';
import { AvatarState } from '@/data/avatarConfig';
import DynamicCharacterAvatar from './DynamicCharacterAvatar';
import {
  MultiplayerRoom,
  RoomMember,
  RoomChatMessage,
  fetchRoomsClient,
  getRoomClient,
  createRoomClient,
  joinRoomClient,
  sendRoomMessageClient,
  performRoomActionClient,
  INITIAL_ROOMS_DEMO
} from '@/data/multiplayerRooms';

interface Props {
  userProfile: UserProfile | null;
  avatar: AvatarState;
  onGoToSoloQuiz?: () => void;
}

export default function MultiplayerRooms({ userProfile, avatar, onGoToSoloQuiz }: Props) {
  // Estado das salas
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [selectedRoomToJoin, setSelectedRoomToJoin] = useState<any | null>(null);

  // Formulário de Criação
  const [newRoomName, setNewRoomName] = useState('Herdeiros com Cristo');
  const [newRoomPasscode, setNewRoomPasscode] = useState('Nova Aliança');
  const [newRoomLevel, setNewRoomLevel] = useState<'basico' | 'medio' | 'avancado'>('basico');
  const [newRoomMaxMembers, setNewRoomMaxMembers] = useState(20);

  // Formulário de Entrada (Palavra-Chave)
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [joinErrorMessage, setJoinErrorMessage] = useState('');

  // Chat
  const [chatMessageText, setChatMessageText] = useState('');
  const [activeTabPanel, setActiveTabPanel] = useState<'quiz' | 'chat' | 'members'>('quiz');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Temporizadores locais sincronizados
  const [timeLeftQuestion, setTimeLeftQuestion] = useState(60);
  const [timeLeftIntermission, setTimeLeftIntermission] = useState(20);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Usuário atual
  const currentUserId = userProfile?.id || 'guest_' + (typeof window !== 'undefined' ? (window.navigator?.userAgent?.length || 10) : 10);
  const currentUserName = userProfile?.name || 'Visitante da Fé';
  const currentUserTitle: 'Irmão' | 'Irmã' = userProfile?.title || (avatar.gender === 'female' ? 'Irmã' : 'Irmão');
  const isAdminUser = isUserAdmin(userProfile);

  // Ação de Moderação pelo Administrador dentro do chat da sala
  const handleAdminDeleteMessage = async (messageId: string) => {
    if (!activeRoom || !isAdminUser) return;
    if (!confirm('Deseja realmente apagar esta mensagem do chat como Administrador?')) return;
    try {
      await performAdminActionClient(
        'delete_message',
        { roomId: activeRoom.id, messageId },
        userProfile?.email || ''
      );
      const updated = await getRoomClient(activeRoom.id);
      if (updated) setActiveRoom(updated);
    } catch (e: any) {
      alert('Erro ao apagar mensagem: ' + (e.message || e));
    }
  };

  // Carrega lista de salas
  const reloadRooms = async () => {
    try {
      const list = await fetchRoomsClient();
      setRoomsList(list);
    } catch (e) {}
  };

  useEffect(() => {
    reloadRooms();
    const interval = setInterval(reloadRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // Polling da sala ativa a cada 1.5s para multiplayer fluido
  useEffect(() => {
    if (!activeRoom?.id) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const updated = await getRoomClient(activeRoom.id);
        if (updated && isMounted) {
          setActiveRoom(updated);
        }
      } catch (e) {}
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeRoom?.id]);

  // Temporizador da Questão (1 minuto / 60 segundos)
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'in_progress') return;

    // Reseta opção escolhida ao iniciar nova questão
    const member = activeRoom.members.find((m) => m.userId === currentUserId);
    if (!member?.hasAnswered) {
      setSelectedOption(null);
    } else {
      setSelectedOption(member.selectedOption ?? null);
    }

    // Calcula tempo restante baseado no timestamp do servidor
    if (activeRoom.questionExpiresAt) {
      const remaining = Math.max(0, Math.ceil((activeRoom.questionExpiresAt - Date.now()) / 1000));
      setTimeLeftQuestion(remaining);
    } else {
      setTimeLeftQuestion(60);
    }

    const timer = setInterval(() => {
      setTimeLeftQuestion((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Tempo de 1 minuto esgotado! Se for o líder ou local, aciona transição
          handleQuestionTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRoom?.status, activeRoom?.currentQuestionIndex, activeRoom?.questionExpiresAt]);

  // Temporizador do Intervalo Pós-Questão (20 segundos)
  useEffect(() => {
    if (!activeRoom || activeRoom.status !== 'intermission') return;

    if (activeRoom.intermissionExpiresAt) {
      const remaining = Math.max(0, Math.ceil((activeRoom.intermissionExpiresAt - Date.now()) / 1000));
      setTimeLeftIntermission(remaining);
    } else {
      setTimeLeftIntermission(20);
    }

    const timer = setInterval(() => {
      setTimeLeftIntermission((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 20 segundos acabaram! Começa a questão seguinte sozinha automaticamente
          handleIntermissionExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRoom?.status, activeRoom?.currentQuestionIndex, activeRoom?.intermissionExpiresAt]);

  // Auto-scroll no chat
  useEffect(() => {
    if (activeTabPanel === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeRoom?.messages?.length, activeTabPanel]);

  // Ações do Jogo
  const handleQuestionTimeExpired = async () => {
    if (!activeRoom) return;
    try {
      await performRoomActionClient(activeRoom.id, 'interrupt_timer', {
        userId: 'system',
        userName: 'Tempo de 1 Minuto Esgotado'
      });
      const updated = await getRoomClient(activeRoom.id);
      if (updated) setActiveRoom(updated);
    } catch (e) {}
  };

  const handleIntermissionExpired = async () => {
    if (!activeRoom) return;
    try {
      await performRoomActionClient(activeRoom.id, 'start_next_question', {
        userId: 'system',
        forceNext: true
      });
      const updated = await getRoomClient(activeRoom.id);
      if (updated) setActiveRoom(updated);
    } catch (e) {}
  };

  // Interrupção manual do tempo por qualquer membro
  const handleInterruptTimer = async () => {
    if (!activeRoom || activeRoom.status !== 'in_progress') return;
    try {
      await performRoomActionClient(activeRoom.id, 'interrupt_timer', {
        userId: currentUserId,
        userName: `${currentUserTitle} ${currentUserName}`
      });
      const updated = await getRoomClient(activeRoom.id);
      if (updated) setActiveRoom(updated);
    } catch (e) {}
  };

  // Responder questão
  const handleSelectAnswer = async (index: number) => {
    if (!activeRoom || activeRoom.status !== 'in_progress') return;
    const member = activeRoom.members.find((m) => m.userId === currentUserId);
    if (member?.hasAnswered) return; // Já respondeu

    setSelectedOption(index);
    const secondsElapsed = 60 - timeLeftQuestion;

    try {
      await performRoomActionClient(activeRoom.id, 'answer_question', {
        userId: currentUserId,
        selectedOption: index,
        secondsElapsed
      });
      const updated = await getRoomClient(activeRoom.id);
      if (updated) setActiveRoom(updated);
    } catch (e) {}
  };

  // Começar próxima questão agora (antes dos 20 segundos)
  const handleStartNextNow = async () => {
    if (!activeRoom || activeRoom.status !== 'intermission') return;
    try {
      await performRoomActionClient(activeRoom.id, 'start_next_question', {
        userId: currentUserId,
        forceNext: true
      });
      const updated = await getRoomClient(activeRoom.id);
      if (updated) setActiveRoom(updated);
    } catch (e) {}
  };

  // Iniciar disputa pelo líder
  const handleStartGame = async () => {
    if (!activeRoom) return;
    try {
      await performRoomActionClient(activeRoom.id, 'start_game', {
        userId: currentUserId
      });
      const updated = await getRoomClient(activeRoom.id);
      if (updated) setActiveRoom(updated);
    } catch (e) {}
  };

  const isAdmin = isUserAdmin(userProfile);

  // Acesso Mestre de Administrador (sem exigência de senha)
  const handleAdminMasterJoin = async (room: any) => {
    setIsLoading(true);
    try {
      const res = await joinRoomClient(room.id, '', {
        userId: currentUserId,
        name: currentUserName,
        title: currentUserTitle,
        photoUrl: userProfile?.photoUrl,
        avatarConfig: avatar,
        userEmail: userProfile?.email
      });
      if (res.success && res.room) {
        setActiveRoom(res.room);
        reloadRooms();
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar mensagem no chat da sala
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatMessageText.trim() || !activeRoom) return;

    const textToSend = chatMessageText.trim();
    setChatMessageText('');

    try {
      await sendRoomMessageClient(activeRoom.id, {
        userId: currentUserId,
        userName: currentUserName,
        userTitle: isAdmin ? 'Administrador' : currentUserTitle,
        text: textToSend,
        userEmail: userProfile?.email
      });
      const updated = await getRoomClient(activeRoom.id);
      if (updated) setActiveRoom(updated);
    } catch (e) {}
  };

  // Abrir Modal para Entrar em um Grupo
  const handlePromptJoin = (room: any) => {
    setSelectedRoomToJoin(room);
    setEnteredPasscode('');
    setJoinErrorMessage('');
    setShowKeyModal(true);
  };

  // Confirmar Palavra-Chave para Entrar
  const handleConfirmJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedRoomToJoin) return;

    if (!enteredPasscode.trim()) {
      setJoinErrorMessage('Por favor, digite a palavra-chave.');
      return;
    }

    setIsLoading(true);
    setJoinErrorMessage('');

    try {
      const res = await joinRoomClient(selectedRoomToJoin.id, enteredPasscode, {
        userId: currentUserId,
        name: currentUserName,
        title: currentUserTitle,
        photoUrl: userProfile?.photoUrl,
        avatarConfig: avatar,
        userEmail: userProfile?.email
      });

      if (res.success && res.room) {
        setActiveRoom(res.room);
        setShowKeyModal(false);
        reloadRooms();
      } else {
        setJoinErrorMessage(res.message || 'Palavra-chave incorreta! Tente novamente.');
      }
    } catch (err) {
      setJoinErrorMessage('Erro ao conectar ao grupo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Criar Novo Grupo
  const handleCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newRoomName.trim() || !newRoomPasscode.trim()) return;

    setIsLoading(true);
    try {
      const res = await createRoomClient({
        name: newRoomName.trim(),
        passcode: newRoomPasscode.trim(),
        createdBy: currentUserId,
        createdByName: currentUserName,
        creatorTitle: currentUserTitle,
        level: newRoomLevel,
        maxMembers: newRoomMaxMembers
      });

      if (res.success && res.room) {
        setActiveRoom(res.room);
        setShowCreateModal(false);
        reloadRooms();
      }
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  // Copiar chave para convite
  const handleCopyInvite = () => {
    if (!activeRoom) return;
    const inviteText = `Venha disputar comigo no Apóstolos Quiz Bíblico!\nGrupo: ${activeRoom.name}\nPalavra-Chave: ${activeRoom.passcode}\nCapacidade: até 20 amigos.`;
    navigator.clipboard.writeText(inviteText);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const currentMember = activeRoom?.members.find((m) => m.userId === currentUserId);
  const isLeader = activeRoom?.createdBy === currentUserId;
  const currentQ = activeRoom && activeRoom.questions && activeRoom.questions[activeRoom.currentQuestionIndex];

  // =========================================================================
  // RENDER 1: LOBBY DE SALAS / LISTAGEM
  // =========================================================================
  if (!activeRoom) {
    return (
      <div className="space-y-4 pb-14 animate-in fade-in duration-300">
        {/* Banner do Modo Salas Bíblicas */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 p-5 sm:p-6 bg-gradient-to-b from-amber-950/60 via-zinc-950 to-zinc-950 shadow-2xl">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" />
                <span>Salas Bíblicas • Até 20 Amigos</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-white">
                Disputa Bíblica em Grupo
              </h2>
              <p className="text-xs text-zinc-300 max-w-md leading-relaxed">
                Reúna até 20 irmãos, jovens ou familiares para uma disputa bíblica com palavra-chave exclusiva, chat privativo e temporizadores ao vivo!
              </p>
            </div>

            {/* Botão de Criar Grupo */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.35)] transition cursor-pointer shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Criar Meu Grupo</span>
            </button>
          </div>
        </div>

        {/* Regras Rápidas da Disputa */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-[11px]">Palavra-Chave Secreta</div>
              <div className="text-[10px] text-zinc-400">Cada grupo tem chave individual para acesso</div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-[11px]">1 Minuto por Questão</div>
              <div className="text-[10px] text-zinc-400">Ou interrompa a qualquer momento</div>
            </div>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl flex items-center gap-2.5">
            <Timer className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-[11px]">20s de Intervalo</div>
              <div className="text-[10px] text-zinc-400">Ou comece já com o temporizador de alerta</div>
            </div>
          </div>
        </div>

        {/* Lista de Grupos Ativos */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Grupos Ativos para Disputar ({roomsList.length})</span>
            </h3>
            <button
              onClick={reloadRooms}
              className="text-[10px] text-zinc-400 hover:text-amber-300 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Atualizar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomsList.map((room) => (
              <div
                key={room.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all space-y-3 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Nível {room.level || 'Básico'}
                      </span>
                      <h4 className="text-base font-black text-white mt-1.5 flex items-center gap-1.5">
                        <span>{room.name}</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Criado por: <span className="text-zinc-200 font-semibold">{room.creatorTitle} {room.createdByName}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{room.membersCount || 1}/{room.maxMembers || 20}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 text-amber-300/90">
                      <KeyRound className="w-3 h-3 text-amber-400" /> Chave Obrigatória
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {room.status === 'in_progress' ? '⚔️ Em Disputa' : 'Aguardando amigos'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePromptJoin(room)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 hover:from-amber-500/30 via-amber-500/10 to-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Entrar no Grupo com Chave</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleAdminMasterJoin(room)}
                      className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase flex items-center gap-1.5 transition cursor-pointer shadow-md shrink-0"
                      title="Entrar com Acesso Mestre de Administrador (sem exigir senha)"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Admin</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL 1: Digitar Palavra-Chave para Entrar no Grupo */}
        {showKeyModal && selectedRoomToJoin && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border-2 border-amber-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-400 mb-2">
                  <KeyRound className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-white">
                  Qual a palavra-chave?
                </h3>
                <p className="text-xs text-zinc-300">
                  Para entrar no grupo <strong className="text-amber-300">"{selectedRoomToJoin.name}"</strong>, digite a palavra-chave definida pelo criador:
                </p>
              </div>

              <form onSubmit={handleConfirmJoin} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={enteredPasscode}
                    onChange={(e) => setEnteredPasscode(e.target.value)}
                    placeholder='Ex: "Nova Aliança"'
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border-2 border-amber-500/50 focus:border-amber-400 text-white font-bold text-center text-sm outline-none shadow-inner"
                  />
                  {selectedRoomToJoin.name === 'Herdeiros com Cristo' && (
                    <p className="text-[10px] text-amber-300/80 text-center mt-1">
                      💡 Dica de demonstração: a chave é <strong>"Nova Aliança"</strong>
                    </p>
                  )}
                </div>

                {joinErrorMessage && (
                  <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs text-center flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{joinErrorMessage}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isLoading ? 'Verificando...' : 'Entrar na Disputa'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: Criar Novo Grupo de Disputa (Até 20 Amigos) */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border-2 border-amber-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto text-amber-400 mb-2">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white">
                  Criar Grupo de Disputa Bíblica
                </h3>
                <p className="text-xs text-zinc-300">
                  Convide até 20 amigos e defina a palavra-chave secreta do grupo.
                </p>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Nome do Grupo:
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder='Ex: Herdeiros com Cristo'
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-amber-500/40 text-white font-semibold outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-bold mb-1 flex items-center justify-between">
                    <span>Palavra-Chave do Grupo (Individual):</span>
                    <span className="text-[10px] text-amber-400">Você define a chave</span>
                  </label>
                  <input
                    type="text"
                    value={newRoomPasscode}
                    onChange={(e) => setNewRoomPasscode(e.target.value)}
                    placeholder='Ex: Nova Aliança'
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-amber-500/40 text-white font-semibold outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Cada chave será individual para o grupo específico (ex: "Nova Aliança").
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      Nível Bíblico:
                    </label>
                    <select
                      value={newRoomLevel}
                      onChange={(e: any) => setNewRoomLevel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold outline-none"
                    >
                      <option value="basico">Nível 1 • Básico (Infantil)</option>
                      <option value="medio">Nível 2 • Médio (Jovens)</option>
                      <option value="avancado">Nível 3 • Avançado (Adulto)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      Limite de Membros:
                    </label>
                    <select
                      value={newRoomMaxMembers}
                      onChange={(e: any) => setNewRoomMaxMembers(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold outline-none"
                    >
                      <option value="5">Até 5 Amigos</option>
                      <option value="10">Até 10 Amigos</option>
                      <option value="15">Até 15 Amigos</option>
                      <option value="20">Até 20 Amigos (Máximo)</option>
                    </select>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                  ⚡ <strong>Regras automáticas da sala:</strong> 1 minuto por questão (ou interrompido por membro) e 20 segundos de intervalo entre as questões.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-zinc-950 font-black uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{isLoading ? 'Criando...' : 'Criar Grupo'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER 2: DENTRO DA SALA (LOBBY, QUIZ EM ANDAMENTO OU RESULTADO)
  // =========================================================================
  return (
    <div className="space-y-3 pb-14 animate-in fade-in duration-300">
      {/* Barra Superior da Sala */}
      <div className="bg-zinc-900/95 border-2 border-amber-500/40 rounded-2xl p-3 sm:px-4 shadow-xl space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Nome do Grupo e Palavra-chave */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Grupo: {activeRoom.name}
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-400" />
                <span>{activeRoom.members.length}/{activeRoom.maxMembers || 20} Amigos</span>
              </span>
            </div>

            {/* Chave de Acesso Exclusiva com botão Copiar */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-400">Palavra-Chave:</span>
              <span className="font-mono text-xs font-black text-amber-400 bg-black/60 px-2 py-0.5 rounded border border-amber-500/40 select-all">
                {activeRoom.passcode}
              </span>
              <button
                onClick={handleCopyInvite}
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1 transition cursor-pointer"
                title="Copiar convite com a chave para seus amigos"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey ? 'Copiado!' : 'Copiar Convite'}</span>
              </button>
            </div>
          </div>

          {/* Botão Sair da Sala */}
          <button
            onClick={() => setActiveRoom(null)}
            className="text-[11px] bg-zinc-800 hover:bg-red-950/80 hover:text-red-300 hover:border-red-500/50 text-zinc-400 border border-zinc-700 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ml-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair do Grupo</span>
          </button>
        </div>

        {/* Abas Superiores dentro da Sala (Disputa Bíblica / Chat Privado / Membros) */}
        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-zinc-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveTabPanel('quiz')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTabPanel === 'quiz'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Disputa</span>
          </button>

          <button
            onClick={() => setActiveTabPanel('chat')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer relative ${
              activeTabPanel === 'chat'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat ({activeRoom.messages?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTabPanel('members')}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTabPanel === 'members'
                ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                : 'bg-zinc-850 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Amigos ({activeRoom.members?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* PAINEL 1: DISPUTA BÍBLICA */}
      {activeTabPanel === 'quiz' && (
        <div className="space-y-3">
          {/* ESTADO 1: AGUARDANDO INÍCIO (SALA DE ESPERA) */}
          {activeRoom.status === 'waiting' && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center mx-auto text-amber-400">
                <Users className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-serif font-black text-white">
                  Lobby de Espera do Grupo
                </h3>
                <p className="text-xs text-zinc-300 max-w-md mx-auto">
                  Compartilhe a palavra-chave <strong className="text-amber-300">"{activeRoom.passcode}"</strong> com seus amigos para eles entrarem no grupo.
                </p>
              </div>

              {/* Grid dos Membros Conectados */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
                  Amigos Conectados ({activeRoom.members.length}/20):
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  {activeRoom.members.map((m) => (
                    <div
                      key={m.userId}
                      className="bg-zinc-950 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center overflow-hidden shrink-0">
                        {m.avatarConfig ? (
                          <DynamicCharacterAvatar avatar={m.avatarConfig} size="full" showPedestal={false} />
                        ) : m.photoUrl?.startsWith('data:') ? (
                          <img src={m.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-black text-amber-300">{m.name.charAt(0)}</span>
                        )}
                      </div>
                      <span className="font-semibold text-zinc-200">
                        {m.title} {m.name}
                      </span>
                      {activeRoom.createdBy === m.userId && (
                        <span title="Criador do Grupo">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de Início para o Líder ou Alerta para Membros */}
              <div className="pt-4 max-w-md mx-auto">
                {isLeader ? (
                  <button
                    onClick={handleStartGame}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:brightness-110 text-zinc-950 font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(245,158,11,0.35)] transition cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Iniciar Disputa Bíblica</span>
                  </button>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Aguardando o líder ({activeRoom.createdByName}) iniciar a disputa...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ESTADO 2: QUESTÃO EM ANDAMENTO (TEMPO DE 1 MINUTO) */}
          {activeRoom.status === 'in_progress' && currentQ && (
            <div className="space-y-3">
              {/* Barra do Temporizador de 1 Minuto e Interrupção */}
              <div className="bg-zinc-900 border-2 border-amber-500/40 rounded-2xl p-3 sm:px-4 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-black">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 uppercase">
                      Questão {activeRoom.currentQuestionIndex + 1} de {activeRoom.totalQuestions}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      • {currentQ.reference}
                    </span>
                  </div>

                  {/* Contador Regressivo de 1 Minuto (60s) */}
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black ${
                    timeLeftQuestion <= 10
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>00:{timeLeftQuestion < 10 ? `0${timeLeftQuestion}` : timeLeftQuestion}</span>
                  </div>
                </div>

                {/* Barra de Progresso do 1 Minuto */}
                <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timeLeftQuestion <= 10
                        ? 'bg-gradient-to-r from-red-600 to-orange-500'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    }`}
                    style={{ width: `${(timeLeftQuestion / 60) * 100}%` }}
                  />
                </div>

                {/* BOTÃO EXCLUSIVO DE INTERRUPÇÃO DE TEMPO (REQUISITO EXPLÍCITO DO USUÁRIO) */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-zinc-400">
                    Tempo limite: 1 minuto para responder
                  </span>

                  <button
                    onClick={handleInterruptTimer}
                    className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:brightness-110 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow transition cursor-pointer shrink-0"
                    title="Clique para encerrar o tempo da questão agora mesmo para todos do grupo"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300 fill-current animate-bounce" />
                    <span>Interromper Tempo / Responder Já</span>
                  </button>
                </div>
              </div>

              {/* Pergunta Bíblica */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <h3 className="text-base sm:text-lg font-serif font-black text-white leading-relaxed">
                  {currentQ.question}
                </h3>

                {/* Alternativas de Resposta */}
                <div className="grid grid-cols-1 gap-2.5 pt-1">
                  {currentQ.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const memberAnswered = currentMember?.hasAnswered;

                    return (
                      <button
                        key={idx}
                        disabled={memberAnswered}
                        onClick={() => handleSelectAnswer(idx)}
                        className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-left font-medium text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/50'
                            : memberAnswered
                            ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-500 cursor-not-allowed'
                            : 'bg-zinc-950 border-zinc-800 hover:border-amber-500/60 text-zinc-200 cursor-pointer hover:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isSelected
                              ? 'bg-amber-400 text-zinc-950'
                              : 'bg-zinc-850 text-zinc-400 border border-zinc-700'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {currentMember?.hasAnswered && (
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resposta enviada! Aguardando o tempo acabar ou interrupção de outro amigo...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ESTADO 3: INTERVALO ENTRE QUESTÕES (TEMPORIZADOR DE ALERTA DE 20 SEGUNDOS) */}
          {activeRoom.status === 'intermission' && currentQ && (
            <div className="space-y-3">
              {/* ALERTA DE 20 SEGUNDOS (REQUISITO EXPLÍCITO DO USUÁRIO) */}
              <div className="relative overflow-hidden bg-gradient-to-r from-amber-950 via-zinc-900 to-amber-950 border-2 border-amber-500/70 rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-3">
                {activeRoom.timeInterruptedBy && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold animate-pulse">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Tempo interrompido por: {activeRoom.timeInterruptedBy}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-white">
                    Intervalo Entre as Questões
                  </h3>
                  <p className="text-xs text-zinc-300">
                    Cada membro tem <strong>20 segundos</strong> para começar a questão seguinte, ou ela começará sozinha com o alerta!
                  </p>
                </div>

                {/* Contador Visual Gigante dos 20 Segundos */}
                <div className="py-2">
                  <div className="inline-flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-amber-400 bg-black/80 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                    <span className="text-3xl font-black font-mono text-amber-300 animate-pulse">
                      {timeLeftIntermission}s
                    </span>
                    <span className="text-[9px] uppercase font-bold text-zinc-400">Alerta</span>
                  </div>
                </div>

                {/* BOTÃO PARA COMEÇAR A QUESTÃO SEGUINTE ANTES DOS 20 SEGUNDOS */}
                <div className="max-w-sm mx-auto">
                  <button
                    onClick={handleStartNextNow}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-110 text-zinc-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition cursor-pointer"
                  >
                    <ArrowRight className="w-5 h-5" />
                    <span>Começar Próxima Questão Agora</span>
                  </button>
                </div>

                {/* Revelação da Resposta Correta da Questão Anterior */}
                <div className="pt-3 border-t border-zinc-800 text-left bg-black/40 p-3.5 rounded-2xl space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Resposta Correta: {currentQ.options[currentQ.correctIndex]}</span>
                  </div>
                  {currentQ.explanation && (
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      {currentQ.explanation}
                    </p>
                  )}
                  <div className="text-[10px] text-zinc-400">
                    Referência: <span className="text-zinc-200 font-semibold">{currentQ.reference}</span>
                  </div>
                </div>
              </div>

              {/* Placar Parcial entre os Amigos */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-2">
                <div className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Placar da Disputa ({activeRoom.members.length} Amigos)</span>
                </div>

                <div className="space-y-1.5">
                  {[...activeRoom.members]
                    .sort((a, b) => b.score - a.score)
                    .map((m, idx) => (
                      <div
                        key={m.userId}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          m.userId === currentUserId
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                            idx === 0
                              ? 'bg-amber-400 text-zinc-950'
                              : idx === 1
                              ? 'bg-zinc-300 text-zinc-950'
                              : idx === 2
                              ? 'bg-amber-700 text-white'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {idx + 1}º
                          </span>
                          <span className="font-bold">
                            {m.title} {m.name}
                          </span>
                          {m.interruptedTime && (
                            <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded border border-orange-500/40">
                              ⚡ Interrompeu
                            </span>
                          )}
                        </div>

                        <span className="font-mono font-black text-amber-400">
                          {m.score} XP
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ESTADO 4: DISPUTA FINALIZADA (PÓDIO DOS AMIGOS) */}
          {activeRoom.status === 'finished' && (
            <div className="bg-zinc-900/95 border-2 border-amber-500/60 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400">
                <Trophy className="w-9 h-9 animate-bounce" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-serif font-black text-amber-300">
                  Disputa Bíblica Concluída!
                </h3>
                <p className="text-xs text-zinc-300">
                  Parabéns a todos os irmãos e amigos pela comunhão na Palavra de Deus!
                </p>
              </div>

              {/* Pódio (1º, 2º e 3º) */}
              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto pt-2 items-end">
                {/* 2º Lugar */}
                {activeRoom.members[1] && (
                  <div className="bg-zinc-950 border border-zinc-700 rounded-2xl p-3 text-center space-y-1 order-1 h-36 flex flex-col justify-end">
                    <span className="text-lg">🥈</span>
                    <div className="font-bold text-xs text-zinc-200 truncate">{activeRoom.members[1].name}</div>
                    <div className="text-[11px] font-mono font-black text-amber-300">{activeRoom.members[1].score} XP</div>
                    <div className="text-[9px] uppercase font-bold text-zinc-400">2º Lugar</div>
                  </div>
                )}

                {/* 1º Lugar (Campeão) */}
                {activeRoom.members[0] && (
                  <div className="bg-gradient-to-b from-amber-500/20 to-zinc-950 border-2 border-amber-400 rounded-2xl p-3 text-center space-y-1 order-2 h-44 flex flex-col justify-end shadow-[0_0_25px_rgba(245,158,11,0.3)]">
                    <span className="text-2xl">👑</span>
                    <div className="font-black text-sm text-amber-300 truncate">{activeRoom.members[0].name}</div>
                    <div className="text-xs font-mono font-black text-yellow-300">{activeRoom.members[0].score} XP</div>
                    <div className="text-[10px] uppercase font-black bg-amber-500 text-zinc-950 rounded py-0.5">1º Campeão</div>
                  </div>
                )}

                {/* 3º Lugar */}
                {activeRoom.members[2] && (
                  <div className="bg-zinc-950 border border-amber-800 rounded-2xl p-3 text-center space-y-1 order-3 h-32 flex flex-col justify-end">
                    <span className="text-lg">🥉</span>
                    <div className="font-bold text-xs text-zinc-200 truncate">{activeRoom.members[2].name}</div>
                    <div className="text-[11px] font-mono font-black text-amber-300">{activeRoom.members[2].score} XP</div>
                    <div className="text-[9px] uppercase font-bold text-amber-700">3º Lugar</div>
                  </div>
                )}
              </div>

              {/* Ações pós-jogo */}
              <div className="flex gap-2 max-w-sm mx-auto pt-3">
                <button
                  onClick={() => setActiveRoom(null)}
                  className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase transition cursor-pointer"
                >
                  Sair do Grupo
                </button>
                {isLeader && (
                  <button
                    onClick={async () => {
                      await performRoomActionClient(activeRoom.id, 'restart_game', {});
                      const u = await getRoomClient(activeRoom.id);
                      if (u) setActiveRoom(u);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-zinc-950 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Nova Rodada
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PAINEL 2: CHAT EXCLUSIVO DOS USUÁRIOS DO GRUPO (REQUISITO EXPLÍCITO DO USUÁRIO) */}
      {activeTabPanel === 'chat' && (
        <div className="bg-zinc-900/95 border-2 border-amber-500/40 rounded-3xl p-4 shadow-xl flex flex-col h-[460px]">
          {/* Cabeçalho do Chat */}
          <div className="pb-3 border-b border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="font-black text-white uppercase">
                Chat do Grupo: {activeRoom.name}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              Visível apenas para membros deste grupo
            </span>
          </div>

          {/* Lista de Mensagens */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
            {(!activeRoom.messages || activeRoom.messages.length === 0) && (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500 italic">
                Nenhuma mensagem enviada ainda. Envie uma saudação aos irmãos!
              </div>
            )}

            {activeRoom.messages?.map((msg) => {
              const isMe = msg.userId === currentUserId;
              if (msg.isSystem) {
                return (
                  <div key={msg.id} className="text-center my-1.5">
                    <span className="inline-block bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] px-3 py-1 rounded-full font-medium">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 px-1 mb-0.5">
                    <span className="font-bold text-amber-300">
                      {msg.userTitle} {msg.userName}
                    </span>
                    {msg.isAdmin && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-black">
                        👑 ADMIN
                      </span>
                    )}
                    {msg.flagged && (
                      <span className="text-[9px] bg-rose-950/80 text-rose-300 border border-rose-600/50 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5">
                        <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
                        Bloqueada
                      </span>
                    )}
                    <span>• {msg.timestamp}</span>

                    {/* Botão de Exclusão Direta para o Administrador Geral */}
                    {isAdminUser && (
                      <button
                        type="button"
                        onClick={() => handleAdminDeleteMessage(msg.id)}
                        className="opacity-60 hover:opacity-100 text-rose-400 hover:text-rose-300 ml-1 p-0.5 transition cursor-pointer"
                        title="Apagar mensagem como Administrador"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                      msg.flagged
                        ? 'bg-rose-950/40 border border-rose-500/50 text-rose-200 italic'
                        : isMe
                        ? 'bg-amber-500 text-zinc-950 font-semibold rounded-br-none shadow-md'
                        : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>

          {/* Campo de Envio de Mensagem */}
          <form onSubmit={handleSendMessage} className="pt-2 border-t border-zinc-800 flex gap-2">
            <input
              type="text"
              value={chatMessageText}
              onChange={(e) => setChatMessageText(e.target.value)}
              placeholder="Digite sua mensagem para o grupo..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-xs outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!chatMessageText.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase flex items-center justify-center transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* PAINEL 3: LISTA DE MEMBROS DO GRUPO (ATÉ 20 AMIGOS) */}
      {activeTabPanel === 'members' && (
        <div className="bg-zinc-900/95 border-2 border-amber-500/40 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h4 className="text-sm font-black text-white uppercase">
                Membros Conectados ({activeRoom.members.length}/20)
              </h4>
              <p className="text-[11px] text-zinc-400">
                Disputando juntos no grupo <strong className="text-amber-300">{activeRoom.name}</strong>
              </p>
            </div>
            <button
              onClick={handleCopyInvite}
              className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Convidar Amigos</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {activeRoom.members.map((m, idx) => (
              <div
                key={m.userId}
                className="bg-zinc-950 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center overflow-hidden shrink-0">
                    {m.avatarConfig ? (
                      <DynamicCharacterAvatar avatar={m.avatarConfig} size="full" showPedestal={false} />
                    ) : m.photoUrl?.startsWith('data:') ? (
                      <img src={m.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-amber-300">{m.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-zinc-200 truncate flex items-center gap-1">
                      <span>{m.title} {m.name}</span>
                      {activeRoom.createdBy === m.userId && (
                        <span title="Criador da Sala">
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Entrou em: {new Date(m.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-amber-400 text-xs">
                    {m.score} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
