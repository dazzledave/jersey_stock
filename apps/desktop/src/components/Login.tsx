"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: Verify, 2: Reset
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const { login } = useAuth();
  const usernameRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Focus the username input immediately
    const timer = setTimeout(() => usernameRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [isRecovering]);

  React.useEffect(() => {
    const checkServer = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) setServerStatus('online');
        else setServerStatus('offline');
      } catch (err) {
        setServerStatus('offline');
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000); // Check every 5s
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, recoveryKey }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      setRecoveryStep(2);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return setError('Passwords do not match');
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/recovery-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, recoveryKey, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Recovery failed');

      alert('Password reset successful! You can now log in.');
      setIsRecovering(false);
      setRecoveryStep(1);
      setPassword('');
      setRecoveryKey('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden font-['Segoe_UI_Variable_Text',_system-ui,_sans-serif]">
      {/* Dynamic Background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">Awards Centre</h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Management Portal</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          {!isRecovering ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                <input 
                  ref={usernameRef}
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-[#1a2234] border border-white/5 rounded-xl px-5 py-4 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-orange-500/50 transition-all"
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[#1a2234] border border-white/5 rounded-xl px-5 py-4 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-orange-500/50 transition-all pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-orange-500 transition-colors p-1"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {serverStatus === 'offline' && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    System Starting Up... Please wait
                  </span>
                </div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs font-bold text-rose-500"
                >
                  {error.includes('Failed to fetch') 
                    ? 'Connection Error: Backend server is not responding.' 
                    : error}
                </motion.div>
              )}

              <button 
                disabled={isLoading}
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Secure Login
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </>
                )}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setIsRecovering(true)}
                  className="text-[10px] text-slate-500 hover:text-orange-500 transition-colors uppercase tracking-widest font-black"
                >
                  Forgotten Password?
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={recoveryStep === 1 ? handleVerifyKey : handleRecovery} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Admin Recovery</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  {recoveryStep === 1 ? 'Step 1: Identity Verification' : 'Step 2: Password Reset'}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={recoveryStep === 2}
                  className="w-full bg-[#1a2234] border border-white/5 rounded-xl px-5 py-4 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-orange-500/50 transition-all disabled:opacity-50"
                  placeholder="Enter admin username"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secret Recovery Key</label>
                <input 
                  type="text" 
                  value={recoveryKey}
                  onChange={(e) => setRecoveryKey(e.target.value.toUpperCase())}
                  required
                  disabled={recoveryStep === 2}
                  className="w-full bg-[#1a2234] border border-white/5 rounded-xl px-5 py-4 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-orange-500/50 transition-all font-mono tracking-widest disabled:opacity-50"
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>

              {recoveryStep === 2 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">New Pass</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                      className="w-full bg-[#1a2234] border border-white/5 rounded-xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm</label>
                    <input 
                      type="password" 
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      className="w-full bg-[#1a2234] border border-white/5 rounded-xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-orange-500/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-xs font-bold text-rose-500">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsRecovering(false);
                    setRecoveryStep(1);
                  }}
                  className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={isLoading}
                  type="submit"
                  className={`flex-1 ${recoveryStep === 1 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'} disabled:opacity-50 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : recoveryStep === 1 ? 'Verify Key' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-10 text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            AWARDS CENTRE POS V1.00.00 • SECURED BY CLOUD-SYNC
          </p>
        </div>
      </motion.div>
    </div>
  );
}
