'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  UserX,
  MessageSquare,
  Sparkles,
  Heart,
  ShieldCheck,
  Search,
  X,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Church,
  MapPin,
  Flame,
  ArrowRight,
  ShieldAlert,
  ChevronLeft,
  Trash2
} from 'lucide-react';
import { UserProfile, ADMIN_MASTER_EMAIL, performAdminActionClient } from '@/data/db';
import { AvatarState } from '@/data/avatarConfig';
import DynamicCharacterAvatar from './DynamicCharacterAvatar';
import {
  CommunityUser,
  Friendship,
  DirectMessage,
  CommunityOverviewResponse,
  fetchCommunityOverviewClient,
  handleFriendActionClient,
  fetchDirectMessagesClient,
  sendDirectMessageClient,
  sendHeartbeatClient
} from '@/data/communitySocial';

interface Props {
  userProfile: UserProfile | null;
  avatar: AvatarState;
  isOpen: boolean;
  onClose: () => void;
  onOpenSoloQuiz?: () => void;
}

export default function CommunitySocialModal({
  userProfile,
  avatar,
  isOpen,
  onClose,
  onOpenSoloQuiz
}: Props) {
  const [activeTab, setActiveTab] = useState<'online' | 'friends' | 'requests' | 'all'>('online');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<CommunityOverviewResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Perfil Selecionado para Inspecionar
  const [inspectedUser, setInspectedUser] = useState<CommunityUser | null>(null);

  // Bate-Papo Privado 1-a-1
  const [activeChatUser, setActiveChatUser] = useState<CommunityUser | null>(null);
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = userProfile?.id || 'guest_user';
  const currentUserName = userProfile?.name || 'Visitante da Fé';
  const currentUserTitle = userProfile?.title || (avatar.gender === 'female' ? 'Irmã' : 'Irmão');
  const isMasterAdmin = Boolean(userProfile?.email && userProfile.email.trim().toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase());

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Exclusão de usuário pelo Administrador
  const handleDeleteUserFromCommunity = async (targetUserId: string, targetUserName: string) => {
    if (!isMasterAdmin || !userProfile?.email) return;
    if (!confirm(`ATENÇÃO ADMINISTRADOR:\nDeseja EXCLUIR DEFINITIVAMENTE o usuário "${targetUserName}" do sistema?`)) return;
    try {
      const res = await performAdminActionClient('delete_user', { userId: targetUserId }, userProfile.email);
      if (res.success) {
        showFeedback(res.message || `Usuário ${targetUserName} excluído com sucesso.`);
        if (inspectedUser?.id === targetUserId) setInspectedUser(null);
        if (activeChatUser?.id === targetUserId) setActiveChatUser(null);
        loadOverview(false);
      } else {
        showFeedback(res.message || 'Erro ao excluir usuário.');
      }
    } catch (e: any) {
      showFeedback('Erro: ' + (e?.message || e));
    }
  };

  // Exclusão em massa de todos os usuários de teste
  const handleDeleteAllTestUsersFromCommunity = async () => {
    if (!isMasterAdmin || !userProfile?.email) return;
    if (!confirm('ATENÇÃO ADMINISTRADOR:\nDeseja EXCLUIR DEFINITIVAMENTE todos os usuários de teste/demonstração do sistema?')) return;
    try {
      const res = await performAdminActionClient('delete_test_users', {}, userProfile.email);
      if (res.success) {
        showFeedback(res.message || 'Usuários de teste excluídos com sucesso.');
        setInspectedUser(null);
        setActiveChatUser(null);
        loadOverview(false);
      } else {
        showFeedback(res.message || 'Erro ao excluir usuários de teste.');
      }
    } catch (e: any) {
      showFeedback('Erro: ' + (e?.message || e));
    }
  };

  // Carrega panorama da comunidade
  const loadOverview = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      if (userProfile) {
        await sendHeartbeatClient(userProfile, avatar);
      }
      const data = await fetchCommunityOverviewClient(currentUserId);
      if (data && data.success) {
        setOverview(data);
      }
    } catch (e) {
      console.warn('Erro ao atualizar comunidade:', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOverview();
      const interval = setInterval(() => loadOverview(true), 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentUserId]);

  // Carrega mensagens do chat ativo
  const loadChatMessages = async (targetUser: CommunityUser, isBackground = false) => {
    if (!isBackground) setChatLoading(true);
    try {
      const res = await fetchDirectMessagesClient(currentUserId, targetUser.id);
      if (res && res.success) {
        setChatMessages(res.messages || []);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      if (!isBackground) setChatLoading(false);
    }
  };

  useEffect(() => {
    if (activeChatUser) {
      loadChatMessages(activeChatUser);
      const interval = setInterval(() => loadChatMessages(activeChatUser, true), 3000);
      return () => clearInterval(interval);
    }
  }, [activeChatUser, currentUserId]);

  useEffect(() => {
    if (activeChatUser && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChatUser]);

  // Ações de Amizade
  const handleAddFriend = async (targetUser: CommunityUser) => {
    const res = await handleFriendActionClient('send_request', {
      userId: currentUserId,
      targetUserId: targetUser.id
    });
    showFeedback(res.message || 'Solicitação enviada!');
    loadOverview(true);
  };

  const handleAcceptFriend = async (requestId: string, targetUserId: string) => {
    const res = await handleFriendActionClient('accept_request', {
      userId: currentUserId,
      requestId,
      targetUserId
    });
    showFeedback(res.message || 'Amizade aceita!');
    loadOverview(true);
  };

  const handleRejectFriend = async (requestId: string) => {
    const res = await handleFriendActionClient('reject_request', {
      userId: currentUserId,
      requestId
    });
    showFeedback(res.message || 'Solicitação recusada.');
    loadOverview(true);
  };

  const handleRemoveFriend = async (targetUser: CommunityUser) => {
    if (!confirm(`Deseja desfazer a amizade com ${targetUser.title} ${targetUser.name}?`)) return;
    const res = await handleFriendActionClient('remove_friend', {
      userId: currentUserId,
      targetUserId: targetUser.id
    });
    showFeedback(res.message || 'Amigo removido.');
    loadOverview(true);
  };

  // Envio de Mensagem Direta
  const handleSendMessage = async (textToSend?: string, interactionType?: DirectMessage['interactionType']) => {
    if (!activeChatUser) return;
    const text = (textToSend || chatInputText).trim();
    if (!text) return;

    if (!textToSend) setChatInputText('');

    const res = await sendDirectMessageClient({
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      fromUserTitle: currentUserTitle,
      toUserId: activeChatUser.id,
      text,
      interactionType: interactionType || 'chat'
    });

    if (!res.success && res.message) {
      alert(res.message);
      return;
    }

    loadChatMessages(activeChatUser);
    loadOverview(true);
  };

  // Enviar Saudação Rápida Direta de um Cartão
  const handleSendQuickGreeting = async (targetUser: CommunityUser, type: DirectMessage['interactionType']) => {
    let msgText = '';
    if (type === 'paz_do_senhor') {
      msgText = `🕊️ A Paz do Senhor, ${targetUser.title} ${targetUser.name}! Um abraço fraternal em Cristo Jesus.`;
    } else if (type === 'orando_por_voce') {
      msgText = `🙏 Olá ${targetUser.title} ${targetUser.name}! Estou orando pela sua vida e seu ministério hoje!`;
    } else if (type === 'abencoado') {
      msgText = `✨ Que o Senhor te abençoe e te guarde, faça resplandecer Seu rosto sobre ti!`;
    }

    const res = await sendDirectMessageClient({
      fromUserId: currentUserId,
      fromUserName: currentUserName,
      fromUserTitle: currentUserTitle,
      toUserId: targetUser.id,
      text: msgText,
      interactionType: type
    });

    if (!res.success && res.message) {
      alert(res.message);
      return;
    }

    showFeedback(`Saudação enviada com sucesso para ${targetUser.name}!`);
    loadOverview(true);
  };

  if (!isOpen) return null;

  // Filtragem de Usuários por Busca
  const filterList = (list: CommunityUser[] = []) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.churchName && u.churchName.toLowerCase().includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q)) ||
        (u.ministry && u.ministry.toLowerCase().includes(q))
    );
  };

  const onlineList = filterList(overview?.onlineUsers || []);
  const friendsList = filterList(overview?.friends || []);
  const allList = filterList(overview?.allUsers || []);
  const pendingRequests = overview?.pendingRequestsReceived || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-zinc-950 border-2 border-amber-500/70 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Glow Superior */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500" />

        {/* 1. Header do Modal com Contador de Usuários */}
        <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-serif font-black text-white">
                  Rede Cristã • Irmãos na Fé
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>{overview?.onlineCount || 1} Online</span>
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Total de <strong className="text-amber-300">{overview?.totalUsers || 1} discípulos</strong> cadastrados no sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Botão de Fechar */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notificação Toast Flutuante */}
        {feedback && (
          <div className="bg-emerald-500 text-zinc-950 px-4 py-2 font-bold text-xs text-center shadow-lg animate-in slide-in-from-top duration-200">
            {feedback}
          </div>
        )}

        {/* MODO 1: BATE-PAPO PRIVADO 1-A-1 ATIVO */}
        {activeChatUser ? (
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
            {/* Topo do Chat Privado */}
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setActiveChatUser(null)}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                  title="Voltar à lista de irmãos"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-amber-400 shrink-0 bg-black flex items-center justify-center">
                  {activeChatUser.photoUrl && activeChatUser.photoUrl.startsWith('data:') ? (
                    <img src={activeChatUser.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <DynamicCharacterAvatar
                      avatar={activeChatUser.avatarConfig || { gender: activeChatUser.gender }}
                      size="sm"
                      showPedestal={false}
                    />
                  )}
                  {activeChatUser.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-zinc-950" />
                  )}
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <span>
                      {activeChatUser.title} {activeChatUser.name}
                    </span>
                    {activeChatUser.isOnline && (
                      <span className="text-[10px] text-emerald-400 font-bold">• Online</span>
                    )}
                  </h3>
                  <p className="text-[10px] text-zinc-400 truncate max-w-[200px] sm:max-w-xs">
                    {activeChatUser.churchName || 'Irmão na Fé'}
                  </p>
                </div>
              </div>

              {/* Botão de Duelo Bíblico */}
              <button
                type="button"
                onClick={() => handleSendMessage('⚔️ Irmão(ã), te convido para disputarmos um Duelo Bíblico! Vamos louvar ao Senhor aprendendo!', 'desafio_quiz')}
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition cursor-pointer"
                title="Convidar para Quiz Bíblico"
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>Desafiar</span>
              </button>
            </div>

            {/* Atalhos de Saudações Cristãs Rápidas */}
            <div className="px-3 py-2 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px]">
              <span className="text-zinc-500 shrink-0 font-semibold">Saudações Rápidas:</span>
              <button
                onClick={() => handleSendMessage('🕊️ A Paz do Senhor, amado(a) irmão(ã)!', 'paz_do_senhor')}
                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-300 shrink-0 border border-zinc-700 transition cursor-pointer"
              >
                🕊️ Paz do Senhor
              </button>
              <button
                onClick={() => handleSendMessage('🙏 Estou orando pela sua vida e família hoje!', 'orando_por_voce')}
                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-300 shrink-0 border border-zinc-700 transition cursor-pointer"
              >
                🙏 Orando por você
              </button>
              <button
                onClick={() => handleSendMessage('✨ Que as bênçãos do Altíssimo estejam sobre sua casa!', 'abencoado')}
                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-amber-300 shrink-0 border border-zinc-700 transition cursor-pointer"
              >
                ✨ Bênção
              </button>
            </div>

            {/* Mensagens do Bate-Papo */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatLoading && chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">
                  Carregando mensagens...
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-500">
                  <MessageSquare className="w-10 h-10 text-zinc-700" />
                  <p className="text-xs">
                    Inicie a conversa com uma saudação cristã fraternal!
                  </p>
                  <p className="text-[10px] text-zinc-600 max-w-xs">
                    Todas as conversas são reservadas para a edificação bíblica mútua.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.fromUserId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                    >
                      <span className="text-[10px] text-zinc-500 px-1">
                        {isMe ? 'Você' : `${msg.fromUserTitle} ${msg.fromUserName}`} •{' '}
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                          isMe
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-semibold rounded-br-none'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Barra de Envio de Mensagem */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-zinc-800/80 bg-zinc-900/95 flex gap-2"
            >
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder={`Mensagem bíblica para ${activeChatUser.name}...`}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-black text-xs uppercase flex items-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Enviar</span>
              </button>
            </form>
          </div>
        ) : (
          /* MODO 2: LISTAS DA COMUNIDADE (ONLINE / AMIGOS / SOLICITAÇÕES / TODOS) */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Navegação por Abas */}
            <div className="px-4 pt-3 pb-2 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('online')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'online'
                      ? 'bg-emerald-500 text-zinc-950 shadow-md'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span>Online ({overview?.onlineCount || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('friends')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'friends'
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Meus Amigos ({overview?.friends?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('requests')}
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'requests'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Solicitações ({pendingRequests.length})</span>
                  {pendingRequests.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Explorar ({overview?.allUsers?.length || 0})</span>
                </button>

                {isMasterAdmin && (
                  <button
                    onClick={handleDeleteAllTestUsersFromCommunity}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/70 text-rose-300 hover:text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm shrink-0"
                    title="Excluir permanentemente todos os usuários de teste/demonstração criados pelo sistema"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Excluir Testes</span>
                  </button>
                )}
              </div>

              {/* Campo de Busca Rápida */}
              <div className="relative w-full sm:w-56 mt-2 sm:mt-0">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar irmão, igreja ou cidade..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Conteúdo Conforme Aba Ativa */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="p-12 text-center text-xs text-zinc-500 space-y-2">
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Conectando aos irmãos da comunidade...</p>
                </div>
              ) : activeTab === 'online' ? (
                /* ABA 1: ONLINE AGORA */
                onlineList.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs space-y-2">
                    <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p>Nenhum outro irmão online com este filtro no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {onlineList.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        isAdmin={isMasterAdmin}
                        onInspect={() => setInspectedUser(user)}
                        onOpenChat={() => setActiveChatUser(user)}
                        onAddFriend={() => handleAddFriend(user)}
                        onSendGreeting={(type) => handleSendQuickGreeting(user, type)}
                        onDeleteUser={isMasterAdmin && user.id !== currentUserId ? () => handleDeleteUserFromCommunity(user.id, user.name) : undefined}
                      />
                    ))}
                  </div>
                )
              ) : activeTab === 'friends' ? (
                /* ABA 2: MEUS AMIGOS */
                friendsList.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs space-y-3">
                    <UserCheck className="w-10 h-10 text-amber-400 mx-auto" />
                    <h3 className="font-bold text-white text-sm">Você ainda não tem amigos adicionados</h3>
                    <p className="max-w-md mx-auto text-zinc-400">
                      Conecte-se com outros discípulos na aba <strong>Online</strong> ou <strong>Explorar</strong> para trocar saudações cristãs e desafiar em duelos bíblicos!
                    </p>
                    <button
                      onClick={() => setActiveTab('online')}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-black text-xs uppercase"
                    >
                      Ver Irmãos Online
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {friendsList.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        isAdmin={isMasterAdmin}
                        onInspect={() => setInspectedUser(user)}
                        onOpenChat={() => setActiveChatUser(user)}
                        onRemoveFriend={() => handleRemoveFriend(user)}
                        onSendGreeting={(type) => handleSendQuickGreeting(user, type)}
                        onDeleteUser={isMasterAdmin && user.id !== currentUserId ? () => handleDeleteUserFromCommunity(user.id, user.name) : undefined}
                      />
                    ))}
                  </div>
                )
              ) : activeTab === 'requests' ? (
                /* ABA 3: SOLICITAÇÕES DE AMIZADE */
                pendingRequests.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                    <p className="font-bold text-white text-sm">Nenhuma solicitação pendente</p>
                    <p>Quando alguém te enviar um pedido de amizade cristã, você poderá aceitar aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-2xl bg-zinc-900 border border-amber-500/40 flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-400 bg-black flex items-center justify-center shrink-0">
                            {req.requester?.photoUrl && req.requester.photoUrl.startsWith('data:') ? (
                              <img src={req.requester.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                              <DynamicCharacterAvatar
                                avatar={req.requester?.avatarConfig || { gender: 'male' }}
                                size="sm"
                                showPedestal={false}
                              />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-white">
                              {req.requesterTitle} {req.requesterName}
                            </h4>
                            <p className="text-[10px] text-zinc-400">
                              {req.requesterChurch || 'Irmão na Fé'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAcceptFriend(req.id, req.requesterId)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase flex items-center gap-1 transition cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Aceitar</span>
                          </button>
                          <button
                            onClick={() => handleRejectFriend(req.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 text-xs transition cursor-pointer"
                            title="Recusar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* ABA 4: EXPLORAR TODOS OS USUÁRIOS */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allList.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      isAdmin={isMasterAdmin}
                      onInspect={() => setInspectedUser(user)}
                      onOpenChat={() => setActiveChatUser(user)}
                      onAddFriend={() => handleAddFriend(user)}
                      onSendGreeting={(type) => handleSendQuickGreeting(user, type)}
                      onDeleteUser={isMasterAdmin && user.id !== currentUserId ? () => handleDeleteUserFromCommunity(user.id, user.name) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. MODAL DE PERFIL COMPLETO DO DISCÍPULO INSPECIONADO */}
        {inspectedUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <div className="relative w-full max-w-md bg-zinc-950 border-2 border-amber-500 rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setInspectedUser(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-3">
                {/* Avatar 3D Grande */}
                <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-3 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)] bg-black/80 flex items-center justify-center">
                  {inspectedUser.photoUrl && inspectedUser.photoUrl.startsWith('data:') ? (
                    <img src={inspectedUser.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <DynamicCharacterAvatar
                      avatar={inspectedUser.avatarConfig || { gender: inspectedUser.gender }}
                      size="full"
                      showPedestal={false}
                    />
                  )}
                </div>

                <div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    {inspectedUser.isOnline ? '🟢 Online Agora' : '⚪ Visto Recentemente'}
                  </div>
                  <h3 className="text-lg font-serif font-black text-white">
                    {inspectedUser.title} {inspectedUser.name}
                  </h3>
                  <p className="text-xs text-amber-300/90 font-medium">
                    {inspectedUser.ministry || 'Membro em Comunhão'}
                  </p>
                </div>

                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 text-xs text-left space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Church className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{inspectedUser.churchName || 'Congregação não informada'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{inspectedUser.city ? `${inspectedUser.city} - ${inspectedUser.state || 'BR'}` : 'Brasil'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{inspectedUser.score || 1000} XP Bíblico Acumulado</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setInspectedUser(null);
                      setActiveChatUser(inspectedUser);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Abrir Chat</span>
                  </button>

                  {inspectedUser.friendStatus !== 'friends' && (
                    <button
                      onClick={() => {
                        handleAddFriend(inspectedUser);
                        setInspectedUser(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase flex items-center gap-1 transition cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Conectar</span>
                    </button>
                  )}
                </div>

                {isMasterAdmin && inspectedUser.id !== currentUserId && (
                  <button
                    onClick={() => handleDeleteUserFromCommunity(inspectedUser.id, inspectedUser.name)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/70 text-rose-300 hover:text-white font-black text-xs uppercase flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Excluir Usuário Definitivamente</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponente de Cartão de Usuário da Comunidade
interface UserCardProps {
  user: CommunityUser;
  isAdmin?: boolean;
  onInspect: () => void;
  onOpenChat: () => void;
  onAddFriend?: () => void;
  onRemoveFriend?: () => void;
  onSendGreeting?: (type: DirectMessage['interactionType']) => void;
  onDeleteUser?: () => void;
}

function UserCard({
  user,
  isAdmin,
  onInspect,
  onOpenChat,
  onAddFriend,
  onRemoveFriend,
  onSendGreeting,
  onDeleteUser
}: UserCardProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 transition flex flex-col justify-between gap-3 shadow-md hover:shadow-lg">
      <div className="flex items-start gap-3">
        {/* Avatar Circular com Indicador Online */}
        <button
          onClick={onInspect}
          className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 bg-black/80 flex items-center justify-center hover:scale-105 transition cursor-pointer"
          title="Ver perfil completo 3D"
        >
          {user.photoUrl && user.photoUrl.startsWith('data:') ? (
            <img src={user.photoUrl} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <DynamicCharacterAvatar
              avatar={user.avatarConfig || { gender: user.gender }}
              size="sm"
              showPedestal={false}
            />
          )}
          {user.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-950" />
          )}
        </button>

        {/* Detalhes do Usuário */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4
              onClick={onInspect}
              className="text-xs sm:text-sm font-black text-white hover:text-amber-300 transition cursor-pointer truncate"
            >
              {user.title} {user.name}
            </h4>
            {user.isAdmin && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.2 rounded">
                Admin
              </span>
            )}
          </div>

          <p className="text-[11px] text-amber-300/80 font-medium truncate">
            {user.ministry || 'Membro em Comunhão'}
          </p>

          <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
            <Church className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
            <span>{user.churchName || 'Igreja Local'}</span>
          </p>
        </div>
      </div>

      {/* Botões de Interação Social */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1">
          {onSendGreeting && (
            <button
              onClick={() => onSendGreeting('paz_do_senhor')}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 transition text-[11px] cursor-pointer"
              title="Saudar com a Paz do Senhor"
            >
              🕊️
            </button>
          )}
          {onSendGreeting && (
            <button
              onClick={() => onSendGreeting('orando_por_voce')}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 transition text-[11px] cursor-pointer"
              title="Enviar Oração"
            >
              🙏
            </button>
          )}
          <button
            onClick={onOpenChat}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
            title="Abrir Bate-papo Direto"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Chat</span>
          </button>
          {onDeleteUser && (
            <button
              onClick={onDeleteUser}
              className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/60 text-rose-300 hover:text-white transition text-[10px] cursor-pointer"
              title={`Excluir definitivamente o usuário ${user.name} do sistema`}
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
            </button>
          )}
        </div>

        <div>
          {user.friendStatus === 'friends' ? (
            <button
              onClick={onRemoveFriend}
              className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-700 hover:border-rose-500/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Amigos na Fé (Clique para opções)"
            >
              <UserCheck className="w-3 h-3 text-emerald-400" />
              <span>Amigos</span>
            </button>
          ) : user.friendStatus === 'pending_sent' ? (
            <span className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-500 text-[10px] font-bold">
              Enviado
            </span>
          ) : onAddFriend ? (
            <button
              onClick={onAddFriend}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <UserPlus className="w-3 h-3" />
              <span>Adicionar</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
