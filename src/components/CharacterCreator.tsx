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

  const ethnicityList: { id: EthnicityType; label: string; desc: string; color: string }[] = [
    { id: 'pardo', label: '🤎 Pardos', desc: 'Miscigenação brasileira', color: '#B48259' },
    { id: 'branco', label: '🤍 Brancos', desc: 'Euro-brasileiro', color: '#F8D5C2' },
    { id: 'negro', label: '🖤 Pretos', desc: 'Afro-brasileiro', color: '#3D2314' },
    { id: 'indigena', label: '🧡 Indígenas', desc: 'Povos originários', color: '#C27343' },
    { id: 'asiatico', label: '💛 Amarelos', desc: 'Asiático-brasileiro', color: '#F2D0A4' }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-24 select-none px-3 sm:px-4">
      {/* Toast Flutuante em Tempo Real */}
      {showSavedToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          Avatar Atualizado com Sucesso!
        </div>
      )}

      {/* 1. SELETOR DE GÊNERO DO PERSONAGEM (IRMÃO OU IRMÃ) */}
      <div className="bg-zinc-900/95 border border-amber-500/40 rounded-2xl p-3 sm:p-4 text-center shadow-lg">
        <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-amber-400 block mb-2">
          1. Gênero do Personagem
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
          <div className="text-xs text-zinc-300 mt-1 max-w-md mx-auto bg-black/60 border border-amber-500/30 rounded-xl px-3 py-1.5 flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {isMale
                ? 'Camisa polo casual, calça jeans, tênis e cabelo curto.'
                : 'Vestido casual de igreja, sandálias e cabelos longos.'}
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
      <div className="bg-zinc-900/95 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" /> 2. Etnias Brasileiras (IBGE)
          </span>
          <span className="text-[10px] text-zinc-400 font-normal">
            Representatividade da Igreja Brasileira
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {ethnicityList.map((eth) => {
            const isSelected = currentEthnicity === eth.id;

            return (
              <button
                key={eth.id}
                type="button"
                onClick={() => handleEthnicityChange(eth.id)}
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col items-center text-center group relative ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/60 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-102 ring-1 ring-amber-400'
                    : 'border-zinc-800 bg-zinc-950/90 hover:border-amber-500/50 hover:bg-zinc-900'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full mb-1.5 border border-white/20"
                  style={{ backgroundColor: eth.color }}
                />
                <span className="font-black text-xs text-amber-200 leading-tight">
                  {eth.label}
                </span>
                <span className="text-[9px] text-zinc-400 mt-0.5 line-clamp-1">
                  {eth.desc}
                </span>
                {isSelected && (
                  <span className="mt-1.5 text-[8px] bg-emerald-500 text-zinc-950 font-black uppercase px-2 py-0.2 rounded-full flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Ativo
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SELETOR DE FAIXA ETÁRIA (CRIANÇAS, JOVENS, ADULTOS, IDOSOS) */}
      <div className="bg-zinc-900/95 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl">
        <h3 className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-amber-400" /> 3. Faixa Etária
          </span>
          <span className="text-[10px] text-zinc-400 font-normal">
            De Crianças a Idosos
          </span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {AGE_STAGES.map((stg) => {
            const isSelected = currentAgeStage === stg.id;

            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => handleAgeStageChange(stg.id)}
                className={`p-3 rounded-xl border-2 transition cursor-pointer flex flex-col items-center text-center group relative ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/60 shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-102 ring-1 ring-amber-400'
                    : 'border-zinc-800 bg-zinc-950/90 hover:border-amber-500/50 hover:bg-zinc-900'
                }`}
              >
                <span className="text-2xl mb-1">{stg.icon}</span>
                <span className="font-black text-xs text-amber-200">
                  {stg.label}
                </span>
                <span className="text-[9px] text-zinc-400 mt-0.5">
                  {stg.sublabel}
                </span>
                {isSelected && (
                  <span className="mt-1.5 text-[8px] bg-emerald-500 text-zinc-950 font-black uppercase px-2 py-0.2 rounded-full flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Escolhido
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
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-zinc-950 font-black uppercase tracking-wider shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition cursor-pointer text-xs sm:text-sm"
      >
        <UserCheck className="w-5 h-5" /> Salvar Personagem e Continuar no Quiz
      </button>
    </div>
  );
}
