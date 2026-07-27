'use client';

import React, { useState } from 'react';
import { loginAdminAction } from '@/app/actions';
import Link from 'next/link';
import { Lock, User, ShieldAlert, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    // Construct FormData to pass to Next.js Server Action
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const result = await loginAdminAction(formData);

    if (result.success) {
      // Fire state event for navbar sync and redirect
      window.dispatchEvent(new Event('admin-login-changed'));
      window.location.href = '/admin/dashboard';
    } else {
      setStatus('error');
      setErrorMsg(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 py-20 relative overflow-hidden">
      {/* Glow overlays */}
      <div className="glow-blue top-1/4 left-1/4" />
      <div className="glow-silver bottom-1/4 right-1/4" />

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-premium-dark p-8 shadow-2xl z-10 text-left space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex rounded-full bg-red-500/10 border border-red-500/25 p-3 text-red-400">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-widest text-white uppercase mt-2">THE REAL ADMIN</h1>
          <p className="text-xs text-slate-500 font-light">
            Enter administrative credentials to access command portal.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Aryan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:border-royal-blue focus:outline-none"
              />
              <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="e.g. 1234"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-xs text-white placeholder-slate-600 focus:border-royal-blue focus:outline-none"
              />
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-400">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-royal-blue hover:bg-royal-blue-hover py-3.5 text-xs font-bold uppercase tracking-widest text-white transition-all disabled:opacity-50"
          >
            {status === 'submitting' ? 'AUTHENTICATING...' : 'LOGIN TO DASHBOARD'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="border-t border-white/5 pt-4 text-center">
          <Link
            href="/"
            className="text-[10px] text-slate-500 hover:text-white uppercase tracking-wider transition-colors"
          >
            &larr; Back to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
