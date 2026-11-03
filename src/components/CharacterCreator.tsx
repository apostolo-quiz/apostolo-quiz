'use client';

import React, { useState } from 'react';
import {
  AvatarState,
  OutfitType,
  GenderType,
  EthnicityType,
  AgeStageType,
  ETHNICITY_PALETTE,
  AGE_STAGES,
  OUTFIT_MAP
} from '@/data/avatarConfig';
import DynamicCharacterAvatar, { resolvePixarImage } from './DynamicCharacterAvatar';
import {
  Sparkles,
  UserCheck,
  Check,
  CheckCircle2,
  Users,
  Calendar,
  Shirt,
  Info
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
  const currentEthnicity = avatar.ethnicity || 'pardo';
  const currentAgeStage = avatar.ageStage || 'adulto';

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

  const handleGenderToggle = (newGender: GenderType) => {
    if (avatar.gender === newGender) return;
    const candidate: AvatarState = {
      ...avatar,
      gender: newGender
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

  const handleEthnicityChange = (newEthnicity: EthnicityType) => {
    const candidate: AvatarState = {
      ...avatar,
      ethnicity: newEthnicity
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

  const handleAgeStageChange = (newAge: AgeStageType) => {
    const candidate: AvatarState = {
      ...avatar,
      ageStage: newAge
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

  const ethnicityList: {
    id: EthnicityType;
    label: string;
    clothing: string;
    color: string;
    themeColor: string;
  }[] = [
    {
      id: 'pardo',
      label: '🤎 Pardos',
      clothing: isMale ? 'Polo Azul Marinho' : 'Vestido Verde Esmeralda',
      color: '#B48259',
      themeColor: '#059669'
    },
    {
      id: 'branco',
      label: '🤍 Brancos',
      clothing: isMale ? 'Polo Vinho Bordô' : 'Vestido Azul Royal',
      color: '#F8D5C2',
      themeColor: '#2563EB'
    },
    {
      id: 'negro',
      label: '🖤 Pretos',
      clothing: isMale ? 'Polo Mostarda Ouro' : 'Vestido Terracota Dourado',
      color: '#3D2314',
      themeColor: '#D97706'
    },
    {
      id: 'indigena',
      label: '🧡 Indígenas',
      clothing: isMale ? 'Polo Verde Oliva' : 'Vestido Coral Terra',
      color: '#C27343',
      themeColor: '#EA580C'
    },
    {
      id: 'asiatico',
      label: '💛 Amarelos',
      clothing: isMale ? 'Polo Azul Aço' : 'Vestido Lilás Suave',
      color: '#F2D0A4',
      themeColor: '#9333EA'
    }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-24 select-none px-3 sm:px-4">
      {/* Toast Flutuante em Tempo Real */}
      {showSavedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs sm:text-sm font-black uppercase tracking-wider px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 border-2 border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-100" />
          Avatar Atualizado com Sucesso!
        </div>
      )}

      {/* 1. SELETOR DE GÊNERO DO PERSONAGEM (IRMÃO OU IRMÃ) */}
      <div className="bg-zinc-950 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 text-center shadow-xl">
        <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-amber-300 block mb-2.5">
          1. Gênero do Personagem
        </span>
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => handleGenderToggle('male')}
            className={`py-3.5 px-4 rounded-2xl text-sm sm:text-base font-black uppercase tracking-wider border-2 transition flex items-center justify-center gap-2 cursor-pointer ${
              isMale
                ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-102 ring-1 ring-amber-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'
            }`}
          >
            <span>👨 Irmão</span>
            {isMale && <Check className="w-5 h-5 text-zinc-950" />}
          </button>

          <button
            type="button"
            onClick={() => handleGenderToggle('female')}
            className={`py-3.5 px-4 rounded-2xl text-sm sm:text-base font-black uppercase tracking-wider border-2 transition flex items-center justify-center gap-2 cursor-pointer ${
              !isMale
                ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-[0_0_20px_rgba(234,179,8,0.5)] scale-102 ring-1 ring-amber-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500'
            }`}
          >
            <span>👩 Irmã</span>
            {!isMale && <Check className="w-5 h-5 text-zinc-950" />}
          </button>
        </div>
      </div>

      {/* 2. ESTÚDIO CENTRAL COM O AVATAR EM DESTAQUE */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/60 bg-gradient-to-b from-amber-950/80 via-zinc-950 to-zinc-950 p-5 sm:p-7 shadow-2xl flex flex-col items-center">
        {/* Halo Suave de Fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.2),transparent_70%)] pointer-events-none"></div>

        {/* Título de Apresentação */}
        <div className="text-center mb-3 z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/25 text-amber-200 text-xs font-extrabold border border-amber-500/40 mb-1.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-300" /> Miniatura 3D Mini-Pixar Colecionável
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-amber-100">
            {isMale ? 'Irmão: Discípulo do Reino' : 'Irmã: Serva Adoradora'}
          </h2>
          <div className="text-xs sm:text-sm text-zinc-100 mt-2 max-w-lg mx-auto bg-black/85 border-2 border-amber-500/50 rounded-2xl p-3 flex items-center justify-center gap-2.5 shadow-lg">
            <Info className="w-5 h-5 text-amber-400 shrink-0" />
            <span className="font-bold leading-snug">
              {isMale
                ? 'Homens e meninos: Calça jeans, camisa polo e tênis.'
                : 'Mulheres e meninas: Vestido modesto, sandálias e cabelos longos.'}
            </span>
          </div>
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

      {/* 3. SELETOR DE ETNIAS BRASILEIRAS (IBGE) */}
      <div className="bg-zinc-950 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" /> 2. Etnias Brasileiras (IBGE)
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            Representatividade Cristã
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
          {ethnicityList.map((eth) => {
            const isSelected = currentEthnicity === eth.id;

            return (
              <button
                key={eth.id}
                type="button"
                onClick={() => handleEthnicityChange(eth.id)}
                className={`p-3 sm:p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center text-center group relative ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/70 shadow-[0_0_20px_rgba(234,179,8,0.45)] scale-102 ring-2 ring-amber-400'
                    : 'border-zinc-800 bg-zinc-900/90 hover:border-amber-500/50 hover:bg-zinc-850'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full mb-1.5 border border-white/30 shadow-sm"
                  style={{ backgroundColor: eth.color }}
                />
                <span className="font-black text-xs sm:text-sm text-amber-100 leading-tight">
                  {eth.label}
                </span>
                <span className="text-[10px] text-zinc-300 font-semibold mt-1 line-clamp-2 leading-tight">
                  {eth.clothing}
                </span>
                {isSelected && (
                  <span className="mt-2 text-[9px] bg-emerald-500 text-zinc-950 font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3" /> Ativo
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SELETOR DE FAIXA ETÁRIA (CRIANÇAS, JOVENS, ADULTOS, IDOSOS) */}
      <div className="bg-zinc-950 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <h3 className="text-sm sm:text-base font-black text-amber-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> 3. Faixa Etária
          </span>
          <span className="text-xs text-zinc-400 font-medium">
            De Crianças a Idosos
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {AGE_STAGES.map((stg) => {
            const isSelected = currentAgeStage === stg.id;

            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => handleAgeStageChange(stg.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center text-center group relative ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/70 shadow-[0_0_20px_rgba(234,179,8,0.45)] scale-102 ring-2 ring-amber-400'
                    : 'border-zinc-800 bg-zinc-900/90 hover:border-amber-500/50 hover:bg-zinc-850'
                }`}
              >
                <span className="text-3xl mb-1.5">{stg.icon}</span>
                <span className="font-black text-sm text-amber-100">
                  {stg.label}
                </span>
                <span className="text-[11px] text-zinc-300 font-medium mt-1">
                  {stg.sublabel}
                </span>
                {isSelected && (
                  <span className="mt-2 text-[10px] bg-emerald-500 text-zinc-950 font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3" /> Escolhido
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. BOTÃO PRINCIPAL DE SALVAR E AVANÇAR */}
      <button
        onClick={() => {
          saveAvatarToStorage(avatar);
          if (onSaveNotification) onSaveNotification();
          onFinish();
        }}
        className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 font-black uppercase tracking-wider shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-98 transition cursor-pointer text-sm sm:text-base"
      >
        <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" /> Salvar Personagem e Continuar no Quiz
      </button>
    </div>
  );
}
