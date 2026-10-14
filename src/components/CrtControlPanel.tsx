import React, { useState } from 'react';
import {
  Sliders,
  Tv,
  Eye,
  Zap,
  Sparkles,
  Palette,
  RotateCcw,
  Smartphone,
  Maximize2,
  Check,
  Code,
  Layers,
  SunMedium,
} from 'lucide-react';
import { CrtConfig, YOUTUBE_CRT_PRESETS, CrtPreset } from '../types/crt';

interface CrtControlPanelProps {
  config: CrtConfig;
  onChange: (config: CrtConfig) => void;
  onReset: () => void;
  onOpenApkModal: () => void;
  onToggleFullscreenOverlay: () => void;
  isFullscreenOverlayActive: boolean;
}

export const CrtControlPanel: React.FC<CrtControlPanelProps> = ({
  config,
  onChange,
  onReset,
  onOpenApkModal,
  onToggleFullscreenOverlay,
  isFullscreenOverlayActive,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'scanlines' | 'tube' | 'color'>('presets');
  const [copiedCode, setCopiedCode] = useState(false);

  const update = <K extends keyof CrtConfig>(key: K, value: CrtConfig[K]) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const handleApplyPreset = (preset: CrtPreset) => {
    onChange({ ...config, ...preset.config });
  };

  const handleCopyShaderConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl backdrop-blur-md space-y-4">
      {/* Top Banner & Quick Fullscreen Overlay Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-emerald-400" />
            Calibração de Sobreposição para Vídeos do YouTube
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ajuste a intensidade das scanlines, curvatura e brilho para o melhor equilíbrio visual
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Fullscreen Overlay Mode Trigger */}
          <button
            onClick={onToggleFullscreenOverlay}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-md ${
              isFullscreenOverlayActive
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
            }`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            {isFullscreenOverlayActive ? 'Sair da Tela Toda' : 'Cobrir a Tela Toda'}
          </button>

          <button
            onClick={onReset}
            title="Restaurar padrão"
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Padrão</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 gap-1 overflow-x-auto pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'presets'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Tv className="h-3.5 w-3.5" />
          Presets Prontos
        </button>

        <button
          onClick={() => setActiveTab('scanlines')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'scanlines'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Scanlines & Opacidade
        </button>

        <button
          onClick={() => setActiveTab('tube')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'tube'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          Curvatura & Tubo
        </button>

        <button
          onClick={() => setActiveTab('color')}
          className={`flex items-center gap-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'color'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <SunMedium className="h-3.5 w-3.5" />
          Brilho & Fósforo RGB
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Escolha uma calibração feita especificamente para assistir a vídeos e canais do YouTube:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {YOUTUBE_CRT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="flex flex-col items-start p-3 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500/50 hover:bg-slate-950 transition text-left group"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-white group-hover:text-emerald-400 transition">
                      {preset.name}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'scanlines' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Opacidade Geral da Sobreposição</span>
                  <span className="font-mono text-emerald-400">{Math.round(config.overlayOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.02"
                  value={config.overlayOpacity}
                  onChange={(e) => update('overlayOpacity', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[11px] text-slate-500">
                  Controla a transparência do filtro para não cobrir o vídeo excessivamente.
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Intensidade das Linhas (Escuridão)</span>
                  <span className="font-mono text-emerald-400">{Math.round(config.scanlineIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.85"
                  step="0.02"
                  value={config.scanlineIntensity}
                  onChange={(e) => update('scanlineIntensity', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[11px] text-slate-500">
                  Espessura e contraste das faixas pretas horizontais.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Densidade de Linhas (Resolução)</span>
                  <span className="font-mono text-emerald-400">{config.scanlineCount} Linhas</span>
                </div>
                <input
                  type="range"
                  min="180"
                  max="540"
                  step="10"
                  value={config.scanlineCount}
                  onChange={(e) => update('scanlineCount', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[11px] text-slate-500">
                  240 linhas (retrô anos 80), 360 linhas (equilibrado), 480 linhas (fino/nítido).
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Leve Tremor de Varredura (Jitter)</span>
                  <span className="font-mono text-emerald-400">{Math.round(config.scanlineJitter * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.08"
                  step="0.005"
                  value={config.scanlineJitter}
                  onChange={(e) => update('scanlineJitter', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tube' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Curvatura do Vidro (Efeito Bojo de Tubo)</span>
                  <span className="font-mono text-emerald-400">{Math.round(config.curvature * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.55"
                  step="0.02"
                  value={config.curvature}
                  onChange={(e) => update('curvature', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[11px] text-slate-500">
                  Deformação convexa esférica característica dos televisores CRT antigos.
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Arredondamento dos Cantos</span>
                  <span className="font-mono text-emerald-400">{Math.round(config.cornerRounding * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.1"
                  step="0.005"
                  value={config.cornerRounding}
                  onChange={(e) => update('cornerRounding', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Vinheta (Bordas Escurecidas)</span>
                  <span className="font-mono text-emerald-400">{Math.round(config.vignette * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.75"
                  step="0.02"
                  value={config.vignette}
                  onChange={(e) => update('vignette', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'color' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Compensação de Brilho do Vídeo</span>
                  <span className="font-mono text-emerald-400">{Math.round(config.brightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.9"
                  max="1.5"
                  step="0.02"
                  value={config.brightness}
                  onChange={(e) => update('brightness', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[11px] text-slate-500">
                  Aumenta o brilho do YouTube para compensar a escuridão natural das scanlines.
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Contraste</span>
                  <span className="font-mono text-emerald-400">{Math.round(config.contrast * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.9"
                  max="1.5"
                  step="0.02"
                  value={config.contrast}
                  onChange={(e) => update('contrast', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1">
                  <span>Máscara de Fósforo Subpixel RGB</span>
                  <span className="font-mono text-emerald-400">{Math.round(config.rgbMaskIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.6"
                  step="0.02"
                  value={config.rgbMaskIntensity}
                  onChange={(e) => update('rgbMaskIntensity', parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[11px] text-slate-500">
                  Listras verticais RGB simulando a grade de fósforo do cinescópio.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tonalidade de Cor do Tubo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => update('colorWarmth', 'warm80s')}
                    className={`p-1.5 rounded-lg text-xs font-medium border transition ${
                      config.colorWarmth === 'warm80s'
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    TV 80s Quente
                  </button>
                  <button
                    onClick={() => update('colorWarmth', 'trinitron')}
                    className={`p-1.5 rounded-lg text-xs font-medium border transition ${
                      config.colorWarmth === 'trinitron'
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sony Trinitron
                  </button>
                  <button
                    onClick={() => update('colorWarmth', 'neutral')}
                    className={`p-1.5 rounded-lg text-xs font-medium border transition ${
                      config.colorWarmth === 'neutral'
                        ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Neutro
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
