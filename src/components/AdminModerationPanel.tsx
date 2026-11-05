'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  MessageSquare,
  AlertTriangle,
  Trash2,
  UserX,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Eye,
  Key,
  DoorOpen,
  Crown,
  Search,
  ExternalLink,
  Volume2
} from 'lucide-react';
import {
  UserProfile,
  fetchAdminOverviewClient,
  performAdminActionClient,
  ADMIN_MASTER_EMAIL
} from '@/data/db';
import { ModerationAlert, MultiplayerRoom } from '@/data/multiplayerRooms';
import DynamicCharacterAvatar from './DynamicCharacterAvatar';

interface Props {
  userProfile: UserProfile | null;
  onOpenRoom?: (room: MultiplayerRoom) => void;
  onBackToHome?: () => void;
}

export default function AdminModerationPanel({ userProfile, onOpenRoom, onBackToHome }: Props) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'rooms' | 'users'>('alerts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alerts, setAlerts] = useState<ModerationAlert[]>([]);
  const [rooms, setRooms] = useState<MultiplayerRoom[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalRooms: 0, pendingAlerts: 0 });
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filtros
  const [userSearch, setUserSearch] = useState('');
  const [selectedRoomToInspect, setSelectedRoomToInspect] = useState<MultiplayerRoom | null>(null);

  const adminEmail = userProfile?.email || ADMIN_MASTER_EMAIL;

  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setRefreshing(true);
    try {
      const data = await fetchAdminOverviewClient(adminEmail);
      if (data.success) {
        setAlerts(data.alerts || []);
        setRooms(data.rooms || []);
        setUsers(data.users || []);
        setStats(data.stats || { totalUsers: 0, totalRooms: 0, pendingAlerts: 0 });

        // Atualiza a sala inspecionada se houver
        if (selectedRoomToInspect) {
          const fresh = (data.rooms || []).find((r: any) => r.id === selectedRoomToInspect.id);
          if (fresh) setSelectedRoomToInspect(fresh);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Polling a cada 4 segundos para moderação em tempo real
    const interval = setInterval(() => loadData(true), 4000);
    return () => clearInterval(interval);
  }, [adminEmail]);

  const notify = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Ações do Administrador
  const handleResolveAlert = async (alertId: string) => {
    const res = await performAdminActionClient('resolve_alert', { alertId }, adminEmail);
    if (res.success) {
      notify('Alerta marcado como resolvido!');
      loadData(true);
    } else {
      notify(res.message || 'Erro ao resolver alerta.', 'error');
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    const res = await performAdminActionClient('dismiss_alert', { alertId }, adminEmail);
    if (res.success) {
      notify('Alerta dispensado (Falso Positivo).');
      loadData(true);
    } else {
      notify(res.message || 'Erro ao dispensar alerta.', 'error');
    }
  };

  const handleDeleteMessage = async (roomId: string, messageId: string) => {
    if (!confirm('Deseja realmente apagar esta mensagem da sala?')) return;
    const res = await performAdminActionClient('delete_message', { roomId, messageId }, adminEmail);
    if (res.success) {
      notify('Mensagem apagada com sucesso da sala!');
      loadData(true);
    } else {
      notify(res.message || 'Erro ao apagar mensagem.', 'error');
    }
  };

  const handleWarnUser = async (roomId: string, userId: string, userName: string) => {
    const reason = prompt(`Motivo da advertência para ${userName}:`, 'Comentário fora dos princípios de conduta cristã.');
    if (!reason) return;
    const res = await performAdminActionClient('warn_user', { roomId, userId, userName, reason }, adminEmail);
    if (res.success) {
      notify(`Advertência enviada para ${userName}!`);
      loadData(true);
    } else {
      notify(res.message || 'Erro ao advertir usuário.', 'error');
    }
  };

  const handleKickMember = async (roomId: string, userId: string, userName: string) => {
    if (!confirm(`Tem certeza de que deseja expulsar ${userName} desta sala?`)) return;
    const res = await performAdminActionClient('kick_member', { roomId, userId }, adminEmail);
    if (res.success) {
      notify(`${userName} expulso da sala.`);
      loadData(true);
    } else {
      notify(res.message || 'Erro ao expulsar membro.', 'error');
    }
  };

  const handleToggleBan = async (user: UserProfile) => {
    if (user.isBanned) {
      if (!confirm(`Deseja revogar o banimento de ${user.name}?`)) return;
      const res = await performAdminActionClient('unban_user', { userId: user.id }, adminEmail);
      if (res.success) {
        notify(`Suspensão de ${user.name} revogada!`);
        loadData(true);
      }
    } else {
      const reason = prompt(`Motivo do banimento para ${user.name}:`, 'Violação das diretrizes comunitárias de respeito e santidade.');
      if (!reason) return;
      const res = await performAdminActionClient('ban_user', { userId: user.id, reason }, adminEmail);
      if (res.success) {
        notify(`Usuário ${user.name} suspenso do sistema.`);
        loadData(true);
      }
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.email?.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase()) {
      alert('O Administrador Geral não pode ser excluído.');
      return;
    }
    if (
      !confirm(
        `ATENÇÃO ADMINISTRADOR:\nDeseja EXCLUIR DEFINITIVAMENTE o usuário "${user.name}" (${user.email || 'Sem e-mail'})?\nEsta ação apagará o cadastro, progresso e removerá o usuário de todas as salas.`
      )
    )
      return;

    const res = await performAdminActionClient('delete_user', { userId: user.id }, adminEmail);
    if (res.success) {
      notify(`Usuário ${user.name} excluído definitivamente com sucesso.`);
      loadData(true);
    } else {
      notify(res.message || 'Erro ao excluir usuário.', 'error');
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Deseja excluir DEFINITIVAMENTE a sala "${roomName}"?`)) return;
    const res = await performAdminActionClient('delete_room', { roomId }, adminEmail);
    if (res.success) {
      notify(`Sala "${roomName}" excluída.`);
      if (selectedRoomToInspect?.id === roomId) setSelectedRoomToInspect(null);
      loadData(true);
    } else {
      notify(res.message || 'Erro ao excluir sala.', 'error');
    }
  };

  const handleClearChat = async (roomId: string, roomName: string) => {
    if (!confirm(`Deseja limpar todas as mensagens do chat da sala "${roomName}"?`)) return;
    const res = await performAdminActionClient('clear_chat', { roomId }, adminEmail);
    if (res.success) {
      notify(`Chat da sala "${roomName}" limpo.`);
      loadData(true);
    } else {
      notify(res.message || 'Erro ao limpar chat.', 'error');
    }
  };

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.churchName || '').toLowerCase().includes(q) ||
      (u.city || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* 1. Header do Painel de Administração */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/70 p-5 sm:p-7 bg-gradient-to-br from-amber-950/60 via-zinc-950 to-zinc-950 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Poderes Plenos de Administração & Moderação</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-black text-white flex items-center gap-2.5">
              <span>Painel do Administrador Geral</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300">
              Conectado como <strong className="text-amber-300">{adminEmail}</strong>. Supervisão em tempo real de salas, membros e moderação comunitária cristã.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-300 text-xs font-black hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Atualizar dados agora"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3.5 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-black hover:bg-amber-400 transition cursor-pointer shadow-md"
              >
                Voltar à Jornada
              </button>
            )}
          </div>
        </div>

        {/* Feedback flutuante */}
        {feedbackMsg && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-black flex items-center gap-2 animate-in fade-in duration-200 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-400 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-400 text-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* 2. Cards de KPIs e Estatísticas do Sistema */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div
            onClick={() => setActiveTab('alerts')}
            className={`p-3.5 rounded-2xl border transition cursor-pointer ${
              pendingAlerts.length > 0
                ? 'bg-rose-950/50 border-rose-500/70 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse'
                : 'bg-zinc-900/80 border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span>Alertas Pendentes</span>
              <ShieldAlert className={`w-4 h-4 ${pendingAlerts.length > 0 ? 'text-rose-400' : 'text-zinc-500'}`} />
            </div>
            <div className={`text-2xl font-black mt-1 ${pendingAlerts.length > 0 ? 'text-rose-400' : 'text-zinc-200'}`}>
              {pendingAlerts.length}
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              {pendingAlerts.length > 0 ? 'Requer atenção imediata!' : 'Tudo em paz'}
            </p>
          </div>

          <div
            onClick={() => setActiveTab('rooms')}
            className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span>Salas Criadas</span>
              <DoorOpen className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.totalRooms}</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Grupos ativos até 20 amigos</p>
          </div>

          <div
            onClick={() => setActiveTab('users')}
            className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
              <span>Usuários Totais</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-zinc-100 mt-1">{stats.totalUsers}</div>
            <p className="text-[10px] text-zinc-400 mt-0.5">Irmãos e irmãs no banco</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>Moderação IA</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-sm font-black text-emerald-200 mt-2">PROTEÇÃO ATIVA</div>
            <p className="text-[10px] text-emerald-400/80 mt-0.5">Filtro de ódio, assédio e sexo</p>
          </div>
        </div>
      </div>

      {/* 3. Seletor de Abas Principais */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-amber-500 text-zinc-950 shadow-md scale-102'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Alertas de Moderação</span>
          {pendingAlerts.length > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-bounce">
              {pendingAlerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-amber-500 text-zinc-950 shadow-md scale-102'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Gestão de Salas ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-amber-500 text-zinc-950 shadow-md scale-102'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários ({users.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* ABA 1: ALERTAS DE MODERAÇÃO DE CONVERSAS */}
      {/* ======================================================== */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Ocorrências Detectadas pelo Filtro de Moderação</span>
            </h2>
            <span className="text-xs text-zinc-400 font-medium">
              Classificação: Sexual • Assédio • Agressivo • Nocivo
            </span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-black text-white">Nenhum alerta de moderação registrado</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Todas as conversas nos chats das salas bíblicas estão dentro dos parâmetros de respeito, santidade e comunhão.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const isPending = alert.status === 'pending';
                const categoryStyle = {
                  sexual: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
                  assedio: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
                  agressivo: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
                  nocivo: 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                }[alert.category] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

                return (
                  <div
                    key={alert.id}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition ${
                      isPending
                        ? 'bg-zinc-950 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                        : 'bg-zinc-900/60 border-zinc-800 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${categoryStyle}`}>
                          ⚠️ {alert.category.toUpperCase()}
                        </span>
                        <span className="text-xs font-black text-white">
                          Sala: <strong className="text-amber-300">{alert.roomName}</strong>
                        </span>
                        <span className="text-xs text-zinc-400">
                          • Autor: <strong>{alert.userName}</strong> ({alert.userId})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-zinc-400">
                          {new Date(alert.createdAt).toLocaleString('pt-BR')}
                        </span>
                        {isPending ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-zinc-950 text-[10px] font-black uppercase">
                            Pendente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-500/40">
                            {alert.status === 'resolved' ? 'Resolvido' : 'Dispensado'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Texto interceptado */}
                    <div className="p-3 rounded-xl bg-black/80 border border-zinc-800 space-y-1 mb-3">
                      <div className="text-[11px] font-black uppercase text-zinc-400">
                        Mensagem Original Retida:
                      </div>
                      <p className="text-sm text-rose-200 font-mono select-all">
                        "{alert.originalText}"
                      </p>
                      <div className="text-[11px] text-zinc-400">
                        Motivo: <span className="text-amber-300">{alert.reason}</span>
                      </div>
                    </div>

                    {/* Ações Rápidas do Administrador */}
                    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-zinc-800/80">
                      <button
                        onClick={() => handleDeleteMessage(alert.roomId, alert.messageId)}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-black hover:bg-rose-900 transition flex items-center gap-1.5 cursor-pointer"
                        title="Apagar a mensagem da sala imediatamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Apagar Mensagem</span>
                      </button>

                      <button
                        onClick={() => handleWarnUser(alert.roomId, alert.userId, alert.userName)}
                        className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-200 text-xs font-black hover:bg-amber-900 transition flex items-center gap-1.5 cursor-pointer"
                        title="Enviar advertência formal do sistema para a sala"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Advertir Usuário</span>
                      </button>

                      <button
                        onClick={() => handleKickMember(alert.roomId, alert.userId, alert.userName)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-black hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
                        title="Expulsar usuário da sala"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Expulsar da Sala</span>
                      </button>

                      <button
                        onClick={() => {
                          const target = users.find((u) => u.id === alert.userId);
                          if (target) handleToggleBan(target);
                          else handleToggleBan({ id: alert.userId, name: alert.userName } as any);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-950 border border-red-700 text-red-300 text-xs font-black hover:bg-red-900 transition flex items-center gap-1.5 cursor-pointer"
                        title="Banir usuário de todas as salas e do sistema"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Banir Usuário</span>
                      </button>

                      <div className="ml-auto flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleDismissAlert(alert.id)}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition cursor-pointer"
                              title="Dispensar se foi falso alarme"
                            >
                              Dispensar
                            </button>
                            <button
                              onClick={() => handleResolveAlert(alert.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-zinc-950 text-xs font-black hover:bg-emerald-500 transition flex items-center gap-1 cursor-pointer shadow-md"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar Resolvido</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 2: GESTÃO PLENA DE SALAS BÍBLICAS */}
      {/* ======================================================== */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-amber-400" />
              <span>Todas as Salas Bíblicas no Servidor</span>
            </h2>
            <span className="text-xs text-zinc-400 font-medium">
              Acesso Mestre Sem Exigência de Senha
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => {
              const membersCount = room.members?.length || 0;
              const maxMembers = room.maxMembers || 20;

              return (
                <div
                  key={room.id}
                  className="p-5 rounded-2xl bg-zinc-950 border-2 border-zinc-800 hover:border-amber-500/60 transition shadow-xl space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                        <span>{room.name}</span>
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Criada por <strong>{room.createdByName}</strong> ({room.creatorTitle || 'Irmão'})
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        room.status === 'in_progress'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : room.status === 'intermission'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {room.status === 'in_progress'
                        ? 'Disputa em Andamento'
                        : room.status === 'intermission'
                        ? 'Intervalo (20s)'
                        : 'Aguardando Membros'}
                    </span>
                  </div>

                  {/* Informações Privilegiadas do Administrador */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-black/60 p-3 rounded-xl border border-zinc-800/80">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Palavra-Chave Secreta:</span>
                      <strong className="text-amber-400 font-mono text-sm flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-400" /> "{room.passcode}"
                      </strong>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Membros:</span>
                      <strong className="text-zinc-200">
                        {membersCount} de {maxMembers} amigos
                      </strong>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Nível Bíblico:</span>
                      <strong className="text-zinc-200 uppercase">{room.level}</strong>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase font-bold">Mensagens no Chat:</span>
                      <strong className="text-zinc-200">{room.messages?.length || 0} mensagens</strong>
                    </div>
                  </div>

                  {/* Botões de Ação do Administrador */}
                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-800 flex-wrap">
                    {onOpenRoom && (
                      <button
                        onClick={() => onOpenRoom(room)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 text-zinc-950 text-xs font-black hover:bg-amber-400 transition flex items-center gap-1.5 cursor-pointer shadow-md"
                        title="Entrar na sala com Acesso Mestre de Administrador (sem precisar de senha)"
                      >
                        <DoorOpen className="w-3.5 h-3.5" />
                        <span>Entrar na Sala (Mestre)</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedRoomToInspect(selectedRoomToInspect?.id === room.id ? null : room)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{selectedRoomToInspect?.id === room.id ? 'Fechar Chat' : 'Inspecionar Chat'}</span>
                    </button>

                    <button
                      onClick={() => handleClearChat(room.id, room.name)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-bold hover:bg-zinc-800 transition flex items-center gap-1.5 cursor-pointer"
                      title="Limpar histórico de mensagens do chat desta sala"
                    >
                      <span>Limpar Chat</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRoom(room.id, room.name)}
                      className="px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-bold hover:bg-rose-900 transition flex items-center gap-1.5 cursor-pointer ml-auto"
                      title="Excluir sala do servidor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>

                  {/* Visualização de Chat Inspecionado */}
                  {selectedRoomToInspect?.id === room.id && (
                    <div className="mt-3 p-3 rounded-xl bg-zinc-900 border border-amber-500/40 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs font-black text-amber-300 border-b border-zinc-800 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> Histórico ao Vivo ({room.messages?.length || 0})
                        </span>
                        <span className="text-[10px] text-zinc-400">Visão de Administrador</span>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {room.messages?.length === 0 ? (
                          <p className="text-zinc-500 italic text-center py-4">Nenhuma mensagem nesta sala.</p>
                        ) : (
                          room.messages?.map((msg) => (
                            <div
                              key={msg.id}
                              className={`p-2 rounded-lg flex items-start justify-between gap-2 ${
                                msg.flagged
                                  ? 'bg-rose-950/70 border border-rose-500/60 text-rose-200'
                                  : msg.isSystem
                                  ? 'bg-zinc-800/60 text-zinc-400 italic text-[11px]'
                                  : 'bg-black/60 text-zinc-200'
                              }`}
                            >
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <strong className="text-amber-300 font-bold">{msg.userName}:</strong>
                                  <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                                  {msg.flagged && (
                                    <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-black uppercase">
                                      Violou Regra
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs break-words">{msg.text}</p>
                                {msg.originalText && (
                                  <p className="text-[10px] text-rose-300 italic">
                                    Original: "{msg.originalText}"
                                  </p>
                                )}
                              </div>

                              {!msg.isSystem && (
                                <button
                                  onClick={() => handleDeleteMessage(room.id, msg.id)}
                                  className="text-zinc-500 hover:text-rose-400 p-1 transition cursor-pointer shrink-0"
                                  title="Apagar esta mensagem"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ABA 3: GESTÃO DE USUÁRIOS */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <span>Usuários e Membros Cadastrados</span>
              </h2>
              <p className="text-xs text-zinc-400">Total de {users.length} irmãos registrados no banco de dados.</p>
            </div>

            {/* Barra de Busca de Usuários */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nome, email ou cidade..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredUsers.map((u) => {
              const isMaster = u.email?.toLowerCase() === ADMIN_MASTER_EMAIL.toLowerCase();

              return (
                <div
                  key={u.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    u.isBanned
                      ? 'bg-rose-950/40 border-rose-500/60'
                      : isMaster
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                      : 'bg-zinc-950 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-400/60 bg-black shrink-0 flex items-center justify-center">
                      {u.photoUrl && u.photoUrl.startsWith('data:') ? (
                        <img src={u.photoUrl} alt="Foto" className="w-full h-full object-cover" />
                      ) : (
                        <DynamicCharacterAvatar
                          avatar={u.avatarConfig || { gender: u.gender || 'male', framing: 'face' }}
                          size="full"
                          showPedestal={false}
                        />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm font-black text-white">{u.name}</strong>
                        {isMaster && (
                          <span className="text-[10px] bg-amber-500 text-zinc-950 font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Crown className="w-3 h-3" /> Administrador
                          </span>
                        )}
                        {u.isVip && (
                          <span className="text-[10px] bg-purple-500 text-white font-black uppercase px-2 py-0.5 rounded-full">
                            VIP
                          </span>
                        )}
                        {u.isBanned && (
                          <span className="text-[10px] bg-rose-600 text-white font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                            Suspenso / Banido
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400">
                        {u.email || 'Sem e-mail'} • {u.city || 'Brasil'} • {u.churchName || 'Igreja Local'}
                      </p>

                      {u.banReason && (
                        <p className="text-[11px] text-rose-300 font-bold">
                          Motivo do bloqueio: {u.banReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações para o Usuário */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!isMaster && (
                      <>
                        <button
                          onClick={() => handleToggleBan(u)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                            u.isBanned
                              ? 'bg-emerald-600 text-zinc-950 hover:bg-emerald-500'
                              : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                          }`}
                        >
                          {u.isBanned ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Reativar</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              <span>Suspender</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/70 text-rose-300 hover:text-white shadow-md"
                          title={`Excluir definitivamente o usuário ${u.name} do sistema`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Excluir Usuário</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
