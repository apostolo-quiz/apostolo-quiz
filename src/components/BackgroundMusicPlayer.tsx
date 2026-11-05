'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AUDIO_TRACKS, AudioTrack } from '@/data/harpaMusic';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Music,
  SkipForward
} from 'lucide-react';

export default function BackgroundMusicPlayer() {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [status, setStatus] = useState<'playing' | 'paused' | 'stopped'>('paused');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.20); // Volume padrão suave (20%)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isExplicitStoppedRef = useRef(false);

  const currentTrack: AudioTrack = AUDIO_TRACKS[currentTrackIndex] || AUDIO_TRACKS[0];

  // Carrega preferências salvas no navegador e tenta tocar suavemente se o usuário não tiver parado antes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialStopped = false;
    let initialMuted = false;
    let initialVolume = 0.20;
    let initialIndex = 0;

    try {
      const savedStopped = localStorage.getItem('apostolos_audio_user_stopped');
      const savedMuted = localStorage.getItem('apostolos_audio_muted');
      const savedVolume = localStorage.getItem('apostolos_audio_volume');
      const savedIndex = localStorage.getItem('apostolos_audio_index');

      if (savedStopped === 'true') {
        initialStopped = true;
        setStatus('stopped');
      }

      if (savedMuted === 'true') {
        initialMuted = true;
        setIsMuted(true);
      }

      if (savedVolume) {
        const parsed = parseFloat(savedVolume);
        initialVolume = Math.max(0.05, Math.min(0.30, parsed));
        setVolume(initialVolume);
      }

      if (savedIndex) {
        const idx = parseInt(savedIndex, 10);
        if (idx >= 0 && idx < AUDIO_TRACKS.length) {
          initialIndex = idx;
          setCurrentTrackIndex(idx);
        }
      }
    } catch (e) {}

    // Se o usuário não tiver explicitamente parado em sessão anterior, tenta autoplay na inicialização
    if (!initialStopped && audioRef.current) {
      audioRef.current.volume = initialMuted ? 0 : initialVolume;
      audioRef.current.play()
        .then(() => setStatus('playing'))
        .catch(() => {
          // Bloqueio normal de autoplay pelo navegador/webview - aguarda interação direta no player
          setStatus('paused');
        });
    }
  }, []);

  // Sincroniza volume e mudo na tag de áudio
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Altera a faixa quando o índice é atualizado
  useEffect(() => {
    if (audioRef.current) {
      const wasPlaying = status === 'playing';
      audioRef.current.src = currentTrack.src;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('apostolos_audio_index', currentTrackIndex.toString());
        } catch (e) {}
      }
      if (wasPlaying) {
        audioRef.current.play().then(() => setStatus('playing')).catch(() => setStatus('paused'));
      }
    }
  }, [currentTrackIndex]);

  // Ação: Play (Tocar)
  const handlePlay = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!audioRef.current) return;

    isExplicitStoppedRef.current = false;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apostolos_audio_user_stopped', 'false');
      } catch (e) {}
    }

    if (!audioRef.current.src || !audioRef.current.src.includes('.mp3')) {
      audioRef.current.src = currentTrack.src;
    }

    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current
      .play()
      .then(() => setStatus('playing'))
      .catch((err) => {
        console.warn('Erro ao reproduzir áudio:', err);
      });
  };

  // Ação: Pause (Pausar reprodução de forma imediata e garantida)
  const handlePause = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!audioRef.current) return;

    isExplicitStoppedRef.current = false;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apostolos_audio_user_stopped', 'true');
      } catch (e) {}
    }

    audioRef.current.pause();
    setStatus('paused');
  };

  // Ação: Parar Áudio (Stop) - pausa e rebobina para o início (0s)
  const handleStop = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!audioRef.current) return;

    isExplicitStoppedRef.current = true;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apostolos_audio_user_stopped', 'true');
      } catch (e) {}
    }

    audioRef.current.pause();
    try {
      audioRef.current.currentTime = 0;
    } catch (e) {}
    setStatus('stopped');
  };

  // Ação: Pular para próxima faixa da harpa
  const handleNextTrack = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const nextIndex = (currentTrackIndex + 1) % AUDIO_TRACKS.length;
    setCurrentTrackIndex(nextIndex);
  };

  // Alterna som / mudo
  const toggleMute = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apostolos_audio_muted', nextMuted ? 'true' : 'false');
      } catch (e) {}
    }
  };

  // Próxima faixa automática ao terminar a música atual
  const handleTrackEnded = () => {
    if (status === 'playing') {
      setCurrentTrackIndex((prev) => (prev + 1) % AUDIO_TRACKS.length);
    }
  };

  const isPlaying = status === 'playing';

  return (
    <>
      {/* Elemento de Áudio HTML5 com eventos sincronizados */}
      <audio
        ref={audioRef}
        src={currentTrack.src}
        onEnded={handleTrackEnded}
        onPlay={() => {
          isExplicitStoppedRef.current = false;
          setStatus('playing');
        }}
        onPause={() => {
          if (isExplicitStoppedRef.current) {
            setStatus('stopped');
          } else {
            setStatus('paused');
          }
        }}
        preload="auto"
      />

      {/* Reprodutor Compacto com Botões Play, Pause, Parar e Avançar Faixa */}
      <aside
        aria-label="Controle de Áudio Bíblico"
        className="fixed bottom-16 right-3 sm:bottom-18 sm:right-5 z-30 select-none font-sans"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 bg-zinc-950/95 border border-amber-500/40 rounded-full py-1.5 px-3 shadow-[0_4px_25px_rgba(0,0,0,0.7)] backdrop-blur-md">
          {/* Indicador de Áudio e Nome da Faixa */}
          <div className="flex items-center gap-1.5 text-amber-400 pl-0.5 pr-1 max-w-[110px] sm:max-w-[150px]">
            <Music className={`w-3.5 h-3.5 shrink-0 ${isPlaying ? 'animate-bounce text-amber-300' : 'text-zinc-500'}`} />
            <span className="text-[10px] font-bold text-zinc-300 truncate" title={currentTrack.title}>
              {currentTrack.title}
            </span>
          </div>

          <span className="w-px h-3.5 bg-zinc-800" />

          {/* Botão Play (Tocar) */}
          <button
            type="button"
            onClick={handlePlay}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
              status === 'playing'
                ? 'bg-amber-500 text-zinc-950 shadow-[0_0_12px_rgba(234,179,8,0.6)] font-bold scale-105'
                : 'bg-zinc-900 text-zinc-300 hover:text-amber-300 hover:bg-zinc-800'
            }`}
            title="Tocar (Play)"
            aria-label="Tocar música de fundo"
          >
            <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
          </button>

          {/* Botão Pause (Pausar / Retomar) */}
          <button
            type="button"
            onClick={handlePause}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
              status === 'paused'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/80 shadow-[0_0_10px_rgba(234,179,8,0.3)] font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800'
            }`}
            title={status === 'paused' ? 'Pausado (clique para retomar)' : 'Pausar música'}
            aria-label="Pausar música de fundo"
          >
            <Pause className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Botão Parar Áudio (Stop) */}
          <button
            type="button"
            onClick={handleStop}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
              status === 'stopped'
                ? 'bg-red-500/25 text-red-400 border border-red-500/70 shadow-[0_0_10px_rgba(239,68,68,0.3)] font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
            }`}
            title={status === 'stopped' ? 'Música Parada no Início' : 'Parar e reiniciar música no início'}
            aria-label="Parar música de fundo"
          >
            <Square className="w-3 h-3 fill-current" />
          </button>

          {/* Botão Próxima Faixa */}
          <button
            type="button"
            onClick={handleNextTrack}
            className="w-6 h-6 rounded-full bg-zinc-900 text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center"
            title="Próxima melodia da Harpa"
            aria-label="Próxima música"
          >
            <SkipForward className="w-3 h-3 fill-current" />
          </button>

          <span className="w-px h-3.5 bg-zinc-800" />

          {/* Botão Mutar/Desmutar */}
          <button
            type="button"
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
