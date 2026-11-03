'use client';

import React from 'react';
import { Heart, ExternalLink } from 'lucide-react';

const VAKINHA_URL =
  'https://www.vakinha.com.br/6431189?utm_source=site-vakinha&utm_medium=share&utm_campaign=pagina-divulgacao';

interface Props {
  className?: string;
}

export default function BrazilDonationBanner({ className = '' }: Props) {
  return (
    <div className={`flex justify-center w-full ${className}`}>
      <a
        href={VAKINHA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2.5 sm:gap-3 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 shadow-[0_2px_12px_rgba(0,0,0,0.7)] hover:border-yellow-300 hover:shadow-[0_0_18px_rgba(34,197,94,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all no-underline text-white cursor-pointer select-none group"
        title="Faça uma doação e fortaleça nosso projeto"
      >
        {/* Emblema da Bandeira do Brasil */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-950 border border-yellow-400 flex items-center justify-center shrink-0 shadow text-base sm:text-lg group-hover:rotate-6 transition-transform">
          🇧🇷
        </div>

        {/* Textos: FAÇA UMA DOAÇÃO / FORTALEÇA NOSSO PROJETO */}
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-yellow-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] flex items-center gap-1">
            FAÇA UMA DOAÇÃO
            <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500 inline" />
          </span>
          <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
            FORTALEÇA NOSSO PROJETO
          </span>
        </div>

        {/* Indicador de Link Externo Compacto */}
        <div className="ml-1 pl-2 border-l border-yellow-400/40 text-yellow-300 group-hover:text-white transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </div>
      </a>
    </div>
  );
}
