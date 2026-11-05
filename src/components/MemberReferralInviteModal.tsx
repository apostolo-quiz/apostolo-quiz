'use client';

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Download,
  Smartphone,
  ExternalLink,
  Award,
  Sparkles,
  Users,
  QrCode,
  X,
  MessageCircle,
  ShieldCheck,
  Send
} from 'lucide-react';
import { UserProfile } from '@/data/db';
import { AvatarState } from '@/data/avatarConfig';
import DynamicCharacterAvatar from './DynamicCharacterAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  avatar: AvatarState;
}

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.apostolos.quizbiblico';
export const DIRECT_APK_FILENAME = 'Apostolos-Quiz-Biblico.apk';

/**
 * Gera o Código de Indicação Individual Único do Membro
 * Exemplo: Se o nome for "Edino Junior" e ID "user_1793666097873", gera "EDINO-7873"
 */
export function generateMemberReferralCode(userProfile: UserProfile | null): string {
  if (!userProfile) return 'APOSTOLOS-3D';
  const firstName = (userProfile.name || 'IRMAO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(' ')[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

  const idSuffix = (userProfile.id || '2026').replace(/\D/g, '').slice(-4) || '777';
  return `${firstName || 'IRMAO'}-${idSuffix}`;
}

export default function MemberReferralInviteModal({
  isOpen,
  onClose,
  userProfile,
  avatar
}: Props) {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const title = userProfile?.title || (avatar.gender === 'female' ? 'Irmã' : 'Irmão');
  const displayName = userProfile?.name || 'Visitante da Fé';
  const referralCode = generateMemberReferralCode(userProfile);

  // Determina a URL base do site atual
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://apostolos-quiz.com';
  const webAppInviteUrl = `${baseUrl}/?ref=${referralCode}`;
  const directApkDownloadUrl = `${baseUrl}/download/${DIRECT_APK_FILENAME}`;

  // Texto completo e acolhedor do convite bíblico individual
  const fullInviteMessage = `📖✨ *A paz do Senhor, meu irmão(ã)!*

Aqui é o(a) *${title} ${displayName}*! Estou te convidando pessoalmente para jogarmos juntos o *Apóstolos: Quiz Bíblico 3D*! 🕊️

Crie seu avatar cristão personalizado em 3D, dispute perguntas bíblicas de Gênesis a Apocalipse e entre em salas com até 20 irmãos em comunhão!

📲 *Escolha como baixar no seu celular:*
• *Google Play Store:* ${PLAY_STORE_URL}
• *Baixar APK Direto (Android):* ${directApkDownloadUrl}
• *Ou Jogue Online no Navegador:* ${webAppInviteUrl}

🎁 *Meu Código de Indicação Individual:* *${referralCode}*
(Ao entrar ou cadastrar com este código, nós dois ganhamos +200 Pontos de Fé XP!)

_"Instrui o sábio, e ele se fará mais sábio; ensina o justo, e ele crescerá em prudência." - Provérbios 9:9_`;

  const copyToClipboard = (text: string, type: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(fullInviteMessage);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(234,179,8,0.3)] max-h-[92vh] overflow-y-auto text-zinc-100">
        
        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:border-amber-400 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center space-y-2 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Share2 className="w-3.5 h-3.5" />
            <span>Convite de Indicação Individual</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-300 drop-shadow">
            Indicar Irmãos & Ganhar XP
          </h2>
          <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
            Compartilhe seu convite individual para que seus amigos e irmãos da igreja baixem o aplicativo na <strong>Play Store</strong> ou via <strong>APK direto</strong>.
          </p>
        </div>

        {/* Card do Membro Indicador */}
        <div className="bg-gradient-to-r from-amber-950/50 via-zinc-900 to-amber-950/50 border-2 border-amber-500/40 rounded-2xl p-4 flex items-center gap-3.5 mb-5 shadow-lg">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 bg-black shadow-md flex items-center justify-center">
            {userProfile?.photoUrl && userProfile.photoUrl.startsWith('data:') ? (
              <img src={userProfile.photoUrl} alt="Foto" className="w-full h-full object-cover" />
            ) : (
              <DynamicCharacterAvatar avatar={avatar} size="full" showPedestal={false} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase font-black tracking-wider text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Embaixador da Palavra
            </div>
            <div className="font-serif font-black text-white text-base truncate">
              {title} {displayName}
            </div>
            <div className="text-[11px] text-zinc-300 mt-0.5">
              Ganha <strong className="text-amber-300">+200 XP</strong> a cada irmão cadastrado!
            </div>
          </div>
        </div>

        {/* Código de Indicação com Cópia Rápida */}
        <div className="bg-zinc-900/90 border border-amber-500/50 rounded-2xl p-3.5 mb-5 text-center space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Seu Código de Indicação Individual
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-wider bg-black/60 px-4 py-1.5 rounded-xl border border-amber-500/40">
              {referralCode}
            </span>
            <button
              onClick={() => copyToClipboard(referralCode, 'code')}
              className="p-2.5 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-400 font-bold transition flex items-center justify-center cursor-pointer shadow-md"
              title="Copiar código"
            >
              {copiedType === 'code' ? <Check className="w-4 h-4 text-emerald-950 font-black" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-zinc-400">
            Seus amigos podem digitar este código na hora de se cadastrar no jogo.
          </p>
        </div>

        {/* OPÇÕES DE DOWNLOAD DO APLICATIVO */}
        <div className="space-y-3 mb-5">
          <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5 px-1">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Links Oficiais de Download</span>
          </h3>

          {/* Opção 1: Google Play Store */}
          <div className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/60 transition rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-white">Google Play Store</div>
                <div className="text-[10px] text-zinc-400 truncate">
                  Instalação oficial e automática pelo Google Play
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => copyToClipboard(PLAY_STORE_URL, 'playstore')}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Copiar link da Play Store"
              >
                {copiedType === 'playstore' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Copiar</span>
              </button>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase transition flex items-center gap-1 shadow"
              >
                <span>Abrir</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Opção 2: Download Direto do APK (Android) */}
          <div className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/60 transition rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-white">Baixar Arquivo APK Direto</div>
                <div className="text-[10px] text-zinc-400 truncate">
                  Instalação direta no celular Android (.apk)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => copyToClipboard(directApkDownloadUrl, 'apk')}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="Copiar link do APK"
              >
                {copiedType === 'apk' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Copiar</span>
              </button>
              <a
                href={directApkDownloadUrl}
                download={DIRECT_APK_FILENAME}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black uppercase transition flex items-center gap-1 shadow"
              >
                <span>Baixar</span>
                <Download className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Opção 3: Jogar Online no Navegador (Web App) */}
          <div className="bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/60 transition rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-white">Jogar no Navegador (Web App)</div>
                <div className="text-[10px] text-zinc-400 truncate">
                  Sem precisar instalar nada, direto pelo link
                </div>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(webAppInviteUrl, 'webapp')}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copiedType === 'webapp' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedType === 'webapp' ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
          </div>
        </div>

        {/* BOTÕES DE COMPARTILHAMENTO DE 1-CLIQUE */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          {/* Botão de WhatsApp em destaque */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-sm uppercase flex items-center justify-center gap-2.5 transition shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Compartilhar Convite no WhatsApp</span>
          </button>

          {/* Copiar Convite Completo */}
          <button
            onClick={() => copyToClipboard(fullInviteMessage, 'full')}
            className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-zinc-200 font-bold text-xs uppercase flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {copiedType === 'full' ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Mensagem Completa Copiada com Sucesso!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copiar Mensagem Completa do Convite</span>
              </>
            )}
          </button>
        </div>

        {/* Rodapé Cristão */}
        <div className="text-center mt-4 text-[10px] text-zinc-500 italic">
          "Ide por todo o mundo e pregai o evangelho a toda criatura." — Marcos 16:15
        </div>
      </div>
    </div>
  );
}
