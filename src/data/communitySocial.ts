// Sistema de Rede Social Cristã, Presença Online e Amizades - Apóstolos Quiz Bíblico
// Permite que irmãos se conectem, vejam quem está online, enviem saudações e conversem

import { UserProfile, isUserAdmin, getServerApiUrl } from './db';
import { AvatarState } from './avatarConfig';

export interface CommunityUser {
  id: string;
  name: string;
  title: 'Irmão' | 'Irmã' | 'Administrador';
  gender: 'male' | 'female';
  photoUrl?: string;
  avatarConfig?: any;
  churchName?: string;
  city?: string;
  state?: string;
  ministry?: string;
  isVip?: boolean;
  isAdmin?: boolean;
  score?: number;
  lastActiveAt: string;
  isOnline: boolean;
  friendStatus?: 'none' | 'pending_sent' | 'pending_received' | 'friends';
}

export interface Friendship {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterTitle: string;
  requesterPhoto?: string;
  requesterChurch?: string;
  addresseeId: string;
  addresseeName: string;
  addresseeTitle: string;
  addresseePhoto?: string;
  addresseeChurch?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  requester?: CommunityUser;
  addressee?: CommunityUser;
}

export interface DirectMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserTitle: string;
  toUserId: string;
  text: string;
  interactionType?: 'chat' | 'paz_do_senhor' | 'orando_por_voce' | 'abencoado' | 'desafio_quiz';
  createdAt: string;
  read: boolean;
}

export interface CommunityOverviewResponse {
  success: boolean;
  totalUsers: number;
  onlineCount: number;
  onlineUsers: CommunityUser[];
  allUsers: CommunityUser[];
  friends: CommunityUser[];
  pendingRequestsReceived: Friendship[];
  pendingRequestsSent: Friendship[];
  unreadMessagesCount: number;
}

// Lista de Discípulos da Comunidade Cristã (Presets para enriquecer a experiência comunitária)
export const DEMO_COMMUNITY_USERS: Omit<CommunityUser, 'isOnline' | 'lastActiveAt'>[] = [
  {
    id: 'user_debora_vasconcelos',
    name: 'Débora Vasconcelos',
    title: 'Irmã',
    gender: 'female',
    photoUrl: '/avatar_pardo_fem_adulto.jpg',
    churchName: 'Assembleia de Deus - Sede',
    city: 'Santo André',
    state: 'SP',
    ministry: 'Diaconisa & Círculo de Oração',
    score: 3450,
    avatarConfig: {
      gender: 'female',
      skinTone: 'pardo_light',
      hairStyle: 'long_curly',
      hairColor: 'dark_brown',
      outfitStyle: 'modest_dress',
      ethnicity: 'pardo',
      ageStage: 'adulto'
    }
  },
  {
    id: 'user_lucas_ferreira',
    name: 'Lucas Ferreira',
    title: 'Irmão',
    gender: 'male',
    photoUrl: '/avatar_branco_masc_adulto.jpg',
    churchName: 'Igreja Batista Memorial',
    city: 'São Bernardo do Campo',
    state: 'SP',
    ministry: 'Líder do Ministério Jovem',
    score: 2890,
    avatarConfig: {
      gender: 'male',
      skinTone: 'fair',
      hairStyle: 'short_crop',
      hairColor: 'brown',
      outfitStyle: 'contemporary_suit',
      ethnicity: 'branco',
      ageStage: 'adulto'
    }
  },
  {
    id: 'user_sarah_alencar',
    name: 'Sarah Alencar',
    title: 'Irmã',
    gender: 'female',
    photoUrl: '/avatar_preto_fem_adulto.jpg',
    churchName: 'Igreja Presbiteriana Central',
    city: 'São Paulo',
    state: 'SP',
    ministry: 'Ministério de Louvor',
    score: 4120,
    avatarConfig: {
      gender: 'female',
      skinTone: 'dark',
      hairStyle: 'braids',
      hairColor: 'black',
      outfitStyle: 'modest_dress',
      ethnicity: 'negro',
      ageStage: 'adulto'
    }
  },
  {
    id: 'user_davi_salomao',
    name: 'Davi Salomão',
    title: 'Irmão',
    gender: 'male',
    photoUrl: '/avatar_pardo_masc_adulto.jpg',
    churchName: 'Assembleia de Deus - Vila Humaitá',
    city: 'Santo André',
    state: 'SP',
    ministry: 'Presbítero & Professor de EBD',
    score: 5200,
    avatarConfig: {
      gender: 'male',
      skinTone: 'pardo_warm',
      hairStyle: 'short_clean',
      hairColor: 'dark_brown',
      outfitStyle: 'formal',
      ethnicity: 'pardo',
      ageStage: 'adulto'
    }
  },
  {
    id: 'user_rebeca_mello',
    name: 'Rebeca Mello',
    title: 'Irmã',
    gender: 'female',
    photoUrl: '/avatar_amarelo_fem_adulto.jpg',
    churchName: 'Comunidade Cristã Zoe',
    city: 'Campinas',
    state: 'SP',
    ministry: 'Professora do Ministério Infantil',
    score: 2150,
    avatarConfig: {
      gender: 'female',
      skinTone: 'asian_fair',
      hairStyle: 'straight_long',
      hairColor: 'black',
      outfitStyle: 'contemporary',
      ethnicity: 'asiatico',
      ageStage: 'adulto'
    }
  },
  {
    id: 'user_samuel_prado',
    name: 'Samuel Prado',
    title: 'Irmão',
    gender: 'male',
    photoUrl: '/avatar_preto_masc_adulto.jpg',
    churchName: 'Assembleia de Deus - Ministério Santo André',
    city: 'Santo André',
    state: 'SP',
    ministry: 'Pastor Auxiliar',
    score: 4800,
    avatarConfig: {
      gender: 'male',
      skinTone: 'dark',
      hairStyle: 'short_clean',
      hairColor: 'black',
      outfitStyle: 'suit_tie',
      ethnicity: 'negro',
      ageStage: 'adulto'
    }
  }
];

// 1. Enviar Heartbeat de presença do usuário
export async function sendHeartbeatClient(
  userProfile: UserProfile,
  avatar?: AvatarState
): Promise<{ success: boolean; onlineCount?: number }> {
  try {
    const url = getServerApiUrl('api/community/heartbeat');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userProfile.id,
        name: userProfile.name,
        title: userProfile.title || (userProfile.gender === 'female' ? 'Irmã' : 'Irmão'),
        gender: userProfile.gender,
        photoUrl: userProfile.photoUrl,
        avatarConfig: avatar || userProfile.avatarConfig,
        churchName: userProfile.churchName,
        city: userProfile.city,
        state: userProfile.state,
        ministry: userProfile.ministry,
        email: userProfile.email
      })
    });
    if (!res.ok) return { success: false };
    return await res.json();
  } catch (e) {
    return { success: false };
  }
}

// 2. Buscar Panorama da Comunidade (Total de usuários, Online, Amigos e Solicitações)
export async function fetchCommunityOverviewClient(
  userId: string
): Promise<CommunityOverviewResponse> {
  try {
    const url = getServerApiUrl(`api/community/overview?userId=${encodeURIComponent(userId)}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('[COMMUNITY] Falha ao buscar panorama no servidor:', err);
    return {
      success: true,
      totalUsers: 1,
      onlineCount: 1,
      onlineUsers: [],
      allUsers: [],
      friends: [],
      pendingRequestsReceived: [],
      pendingRequestsSent: [],
      unreadMessagesCount: 0
    };
  }
}

// 3. Ações de Amizade (Enviar Pedido, Aceitar, Recusar, Remover)
export async function handleFriendActionClient(
  action: 'send_request' | 'accept_request' | 'reject_request' | 'remove_friend',
  payload: {
    userId: string;
    targetUserId?: string;
    requestId?: string;
  }
): Promise<{ success: boolean; message?: string }> {
  try {
    const url = getServerApiUrl('api/community/friend');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload })
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Erro ao processar solicitação de amizade.' };
  }
}

// 4. Buscar Bate-Papo Direto entre Dois Irmãos
export async function fetchDirectMessagesClient(
  userId: string,
  otherUserId: string
): Promise<{ success: boolean; messages: DirectMessage[] }> {
  try {
    const url = getServerApiUrl(
      `api/community/messages?userId=${encodeURIComponent(userId)}&otherUserId=${encodeURIComponent(otherUserId)}`
    );
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { success: false, messages: [] };
  }
}

// 5. Enviar Mensagem Direta ou Saudação Cristã no Bate-Papo
export async function sendDirectMessageClient(payload: {
  fromUserId: string;
  fromUserName: string;
  fromUserTitle: string;
  toUserId: string;
  text: string;
  interactionType?: 'chat' | 'paz_do_senhor' | 'orando_por_voce' | 'abencoado' | 'desafio_quiz';
}): Promise<{ success: boolean; message?: string; msg?: DirectMessage; blocked?: boolean }> {
  try {
    const url = getServerApiUrl('api/community/messages');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Erro ao enviar mensagem.' };
  }
}
