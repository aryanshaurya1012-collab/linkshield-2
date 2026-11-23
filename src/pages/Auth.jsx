import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, User, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthModal, setOauthModal] = useState(null); // 'google' | 'apple' | null
  const [oauthCustomEmail, setOauthCustomEmail] = useState('');
  const navigate = useNavigate();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please provide a valid operator email address.');
      return;
    }

    if (password.length < 6) {
      setError('Security policy requires a minimum of 6 characters for access codes.');
      return;
    }

    setLoading(true);
    try {
      let user;
      if (isRegister) {
        user = await api.register(trimmedEmail, password, name.trim() || trimmedEmail.split('@')[0]);
      } else {
        user = await api.login(trimmedEmail, password);
      }
      onLoginSuccess(user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthInitiate = (provider) => {
    setOauthModal(provider);
    setOauthCustomEmail(provider === 'google' ? 'security.operator@gmail.com' : 'security.operator@icloud.com');
  };

  const handleOAuthConfirm = async () => {
    if (!oauthCustomEmail.trim()) return;
    setLoading(true);
    setError('');
    try {
      const email = oauthCustomEmail.trim().toLowerCase();
      const displayName = email.split('@')[0].replace('.', ' ');
      const avatar = oauthModal === 'google'
        ? `https://api.dicebear.com/7.x/identicon/svg?seed=${email}`
        : `https://api.dicebear.com/7.x/initials/svg?seed=${email}`;

      const user = await api.oauthLogin(oauthModal, email, displayName, avatar);
      setOauthModal(null);
      onLoginSuccess(user);
      navigate('/');
    } catch (err) {
      setError(err.message || 'OAuth sequence failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Branding Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-1 shadow-sm">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {isRegister ? 'Create Security Credentials' : 'Authenticate to Command Node'}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Persistent SQLite-backed security portal for live link inspection and threat analysis.
          </p>
        </div>

        {/* Auth Box */}
        <div className="panel p-6 sm:p-8 space-y-5 border-slate-800 shadow-xl">
          {error && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Social OAuth Buttons */}
          <div className="space-y-2.5">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={() => handleOAuthInitiate('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Apple OAuth Button */}
            <button
              type="button"
              onClick={() => handleOAuthInitiate('apple')}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.71-11.71-14-4.79-7.39-8.71-16.14-11.77-26.24-3.05-10.1-4.58-20.08-4.58-29.93 0-14.88 3.82-27.34 11.46-37.38 7.63-10.04 17.5-15.16 29.58-15.38 4.89 0 10.16 1.25 15.82 3.75 5.66 2.5 9.4 3.75 11.22 3.75 1.52 0 5.37-1.3 11.55-3.9 6.18-2.6 11.4-3.79 15.66-3.58 11.74.54 21.08 4.51 28.02 11.91 6.94 7.4 11.26 16.32 12.96 26.77-10.45 6.31-15.63 15.13-15.54 26.44.11 8.91 3.42 16.51 9.92 22.8 6.5 6.29 14.34 10.03 23.51 11.22-2.17 6.3-4.99 12.82-8.45 19.55zM119.22 33.02c0-7.38 2.65-14.42 7.95-21.13 5.3-6.71 11.93-11.02 19.89-12.92.54 1.3.82 2.77.82 4.4 0 7.38-2.76 14.54-8.28 21.49-5.52 6.95-12.18 11.14-19.98 12.57-.22-1.3-.4-2.77-.4-4.41z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 shrink-0">
              Or email credential
            </span>
          </div>

          {/* Standard Email Auth Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Operator Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Security Lead"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operator Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@gmail.com"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Access Code (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2 pl-9 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Register Credentials' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="pt-3 border-t border-slate-800/80 text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isRegister ? 'Already have operator clearance? Sign In' : 'Need operator access? Create Account'}
            </button>
          </div>
        </div>

        {/* Security Assurance Pills */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            SQLite Vault
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            PBKDF2 SHA-256
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Zero Tracking
          </span>
        </div>
      </div>

      {/* OAuth Prompt Modal */}
      {oauthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="panel max-w-sm w-full p-6 space-y-4 border-slate-700">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-white capitalize">
                Authenticate via {oauthModal}
              </h3>
              <p className="text-xs text-slate-400">
                Confirm your {oauthModal === 'google' ? 'Google / Gmail' : 'Apple ID'} account address to link:
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Account Email</label>
                <input
                  type="email"
                  value={oauthCustomEmail}
                  onChange={(e) => setOauthCustomEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/60"
                  placeholder={oauthModal === 'google' ? 'name@gmail.com' : 'name@icloud.com'}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOauthModal(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || !oauthCustomEmail.trim()}
                  onClick={handleOAuthConfirm}
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Sign In'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
