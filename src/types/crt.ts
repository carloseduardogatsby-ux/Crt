export interface CrtConfig {
  // Overlay Mode Settings
  overlayEnabled: boolean;
  overlayOpacity: number; // 0.2 to 1.0 (transparency over apps/video)
  blendMode: 'multiply' | 'screen' | 'overlay' | 'normal';

  // Distortion & Geometry
  curvature: number; // 0.0 to 0.6 (barrel distortion)
  cornerRounding: number; // 0.0 to 0.15
  vignette: number; // 0.0 to 0.8

  // Scanlines & Raster
  scanlineIntensity: number; // 0.1 to 0.9
  scanlineCount: number; // 180 to 600
  scanlineBeam: number; // 0.8 to 2.5 (beam sharpness)
  scanlineJitter: number; // 0.0 to 0.08 (drift/jitter)

  // Color & Phosphors
  rgbMaskIntensity: number; // 0.0 to 0.7 (aperture grille/triad)
  rgbMaskType: 'aperture' | 'triad' | 'subtle';
  chromaticAberration: number; // 0.0 to 0.01
  bloom: number; // 0.0 to 0.6

  // Video Enhancements (keeps YouTube bright & crisp)
  brightness: number; // 0.8 to 1.5
  contrast: number; // 0.8 to 1.6
  saturation: number; // 0.8 to 1.5
  colorWarmth: 'neutral' | 'warm80s' | 'trinitron' | 'green' | 'amber';
  colorTint?: string;
  flicker: number; // 0.0 to 0.04
  noise?: number; // 0.0 to 0.1
}

export interface CrtPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  config: Partial<CrtConfig>;
}

export const YOUTUBE_CRT_PRESETS: CrtPreset[] = [
  {
    id: 'youtube_ideal',
    name: 'YouTube Retrô Ideal',
    description: 'Calibrado especialmente para assistir vídeos no YouTube: scanlines nítidas sem escurecer a imagem.',
    badge: 'Recomendado',
    config: {
      overlayOpacity: 0.85,
      blendMode: 'multiply',
      curvature: 0.2,
      cornerRounding: 0.03,
      vignette: 0.35,
      scanlineIntensity: 0.45,
      scanlineCount: 360,
      scanlineBeam: 1.5,
      scanlineJitter: 0.01,
      rgbMaskIntensity: 0.25,
      rgbMaskType: 'aperture',
      chromaticAberration: 0.002,
      bloom: 0.25,
      brightness: 1.15,
      contrast: 1.1,
      saturation: 1.15,
      colorWarmth: 'warm80s',
      flicker: 0.005,
    },
  },
  {
    id: 'trinitron_pvm',
    name: 'Sony Trinitron PVM',
    description: 'Monitor profissional de transmissão com máscara Aperture Grille fina e máxima fidelidade de cores.',
    badge: 'Pro Grade',
    config: {
      overlayOpacity: 0.8,
      blendMode: 'multiply',
      curvature: 0.08,
      cornerRounding: 0.01,
      vignette: 0.2,
      scanlineIntensity: 0.35,
      scanlineCount: 480,
      scanlineBeam: 1.8,
      scanlineJitter: 0.0,
      rgbMaskIntensity: 0.3,
      rgbMaskType: 'aperture',
      chromaticAberration: 0.001,
      bloom: 0.15,
      brightness: 1.08,
      contrast: 1.12,
      saturation: 1.1,
      colorWarmth: 'trinitron',
      flicker: 0.0,
    },
  },
  {
    id: 'tv_tubo_80s',
    name: 'TV de Tubo 80s / 90s',
    description: 'Efeito nostálgico de TV antiga de sala com vidro curvo, leve estática e cores aquecidas.',
    badge: 'Nostalgia',
    config: {
      overlayOpacity: 0.9,
      blendMode: 'multiply',
      curvature: 0.42,
      cornerRounding: 0.06,
      vignette: 0.55,
      scanlineIntensity: 0.55,
      scanlineCount: 260,
      scanlineBeam: 1.3,
      scanlineJitter: 0.03,
      rgbMaskIntensity: 0.4,
      rgbMaskType: 'triad',
      chromaticAberration: 0.005,
      bloom: 0.4,
      brightness: 1.2,
      contrast: 1.2,
      saturation: 1.25,
      colorWarmth: 'warm80s',
      flicker: 0.015,
    },
  },
  {
    id: 'anime_vhs',
    name: 'Anime VHS Tape',
    description: 'Estilo fita cassete VHS dos anos 90, perfeito para animes e clipes de synthwave/lo-fi.',
    badge: 'Anime & VHS',
    config: {
      overlayOpacity: 0.85,
      blendMode: 'multiply',
      curvature: 0.18,
      cornerRounding: 0.02,
      vignette: 0.4,
      scanlineIntensity: 0.4,
      scanlineCount: 320,
      scanlineBeam: 1.4,
      scanlineJitter: 0.04,
      rgbMaskIntensity: 0.2,
      rgbMaskType: 'subtle',
      chromaticAberration: 0.006,
      bloom: 0.35,
      brightness: 1.12,
      contrast: 1.18,
      saturation: 1.3,
      colorWarmth: 'warm80s',
      flicker: 0.01,
    },
  },
  {
    id: 'subtle_clean',
    name: 'Scanlines Suaves (Clean)',
    description: 'Filtro ultraleve e discreto para assistir vídeos longos sem cansar a visão.',
    badge: 'Confortável',
    config: {
      overlayOpacity: 0.65,
      blendMode: 'multiply',
      curvature: 0.0,
      cornerRounding: 0.0,
      vignette: 0.15,
      scanlineIntensity: 0.28,
      scanlineCount: 400,
      scanlineBeam: 2.0,
      scanlineJitter: 0.0,
      rgbMaskIntensity: 0.15,
      rgbMaskType: 'subtle',
      chromaticAberration: 0.0,
      bloom: 0.1,
      brightness: 1.05,
      contrast: 1.05,
      saturation: 1.05,
      colorWarmth: 'neutral',
      flicker: 0.0,
    },
  },
];

export const DEFAULT_CRT_CONFIG: CrtConfig = {
  overlayEnabled: true,
  overlayOpacity: 0.85,
  blendMode: 'multiply',
  curvature: 0.22,
  cornerRounding: 0.03,
  vignette: 0.35,
  scanlineIntensity: 0.45,
  scanlineCount: 360,
  scanlineBeam: 1.5,
  scanlineJitter: 0.01,
  rgbMaskIntensity: 0.25,
  rgbMaskType: 'aperture',
  chromaticAberration: 0.0025,
  bloom: 0.25,
  brightness: 1.15,
  contrast: 1.1,
  saturation: 1.15,
  colorWarmth: 'warm80s',
  flicker: 0.005,
};
