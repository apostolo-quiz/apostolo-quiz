'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Award, Printer, Share2, CheckCircle2, ShieldCheck, Download, Sparkles, BookOpen } from 'lucide-react';
import { ALL_27_MODULES } from '@/data/modulesQuizData';

interface Props {
  studentName: string;
  setStudentName: (name: string) => void;
  completedModules: number[];
  score: number;
  userTitle?: 'Irmão' | 'Irmã';
  churchName?: string;
  ministry?: string;
}

export default function CertificateView({
  studentName,
  setStudentName,
  completedModules,
  score,
  userTitle = 'Irmão',
  churchName,
  ministry,
}: Props) {
  const [certCode, setCertCode] = useState('CERT-APOSTOLOS-7782');
  const [issueDate, setIssueDate] = useState('02/11/2026');
  const [isEditingName, setIsEditingName] = useState(!studentName);
  const [tempName, setTempName] = useState(studentName || 'Discípulo de Cristo');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCode = localStorage.getItem('apostolos_cert_code');
      if (savedCode) {
        setCertCode(savedCode);
      } else {
        const generated = `CERT-FATESA-${Math.floor(100000 + Math.random() * 900000)}`;
        setCertCode(generated);
        localStorage.setItem('apostolos_cert_code', generated);
      }
      const today = new Date().toLocaleDateString('pt-BR');
      setIssueDate(today);
    }
  }, []);

  const handleSaveName = () => {
    if (!tempName.trim()) return;
    setStudentName(tempName.trim());
    if (typeof window !== 'undefined') {
      localStorage.setItem('apostolos_student_name', tempName.trim());
    }
    setIsEditingName(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const progressPercent = Math.min(100, Math.round((completedModules.length / 27) * 100));
  const isEligible = completedModules.length >= 27 || progressPercent >= 100 || completedModules.length >= 1;

  return (
    <div className="space-y-6 pb-20">
      {/* Barra de Progresso Curricular */}
      <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-xl print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                <Award className="w-5 h-5 text-amber-400" />
              </span>
              <h2 className="text-base font-bold text-amber-200 uppercase tracking-wide">
                Progresso para o Certificado em Teologia Básica
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Conclua os 27 módulos da grade curricular teológica para emissão do diploma oficial.
            </p>
          </div>

          <div className="text-right sm:text-right">
            <span className="text-2xl font-black text-amber-400">{completedModules.length}</span>
            <span className="text-xs text-zinc-400"> / 27 Módulos</span>
            <div className="text-[11px] text-emerald-400 font-bold">{progressPercent}% Concluído</div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-zinc-950 rounded-full h-2.5 border border-zinc-800 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>

        {/* Campo para editar/confirmar nome no certificado */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-zinc-300 w-full sm:w-auto">
            Nome do {userTitle} no Certificado:{' '}
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder={`Nome do ${userTitle} para o diploma`}
                  className="bg-zinc-950 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-amber-200 focus:outline-hidden"
                />
                <button
                  onClick={handleSaveName}
                  className="bg-amber-500 text-zinc-950 font-bold text-xs px-3 py-1.5 rounded-lg hover:brightness-110 cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <span className="font-bold text-amber-300 ml-1">
                {userTitle} {studentName || 'Clique para definir'}
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-[10px] text-zinc-400 underline ml-2 cursor-pointer"
                >
                  (Alterar)
                </button>
              </span>
            )}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 hover:brightness-110 shadow-lg shadow-amber-500/20 cursor-pointer transition"
            >
              <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
            </button>
          </div>
        </div>
      </div>

      {/* DOCUMENTO DO CERTIFICADO OFICIAL */}
      <div
        id="official-certificate"
        className="relative bg-gradient-to-b from-[#fffbf0] via-[#fef7e2] to-[#fbf0d0] text-zinc-900 rounded-3xl p-6 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.8)] border-[10px] border-double border-[#85581A] max-w-4xl mx-auto overflow-hidden select-text"
      >
        {/* Marca d'água ornamental de fundo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <img src="/logo.jpg" alt="Watermark" className="w-96 h-96 object-cover rounded-full" />
        </div>

        {/* Bordas decorativas clássicas dos cantos */}
        <div className="absolute top-2 left-2 text-[#85581A] text-2xl font-serif">❖</div>
        <div className="absolute top-2 right-2 text-[#85581A] text-2xl font-serif">❖</div>
        <div className="absolute bottom-2 left-2 text-[#85581A] text-2xl font-serif">❖</div>
        <div className="absolute bottom-2 right-2 text-[#85581A] text-2xl font-serif">❖</div>

        {/* Cabeçalho Institucional do Certificado */}
        <div className="text-center space-y-2 relative z-10">
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-[#85581A] shadow-md bg-black/90 p-0.5">
            <img src="/logo.jpg" alt="Logo Oficial" className="w-full h-full object-cover rounded-full" />
          </div>

          <div className="text-[11px] font-serif uppercase tracking-[0.3em] font-bold text-[#85581A]">
            Faculdade de Teologia Santo André • FATESA
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-wider text-[#4a2e0a] uppercase py-1 border-b-2 border-[#85581A]/40 inline-block px-8">
            CERTIFICADO DE CONCLUSÃO
          </h1>

          <div className="text-xs sm:text-sm font-serif font-bold text-[#6b4716] tracking-[0.2em] uppercase">
            Curso Básico de Teologia Bíblica e Ministerial
          </div>
        </div>

        {/* Corpo do Texto Solene */}
        <div className="my-8 text-center space-y-4 relative z-10 max-w-2xl mx-auto font-serif">
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed italic">
            Certificamos, para os devidos fins de fé, ministério e edificação espiritual, que o(a):
          </p>

          {/* Nome do Irmão / Irmã em Destaque Gótico / Caligráfico */}
          <div className="py-2 border-b-2 border-[#85581A] text-2xl sm:text-4xl font-serif font-black text-[#85581A] tracking-wide">
            {userTitle} {studentName || 'Registrado(a)'}
          </div>

          {churchName && (
            <div className="text-xs font-serif text-[#6b4716] italic">
              Membro da <strong>{churchName}</strong> {ministry ? `• Ministério: ${ministry}` : ''}
            </div>
          )}

          <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed text-justify sm:text-center pt-2">
            concluiu com êxito e louvável aproveitamento todos os <strong>27 Módulos Teológicos</strong> do{' '}
            <strong>Curso Básico de Teologia</strong>, demonstrando fidelidade doutrinária nas Sagradas Escrituras,
            apologética cristã, teologia prática e conhecimento das cartas e profecias apostólicas, totalizando a carga
            horária de <strong>120 horas-aula</strong>.
          </p>

          <div className="bg-[#85581A]/10 border border-[#85581A]/30 rounded-xl p-3 text-xs text-[#52330a] italic font-serif">
            &ldquo;Procura apresentar-te a Deus aprovado, como obreiro que não tem de que se envergonhar, que maneja bem a
            palavra da verdade.&rdquo; — <strong>2 Timóteo 2:15</strong>
          </div>
        </div>

        {/* Rodapé: Selo Dourado e Assinaturas */}
        <div className="mt-8 pt-6 border-t border-[#85581A]/30 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center relative z-10">
          {/* Assinatura Pedagógica */}
          <div className="space-y-1">
            <div className="w-36 h-0.5 bg-[#85581A] mx-auto"></div>
            <div className="text-[11px] font-bold font-serif text-zinc-800">Coordenação Pedagógica</div>
            <div className="text-[10px] text-zinc-600 font-serif">Conselho de Doutrina e Ensino</div>
          </div>

          {/* Selo Dourado Central */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 border-2 border-[#85581A] shadow-lg flex items-center justify-center text-zinc-950 font-black text-xs text-center p-1 uppercase leading-tight font-serif">
              SELO OFICIAL DE TEOLOGIA
            </div>
            <span className="text-[9px] font-mono text-[#85581A] mt-1 font-bold">{certCode}</span>
          </div>

          {/* Assinatura Reitoria / Direção */}
          <div className="space-y-1">
            <div className="w-36 h-0.5 bg-[#85581A] mx-auto"></div>
            <div className="text-[11px] font-bold font-serif text-zinc-800">Reitoria Teológica</div>
            <div className="text-[10px] text-zinc-600 font-serif">FATESA • Apóstolos Quiz</div>
          </div>
        </div>

        {/* Registro e Data */}
        <div className="mt-6 text-center text-[10px] font-mono text-zinc-600 border-t border-[#85581A]/20 pt-2">
          Emitido em {issueDate} • Registro Acadêmico: {certCode} • Chave de Autenticidade Digital Válida
        </div>
      </div>
    </div>
  );
}
