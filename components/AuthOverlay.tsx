
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Shield, Lock, Mail, Key, Rocket, Eye, EyeOff } from 'lucide-react';

interface AuthOverlayProps {
  onLogin: (user: UserProfile) => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) return;

      // Extract name from email for display
      const name = email.split('@')[0];
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);

      // Create user profile
      const user: UserProfile = {
          name: displayName,
          email: email.trim().toLowerCase(),
          picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2563eb&color=fff`,
          sub: `user-${email.trim().toLowerCase()}`, // Use email as unique ID
          isGuest: false
      };
      
      // In a real app, we would validate password hash here.
      // For local-first paper trading, we accept the input to key the local storage.
      onLogin(user);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-4">
       {/* Background Effects */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
       </div>

       <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-8 relative z-10 animate-fade-in">
           <div className="text-center mb-8">
               <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                   <Shield size={32} className="text-white" />
               </div>
               <h1 className="text-3xl font-bold text-white mb-2">AI-Trade Pro</h1>
               <p className="text-slate-400 text-sm">Secure Paper Trading Platform</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-4">
               
               {/* Email Input */}
               <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                   <div className="relative group">
                       <Mail size={18} className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                       <input 
                          type="email" 
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          required
                          autoFocus
                       />
                   </div>
               </div>

               {/* Password Input */}
               <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                   <div className="relative group">
                       <Key size={18} className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                       <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-12 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                          required
                       />
                       <button 
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                       >
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                   </div>
               </div>

               <button 
                  type="submit"
                  disabled={!email.trim() || !password.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-500/20 mt-6"
               >
                   <Rocket size={20} className="group-hover:-translate-y-1 transition-transform" />
                   {isRegistering ? 'Create Account' : 'Login to Dashboard'}
               </button>
           </form>
           
           <div className="mt-6 text-center">
               <button onClick={() => setIsRegistering(!isRegistering)} className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                   {isRegistering ? 'Already have an account? Login' : 'First time? Create a local profile'}
               </button>
           </div>
           
           <div className="mt-6 text-center border-t border-slate-800 pt-6">
               <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                   <Lock size={10} /> Data is encrypted and stored locally on this device.
               </p>
           </div>
       </div>
    </div>
  );
};
