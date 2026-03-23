import React from 'react';
import { motion } from 'framer-motion';
import { useLMS } from '@/contexts/LMSContext';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import {
  Users, BookOpen, DollarSign, TrendingUp,
  TrendingDown, ArrowUpRight, Clock, CheckCircle2, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { revenueData, attendanceData } from '@/data/mockData';
import { format } from 'date-fns';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change: string;
  positive: boolean;
  icon: React.ElementType;
  color: string;
  delay: number;
}> = ({ title, value, change, positive, icon: Icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-default"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
        positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
      }`}>
        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {change}
      </div>
    </div>
    <p className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>
      {value}
    </p>
    <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {title}
    </p>
  </motion.div>
);

const DashboardPage: React.FC = () => {
  const { students, lessons, payments, teachers } = useLMS();
  const { user } = useAuth();

  const today = new Date().toISOString().split('T')[0];
  const todayLessons = lessons.filter(l => l.date === today);
  const upcomingLessons = lessons
    .filter(l => l.status === 'SCHEDULED' && l.date >= today)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 6);

  const totalRevenue = payments
    .filter(p => p.type === 'DEPOSIT')
    .reduce((sum, p) => sum + p.amount, 0);

  const completedLessons = lessons.filter(l => l.status === 'COMPLETED').length;

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const lessonTypeColor = (type: string) =>
    type === 'GROUP' ? 'bg-teal-500/10 text-teal-700 border border-teal-200' : 'bg-amber-500/10 text-amber-700 border border-amber-200';

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-500 mt-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Here's what's happening today — {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Stat cards */}
        {isAdmin && (
          <div className="grid grid-cols-4 gap-4">
            <StatCard title="Active Students" value={students.length} change="+12%" positive icon={Users} color="bg-teal-500/10 text-teal-600" delay={0} />
            <StatCard title="Today's Lessons" value={todayLessons.length} change="+2" positive icon={BookOpen} color="bg-blue-500/10 text-blue-600" delay={0.05} />
            <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="+18%" positive icon={DollarSign} color="bg-emerald-500/10 text-emerald-600" delay={0.1} />
            <StatCard title="Teachers Active" value={teachers.length} change="0%" positive={false} icon={Users} color="bg-purple-500/10 text-purple-600" delay={0.15} />
          </div>
        )}

        {isTeacher && (
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="Today's Lessons" value={todayLessons.length} change="+1" positive icon={BookOpen} color="bg-teal-500/10 text-teal-600" delay={0} />
            <StatCard title="Completed Lessons" value={completedLessons} change="+5" positive icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-600" delay={0.05} />
            <StatCard title="Upcoming This Week" value={upcomingLessons.length} change="+2" positive icon={Calendar} color="bg-blue-500/10 text-blue-600" delay={0.1} />
          </div>
        )}

        {/* Charts + Upcoming split */}
        <div className="grid grid-cols-3 gap-5">
          {/* Revenue chart */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>Revenue Overview</h3>
                  <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Monthly deposit income</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3" /> +18% YoY
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Plus Jakarta Sans, sans-serif' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#0d9488" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {isTeacher && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="col-span-2 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>Attendance Rate</h3>
                  <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Weekly student attendance %</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[70, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }}
                    formatter={(v: number) => [`${v}%`, 'Attendance']}
                  />
                  <Line dataKey="rate" stroke="#0d9488" strokeWidth={2.5} dot={{ fill: '#0d9488', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Upcoming lessons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="col-span-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            <h3 className="font-bold text-slate-800 mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              Upcoming Lessons
            </h3>
            <div className="space-y-3">
              {upcomingLessons.slice(0, 5).map((lesson, i) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      {lesson.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      {lesson.date} · {lesson.startTime}
                    </p>
                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-1 ${lessonTypeColor(lesson.type)}`}>
                      {lesson.type}
                    </span>
                  </div>
                </motion.div>
              ))}
              {upcomingLessons.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  No upcoming lessons
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Attendance chart for admin */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>Attendance Rate</h3>
                <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Weekly student attendance percentage</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[70, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: 12 }}
                  formatter={(v: number) => [`${v}%`, 'Attendance']}
                />
                <Line dataKey="rate" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
