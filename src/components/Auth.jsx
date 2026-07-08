import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, User, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { loginUser, registerUser } from '../utils/db';
import { motion } from 'framer-motion';

const BANNED_DOMAINS = [
  '10minutemail', 'tempmail', 'guerrillamail', 'yopmail', 
  'mailinator', 'temp-mail', 'throwawaymail', 'sharklasers', 
  'getnada', 'maildrop'
];

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateUsername = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    
    if (emailRegex.test(input)) {
      const domain = input.split('@')[1].toLowerCase();
      if (BANNED_DOMAINS.some(d => domain.includes(d))) {
        return 'Temporary/disposable email domains are strictly prohibited.';
      }
      return null;
    }
    
    if (phoneRegex.test(input)) {
      return null;
    }
    
    return 'Please enter a valid email address or phone number.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      let user;
      if (isLogin) {
        user = await loginUser(username, password);
      } else {
        user = await registerUser(username, password);
      }
      onLogin(user);
      navigate('/scanner');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="w-full flex items-center justify-center py-12 px-4 relative z-10"
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-[#00FFFF]/40 shadow-[0_0_30px_rgba(0,255,255,0.15)] relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent"></div>
        
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-[#00FFFF]/10 rounded-2xl border border-[#00FFFF]/30 shadow-[0_0_20px_rgba(0,255,255,0.2)] mb-4">
            <Shield className="w-10 h-10 text-[#00FFFF] drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
          </div>
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00FFFF] to-[#0088FF] tracking-widest uppercase mb-2">
            Secure Terminal
          </h2>
          <p className="text-[#00FFFF]/60 font-mono text-xs uppercase tracking-widest">
            {isLogin ? 'Authenticate to access Node' : 'Initialize new operator profile'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FF0000]/10 border border-[#FF0000]/50 rounded-xl flex items-start gap-3 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.2)]">
            <ShieldAlert className="w-5 h-5 text-[#FF0000] shrink-0 mt-0.5" />
            <p className="text-sm text-[#FF0000] font-mono tracking-wide">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[#00FFFF] font-mono text-xs font-bold uppercase tracking-widest mb-2 ml-1">
              Operator ID (Email/Phone)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-[#00FFFF]/50" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="operator@domain.com"
                className="w-full bg-slate-950/80 border border-[#00FFFF]/30 rounded-xl py-3 pl-12 pr-4 text-[#00FFFF] font-mono placeholder:text-[#00FFFF]/30 focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/60 focus:border-[#00FFFF]/60 transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#00FFFF] font-mono text-xs font-bold uppercase tracking-widest mb-2 ml-1">
              Access Code (Password)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-[#00FFFF]/50" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-[#00FFFF]/30 rounded-xl py-3 pl-12 pr-4 text-[#00FFFF] font-mono placeholder:text-[#00FFFF]/30 focus:outline-none focus:ring-2 focus:ring-[#00FFFF]/60 focus:border-[#00FFFF]/60 transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-8 flex items-center justify-center gap-2 bg-[#00FFFF]/10 hover:bg-[#00FFFF]/20 border border-[#00FFFF] text-[#00FFFF] py-3 rounded-xl font-bold font-mono uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="animate-pulse">Authenticating...</span>
            ) : (
              <>
                {isLogin ? 'Grant Access' : 'Establish Link'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#00FFFF]/20 text-center">
          <p className="text-[#00FFFF]/60 font-mono text-sm">
            {isLogin ? 'No active clearance?' : 'Already have clearance?'}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="ml-2 text-[#00FFFF] font-bold hover:underline tracking-wide"
            >
              {isLogin ? 'Request Access' : 'Authenticate Now'}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
