import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  CreditCard, BarChart3, LogOut, ChevronRight, UserCircle, BookMarked
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'teacher', 'student'] },
  { label: 'Students', icon: Users, path: '/students', roles: ['admin'] },
  { label: 'Teachers', icon: UserCircle, path: '/teachers', roles: ['admin'] },
  { label: 'Groups', icon: BookMarked, path: '/groups', roles: ['admin', 'teacher'] },
  { label: 'Schedule', icon: Calendar, path: '/schedule', roles: ['admin', 'teacher'] },
  { label: 'My Lessons', icon: BookOpen, path: '/my-lessons', roles: ['student'] },
  { label: 'Book a Lesson', icon: Calendar, path: '/book-lesson', roles: ['student'] },
  { label: 'Payments', icon: CreditCard, path: '/payments', roles: ['admin'] },
  { label: 'My Balance', icon: CreditCard, path: '/my-balance', roles: ['student'] },
  { label: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['admin'] },
  { label: 'Attendance', icon: GraduationCap, path: '/attendance', roles: ['teacher'] },
];

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const filteredItems = navItems.filter(item => user && item.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    admin: 'bg-teal-500/20 text-teal-400',
    teacher: 'bg-amber-500/20 text-amber-400',
    student: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="fixed left-0 top-0 bottom-0 w-[260px] bg-[#0F172A] border-r border-slate-800/60 flex flex-col z-50"
      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.03\'/%3E%3C/svg%3E")' }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>
              LinguaFlow
            </h1>
            <p className="text-slate-500 text-[10px] mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              School Management
            </p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${user ? roleColors[user.role] : ''}`}
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          {user?.role}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="space-y-0.5">
          {filteredItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                  style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 text-teal-400/60" />}
                    </>
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* User profile chip */}
      <div className="px-3 py-4 border-t border-slate-800/60">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/40">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 flex-shrink-0"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            {user?.name?.split(' ').map(n => n[0]).join('') || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {user?.name}
            </p>
            <p className="text-[11px] text-slate-500 truncate" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
