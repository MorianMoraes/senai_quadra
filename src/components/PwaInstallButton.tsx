import { useEffect, useState } from 'react';

interface DeferredInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type InstallMode = 'unavailable' | 'native' | 'ios' | 'safari';

function isInstalled(): boolean {
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return standalone || iosStandalone;
}

function manualInstallMode(): InstallMode {
  const userAgent = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';

  const isMacSafari = /Macintosh/i.test(userAgent) && /Safari/i.test(userAgent) && !/(Chrome|Chromium|Edg|OPR|Firefox)/i.test(userAgent);
  return isMacSafari ? 'safari' : 'unavailable';
}

export function PwaInstallButton() {
  const [mode, setMode] = useState<InstallMode>(() => isInstalled() ? 'unavailable' : manualInstallMode());
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as DeferredInstallPrompt);
      setMode('native');
    };
    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstructions(false);
      setMode('unavailable');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const install = async () => {
    if (mode === 'ios' || mode === 'safari') {
      setShowInstructions(value => !value);
      return;
    }
    if (!deferredPrompt) return;

    const prompt = deferredPrompt;
    setDeferredPrompt(null);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      // Browsers may reject the install prompt if the installation state changed.
    } finally {
      setMode('unavailable');
    }
  };

  if (mode === 'unavailable') return null;

  const hasManualInstructions = mode === 'ios' || mode === 'safari';
  const instructions = mode === 'ios'
    ? 'No menu Compartilhar do navegador, toque em “Adicionar à Tela de Início”.'
    : 'No Safari, abra o menu Arquivo e selecione “Adicionar ao Dock”.';

  return <div className="pwa-install-control">
    {showInstructions && <div className="pwa-install-help" id="pwa-install-help" role="status">{instructions}</div>}
    <button
      className="btn btn-primary pwa-install-button"
      type="button"
      aria-expanded={hasManualInstructions ? showInstructions : undefined}
      aria-controls={hasManualInstructions ? 'pwa-install-help' : undefined}
      onClick={install}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
      </svg>
      <span>Instalar aplicativo</span>
    </button>
  </div>;
}
