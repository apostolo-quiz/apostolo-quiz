'use client';

import React, { useState } from 'react';
import {
  AvatarState,
  OutfitType,
  GenderType,
  OUTFIT_MAP
} from '@/data/avatarConfig';
import DynamicCharacterAvatar, { resolvePixarImage } from './DynamicCharacterAvatar';
import {
  Sparkles,
  UserCheck,
  Check,
  CheckCircle2,
  Shirt,
  Crown,
  Scroll
} from 'lucide-react';

interface Props {
  avatar: AvatarState;
  setAvatar: React.Dispatch<React.SetStateAction<AvatarState>>;
  onFinish: () => void;
  onSaveNotification?: (savedAvatar?: AvatarState) => void;
}

export default function CharacterCreator({
  avatar,
  setAvatar,
  onFinish,
  onSaveNotification
}: Props) {
  const [showSavedToast, setShowSavedToast] = useState(false);

  const isMale = avatar.gender === 'male';
  const currentOutfit = (avatar.outfit || 'casual') as OutfitType;

  const saveAvatarToStorage = (state: AvatarState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apostolos_avatar_state', JSON.stringify(state));
      } catch (e) {}
    }
  };

  const triggerToast = (state?: AvatarState) => {
    setShowSavedToast(true);
    if (onSaveNotification) onSaveNotification(state || avatar);
    setTimeout(() => setShowSavedToast(false), 1200);
  };

  /**
   * Troca de Gênero do Personagem (Irmão ou Irmã)
   */
  const handleGenderToggle = (newGender: GenderType) => {
    if (avatar.gender === newGender) return;

    const candidate: AvatarState = {
      ...avatar,
      gender: newGender,
      outfit: avatar.outfit || 'casual'
    };

    const resolvedImage = resolvePixarImage(candidate);
    const updated: AvatarState = {
      ...candidate,
      imageUrl: resolvedImage
    };

    setAvatar(updated);
    saveAvatarToStorage(updated);
    triggerToast(updated);
  };

  /**
   * Troca Direta da Variação de Roupa (Casual, A Rigor, Medieval)
   */
  const handleOutfitChange = (newOutfit: OutfitType) => {
    const candidate: AvatarState = {
      ...avatar,
      outfit: newOutfit
    };

    const resolvedImage = resolvePixarImage(candidate);
    const updated: AvatarState = {
      ...candidate,
      imageUrl: resolvedImage
    };

    setAvatar(updated);
    saveAvatarToStorage(updated);
    triggerToast(updated);
  };

  // As 3 variações oficiais de roupa
  const outfitOptions: {
    id: OutfitType;
    label: string;
    sublabel: string;
    desc: string;
    icon: React.ReactNode;
    previewImg: string;
  }[] = [
    {
      id: 'casual',
      label: 'Casual',
      sublabel: 'Dia a Dia Moderno',
      desc: isMale
        ? 'Camiseta casual estilosa, calça jeans e tênis'
        : 'Blusa casual moderna elegante e saia confortável',
      icon: <Shirt className="w-5 h-5 sm:w-6 sm:h-6" />,
      previewImg: isMale ? '/avatar_irmao_casual.jpg' : '/avatar_irma_casual.jpg'
    },
    {
      id: 'rigor',
      label: 'A Rigor',
      sublabel: 'Traje Formal de Gala',
      desc: isMale
        ? 'Terno escuro alinhado com gravata e máxima solenidade'
        : 'Vestido social fino de festa longo e modesto',
      icon: <Crown className="w-5 h-5 sm:w-6 sm:h-6" />,
      previewImg: isMale ? '/avatar_irmao_arigor.jpg' : '/avatar_irma_arigor.jpg'
    },
    {
      id: 'medieval',
      label: 'Medieval',
      sublabel: 'Época Bíblica Apostólica',
      desc: isMale
        ? 'Túnica bíblica de linho nobre, manto e cinto de couro de época'
        : 'Vestimenta bíblica clássica drapeada com manto suave',
      icon: <Scroll className="w-5 h-5 sm:w-6 sm:h-6" />,
      previewImg: isMale ? '/avatar_irmao_medieval.jpg' : '/avatar_irma_medieval.jpg'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-24 select-none px-3 sm:px-4">
      {/* Toast Flutuante em Tempo Real */}
      {showSavedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          Roupa Atualizada com Sucesso!
        </div>
      )}

      {/* 1. SELETOR DE GÊNERO DO PERSONAGEM (IRMÃO OU IRMÃ) */}
      <div className="bg-zinc-900/95 border border-amber-500/40 rounded-2xl p-3 sm:p-4 text-center shadow-lg">
        <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-amber-400 block mb-2">
          Gênero do Personagem
        </span>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => handleGenderToggle('male')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider border transition flex items-center justify-center gap-2 cursor-pointer ${
              isMale
                ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_18px_rgba(234,179,8,0.5)] scale-102'
                : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
            }`}
          >
            <span>👨 Irmão</span>
            {isMale && <Check className="w-4 h-4 text-zinc-950" />}
          </button>

          <button
            type="button"
            onClick={() => handleGenderToggle('female')}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider border transition flex items-center justify-center gap-2 cursor-pointer ${
              !isMale
                ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_18px_rgba(234,179,8,0.5)] scale-102'
                : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500'
            }`}
          >
            <span>👩 Irmã</span>
            {!isMale && <Check className="w-4 h-4 text-zinc-950" />}
          </button>
        </div>
      </div>

      {/* 2. ESTÚDIO CENTRAL COM O AVATAR EM DESTAQUE */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-950/70 via-zinc-950 to-zinc-950 p-5 sm:p-7 shadow-2xl flex flex-col items-center">
        {/* Halo Suave de Fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.18),transparent_70%)] pointer-events-none"></div>

        {/* Título de Apresentação */}
        <div className="text-center mb-3 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] sm:text-xs font-bold border border-amber-500/40 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Miniatura 3D Mini-Pixar Colecionável
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-200">
            {isMale ? 'Irmão: Discípulo do Reino' : 'Irmã: Serva Adoradora'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Selecione abaixo a variação de roupa que você quer vestir no jogo:
          </p>
        </div>

        {/* Avatar 3D Centralizado e Proporcional */}
        <div className="relative my-2 sm:my-3 z-10 flex flex-col items-center">
          <div className="absolute -inset-4 rounded-full border border-amber-500/30 animate-pulse pointer-events-none"></div>

          <DynamicCharacterAvatar
            avatar={avatar}
            size="2xl"
            showPedestal={true}
            className="shadow-2xl"
          />
        </div>
      </div>

      {/* 3. SELEÇÃO DAS 3 VARIAÇÕES DE ROUPA (CASUAL, A RIGOR, MEDIEVAL) */}
      <div className="bg-zinc-900/95 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>👔 Variação de Roupa do Personagem</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {outfitOptions.map((opt) => {
            const isSelected = currentOutfit === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleOutfitChange(opt.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center text-center group relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/60 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-102 ring-2 ring-amber-400/40'
                    : 'border-zinc-800 bg-zinc-950/90 hover:border-amber-500/60 hover:bg-zinc-900'
                }`}
              >
                {/* Miniatura de Preview */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-amber-400/70 mb-2 group-hover:scale-105 transition-transform bg-black shrink-0 shadow-md">
                  <img
                    src={opt.previewImg}
                    alt={opt.label}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-amber-400">{opt.icon}</span>
                  <span className="font-black text-sm text-amber-200">{opt.label}</span>
                </div>

                <span className="text-[10px] sm:text-xs font-bold text-amber-400/90 mb-1">
                  {opt.sublabel}
                </span>

                <span className="text-[9px] sm:text-[10px] text-zinc-400 line-clamp-2">
                  {opt.desc}
                </span>

                {isSelected ? (
                  <span className="mt-2 text-[9px] bg-emerald-500 text-zinc-950 font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <Check className="w-3 h-3" /> Vestindo
                  </span>
                ) : (
                  <span className="mt-2 text-[9px] text-zinc-500 group-hover:text-amber-300 font-bold uppercase">
                    Selecionar
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. BOTÃO PRINCIPAL DE SALVAR E AVANÇAR */}
      <button
        onClick={() => {
          saveAvatarToStorage(avatar);
          if (onSaveNotification) onSaveNotification();
          onFinish();
        }}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-zinc-950 font-black uppercase tracking-wider shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition cursor-pointer text-xs sm:text-sm"
      >
        <UserCheck className="w-5 h-5" /> Salvar Personagem e Iniciar Missões
      </button>
    </div>
  );
}
