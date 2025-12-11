import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X, MonitorDown } from 'lucide-react';

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);

    // Check for iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      // Show the install prompt (Android/Desktop Chrome)
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    } else if (isIOS) {
      // Show manual instructions for iOS
      setShowIOSInstructions(true);
    }
  };

  // If installed or not supported (and not iOS), hide button
  if (isStandalone || (!deferredPrompt && !isIOS)) return null;

  return (
    <>
        <button 
          onClick={handleInstallClick} 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/30 animate-pulse transition-all"
        >
          {isIOS ? <Download size={14} /> : <MonitorDown size={14} />} 
          Install App
        </button>

        {showIOSInstructions && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-fade-in" onClick={() => setShowIOSInstructions(false)}>
                <div className="bg-surface border border-slate-700 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setShowIOSInstructions(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
                    
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
                            <Download size={24} className="text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Install AI-Trade</h3>
                        <p className="text-xs text-slate-400">Add to Home Screen for the best experience</p>
                    </div>

                    <div className="space-y-4 text-sm text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-4">
                            <span className="flex-none flex items-center justify-center w-8 h-8 bg-slate-700 rounded-lg text-blue-400"><Share size={16} /></span>
                            <p>1. Tap the <span className="font-bold text-white">Share</span> button in your Safari menu bar.</p>
                        </div>
                        <div className="w-full h-px bg-slate-700/50"></div>
                        <div className="flex items-center gap-4">
                            <span className="flex-none flex items-center justify-center w-8 h-8 bg-slate-700 rounded-lg text-blue-400"><PlusSquare size={16} /></span>
                            <p>2. Scroll down and tap <span className="font-bold text-white">Add to Home Screen</span>.</p>
                        </div>
                    </div>
                    
                    <button onClick={() => setShowIOSInstructions(false)} className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">
                        Close
                    </button>
                </div>
            </div>
        )}
    </>
  );
};