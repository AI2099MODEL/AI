import React, { useEffect, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import { UserProfile } from '../types';
import { Shield, Lock, Globe, AlertCircle, LogIn, User, Mail, UserCircle } from 'lucide-react';

interface AuthOverlayProps {
  onLogin: (user: UserProfile) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLogin }) => {
  const [clientId, setClientId] = useState<string>(() => {
      return localStorage.getItem('google_client_id') || '';
  });
  const [error, setError] = useState<string | null>(null);
  
  // Simulated Login State
  const [simName, setSimName] = useState('');
  const [simEmail, setSimEmail] = useState('');

  useEffect(() => {
    if (!clientId) return;

    // Wait for Google script to load
    const initGoogle = () => {
        if (window.google && window.google.accounts) {
            try {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                    auto_select: false,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById("googleSignInBtn"),
                    { theme: "filled_blue", size: "large", width: "100%" }
                );
            } catch (e) {
                console.error("Google Auth Error", e);
                setError("Invalid Client ID or Origin mismatch.");
            }
        } else {
            setTimeout(initGoogle, 500);
        }
    };

    initGoogle();
  }, [clientId]);

  const handleCredentialResponse = (response: any) => {
    try {
        const decoded: any = jwtDecode(response.credential);
        const user: UserProfile = {
            name: decoded.name,
            email: decoded.email,
            picture: decoded.picture,
            sub: decoded.sub,
            isGuest: false
        };
        onLogin(user);
    } catch (e) {
        setError("Failed to decode credential");
    }
  };

  const handleSimulatedLogin = (e: React.FormEvent) => {
      e.preventDefault();
      onLogin({
          name: simName || "Guest Trader",
          email: simEmail || "guest@aitrade.pro",
          picture: "", // No picture for sim
          sub: "sim-" + Date.now(),
          isGuest: true
      });
  };

  const saveClientId = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('google_client_id', clientId);
      window.location.reload(); // Reload to re-init google script with new ID
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-4">
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[100px]" />
           <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[100px]" />
       </div>

       <div className="w-full max-w-md bg-surface border border-slate-700 rounded-2xl shadow-2xl p-8 relative z-10 animate-fade-in">
           <div className="text-center mb-6">
               <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                   <Shield size={24} className="text-white" />
               </div>
               <h1 className="text-2xl font-bold text-white mb-1">AI-Trade Pro</h1>
               <p className="text-slate-400 text-sm">Secure Algorithmic Trading Platform</p>
           </div>

           {error && (
               <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
                   <AlertCircle size={14} /> {error}
               </div>
           )}

           <div className="space-y-6">
               {/* Section 1: Google Login */}
               <div>
                   <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Google Access</h3>
                   {!clientId ? (
                       <form onSubmit={saveClientId} className="space-y-2">
                           <input 
                              type="text" 
                              placeholder="Enter Google Client ID (Optional)"
                              value={clientId}
                              onChange={(e) => setClientId(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:border-blue-500 outline-none transition-colors"
                           />
                           <button type="submit" className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors border border-slate-600">
                               Enable Google Sign-In
                           </button>
                       </form>
                   ) : (
                       <div className="space-y-2">
                            <div id="googleSignInBtn" className="h-[44px] w-full flex justify-center"></div>
                            <button onClick={() => { localStorage.removeItem('google_client_id'); setClientId(''); }} className="text-[10px] text-slate-500 hover:text-slate-300 w-full text-center underline">
                                Reset Client ID
                            </button>
                       </div>
                   )}
               </div>
               
               <div className="relative flex items-center py-2">
                   <div className="flex-grow border-t border-slate-700"></div>
                   <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] uppercase">Or Continue With Email</span>
                   <div className="flex-grow border-t border-slate-700"></div>
               </div>

               {/* Section 2: Simulated Email Login */}
               <form onSubmit={handleSimulatedLogin} className="space-y-3">
                   <div className="relative">
                       <UserCircle size={16} className="absolute left-3 top-3 text-slate-500" />
                       <input 
                          type="text" 
                          placeholder="Your Name"
                          value={simName}
                          onChange={(e) => setSimName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                       />
                   </div>
                   <div className="relative">
                       <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                       <input 
                          type="email" 
                          placeholder="Email ID"
                          value={simEmail}
                          onChange={(e) => setSimEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                       />
                   </div>
                   <button 
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20"
                   >
                       <LogIn size={18} />
                       Start Trading
                   </button>
               </form>
           </div>
           
           <div className="mt-6 text-center">
               <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
                   <Lock size={10} /> Data stored locally. No server transmission.
               </p>
           </div>
       </div>
    </div>
  );
};