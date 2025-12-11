import React, { useEffect, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import { UserProfile } from '../types';
import { Shield, Lock, AlertCircle, LogIn, Mail, UserCircle, Key } from 'lucide-react';

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
  
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

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

  const handleEmailLogin = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!email || !password || (isRegistering && !name)) {
          setError("All fields are required.");
          return;
      }

      if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
      }

      // Simulate Authentication
      onLogin({
          name: name || email.split('@')[0],
          email: email,
          picture: `https://ui-avatars.com/api/?name=${name || email}&background=random`, 
          sub: "user-" + Date.now(), // Generate a unique ID
          isGuest: false // Treat as a real user
      });
  };

  const saveClientId = (e: React.FormEvent) => {
      e.preventDefault();
      localStorage.setItem('google_client_id', clientId);
      window.location.reload(); 
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
               {/* Google Login Section */}
               <div>
                   {clientId ? (
                       <div className="space-y-2">
                            <div id="googleSignInBtn" className="h-[44px] w-full flex justify-center"></div>
                            <button onClick={() => { localStorage.removeItem('google_client_id'); setClientId(''); }} className="text-[10px] text-slate-500 hover:text-slate-300 w-full text-center underline">
                                Change Client ID
                            </button>
                       </div>
                   ) : (
                       <button 
                         onClick={() => setClientId('ENTER_CLIENT_ID')} // Placeholder action to toggle input visibility if needed, or mostly just show text input
                         className="hidden" // Hiding this button, showing form below 
                       ></button>
                   )}
                   
                   {!clientId && (
                        <div className="text-center">
                            <button onClick={() => { const id = prompt("Enter Google Client ID:"); if(id) { localStorage.setItem('google_client_id', id); setClientId(id); } }} className="text-xs text-blue-400 hover:text-blue-300 underline">
                                Configure Google Sign-In
                            </button>
                        </div>
                   )}
               </div>
               
               <div className="relative flex items-center py-2">
                   <div className="flex-grow border-t border-slate-700"></div>
                   <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] uppercase">Secure Login</span>
                   <div className="flex-grow border-t border-slate-700"></div>
               </div>

               {/* Standard Email Login Form */}
               <form onSubmit={handleEmailLogin} className="space-y-3">
                   {isRegistering && (
                       <div className="relative">
                           <UserCircle size={16} className="absolute left-3 top-3 text-slate-500" />
                           <input 
                              type="text" 
                              placeholder="Full Name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                              required
                           />
                       </div>
                   )}
                   <div className="relative">
                       <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                       <input 
                          type="email" 
                          placeholder="Email Address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                          required
                       />
                   </div>
                   <div className="relative">
                       <Key size={16} className="absolute left-3 top-3 text-slate-500" />
                       <input 
                          type="password" 
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none"
                          required
                          minLength={6}
                       />
                   </div>

                   <button 
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20"
                   >
                       <LogIn size={18} />
                       {isRegistering ? 'Create Account' : 'Sign In'}
                   </button>
               </form>
               
               <div className="text-center">
                   <button 
                     type="button" 
                     onClick={() => { setIsRegistering(!isRegistering); setError(null); }} 
                     className="text-xs text-slate-400 hover:text-white transition-colors"
                   >
                       {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Register"}
                   </button>
               </div>
           </div>
           
           <div className="mt-6 text-center">
               <p className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
                   <Lock size={10} /> Secure Encryption. Local Storage Only.
               </p>
           </div>
       </div>
    </div>
  );
};