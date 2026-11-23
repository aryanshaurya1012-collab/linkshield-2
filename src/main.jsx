import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';

const PUBLISHABLE_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#10b981',
    colorBackground: '#0f172a',
    colorForeground: '#f8fafc',
    colorNeutral: '#f8fafc',
    colorInput: '#020617',
    colorInputForeground: '#f8fafc',
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    colorTextOnPrimaryBackground: '#020617',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full',
    card: 'border border-slate-700/80 shadow-2xl bg-slate-900 text-slate-100 rounded-2xl',
    headerTitle: 'text-slate-100 font-extrabold text-xl',
    headerSubtitle: 'text-slate-400 text-xs',
    socialButtonsBlockButton: 'bg-slate-950 border border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-100 transition-colors',
    socialButtonsBlockButtonText: 'text-slate-100 font-semibold text-xs',
    dividerLine: 'bg-slate-800',
    dividerText: 'text-slate-400 text-xs uppercase font-medium',
    formFieldLabel: 'text-slate-200 text-xs font-semibold',
    formFieldInput: 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500',
    formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95',
    footerActionText: 'text-slate-400 text-xs',
    footerActionLink: 'text-emerald-400 hover:text-emerald-300 font-semibold text-xs',
    identityPreviewText: 'text-slate-200 text-xs font-medium',
    identityPreviewEditButton: 'text-emerald-400 hover:text-emerald-300 text-xs',
    formResendCodeLink: 'text-emerald-400 hover:text-emerald-300 text-xs',
    otpCodeFieldInput: 'bg-slate-950 border-slate-700 text-slate-100 text-lg rounded-xl',
    userButtonPopoverCard: 'bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl',
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
        appearance={clerkAppearance}
      >
        <App isClerkConfigured={true} />
      </ClerkProvider>
    ) : (
      <App isClerkConfigured={false} />
    )}
  </StrictMode>,
);
