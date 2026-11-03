'use client';

import React from 'react';
import { Heart, Sparkles, ExternalLink } from 'lucide-react';

const VAKINHA_URL =
  'https://www.vakinha.com.br/6431189?utm_source=site-vakinha&utm_medium=share&utm_campaign=pagina-divulgacao';

interface Props {
  className?: string;
}

export default function BrazilDonationBanner({ className = '' }: Props) {
  return (
    <a
      href={VAKINHA_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`block relative overflow-hidden rounded-2xl border-3 border-yellow-400 bg-gradient-to-r from-emerald-900 via-green-700 to-emerald-900 p-3.5 sm:p-4 shadow-[0_4px_25px_rgba(0,0,0,0.7)] hover:border-yellow-300 hover:shadow-[0_0_35px_rgba(34,197,94,0.55)] transition-all select-none group no-underline text-white cursor-pointer ${className}`}
      title="Faça uma doação e fortaleça nosso projeto"
    >
      {/* Geometria de Losango Amarelo e Círculo Azul da Bandeira do Brasil */}
      <div className="absolute -top-10 -left-10 w-36 h-36 bg-yellow-400/25 rotate-45 pointer-events-none rounded-2xl group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-blue-700/35 rotate-45 pointer-events-none rounded-2xl group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-900/20 rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Lado Esquerdo: Emblema + Textos com Máximo Contraste */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-950 border-2 border-yellow-400 flex items-center justify-center shrink-0 shadow-lg text-2xl group-hover:rotate-6 transition-transform">
            🇧🇷
          </div>

          <div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-400 text-zinc-950 text-[10px] font-black uppercase tracking-wider shadow">
                FAÇA UMA DOAÇÃO
              </span>
              <span className="text-[10px] text-yellow-300 font-bold hidden sm:inline-flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-yellow-300" /> Apoio Voluntário
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
              FORTALEÇA NOSSO PROJETO
            </h3>

            <p className="text-[11px] sm:text-xs font-semibold text-yellow-100 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight max-w-md">
              Ajude a manter os servidores ativos, o quiz gratuito e o ensino bíblico para milhares de vidas no Brasil.
            </p>
          </div>
        </div>

        {/* Lado Direito: Único Botão de Doação Ancorado */}
        <div className="shrink-0 w-full sm:w-auto">
          <div className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-300 group-hover:from-yellow-300 group-hover:to-amber-200 text-zinc-950 font-black text-xs uppercase tracking-wider border-2 border-white shadow-xl flex items-center justify-center gap-2 group-hover:scale-105 active:scale-95 transition">
            <Heart className="w-4 h-4 fill-red-600 text-red-600" />
            <span>Doar Agora</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-900 ml-0.5" />
          </div>
        </div>
      </div>
    </a>
  );
}
