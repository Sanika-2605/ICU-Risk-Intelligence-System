import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Header({ onMenuToggle, alertCount = 0 }) {
  const { user, role, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-surface-200 shadow-sm">
      <div className="flex items-center justify-between px-6 lg:px-8 h-16">
        {/* Left: hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-surface-100 text-surface-650 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Center: title */}
        <div className="hidden lg:block">
          <h2 className="text-base font-bold text-slate-800 tracking-wide uppercase">
            ICU Clinical Dashboard
          </h2>
        </div>

        {/* Right: alerts + bell + user profile */}
        <div className="flex items-center gap-4">
          
          {/* Notification Bell */}
          <div className="relative p-2 text-slate-500 hover:text-primary-500 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-danger-500"></span>
              </span>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-sm shadow-sm">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {user?.name || 'Staff User'}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{role}</p>
              </div>
              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
                <div className="px-4 py-2.5 border-b border-slate-50">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                    window.location.href = '/login';
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 hover:text-danger-700 transition-all font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out Session
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
