'use client';

import React from 'react';
import { AvatarState, OutfitType, OUTFIT_MAP } from '@/data/avatarConfig';

interface Props {
  avatar: AvatarState;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showPedestal?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Resolução dinâmica do Modelo 3D Oficial por Roupa e Gênero:
 * - Casual
 * - A Rigor
 * - Medieval
 */
export function resolvePixarImage(avatar: AvatarState): string {
  const isFemale = avatar.gender === 'female';
  const outfit = (avatar.outfit || 'casual') as OutfitType;

  if (isFemale) {
    if (outfit === 'rigor') return '/avatar_irma_arigor.jpg';
    if (outfit === 'medieval') return '/avatar_irma_medieval.jpg';
    return '/avatar_irma_casual.jpg';
  } else {
    if (outfit === 'rigor') return '/avatar_irmao_arigor.jpg';
    if (outfit === 'medieval') return '/avatar_irmao_medieval.jpg';
    return '/avatar_irmao_casual.jpg';
  }
}

export default function DynamicCharacterAvatar({
  avatar,
  size = 'lg',
  showPedestal = true,
  className = '',
  onClick
}: Props) {
  const outfitKey = (avatar.outfit || 'casual') as OutfitType;
  const isFemale = avatar.gender === 'female';

  // Resolução da imagem 3D de acordo com o gênero e a roupa
  const baseImg = resolvePixarImage(avatar);
  const outfitData = OUTFIT_MAP[outfitKey] || OUTFIT_MAP.casual;

  const sizeClasses = {
    sm: 'w-10 h-10 sm:w-11 sm:h-11',
    md: 'w-14 h-14 sm:w-16 sm:h-16',
    lg: 'w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52',
    xl: 'w-48 h-48 sm:w-56 sm:h-56 md:w-60 md:h-60',
    '2xl': 'w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72',
    full: 'w-full h-full'
  }[size];

  return (
    <div
      onClick={onClick}
      style={{
        borderColor: outfitData.border,
        boxShadow: `0 0 30px ${outfitData.glow}`
      }}
      className={`relative select-none overflow-hidden rounded-full border-4 sm:border-5 bg-gradient-to-b from-amber-950/70 via-black to-zinc-950 flex items-center justify-center shrink-0 ${sizeClasses} ${className} ${
        onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''
      }`}
    >
      <img
        key={`${baseImg}_${outfitKey}`}
        src={baseImg}
        alt={`${isFemale ? 'Irmã' : 'Irmão'} - Roupa ${outfitData.label}`}
        className="w-full h-full object-cover transition-transform duration-300 ease-out select-none"
        loading="eager"
      />

      {/* Brilho Especular Superior Dourado de Iluminação de Estúdio */}
      <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-b from-amber-300/15 via-transparent to-black/30"></div>

      {/* Selo do Personagem no rodapé do avatar */}
      {size !== 'sm' && size !== 'md' && (
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/90 border border-amber-400/80 rounded-full px-3 py-0.5 shadow-lg flex items-center gap-1.5 backdrop-blur-md pointer-events-none whitespace-nowrap">
          <span className="w-2 h-2 rounded-full inline-block shrink-0 bg-amber-400 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-black uppercase text-amber-300 tracking-wider">
            {isFemale ? 'Irmã' : 'Irmão'} • {outfitData.label}
          </span>
        </div>
      )}
    </div>
  );
}
