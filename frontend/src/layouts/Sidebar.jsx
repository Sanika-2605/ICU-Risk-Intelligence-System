import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const icons = {
  dashboard: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  predictions: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  alerts: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  history: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  vitals: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
};

const navConfig = {
  doctor: [
    { label: 'Dashboard', path: '/doctor/dashboard', icon: 'dashboard' },
    { label: 'Predictions', path: '/prediction', icon: 'predictions' },
    { label: 'Alerts', path: '/alerts', icon: 'alerts' },
    { label: 'Patient History', path: '/history', icon: 'history' },
  ],
  nurse: [
    { label: 'Dashboard', path: '/nurse/dashboard', icon: 'dashboard' },
    { label: 'Alerts', path: '/alerts', icon: 'alerts' },
    { label: 'Patient History', path: '/history', icon: 'history' },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Patient History', path: '/history', icon: 'history' },
    { label: 'Alerts', path: '/alerts', icon: 'alerts' },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const links = navConfig[role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-primary-900 border-r border-primary-800 text-white
          transform transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:h-screen
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
          w-72 flex flex-col justify-between flex-shrink-0
        `}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1 overflow-hidden">
          
          {/* Header/Logo */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-primary-800 flex-shrink-0 bg-primary-900/50">
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-med flex items-center justify-center font-extrabold text-white tracking-widest text-sm shadow-md">
                  ICU
                </div>
                <span className="font-extrabold text-sm tracking-widest uppercase text-white truncate opacity-90">
                  Risk Engine
                </span>
              </div>
            ) : (
              <div className="mx-auto w-8 h-8 rounded-xl bg-cyan-med flex items-center justify-center font-extrabold text-white tracking-widest text-sm shadow-md">
                ICU
              </div>
            )}

            {/* Collapse button on Desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-primary-800 text-primary-300 hover:text-white transition-all cursor-pointer"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <svg className={`w-4 h-4 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* User Role Tag */}
          <div className={`p-5 border-b border-primary-800 bg-primary-950/20 flex-shrink-0 ${isCollapsed ? 'text-center p-3' : ''}`}>
            {!isCollapsed ? (
              <div>
                <p className="text-[10px] font-bold text-primary-400 uppercase tracking-widest opacity-80">Access Level</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse"></div>
                  <p className="text-sm font-extrabold text-white tracking-wide uppercase">{role}</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-8 h-8 rounded-full bg-primary-800 text-primary-300 text-xs font-bold flex items-center justify-center uppercase shadow-inner" title={`${role} Role`}>
                {role?.charAt(0)}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto overflow-x-hidden">
            {links.map((link) => (
              <NavLink
                key={link.path + link.label}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 group relative
                  ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5 gap-3.5'}
                  ${isActive
                    ? 'bg-cyan-med text-white shadow-lg shadow-cyan-med/30'
                    : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                  }`
                }
              >
                {link.icon && icons[link.icon]}
                {!isCollapsed && <span>{link.label}</span>}
                
                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <span className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-slate-700">
                    {link.label}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Section (Fixed at bottom) */}
        <div className="p-4 border-t border-primary-800 bg-primary-950/20 flex-shrink-0">
          {!isCollapsed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-primary-800 text-primary-200 flex items-center justify-center font-bold text-sm shadow-inner">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="truncate flex-1">
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'Medical Staff'}</p>
                  <p className="text-[11px] font-semibold text-primary-300 truncate tracking-wide">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[11px] font-bold text-primary-200 hover:text-white bg-primary-800/50 hover:bg-danger-600 border border-primary-800 hover:border-danger-500 rounded-xl transition-all cursor-pointer shadow-sm uppercase tracking-widest"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Secure Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="mx-auto w-11 h-11 flex items-center justify-center rounded-xl bg-primary-800/50 hover:bg-danger-600 text-primary-200 hover:text-white border border-primary-800 hover:border-danger-500 transition-all cursor-pointer shadow-sm"
              title="Secure Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
