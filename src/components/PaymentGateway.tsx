'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, CreditCard, ShieldCheck, Check, Copy, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { UserProfile, saveTransaction, saveUserProfile, PaymentTransaction } from '@/data/db';

interface Props {
  profile: UserProfile | null;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PaymentGateway({ profile, onSuccess, onClose }: Props) {
  const [method, setMethod] = useState<'pix' | 'card'>('pix');
  const [pixCopied, setPixCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isLocalHost, setIsLocalHost] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '';
      setIsLocalHost(isLocal);
    }
  }, []);

  // Dados do Cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(profile?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const amount = 10.0;
  const prizeFund = amount * 0.3; // 30% retido para premiações
  const operationalFund = amount * 0.7;

  const pixCode =
    '00020126580014br.gov.bcb.pix0136pix-apostolos-quiz@teologia.com.br520400005303986540510.005802BR5925APOSTOLOS QUIZ BIBLICO6009SAO PAULO62070503***6304ABCD';

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsApproved(true);

      // Salva no banco de dados de transações
      const newTransaction: PaymentTransaction = {
        id: `PAY_${Date.now()}`,
        userId: profile?.id || 'user_guest',
        userName: profile?.name || 'Irmão Registrado',
        userTitle: profile?.title || 'Irmão',
        amount: 10.0,
        prizeFund30: prizeFund,
        operationalFund70: operationalFund,
        paymentMethod: method === 'pix' ? 'pix' : 'credit_card',
        status: 'approved',
        pixCode: method === 'pix' ? pixCode : undefined,
        createdAt: new Date().toISOString()
      };
      saveTransaction(newTransaction);

      // Atualiza o perfil para VIP no banco
      if (profile) {
        const updated = { ...profile, isVip: true };
        saveUserProfile(updated);
      }
    }, 1500);
  };

  const handleFinish = () => {
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
        {/* Cabeçalho do Gateway */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400 mx-auto flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-amber-200 uppercase tracking-wide">
            Gateway de Pagamento Seguro
          </h3>
          <p className="text-xs text-zinc-400">
            Acesso Completo ao Nível Avançado das 300 Questões Bíblicas Oficiais.
          </p>
          <div className="text-2xl font-black text-amber-400 py-1">
            R$ 10,00 <span className="text-xs text-zinc-400 font-normal">/ taxa única</span>
          </div>
        </div>

        {isApproved ? (
          /* Recibo de Confirmação */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-emerald-300">Pagamento Confirmado com Sucesso!</h4>
            <p className="text-xs text-zinc-300 max-w-xs mx-auto">
              {profile?.title || 'Irmão(ã)'} <strong>{profile?.name || ''}</strong>, seu acesso a todas as questões
              avançadas foi liberado permanentemente no seu dispositivo.
            </p>
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 text-left space-y-1">
              <div>Autenticação: AUT-APOSTOLOS-{Date.now().toString().slice(-6)}</div>
              <div>Valor: R$ 10,00</div>
              <div>Método: {method === 'pix' ? 'PIX Instantâneo' : 'Cartão de Crédito'}</div>
              <div>Status: APROVADO / COMPENSADO</div>
            </div>
            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              Começar Desafios Avançados
            </button>
          </div>
        ) : (
          /* Formulário de Seleção do Gateway */
          <div className="space-y-4">
            {/* Escolha do Método */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('pix')}
                className={`py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                  method === 'pix'
                    ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <QrCode className="w-4 h-4" /> PIX Instantâneo
              </button>
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                  method === 'card'
                    ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Cartão de Crédito
              </button>
            </div>

            {/* Conteúdo PIX */}
            {method === 'pix' && (
              <div className="bg-zinc-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 text-center">
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                  {/* QR Code Simulado Visual */}
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=pix-apostolos-quiz-10-reais"
                    alt="QR Code PIX R$ 10,00"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-[11px] text-zinc-400">
                  Chave PIX: <span className="font-mono text-zinc-200">pix-apostolos-quiz@teologia.com.br</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  {pixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {pixCopied ? 'Chave Copiada!' : 'Copiar Código PIX Copia e Cola'}
                </button>
              </div>
            )}

            {/* Conteúdo Cartão de Crédito */}
            {method === 'card' && (
              <div className="space-y-2 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-amber-400 mb-1">
                    Número do Cartão:
                  </label>
                  <input
                    type="text"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-100 font-mono focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-400 mb-1">Validade:</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/AA"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-100 font-mono focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-amber-400 mb-1">CVV:</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-100 font-mono focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Liberação Rápida para Teste em Localhost */}
            {isLocalHost && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition hover:brightness-110 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> ⚡ Aprovar Imediatamente (Modo Localhost)
                  </button>
                </div>
              )}

            {/* Ações */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processando Compensação...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Confirmar Pagamento (R$ 10,00)
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-zinc-400 hover:text-zinc-200 transition font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
