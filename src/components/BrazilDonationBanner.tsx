'use client';

import React from 'react';

const VAKINHA_URL =
  'https://www.vakinha.com.br/6431189?utm_source=site-vakinha&utm_medium=share&utm_campaign=pagina-divulgacao';

interface Props {
  className?: string;
}

export default function BrazilDonationBanner({ className = '' }: Props) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <a
        href={VAKINHA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-yellow-400 bg-gradient-to-r from-emerald-800 via-green-700 to-emerald-800 shadow-md hover:border-yellow-300 hover:shadow-[0_0_12px_rgba(34,197,94,0.5)] hover:scale-105 active:scale-95 transition-all no-underline text-white cursor-pointer select-none"
        title="faça uma doação - FORTALEZA NOSSO PROJETO"
      >
        {/* Ícone Pequeno da Bandeira */}
        <span className="text-sm sm:text-base leading-none shrink-0" role="img" aria-label="Bandeira do Brasil">
          🇧🇷
        </span>

        {/* Textos Curtos e Compactos */}
        <div className="flex flex-col text-left leading-none">
          <span className="text-[8px] sm:text-[9px] font-bold text-yellow-300 uppercase tracking-wide">
            faça uma doação
          </span>
          <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
            FORTALEZA NOSSO PROJETO
          </span>
        </div>
      </a>
    </div>
  );
}
