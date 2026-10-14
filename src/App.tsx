import React, { useState } from 'react';
import {
  Tv,
  Smartphone,
  Maximize2,
  Sparkles,
  Info,
  Sliders,
  CheckCircle2,
  Download,
  Power,
  RotateCcw,
  Film,
} from 'lucide-react';
import { CrtConfig, DEFAULT_CRT_CONFIG, YOUTUBE_CRT_PRESETS } from './types/crt';
import { YouTubePlayerWithCrt } from './components/YouTubePlayerWithCrt';
import { CrtControlPanel } from './components/CrtControlPanel';
import { CrtOverlayLayer } from './components/CrtOverlayLayer';
import { FloatingOverlayWidget } from './components/FloatingOverlayWidget';
import { ApkExportModal } from './components/ApkExportModal';
import { usePWAInstall } from './hooks/usePWAInstall';

export default function App() {
  const [config, setConfig] = useState<CrtConfig>({ ...DEFAULT_CRT_CONFIG });
  const [isFullscreenOverlayActive, setIsFullscreenOverlayActive] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();

  const handleToggleOverlay = () => {
    setConfig((prev) => ({
      ...prev,
      overlayEnabled: !prev.overlayEnabled,
    }));
  };

  const handleSelectPreset = (presetId: string) => {
    const p = YOUTUBE_CRT_PRESETS.find((item) => item.id === presetId);
    if (p) {
      setConfig((prev) => ({ ...prev, ...p.config }));
    }
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_CRT_CONFIG });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
      {/* Global Full-Screen CRT Overlay (When active, covers the entire viewport with click-through!) */}
      {isFullscreenOverlayActive && (
        <>
          <CrtOverlayLayer config={config} isFullScreenMode={true} />
          <FloatingOverlayWidget
            config={config}
            onChange={setConfig}
            onExitFullscreenOverlay={() => setIsFullscreenOverlayActive(false)}
            onOpenApkModal={() => setIsApkModalOpen(true)}
          />
        </>
      )}

      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 shadow-md shadow-emerald-500/20 font-bold">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  CRT Overlay para YouTube
                </h1>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/30">
                  Sobreposição de Tela
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Assista a vídeos do YouTube com efeito retrô de tubo CRT sobreposto na tela
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Toggle Overlay */}
            <button
              onClick={handleToggleOverlay}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                config.overlayEnabled
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              <span>{config.overlayEnabled ? 'Filtro: Ativo' : 'Filtro: Pausado'}</span>
            </button>

            {/* Direct WebAPK Install if on Android */}
            {isInstallable && !isInstalled && (
              <button
                onClick={install}
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Instalar no Android
              </button>
            )}

            {/* Gerar APK button */}
            <button
              onClick={() => setIsApkModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition"
            >
              <Smartphone className="h-4 w-4" />
              <span>Baixar / Gerar APK</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 space-y-6">
        {/* Quick Highlights Banner */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="text-xs font-bold text-emerald-300">
                Filtro de Sobreposição Ativo para YouTube & Apps
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Cole o link de qualquer vídeo do YouTube abaixo ou toque em <strong>"Cobrir a Tela Toda"</strong> para projetar o efeito sobre o seu dispositivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsFullscreenOverlayActive(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 shadow-md transition"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Cobrir a Tela Toda
            </button>
          </div>
        </div>

        {/* YouTube Player with CRT Overlay */}
        <YouTubePlayerWithCrt
          config={config}
          onToggleOverlay={handleToggleOverlay}
          onSelectPreset={handleSelectPreset}
          onOpenApkModal={() => setIsApkModalOpen(true)}
        />

        {/* Interactive Overlay Calibration Panel */}
        <CrtControlPanel
          config={config}
          onChange={setConfig}
          onReset={handleReset}
          onOpenApkModal={() => setIsApkModalOpen(true)}
          onToggleFullscreenOverlay={() => setIsFullscreenOverlayActive(!isFullscreenOverlayActive)}
          isFullscreenOverlayActive={isFullscreenOverlayActive}
        />

        {/* How System Overlay Works on Android Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Como funciona a sobreposição no celular Android (APK)?
              </h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-3xl">
                No Android, o aplicativo utiliza o serviço de sistema <code>OverlayService</code> com a permissão{' '}
                <strong className="text-emerald-400">"Aparecer sobre outros aplicativos"</strong> (<code>SYSTEM_ALERT_WINDOW</code>).
                Isso cria uma camada transparente com as scanlines e a curvatura CRT que fica permanentemente na frente da tela,
                enquanto todos os toques e rolagem passam diretamente para o YouTube, TikTok, Netflix ou qualquer outro app (através da flag{' '}
                <code>FLAG_NOT_TOUCHABLE</code>).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-bold text-xs text-emerald-400 mb-1">1. Toque não é bloqueado</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Você pode pausar vídeos, pular anúncios, digitar comentários e navegar no YouTube normalmente.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-bold text-xs text-emerald-400 mb-1">2. Funciona em tela cheia</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ao girar o celular para assistir em tela cheia no YouTube, o efeito CRT rotaciona e cobre 100% do display.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-bold text-xs text-emerald-400 mb-1">3. Controle na barra de notificações</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Uma notificação discreta permite ligar e desligar o efeito a qualquer momento sem precisar fechar o YouTube.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>CRT Overlay para YouTube &bull; Sobreposição de tela com scanlines e curvatura</p>
          <button
            onClick={() => setIsApkModalOpen(true)}
            className="text-emerald-400 font-semibold hover:underline"
          >
            Obter APK para Android
          </button>
        </div>
      </footer>

      {/* APK Hub Modal */}
      <ApkExportModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
        config={config}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isAndroid={isAndroid}
        onInstallPwa={install}
      />
    </div>
  );
}
