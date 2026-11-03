'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AUDIO_TRACKS, AudioTrack } from '@/data/harpaMusic';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Music
} from 'lucide-react';

export default function BackgroundMusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.20); // Volume padrão suave abaixo de 30% (20%)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack: AudioTrack = AUDIO_TRACKS[currentTrackIndex] || AUDIO_TRACKS[0];

  // Carrega preferências salvas no navegador (garantindo teto abaixo de 30%)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedMuted = localStorage.getItem('apostolos_audio_muted') || localStorage.getItem('apostolos_harpa_muted');
        const savedVolume = localStorage.getItem('apostolos_audio_volume') || localStorage.getItem('apostolos_harpa_volume');
        const savedIndex = localStorage.getItem('apostolos_audio_index') || localStorage.getItem('apostolos_harpa_index');

        if (savedMuted === 'true') setIsMuted(true);
        if (savedVolume) {
          const parsed = parseFloat(savedVolume);
          // Garante que o volume inicial respeite o teto abaixo de 30%
          setVolume(Math.max(0.05, Math.min(0.25, parsed)));
        } else {
          setVolume(0.20);
        }
        if (savedIndex) {
          const idx = parseInt(savedIndex, 10);
          if (idx >= 0 && idx < AUDIO_TRACKS.length) {
            setCurrentTrackIndex(idx);
          }
        }
      } catch (e) {}
    }
  }, []);

  // Inicia o áudio na primeira interação do usuário respeitando as políticas dos navegadores
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.volume = isMuted ? 0 : volume;
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Se o navegador bloquear, aguarda clique direto no botão Play
          });
      }
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
          localStorage.setItem('apostolos_audio_index', currentTrackIndex.toString());
        } catch (e) {}
      }
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentTrackIndex]);

  // Ação: Play
  const handlePlay = () => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {});
  };

  // Ação: Pause
  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  // Ação: Parar Áudio (Stop) - pausa e zera a reprodução
  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  // Alterna som / mudo
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apostolos_audio_muted', nextMuted ? 'true' : 'false');
      } catch (e) {}
    }
  };

  // Próxima faixa em looping contínuo
  const handleTrackEnded = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % AUDIO_TRACKS.length);
  };

  return (
    <>
      {/* Elemento de Áudio HTML5 */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onEnded={handleTrackEnded}
        onPlay={() => {
          if (audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
          }
        }}
        preload="auto"
      />

      {/* Reprodutor Compacto com Botões Play, Pause e Parar Áudio */}
      <aside
        aria-label="Controle de Áudio"
        className="fixed bottom-16 right-3 sm:bottom-18 sm:right-5 z-30 select-none font-sans"
      >
        <div className="flex items-center gap-1.5 bg-zinc-950/95 border border-amber-500/40 rounded-full py-1.5 px-3 shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md">
          {/* Indicador de Áudio */}
          <div className="flex items-center gap-1.5 text-amber-400 pl-0.5 pr-1">
            <Music className={`w-3.5 h-3.5 ${isPlaying ? 'animate-bounce' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 hidden sm:inline">
              Áudio
            </span>
          </div>

          <span className="w-px h-3.5 bg-zinc-800" />

          {/* Botão Play */}
          <button
            onClick={handlePlay}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-zinc-950 shadow-sm font-bold'
                : 'bg-zinc-900 text-zinc-300 hover:text-amber-300 hover:bg-zinc-800'
            }`}
            title="Tocar (Play)"
            aria-label="Tocar áudio"
          >
            <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
          </button>

          {/* Botão Pause */}
          <button
            onClick={handlePause}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
              !isPlaying && audioRef.current && audioRef.current.currentTime > 0
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                : 'bg-zinc-900 text-zinc-300 hover:text-amber-300 hover:bg-zinc-800'
            }`}
            title="Pausar"
            aria-label="Pausar áudio"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Botão Parar Áudio */}
          <button
            onClick={handleStop}
            className="w-7 h-7 rounded-full bg-zinc-900 text-zinc-300 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center"
            title="Parar áudio"
            aria-label="Parar áudio"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>

          <span className="w-px h-3.5 bg-zinc-800" />

          {/* Botão Mutar/Desmutar */}
          <button
            onClick={toggleMute}
            className="p-1 text-zinc-400 hover:text-amber-300 transition cursor-pointer"
            title={isMuted ? 'Ativar som' : 'Silenciar'}
            aria-label="Controle de volume"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
