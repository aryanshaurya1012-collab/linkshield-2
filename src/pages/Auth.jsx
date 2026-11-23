import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/react';
import { dark } from '@clerk/themes';
import { Shield, ArrowLeft, KeyRound, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function Auth({ isClerkConfigured, initialMode = 'sign-in' }) {
  const [mode, setMode] = useState(initialMode); // 'sign-in' or 'sign-up'
  const [manualKey, setManualKey] = useState('');
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveKey = (e) => {
    e.preventDefault();
    if (!manualKey.trim().startsWith('pk_')) {
      alert('A valid Clerk Publishable Key starts with "pk_test_" or "pk_live_".');
      return;
    }
    // Inform user how to persist in .env
    setKeySaved(true);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-8 px-4">
      {/* Top back navigation */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center text-xs text-slate-400">
        <Link to="/" className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Live Scanner
        </Link>
        <span className="font-mono text-[11px] text-slate-500">Clerk Auth Engine</span>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-sm">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isClerkConfigured 
              ? (mode === 'sign-up' ? 'Create LinkShield Account' : 'Sign in to LinkShield')
              : 'Clerk Authentication Setup'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {isClerkConfigured
              ? 'Secured with enterprise SSO, Google, Apple ID, passkeys, and multi-factor authentication.'
              : 'Connect your Clerk Dashboard publishable key to activate live authentication.'}
          </p>
        </div>

        {/* When Clerk is Configured with Publishable Key */}
        {isClerkConfigured ? (
          <div className="flex flex-col items-center justify-center">
            {mode === 'sign-in' ? (
              <SignIn
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: '#10b981',
                    colorBackground: '#0b0f19',
                    colorInputBackground: '#050811',
                    colorText: '#f1f5f9',
                    colorTextSecondary: '#94a3b8',
                    borderRadius: '0.75rem',
                  },
                  elements: {
                    rootBox: 'w-full',
                    card: 'border border-slate-800 shadow-2xl bg-slate-900/95 w-full rounded-2xl',
                    formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold',
                    footerActionLink: 'text-emerald-400 hover:text-emerald-300 font-semibold',
                  }
                }}
              />
            ) : (
              <SignUp
                appearance={{
                  baseTheme: dark,
                  variables: {
                    colorPrimary: '#10b981',
                    colorBackground: '#0b0f19',
                    colorInputBackground: '#050811',
                    colorText: '#f1f5f9',
                    colorTextSecondary: '#94a3b8',
                    borderRadius: '0.75rem',
                  },
                  elements: {
                    rootBox: 'w-full',
                    card: 'border border-slate-800 shadow-2xl bg-slate-900/95 w-full rounded-2xl',
                    formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold',
                    footerActionLink: 'text-emerald-400 hover:text-emerald-300 font-semibold',
                  }
                }}
              />
            )}

            {/* Toggle Mode Link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium"
              >
                {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        ) : (
          /* When Clerk Key is Pending */
          <div className="panel p-6 sm:p-8 space-y-6 border-slate-700 bg-slate-900/90 shadow-2xl rounded-2xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>@clerk/react SDK Installed</span>
              </div>

              <h2 className="text-base font-bold text-white">
                Add your Clerk Publishable Key
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed">
                To enable live Google, Apple, and email authentication in LinkShield, add your Publishable Key to your <code className="text-emerald-400 font-mono">.env</code> file.
              </p>
            </div>

            {/* Step-by-step guidance */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200 block">Step 1: Get Key from Clerk Dashboard</span>
                <p className="text-slate-400">
                  Open your <a href="https://dashboard.clerk.com/~/api-keys" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">Clerk API Keys <ExternalLink className="w-3 h-3" /></a> and copy your Publishable Key.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 font-mono">
                <span className="font-semibold text-slate-200 block font-sans">Step 2: Add to .env</span>
                <div className="p-2.5 rounded bg-slate-900 text-emerald-400 text-[11px] select-all border border-slate-800">
                  VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
                </div>
              </div>
            </div>

            {/* Quick Helper Input */}
            <form onSubmit={handleSaveKey} className="space-y-3 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                Paste Key to Verify Format
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="pk_test_..."
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {keySaved && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                  Key format verified! Paste this value into your <code className="font-mono font-bold">.env</code> file and restart with <code className="font-mono">npm run dev</code>.
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                Validate Key
              </button>
            </form>
          </div>
        )}

        {/* Security Assurances */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Clerk Cloud SSO
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            SOC 2 Type II
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            SQLite Storage
          </span>
        </div>
      </div>
    </div>
  );
}
