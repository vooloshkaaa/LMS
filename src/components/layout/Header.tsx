import React, { useState } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLMS } from '@/contexts/LMSContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();
  const { notifications, markNotificationRead } = useLMS();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unread = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const notifColors: Record<string, string> = {
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    success: 'bg-teal-500/20 text-teal-400 border-teal-500/20',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
    error: 'bg-red-500/20 text-red-400 border-red-500/20',
  };

  return (
    <header className="h-[60px] bg-[#F8FAFC] border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-40">
      {/* Page title */}
      <h1 className="text-lg font-bold text-slate-800 flex-shrink-0" style={{ fontFamily: 'Syne, sans-serif' }}>
        {title}
      </h1>

      {/* Search */}
      <div className="flex-1 max-w-md ml-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, lessons, teachers..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-teal-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Notifications</h3>
                  {unread > 0 && <span className="text-xs text-teal-600 font-medium">{unread} unread</span>}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">No notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`px-4 py-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!n.read ? 'bg-teal-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? 'bg-teal-500' : 'bg-slate-300'}`} />
                          <div>
                            <p className="text-xs font-semibold text-slate-700" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-xs font-bold text-white"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {user?.name?.split(' ').map(n => n[0]).join('') || '?'}
            </div>
            <span className="text-sm font-medium text-slate-700" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-700" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{user?.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setShowNotifications(false); setShowUserMenu(false); }}
        />
      )}
    </header>
  );
};

export default Header;
