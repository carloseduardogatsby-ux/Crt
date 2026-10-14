import React, { useState } from 'react';
import {
  Tv,
  Power,
  Sliders,
  X,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { CrtConfig, YOUTUBE_CRT_PRESETS } from '../types/crt';

interface FloatingOverlayWidgetProps {
  config: CrtConfig;
  onChange: (config: CrtConfig) => void;
  onExitFullscreenOverlay: () => void;
  onOpenApkModal: () => void;
}

export const FloatingOverlayWidget: React.FC<FloatingOverlayWidgetProps> = ({
  config,
  onChange,
  onExitFullscreenOverlay,
  onOpenApkModal,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const update = <K extends keyof CrtConfig>(key: K, value: CrtConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  return (
    <aside
      aria-label="Controle de Sobreposição CRT"
      className="fixed bottom-4 right-4 z-50 pointer-events-auto flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 duration-300"
    >
      {/* Expanded Quick Settings Panel */}
      {isExpanded && (
        <div className="w-72 sm:w-80 rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-4 shadow-2xl shadow-emerald-950/60 backdrop-blur-md text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Ajuste Rápido de Sobreposição
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-semibold">Preset:</span>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {YOUTUBE_CRT_PRESETS.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChange({ ...config, ...p.config })}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 p-1.5 text-left text-[11px] font-medium text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Opacidade do Filtro</span>
              <span className="font-mono text-emerald-400">{Math.round(config.overlayOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={config.overlayOpacity}
              onChange={(e) => update('overlayOpacity', parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Scanline Darkness */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Intensidade Scanlines</span>
              <span className="font-mono text-emerald-400">{Math.round(config.scanlineIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.02"
              value={config.scanlineIntensity}
              onChange={(e) => update('scanlineIntensity', parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Curvature */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Curvatura do Tubo</span>
              <span className="font-mono text-emerald-400">{Math.round(config.curvature * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.02"
              value={config.curvature}
              onChange={(e) => update('curvature', parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={onOpenApkModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
            >
              <Smartphone className="h-3.5 w-3.5" />
              Instalar APK no Celular
            </button>

            <button
              onClick={onExitFullscreenOverlay}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition"
            >
              Sair da Tela Toda
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Pill */}
      <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/50 bg-slate-950/90 p-1.5 shadow-xl backdrop-blur-md">
        <button
          onClick={() => update('overlayEnabled', !config.overlayEnabled)}
          title={config.overlayEnabled ? 'Desligar CRT' : 'Ligar CRT'}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
            config.overlayEnabled
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Power className="h-4 w-4" />
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white hover:text-emerald-400 transition"
        >
          <Tv className="h-3.5 w-3.5 text-emerald-400" />
          <span>Filtro CRT</span>
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>

        <button
          onClick={onExitFullscreenOverlay}
          title="Fechar tela cheia"
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </aside>
  );
};
