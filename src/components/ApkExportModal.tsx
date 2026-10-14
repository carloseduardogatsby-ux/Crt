import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Cloud,
  Terminal,
  Check,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  Layers,
  ShieldCheck,
  FileCode2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CrtConfig } from '../types/crt';
import { generateAndroidProjectZip } from '../services/apkGenerator';

interface ApkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CrtConfig;
  isInstallable: boolean;
  isInstalled: boolean;
  isAndroid: boolean;
  onInstallPwa: () => Promise<boolean>;
}

export const ApkExportModal: React.FC<ApkExportModalProps> = ({
  isOpen,
  onClose,
  config,
  isInstallable,
  isInstalled,
  isAndroid,
  onInstallPwa,
}) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'cloud' | 'native' | 'cli'>('pwa');
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const currentAppUrl = typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
    ? window.location.origin
    : 'https://ais-pre-lkek6svqun2fwne6e75rcd-389699862383.us-east1.run.app';

  const handleDownloadZip = async () => {
    setIsGeneratingZip(true);
    try {
      const blob = await generateAndroidProjectZip(config, currentAppUrl);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CRT-Overlay-Android-Source.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleDirectInstall = async () => {
    const success = await onInstallPwa();
    if (success) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const pwaBuilderUrl = `https://www.pwabuilder.com?url=${encodeURIComponent(currentAppUrl)}`;

  const githubWorkflowYaml = `name: Build CRT Overlay APK
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Build APK with Gradle
        run: |
          chmod +x gradlew || true
          ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: CRT-Overlay-APK
          path: app/build/outputs/apk/debug/*.apk`;

  const cliCommands = `# 1. Instale a ferramenta oficial do Google para criar APKs Web
npm install -g @bubblewrap/cli

# 2. Inicialize o projeto apontando para o seu app
bubblewrap init --manifest="${currentAppUrl}/manifest.webmanifest"

# 3. Compile o arquivo .APK em 1 minuto
bubblewrap build

# O APK gerado estará pronto para instalar: app-release-signed.apk`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-2xl shadow-emerald-950/50 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Central de Geração de APK Android
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/40">
                  v1.0 Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transforme o CRT Overlay em um aplicativo Android (.APK) instalado no seu celular
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'pwa'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            1. WebAPK Instantâneo (Recomendado)
          </button>

          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'cloud'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="h-4 w-4" />
            2. Compilador de APK na Nuvem
          </button>

          <button
            onClick={() => setActiveTab('native')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'native'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="h-4 w-4" />
            3. Baixar Projeto Kotlin (.ZIP)
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'cli'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-4 w-4" />
            4. Terminal / Bubblewrap
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-emerald-200 text-sm">
                      O que é o WebAPK do Android?
                    </h3>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                      Quando você toca em <strong>"Instalar"</strong> no Android (via Google Chrome ou Edge),
                      o <strong>Google Play Services</strong> compila e assina automaticamente um arquivo APK real no
                      seu aparelho. O aplicativo ganha ícone nativo na gaveta de apps, tela cheia sem barras de
                      navegador e funciona 100% offline!
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <Smartphone className="h-8 w-8" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-black">
                    APK
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-white">CRT Overlay Studio</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Instale agora mesmo direto no seu smartphone Android sem precisar ativar modo desenvolvedor nem baixar arquivos desconhecidos.
                  </p>
                </div>

                {isInstalled ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-5 py-2.5 text-sm font-semibold text-emerald-400">
                    <Check className="h-4 w-4" />
                    Aplicativo Já Instalado no Dispositivo!
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={handleDirectInstall}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 active:scale-95 transition"
                  >
                    <Smartphone className="h-4 w-4" />
                    Instalar APK no Meu Android Agora
                  </button>
                ) : (
                  <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-300 max-w-md text-left">
                    <p className="font-semibold text-emerald-400 mb-1">Como instalar pelo navegador:</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400">
                      <li>Abra este link no <strong>Chrome do Android</strong></li>
                      <li>Toque nos <strong>três pontinhos (⋮)</strong> no canto superior direito</li>
                      <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></li>
                      <li>O Android instalará o APK automaticamente em segundos!</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                      <Cloud className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">PWABuilder (Oficial Microsoft & Google)</h4>
                      <p className="text-xs text-slate-400">Gera um pacote .APK e .AAB direto na nuvem sem precisar de Android Studio</p>
                    </div>
                  </div>
                  <a
                    href={pwaBuilderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition shrink-0"
                  >
                    Abrir no PWABuilder
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* Box com o Endereço do App e botão Copiar */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Endereço deste app para colar no PWABuilder:
                  </label>
                  <div className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 p-2">
                    <input
                      type="text"
                      readOnly
                      value={currentAppUrl}
                      className="flex-1 bg-transparent font-mono text-xs text-emerald-400 outline-none select-all px-2"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentAppUrl);
                        setCopiedUrl(true);
                        setTimeout(() => setCopiedUrl(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition shrink-0"
                    >
                      {copiedUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedUrl ? 'Copiado!' : 'Copiar Endereço'}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-3 text-xs text-slate-400 space-y-1">
                  <p><strong>Passo a passo no PWABuilder:</strong></p>
                  <p>1. Clique em <strong>"Copiar Endereço"</strong> acima ou abra o link pré-preenchido.</p>
                  <p>2. No <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">PWABuilder.com</a>, clique em <strong>"Start"</strong>.</p>
                  <p>3. Clique em <strong>"Package for Stores"</strong> &gt; escolha <strong>Android</strong> e baixe seu arquivo <code>.apk</code> assinado!</p>
                </div>
              </div>

              {/* GitHub Actions Auto Builder */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Compilação Automática no GitHub Actions</h4>
                      <p className="text-xs text-slate-400">Workflow que compila o arquivo .APK de graça nos servidores do GitHub</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(githubWorkflowYaml);
                      setCopiedWorkflow(true);
                      setTimeout(() => setCopiedWorkflow(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                  >
                    {copiedWorkflow ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedWorkflow ? 'Copiado!' : 'Copiar YAML'}
                  </button>
                </div>

                <pre className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-36">
                  {githubWorkflowYaml}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'native' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-500/30 bg-slate-950 p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-emerald-400" />
                      Pacote Completo Android Studio (Kotlin + OpenGL Shaders)
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 max-w-lg">
                      Baixe o código fonte nativo completo do projeto <code>CRT-Overlay-Android</code> com o serviço de
                      sobreposição (<code>OverlayService.kt</code>), renderizador OpenGL ES (<code>CrtGlRenderer.kt</code>) e os shaders
                      GLSL já calibrados com os parâmetros atuais de scanline e curvatura!
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadZip}
                    disabled={isGeneratingZip}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" />
                    {isGeneratingZip ? 'Empacotando ZIP...' : 'Baixar Projeto .ZIP'}
                  </button>
                </div>

                <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-3 text-xs space-y-2">
                  <p className="font-semibold text-slate-200">Arquivos incluídos no pacote ZIP:</p>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-400">
                    <div>📁 app/src/main/assets/shaders/crt_frag.glsl</div>
                    <div>📁 app/src/main/assets/shaders/crt_vert.glsl</div>
                    <div>📁 app/src/main/java/.../OverlayService.kt</div>
                    <div>📁 app/src/main/java/.../CrtGlRenderer.kt</div>
                    <div>📁 app/src/main/java/.../MainActivity.kt</div>
                    <div>📁 .github/workflows/build-apk.yml</div>
                    <div>📁 app/build.gradle.kts</div>
                    <div>📁 settings.gradle.kts</div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
                  <span className="text-emerald-400 font-semibold">Como compilar o APK localmente no computador:</span>
                  <p className="mt-1">
                    Basta descompactar o arquivo e rodar no terminal: <code>./gradlew assembleDebug</code>. O APK pronto estará em <code>app/build/outputs/apk/debug/app-debug.apk</code>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-emerald-400" />
                      Gerar APK via Linha de Comando (Bubblewrap CLI)
                    </h4>
                    <p className="text-xs text-slate-400">
                      O Bubblewrap é a ferramenta de linha de comando desenvolvida pelo time do Google Chrome para converter aplicações web em APKs Android nativos.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cliCommands);
                      setCopiedCli(true);
                      setTimeout(() => setCopiedCli(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition"
                  >
                    {copiedCli ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedCli ? 'Copiado!' : 'Copiar Comandos'}
                  </button>
                </div>

                <pre className="rounded-lg bg-slate-900 border border-slate-800 p-4 text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
                  {cliCommands}
                </pre>

                <div className="text-xs text-slate-400 bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg">
                  💡 <strong>Dica Pro:</strong> O Bubblewrap gera um arquivo <code>app-release-signed.apk</code> que você pode enviar por WhatsApp, Telegram ou cabo USB para o celular e instalar diretamente.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 bg-slate-950/80">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Suporte a Android 8.0 até Android 15 (Target SDK 34)
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
