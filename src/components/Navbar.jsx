import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Shield, Home, Search, Database, LayoutDashboard, History, KeyRound } from 'lucide-react';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { dark } from '@clerk/themes';

export default function Navbar({ isClerkConfigured }) {
  const navItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/scanner', label: 'Scanner', icon: Search },
    { to: '/intel', label: 'Threat Intel', icon: Database },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/history', label: 'Audit Logs', icon: History },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080c14]/95 border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl group-hover:border-emerald-500/40 transition-colors shadow-sm">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  LinkShield
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Clerk v3
                  </span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Threat Intel &amp; Phishing Defense</p>
              </div>
            </NavLink>

            {/* Engine Live Ping Indicator */}
            <div className="hidden lg:flex items-center gap-2 ml-5 pl-5 border-l border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-slate-400 font-medium">Clerk Auth Active</span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/80'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Actions / Clerk User Profile */}
          <div className="flex items-center gap-3">
            {isClerkConfigured ? (
              <>
                <Show when="signed-in">
                  <div className="flex items-center gap-3">
                    <UserButton
                      appearance={{
                        baseTheme: dark,
                        elements: {
                          avatarBox: 'w-8 h-8 rounded-full border border-emerald-500/30 shadow-md ring-2 ring-emerald-500/20',
                          userButtonPopoverCard: 'bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl',
                        }
                      }}
                    />
                  </div>
                </Show>

                <Show when="signed-out">
                  <div className="flex items-center gap-2">
                    <SignInButton mode="modal">
                      <button className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors">
                        Sign In
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95">
                        Get Started
                      </button>
                    </SignUpButton>
                  </div>
                </Show>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Connect Clerk Key
                </Link>
                <Link
                  to="/scanner"
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-sm active:scale-95"
                >
                  Start Scanning
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub Navigation Bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 bg-[#080c14]/95">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </header>
  );
}
