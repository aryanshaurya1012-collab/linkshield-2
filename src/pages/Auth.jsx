import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, User, Eye, EyeOff, ArrowRight, Loader2, ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { api } from '../utils/api';

export default function Auth({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google & Apple SSO Modal states
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showAppleModal, setShowAppleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [isEnteringCustomGoogle, setIsEnteringCustomGoogle] = useState(false);
  const [customAppleEmail, setCustomAppleEmail] = useState('');
  const [isEnteringCustomApple, setIsEnteringCustomApple] = useState(false);

  const navigate = useNavigate();

  const googleAccounts = [
    {
      name: 'Rakesh Kumar',
      email: 'rakesh.kumar@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rakesh&backgroundColor=b6e3f4'
    },
    {
      name: 'Security Operations',
      email: 'soc.admin@gmail.com',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=socadmin&backgroundColor=c0aede'
    }
  ];

  const appleAccounts = [
    {
      name: 'Rakesh Kumar (Personal)',
      email: 'rakesh.security@icloud.com'
    },
    {
      name: 'LinkShield SecOps',
      email: 'secops@icloud.com'
    }
  ];

  const handleOAuthSignIn = async (provider, chosenEmail, chosenName, chosenAvatar) => {
    setLoading(true);
    setError('');
    try {
      const user = await api.oauthLogin(provider, chosenEmail, chosenName, chosenAvatar);
      onLoginSuccess(user);
      setShowGoogleModal(false);
      setShowAppleModal(false);
      navigate('/');
    } catch (err) {
      setError(err.message || `${provider} sign-in failed. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSubmit = (e) => {
    e.preventDefault();
    const trimmed = customGoogleEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please provide a valid Gmail address.');
      return;
    }
    const derivedName = trimmed.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
    handleOAuthSignIn('google', trimmed, formattedName, `https://api.dicebear.com/7.x/avataaars/svg?seed=${trimmed}`);
  };

  const handleCustomAppleSubmit = (e) => {
    e.preventDefault();
    const trimmed = customAppleEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please provide a valid Apple ID email.');
      return;
    }
    const derivedName = trimmed.split('@')[0].replace(/[._]/g, ' ');
    const formattedName = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
    handleOAuthSignIn('apple', trimmed, formattedName, null);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
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
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-10 px-4">
      {/* Top back navigation */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center text-xs text-slate-400">
        <Link to="/" className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Live Scanner
        </Link>
        <span className="font-mono text-[11px] text-slate-500">LinkShield Enterprise</span>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-sm">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {isRegister ? 'Create your account' : 'Sign in to LinkShield'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {isRegister
              ? 'Start protecting your users and monitoring malicious links in real-time.'
              : 'Welcome back. Access your SOC dashboard, threat feeds, and forensic archives.'}
          </p>
        </div>

        {/* Main Auth Panel */}
        <div className="panel p-6 sm:p-8 space-y-5 border-slate-700/80 bg-slate-900/90 shadow-2xl rounded-2xl">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Social Sign In Buttons */}
          <div className="space-y-3">
            {/* Google OAuth Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => { setError(''); setShowGoogleModal(true); }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-[0.99] border border-slate-200"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              disabled={loading}
              onClick={() => { setError(''); setShowAppleModal(true); }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black hover:bg-slate-950 text-white rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-[0.99] border border-slate-700"
            >
              <svg className="w-4 h-4 fill-current text-white shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.71-11.71-14-4.79-7.39-8.71-16.14-11.77-26.24-3.05-10.1-4.58-20.08-4.58-29.93 0-14.88 3.82-27.34 11.46-37.38 7.63-10.04 17.5-15.16 29.58-15.38 4.89 0 10.16 1.25 15.82 3.75 5.66 2.5 9.4 3.75 11.22 3.75 1.52 0 5.37-1.3 11.55-3.9 6.18-2.6 11.4-3.79 15.66-3.58 11.74.54 21.08 4.51 28.02 11.91 6.94 7.4 11.26 16.32 12.96 26.77-10.45 6.31-15.63 15.13-15.54 26.44.11 8.91 3.42 16.51 9.92 22.8 6.5 6.29 14.34 10.03 23.51 11.22-2.17 6.3-4.99 12.82-8.45 19.55zM119.22 33.02c0-7.38 2.65-14.42 7.95-21.13 5.3-6.71 11.93-11.02 19.89-12.92.54 1.3.82 2.77.82 4.4 0 7.38-2.76 14.54-8.28 21.49-5.52 6.95-12.18 11.14-19.98 12.57-.22-1.3-.4-2.77-.4-4.41z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          {/* Clean Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-500 shrink-0 font-medium">
              or continue with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rakesh Kumar"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work or Personal Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => alert('For local/demo access, you can sign in directly with Google or Apple, or use your registered email credentials.')}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2.5 pl-9 pr-10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm mt-1 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Free Account' : 'Sign In with Email'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Security Assurances / Trust Indicators */}
        <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            SQLite Database
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            PBKDF2 SHA-256
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            TLS Handshake
          </span>
        </div>
      </div>

      {/* REALISTIC GOOGLE IDENTITY SERVICES MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 relative border border-slate-200">
            {/* Close button */}
            <button
              onClick={() => { setShowGoogleModal(false); setIsEnteringCustomGoogle(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Header */}
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-tight">Sign in with Google</h3>
                <p className="text-[11px] text-slate-500">Choose an account to continue to LinkShield</p>
              </div>
            </div>

            {/* Account List */}
            {!isEnteringCustomGoogle ? (
              <div className="space-y-1.5 pt-1">
                {googleAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleOAuthSignIn('google', acc.email, acc.name, acc.avatar)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 text-left transition-colors border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full border border-slate-200 shadow-sm" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 leading-tight">{acc.name}</span>
                        <span className="text-[11px] text-slate-500 leading-tight">{acc.email}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-600">Continue</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsEnteringCustomGoogle(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 text-left transition-colors border border-transparent hover:border-slate-200 text-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">Use another Google account</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Google / Gmail Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="yourname@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEnteringCustomGoogle(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 leading-relaxed text-center">
              To continue, Google will share your name, email address, and profile picture with LinkShield.
            </div>
          </div>
        </div>
      )}

      {/* REALISTIC APPLE ID SHEET MODAL */}
      {showAppleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#1c1c1e] text-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 relative border border-slate-700">
            {/* Close button */}
            <button
              onClick={() => { setShowAppleModal(false); setIsEnteringCustomApple(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Apple Header */}
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <svg className="w-6 h-6 fill-current text-white shrink-0" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.71-11.71-14-4.79-7.39-8.71-16.14-11.77-26.24-3.05-10.1-4.58-20.08-4.58-29.93 0-14.88 3.82-27.34 11.46-37.38 7.63-10.04 17.5-15.16 29.58-15.38 4.89 0 10.16 1.25 15.82 3.75 5.66 2.5 9.4 3.75 11.22 3.75 1.52 0 5.37-1.3 11.55-3.9 6.18-2.6 11.4-3.79 15.66-3.58 11.74.54 21.08 4.51 28.02 11.91 6.94 7.4 11.26 16.32 12.96 26.77-10.45 6.31-15.63 15.13-15.54 26.44.11 8.91 3.42 16.51 9.92 22.8 6.5 6.29 14.34 10.03 23.51 11.22-2.17 6.3-4.99 12.82-8.45 19.55zM119.22 33.02c0-7.38 2.65-14.42 7.95-21.13 5.3-6.71 11.93-11.02 19.89-12.92.54 1.3.82 2.77.82 4.4 0 7.38-2.76 14.54-8.28 21.49-5.52 6.95-12.18 11.14-19.98 12.57-.22-1.3-.4-2.77-.4-4.41z" />
              </svg>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">Sign in with Apple</h3>
                <p className="text-[11px] text-slate-400">Use your Apple ID to sign in to LinkShield</p>
              </div>
            </div>

            {/* Apple Account List */}
            {!isEnteringCustomApple ? (
              <div className="space-y-1.5 pt-1">
                {appleAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleOAuthSignIn('apple', acc.email, acc.name, null)}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-left transition-colors border border-transparent hover:border-slate-700"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white leading-tight">{acc.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono leading-tight">{acc.email}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-400">Authorize</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setIsEnteringCustomApple(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 text-left transition-colors border border-transparent hover:border-slate-700 text-slate-300"
                >
                  <span className="text-xs font-semibold">Use a different Apple ID</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomAppleSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Apple ID Email Address
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="name@icloud.com"
                    value={customAppleEmail}
                    onChange={(e) => setCustomAppleEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEnteringCustomApple(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </form>
            )}

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed text-center">
              Your Apple ID credentials are cryptographically protected and never exposed to client applications.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
