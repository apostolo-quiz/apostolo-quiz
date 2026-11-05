'use client';

import React from 'react';
import { AvatarState, OutfitType, OUTFIT_MAP, ETHNICITY_PALETTE, EthnicityType } from '@/data/avatarConfig';

interface Props {
  avatar: AvatarState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showPedestal?: boolean;
  framing?: 'face' | 'full';
  className?: string;
  onClick?: () => void;
}

/**
 * Resolução dinâmica do Modelo 3D Oficial por Etnia, Gênero e Faixa Etária:
 * - 5 Etnias: Pardos, Brancos, Pretos, Indígenas, Amarelos
 * - 2 Gêneros: Masculino (camisa polo, calça jeans, tênis, cabelo curto)
 *              Feminino (vestido, sandálias, cabelo longo)
 * - 4 Faixas Etárias: Criança, Jovem, Adulto, Idoso
 */
export function resolvePixarImage(avatar: AvatarState): string {
  const isFemale = avatar.gender === 'female';
  const ethnicity = avatar.ethnicity || 'pardo';
  const age = avatar.ageStage || 'adulto';

  // Matriz Oficial dos 40 Avatares 3D Cristãos da pasta avatares/
  // 5 Etnias x 2 Gêneros x 4 Faixas Etárias
  const ethKey = ethnicity === 'negro' ? 'preto' : ethnicity === 'asiatico' ? 'amarelo' : ethnicity;
  const genderKey = isFemale ? 'fem' : 'masc';

  return `/avatar_${ethKey}_${genderKey}_${age}.jpg`;
}

export default function DynamicCharacterAvatar({
  avatar,
  size = 'lg',
  showPedestal = true,
  framing,
  className = '',
  onClick
}: Props) {
  const outfitKey = (avatar.outfit || 'casual') as OutfitType;
  const isFemale = avatar.gender === 'female';
  const ethKey = (avatar.ethnicity || 'pardo') as EthnicityType;
  const ethData = ETHNICITY_PALETTE[ethKey] || ETHNICITY_PALETTE.pardo;

  // Enquadramento: 'face' (foco no rosto) ou 'full' (reduz o personagem para caber inteiro no círculo)
  const currentFraming = framing || avatar.framing || 'face';
  const isFullBody = currentFraming === 'full';

  // Resolução da imagem 3D de acordo com o gênero e a roupa
  const baseImg = resolvePixarImage(avatar);
  const outfitData = OUTFIT_MAP[outfitKey] || OUTFIT_MAP.casual;
  const activeBorder = ethData.borderColor || outfitData.border;
  const activeGlow = ethData.themeColor || outfitData.glow;

  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-11 sm:h-11',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52',
    xl: 'w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60',
    '2xl': 'w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72',
    full: 'w-full h-full'
  }[size];

  const isFullSize = size === 'full';

  return (
    <div
      onClick={onClick}
      style={{
        borderColor: isFullSize ? 'transparent' : activeBorder,
        boxShadow: isFullSize ? 'none' : `0 0 25px ${activeGlow}`
      }}
      className={`relative select-none overflow-hidden rounded-full ${
        isFullSize ? 'border-0' : 'border-4 sm:border-5'
      } bg-gradient-to-b from-amber-950/70 via-black to-zinc-950 flex items-center justify-center shrink-0 ${sizeClasses} ${className} ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      }`}
    >
      <img
        key={`${baseImg}_${outfitKey}_${currentFraming}`}
        src={`${baseImg}?v=20261105e`}
        alt={`${isFemale ? 'Irmã' : 'Irmão'} - ${isFemale ? ethData.femaleClothing : ethData.maleClothing}`}
        style={
          isFullBody
            ? {
                transform: 'scale(0.86)',
                transformOrigin: 'center center'
              }
            : {
                transform: 'scale(2.7)',
                transformOrigin: '50% 0%'
              }
        }
        className={`w-full h-full ${
          isFullBody ? 'object-contain' : 'object-cover'
        } transition-transform duration-300 ease-out select-none pointer-events-none`}
        loading="eager"
      />

      {/* Brilho Especular Superior Dourado de Iluminação de Estúdio */}
      <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-b from-amber-300/15 via-transparent to-black/30"></div>

      {/* Selo do Personagem no rodapé do avatar */}
      {size !== 'sm' && size !== 'md' && size !== 'full' && (
        <div
          className={`absolute ${
            isFullBody ? 'bottom-1 sm:bottom-1.5' : 'bottom-1.5 sm:bottom-2'
          } left-1/2 -translate-x-1/2 z-20 bg-black/95 border border-amber-400/90 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 shadow-lg flex items-center gap-1.5 backdrop-blur-md pointer-events-none whitespace-nowrap`}
        >
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full inline-block shrink-0 bg-amber-400 animate-pulse" />
          <span className="text-[9px] sm:text-[11px] font-black uppercase text-amber-200 tracking-wider">
            {isFemale ? 'Irmã' : 'Irmão'} • {avatar.ageStage ? avatar.ageStage.toUpperCase() : 'MEMBRO'}
          </span>
        </div>
      )}
    </div>
  );
}
