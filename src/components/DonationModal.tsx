'use client';

import React, { useState } from 'react';
import {
  Heart,
  QrCode,
  Copy,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  Gift,
  Flame,
  ThumbsUp
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationModal({ isOpen, onClose }: Props) {
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [pixCopied, setPixCopied] = useState(false);

  if (!isOpen) return null;

  // Chave PIX Oficial do Projeto
  const pixKey = 'pix-apostolos-quiz@teologia.com.br';
  const pixCode =
    '00020126580014br.gov.bcb.pix0136pix-apostolos-quiz@teologia.com.br520400005303986540510.005802BR5925APOSTOLOS QUIZ BIBLICO6009SAO PAULO62070503***6304ABCD';

  const handleCopyPix = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pixKey);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2500);
    }
  };

  const amountOptions = [
    { value: 5, label: 'R$ 5', desc: 'Semente' },
    { value: 10, label: 'R$ 10', desc: 'Apoio' },
    { value: 25, label: 'R$ 25', desc: 'Edificação' },
    { value: 50, label: 'R$ 50', desc: 'Multiplicação' },
    { value: 100, label: 'R$ 100', desc: 'Missionário' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl overflow-hidden border-3 border-yellow-400 shadow-[0_0_50px_rgba(34,197,94,0.35)] bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
        {/* Banner Superior com as Cores da Bandeira do Brasil */}
        <div className="relative p-5 text-center bg-gradient-to-r from-emerald-800 via-green-600 to-emerald-800 border-b-4 border-yellow-400 overflow-hidden">
          {/* Losango Amarelo Decorativo Sutil de Fundo */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-yellow-400/20 rotate-45 pointer-events-none rounded-3xl" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-600/30 rotate-45 pointer-events-none rounded-3xl" />

          {/* Botão Fechar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-yellow-300 hover:text-white hover:bg-black/80 transition cursor-pointer z-10"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Emblema Brasil */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/90 border-2 border-yellow-400 shadow-md mb-2">
            <span className="text-base">🇧🇷</span>
            <span className="text-[11px] font-black uppercase text-yellow-300 tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              Missão e Tecnologia Cristã
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)]">
            FORTALEÇA NOSSO PROJETO
          </h2>

          <p className="text-xs sm:text-sm font-bold text-yellow-200 mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] max-w-md mx-auto">
            Sua doação voluntária mantém nossos servidores ativos, as 100 histórias infantis e o jogo gratuito para o Reino de Deus!
          </p>
        </div>

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Seletor de Valores Sugeridos */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-yellow-400 mb-2 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-emerald-400" /> Escolha o Valor da Contribuição:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {amountOptions.map((opt) => {
                const isSelected = selectedAmount === opt.value && !customAmount;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSelectedAmount(opt.value);
                      setCustomAmount('');
                    }}
                    className={`py-2 px-1 rounded-xl border-2 transition cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-yellow-400 border-yellow-300 text-zinc-950 font-black shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-102'
                        : 'bg-zinc-900/90 border-zinc-700 text-zinc-200 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-black">{opt.label}</span>
                    <span
                      className={`text-[9px] uppercase tracking-wider ${
                        isSelected ? 'text-zinc-900 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo de Outro Valor */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700 rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-zinc-400 whitespace-nowrap">
              Outro valor (R$):
            </span>
            <input
              type="number"
              placeholder="Ex: 15,00"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(0);
              }}
              className="w-full bg-transparent text-sm font-bold text-yellow-300 focus:outline-hidden"
              min="1"
            />
          </div>

          {/* Caixa do PIX com Cores do Brasil */}
          <div className="bg-gradient-to-b from-blue-950/80 to-zinc-950 border-2 border-yellow-400/80 rounded-2xl p-4 text-center space-y-3 shadow-lg">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600 border border-yellow-300 flex items-center justify-center text-white">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-yellow-400 tracking-wider block">
                  Doação Rápida via PIX
                </span>
                <span className="text-xs font-black text-white">
                  Qualquer Banco do Brasil
                </span>
              </div>
            </div>

            {/* Chave PIX com Destaque */}
            <div className="bg-black/80 border border-yellow-400/60 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-left w-full sm:w-auto truncate">
                <span className="text-[10px] font-bold text-zinc-400 block uppercase">
                  Chave PIX (E-mail):
                </span>
                <span className="text-xs sm:text-sm font-mono font-black text-yellow-300 select-all truncate block">
                  {pixKey}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyPix}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shrink-0 ${
                  pixCopied
                    ? 'bg-emerald-500 text-zinc-950 font-black border border-emerald-300'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black border border-yellow-200'
                }`}
              >
                {pixCopied ? (
                  <>
                    <Check className="w-4 h-4 text-zinc-950" />
                    <span>Chave Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-950" />
                    <span>Copiar PIX</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed italic max-w-sm mx-auto">
              Abra o aplicativo do seu banco, escolha <strong>PIX</strong> e cole a chave acima para abençoar nosso ministério.
            </p>
          </div>

          {/* Versículo Bíblico Inspirador */}
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 text-center text-xs text-emerald-200">
            <p className="italic font-serif">
              "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria."
            </p>
            <span className="text-[10px] font-bold text-yellow-400 block mt-1">
              — 2 Coríntios 9:7
            </span>
          </div>

          {/* Botão de Fechar / Concluir */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <ThumbsUp className="w-4 h-4 text-yellow-300" />
            <span>Que Deus Abençoe Sua Generosidade!</span>
          </button>
        </div>
      </div>
    </div>
  );
}
