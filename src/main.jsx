import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';

const PUBLISHABLE_KEY = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        afterSignOutUrl="/"
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
            card: 'border border-slate-800 shadow-2xl bg-slate-900/95',
            formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold',
            footerActionLink: 'text-emerald-400 hover:text-emerald-300 font-semibold',
          }
        }}
      >
        <App isClerkConfigured={true} />
      </ClerkProvider>
    ) : (
      <App isClerkConfigured={false} />
    )}
  </StrictMode>,
);
