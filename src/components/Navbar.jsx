import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Search, History, Database, LogOut } from 'lucide-react';
import { api } from '../utils/api';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.logout();
    onLogout();
    navigate('/auth');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/scanner', label: 'Scanner', icon: Search },
    { to: '/history', label: 'History', icon: History },
    { to: '/intel', label: 'Threat Intel', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080c14]/90 border-b border-slate-800/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg group-hover:border-emerald-500/40 transition-colors">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  LinkShield
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    SOC
                  </span>
                </span>
                <p className="text-[10px] text-slate-400 font-medium -mt-0.5">Enterprise Threat Intel</p>
              </div>
            </NavLink>

            {/* System Status Ping */}
            <div className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l border-slate-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-slate-400">Threat Engine Live</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 bg-slate-900/80 border border-slate-800 rounded-lg">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[140px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[140px]">
                      {user.email}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <NavLink
                to="/auth"
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-sm"
              >
                Sign In
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
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
                  isActive ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
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
