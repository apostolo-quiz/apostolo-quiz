export interface AudioTrack {
  id: string;
  title: string;
  src: string;
}

export type HarpaTrack = AudioTrack;

export const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'caminhar-em-luz',
    title: 'Caminhar em Luz',
    src: '/harpa/caminhar-em-luz.mp3'
  },
  {
    id: 'caminho-de-paz',
    title: 'Caminho de Paz',
    src: '/harpa/caminho-de-paz.mp3'
  },
  {
    id: 'fonte-de-vida',
    title: 'Fonte de Vida',
    src: '/harpa/fonte-de-vida.mp3'
  },
  {
    id: 'graca-abundante',
    title: 'Graça Abundante',
    src: '/harpa/graca-abundante.mp3'
  },
  {
    id: 'melodia-da-graca',
    title: 'Melodia da Graça',
    src: '/harpa/harpa-da-graca.mp3'
  },
  {
    id: 'luz-do-santuario',
    title: 'Luz do Santuário',
    src: '/harpa/luz-do-santuario.mp3'
  },
  {
    id: 'oracao-da-manha',
    title: 'Oração da Manhã',
    src: '/harpa/oracao-da-manha.mp3'
  },
  {
    id: 'orvalho-divino',
    title: 'Orvalho Divino',
    src: '/harpa/orvalho-divino.mp3'
  },
  {
    id: 'promessa-eterna',
    title: 'Promessa Eterna',
    src: '/harpa/promessa-eterna.mp3'
  },
  {
    id: 'refugio-celestial',
    title: 'Refúgio Celestial',
    src: '/harpa/refugio-celestial.mp3'
  }
];

export const HARPA_TRACKS = AUDIO_TRACKS;
