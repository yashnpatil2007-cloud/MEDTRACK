import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Activity, 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  ShieldCheck, 
  Building2, 
  Ambulance as AmbulanceIcon, 
  UserCircle2, 
  Radio, 
  CheckCircle,
  Clock
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isDashboard?: boolean;
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isDashboard = false,
  onNavigate,
  currentPage = 'home'
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'AMBULANCE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <AmbulanceIcon className="w-3.5 h-3.5 mr-1" />
            Ambulance Crew
          </span>
        );
      case 'HOSPITAL':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <Building2 className="w-3.5 h-3.5 mr-1" />
            Hospital Desk
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Administrator
          </span>
        );
      case 'SUPERADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-navy-900 text-white">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-400" />
            Super Administrator
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Brand Logo & Dashboard Sidebar Toggle */}
          <div className="flex items-center space-x-3">
            {isDashboard && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-lg text-slate-500 hover:text-navy-900 hover:bg-slate-100 lg:hidden transition-colors"
                aria-label="Toggle Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div 
              onClick={() => onNavigate ? onNavigate('home') : null}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-navy-900 via-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/10 group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-navy-950 font-sans flex items-center">
                  MED<span className="text-teal-600">TRACK</span>
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emergency-500 animate-pulse" />
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-600">
                  Emergency Grid
                </span>
              </div>
            </div>
          </div>

          {/* Center / Navigation Links for Public Landing Page */}
          {!isDashboard && (
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => onNavigate && onNavigate('home')}
                className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-teal-600 font-semibold' : 'text-slate-600 hover:text-navy-900'}`}
              >
                Home
              </button>
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors">
                How It Works
              </a>
              <a href="#portals" className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors">
                Portals
              </a>
              <a href="#security" className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors">
                Trust & Security
              </a>
              <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors">
                Contact
              </a>
            </nav>
          )}

          {/* Right: Actions */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                {/* Live Socket Status Indicator */}
                <div className="hidden sm:flex items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                  <Radio className="w-3 h-3 mr-1.5 text-emerald-600 animate-pulse" />
                  Live Sync
                </div>

                {/* Role Pill */}
                <div className="hidden md:block">
                  {getRoleBadge()}
                </div>

                {/* Notifications Bell Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl text-slate-500 hover:text-navy-900 hover:bg-slate-100 relative transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emergency-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Popover */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-sm font-bold text-navy-950">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emergency-100 text-emergency-700">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 15).map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markAsRead(n.id)}
                              className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors ${!n.is_read ? 'bg-teal-50/40' : ''}`}
                            >
                              <div className="flex items-start justify-between">
                                <h5 className="text-xs font-bold text-navy-950">{n.title}</h5>
                                <span className="text-[10px] text-slate-400 flex items-center">
                                  <Clock className="w-2.5 h-2.5 mr-0.5" />
                                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Avatar / Logout */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {user.user_id.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold text-navy-950">
                      {user.user_id}
                    </span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                        <p className="text-xs font-bold text-navy-950 truncate">{user.user_id}</p>
                        <p className="text-[10px] text-teal-600 font-semibold uppercase tracking-wider mt-0.5">{user.role}</p>
                      </div>

                      {isDashboard ? (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            if (onNavigate) onNavigate('settings');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                        >
                          <UserCircle2 className="w-4 h-4 text-slate-400" />
                          <span>Account Settings</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            if (onNavigate) onNavigate('dashboard');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-teal-600 font-semibold hover:bg-slate-50 flex items-center space-x-2"
                        >
                          <Activity className="w-4 h-4 text-teal-600" />
                          <span>Go to Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          setShowProfileMenu(false);
                          await logout();
                          if (onNavigate) onNavigate('home');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-emergency-600 hover:bg-emergency-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4 text-emergency-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => onNavigate && onNavigate('ambulance-login')}
                  className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-navy-900 hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
                >
                  <AmbulanceIcon className="w-4 h-4 text-teal-600" />
                  <span className="hidden sm:inline">Ambulance</span> Login
                </button>
                <button
                  onClick={() => onNavigate && onNavigate('hospital-login')}
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-navy-900 hover:bg-navy-950 transition-all shadow-md shadow-navy-900/10 flex items-center space-x-1.5"
                >
                  <Building2 className="w-4 h-4 text-teal-400" />
                  <span className="hidden sm:inline">Hospital</span> Login
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            {!isDashboard && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 md:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Landing Dropdown Menu */}
        {!isDashboard && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate && onNavigate('home'); }}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Home
            </button>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              How It Works
            </a>
            <a
              href="#portals"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Portal Cards
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Contact Advisory
            </a>
          </div>
        )}
      </div>
    </header>
  );
};
