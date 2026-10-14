import React, { useState } from 'react';
import {
  Play,
  Maximize2,
  Tv,
  Sparkles,
  Link2,
  Check,
  Film,
  Volume2,
  HelpCircle,
} from 'lucide-react';
import { CrtConfig } from '../types/crt';
import { CrtOverlayLayer } from './CrtOverlayLayer';

interface YouTubePlayerWithCrtProps {
  config: CrtConfig;
  onToggleOverlay: () => void;
  onSelectPreset: (presetId: string) => void;
  onOpenApkModal: () => void;
}

const SAMPLE_YOUTUBE_VIDEOS = [
  {
    id: 'dQw4w9WgXcQ', // Classic 80s Rick Astley
    title: 'Anos 80 Clássico (1987)',
    category: 'Música 80s',
  },
  {
    id: 'fJ9rUzIMcZQ', // Queen Bohemian Rhapsody
    title: 'Bohemian Rhapsody (Live TV)',
    category: 'Show TV',
  },
  {
    id: 'jfKfPfyJRdk', // Lofi Girl / ChilledCow
    title: 'Lofi Hip Hop Radio',
    category: 'Lo-Fi Retrô',
  },
  {
    id: '5yx6BWlEVcY', // Chillwave / Synthwave
    title: 'Synthwave 80s Sunset Drive',
    category: 'Synthwave',
  },
];

export const YouTubePlayerWithCrt: React.FC<YouTubePlayerWithCrtProps> = ({
  config,
  onToggleOverlay,
  onSelectPreset,
  onOpenApkModal,
}) => {
  const [videoInput, setVideoInput] = useState('');
  const [currentVideoId, setCurrentVideoId] = useState('5yx6BWlEVcY');
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Extract YouTube ID from full URL or short URL or raw ID
  const extractVideoId = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return currentVideoId;

    // Pattern for youtube.com/watch?v=ID or youtu.be/ID
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = trimmed.match(regExp);
    if (match && match[1]) {
      return match[1];
    }
    // If user just typed an 11-char ID
    if (trimmed.length === 11 && !trimmed.includes('/')) {
      return trimmed;
    }
    return trimmed;
  };

  const handleLoadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(videoInput);
    if (id) {
      setCurrentVideoId(id);
      setVideoInput('');
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
      setIsPlayerFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsPlayerFullscreen(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* URL Input Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 shadow-lg backdrop-blur">
        <form onSubmit={handleLoadVideo} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Link2 className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Cole qualquer link do YouTube aqui (ex: https://www.youtube.com/watch?v=...)"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:bg-emerald-400 active:scale-95 transition"
          >
            <Play className="h-4 w-4" />
            Assistir no CRT
          </button>
        </form>

        {/* Quick sample videos */}
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] mr-1">Sugestões de Vídeo:</span>
          {SAMPLE_YOUTUBE_VIDEOS.map((vid) => (
            <button
              key={vid.id}
              onClick={() => setCurrentVideoId(vid.id)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition ${
                currentVideoId === vid.id
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              📺 {vid.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main YouTube CRT Player Container */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-3xl overflow-hidden bg-black border-4 border-slate-850 shadow-2xl transition-all ${
          isPlayerFullscreen ? 'h-screen flex items-center justify-center' : 'aspect-video max-h-[75vh]'
        }`}
        style={{
          boxShadow: isPlayerFullscreen
            ? 'none'
            : '0 25px 60px -15px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.95)',
        }}
      >
        {/* Real YouTube Video Embed */}
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${currentVideoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
            typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
          )}&rel=0&modestbranding=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 block"
        />

        {/* The Transparent CRT Overlay Layer (Passes touches/clicks to YouTube!) */}
        <CrtOverlayLayer config={config} isFullScreenMode={false} />

        {/* Floating Quick Action Overlay inside Player */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleOverlay}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur transition ${
              config.overlayEnabled
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                : 'bg-slate-900/90 text-slate-400 border border-slate-700'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            {config.overlayEnabled ? 'CRT Overlay: LIGADO' : 'CRT Overlay: DESLIGADO'}
          </button>
        </div>

        <div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            title={isPlayerFullscreen ? 'Sair da tela cheia' : 'Assistir em Tela Cheia'}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900/80 text-white border border-slate-700/80 backdrop-blur hover:bg-emerald-500 hover:text-black transition shadow-lg"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
