'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HARPA_TRACKS, HarpaTrack } from '@/data/harpaMusic';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Music,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Repeat
} from 'lucide-react';

export default function BackgroundMusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.35); // Volume ambiente suave padrão (35%)
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack: HarpaTrack = HARPA_TRACKS[currentTrackIndex] || HARPA_TRACKS[0];

  // Carrega preferências salvas no navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedMuted = localStorage.getItem('apostolos_harpa_muted');
        const savedVolume = localStorage.getItem('apostolos_harpa_volume');
        const savedIndex = localStorage.getItem('apostolos_harpa_index');

        if (savedMuted === 'true') setIsMuted(true);
        if (savedVolume) setVolume(Math.max(0.05, Math.min(1, parseFloat(savedVolume))));
        if (savedIndex) {
          const idx = parseInt(savedIndex, 10);
          if (idx >= 0 && idx < HARPA_TRACKS.length) {
            setCurrentTrackIndex(idx);
          }
        }
      } catch (e) {}
    }
  }, []);

  // Inicia o áudio no primeiro clique do usuário no app (obrigatório pela política de autoplay dos navegadores)
  useEffect(() => {
    const handleFirstInteraction = () => {
      setHasUserInteracted(true);
      if (audioRef.current && !isPlaying) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Se o navegador ainda bloquear, aguarda ação direta no botão
          });
      }
      // Remove os ouvintes após a primeira interação
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isPlaying]);

  // Atualiza o volume e mudo na tag de áudio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Altera a faixa e toca se estiver em reprodução
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.src;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('apostolos_harpa_index', currentTrackIndex.toString());
        } catch (e) {}
      }
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentTrackIndex]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apostolos_harpa_muted', nextMuted ? 'true' : 'false');
      } catch (e) {}
    }
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % HARPA_TRACKS.length);
  };

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + HARPA_TRACKS.length) % HARPA_TRACKS.length);
  };

  // Quando a música atual terminar, vai automaticamente para a próxima em looping contínuo infinito
  const handleTrackEnded = () => {
    handleNext();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (isMuted) setIsMuted(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apostolos_harpa_volume', val.toString());
      } catch (e) {}
    }
  };

  return (
    <>
      {/* Elemento de Áudio HTML5 Oficial */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onEnded={handleTrackEnded}
        preload="auto"
      />

      {/* Mini Player Flutuante da Harpa Cristã Instrumental */}
      <div className="fixed bottom-16 right-3 sm:bottom-18 sm:right-5 z-30 select-none font-sans">
        {/* Painel Expandido com Lista e Volume */}
        {isExpanded && (
          <div className="mb-2 w-72 sm:w-80 rounded-2xl bg-zinc-950/95 border-2 border-amber-500/50 p-4 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-zinc-100">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs uppercase tracking-wider">
                <Music className="w-4 h-4 text-amber-400" />
                <span>Harpa Cristã Instrumental</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md transition"
                title="Minimizar"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Faixa Atual */}
            <div className="bg-zinc-900/90 border border-amber-500/30 rounded-xl p-3 mb-3 text-center">
              <div className="text-[10px] uppercase font-bold text-amber-400/80 mb-0.5 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Em Reprodução (Looping)
              </div>
              <div className="text-sm font-black text-amber-100 truncate">
                {currentTrack.title}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Música {currentTrackIndex + 1} de {HARPA_TRACKS.length}
              </div>
            </div>

            {/* Controles de Reprodução */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 transition cursor-pointer"
                title="Música Anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={togglePlay}
                className="p-3 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-zinc-950 font-black shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={handleNext}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 transition cursor-pointer"
                title="Próxima Música"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Controle de Volume */}
            <div className="flex items-center gap-2 px-1">
              <button
                onClick={toggleMute}
                className="text-zinc-400 hover:text-amber-300 transition cursor-pointer"
                title={isMuted ? 'Desmutar' : 'Mutar'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-full accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-mono text-zinc-400 w-8 text-right">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>

            {/* Lista Rápida das 10 Faixas */}
            <div className="mt-3 pt-2 border-t border-zinc-800 max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
              {HARPA_TRACKS.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-between transition cursor-pointer ${
                    currentTrackIndex === idx
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 font-bold'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <span className="truncate">
                    {idx + 1}. {track.title}
                  </span>
                  {currentTrackIndex === idx && isPlaying && (
                    <span className="flex gap-0.5 items-end h-3 ml-1 shrink-0">
                      <span className="w-0.5 bg-amber-400 h-2 animate-pulse" />
                      <span className="w-0.5 bg-amber-400 h-3 animate-pulse delay-75" />
                      <span className="w-0.5 bg-amber-400 h-1.5 animate-pulse delay-150" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botão/Pílula Flutuante Principal */}
        <div className="flex items-center gap-1.5 bg-zinc-950/90 border-2 border-amber-500/60 rounded-full py-1.5 px-3 shadow-[0_4px_25px_rgba(0,0,0,0.6)] backdrop-blur-md hover:border-amber-400 transition-all">
          {/* Botão Tocar / Pausar */}
          <button
            onClick={togglePlay}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
              isPlaying
                ? 'bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(234,179,8,0.5)]'
                : 'bg-zinc-900 text-zinc-400 hover:text-amber-300'
            }`}
            title={isPlaying ? 'Pausar Harpa' : 'Tocar Harpa Instrumental'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            )}
          </button>

          {/* Título da Música com Botão de Expandir */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-left cursor-pointer group py-0.5 max-w-[140px] sm:max-w-[200px]"
            title="Abrir reprodutor da Harpa"
          >
            <div className="flex flex-col truncate">
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Music className="w-2.5 h-2.5" />
                Harpa Cristã
                {isPlaying && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping ml-0.5" />
                )}
              </span>
              <span className="text-[11px] font-semibold text-zinc-200 group-hover:text-amber-200 truncate">
                {currentTrack.title}
              </span>
            </div>

            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 shrink-0" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 shrink-0" />
            )}
          </button>

          {/* Botão Mutar Rápido */}
          <button
            onClick={toggleMute}
            className="p-1 text-zinc-400 hover:text-amber-300 transition cursor-pointer shrink-0"
            title={isMuted ? 'Desmutar' : 'Mutar'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400/90" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
