import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle2, XCircle } from 'lucide-react';

const MyLessonsPage: React.FC = () => {
  const { lessons, teachers } = useLMS();
  const { user } = useAuth();

  const today = new Date().toISOString().split('T')[0];

  // Find the student record matching current user
  const upcoming = lessons
    .filter(l => l.date >= today && l.status === 'SCHEDULED')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const past = lessons
    .filter(l => l.status === 'COMPLETED' || l.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';

  const statusIcon = (status: string) => {
    if (status === 'COMPLETED') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'CANCELLED') return <XCircle className="w-4 h-4 text-red-400" />;
    return <Clock className="w-4 h-4 text-blue-400" />;
  };

  return (
    <MainLayout title="My Lessons" allowedRoles={['student']}>
      <div className="space-y-6">
        {/* Upcoming */}
        <div>
          <h2 className="font-bold text-slate-700 text-lg mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Upcoming Lessons ({upcoming.length})
          </h2>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No upcoming lessons</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {upcoming.map((lesson, i) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      lesson.type === 'GROUP' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {lesson.type}
                    </span>
                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> SCHEDULED
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {lesson.title}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      📅 {lesson.date} · {lesson.startTime}–{lesson.endTime}
                    </p>
                    <p className="text-xs text-slate-500">🏫 {lesson.classroom}</p>
                    <p className="text-xs text-slate-500">👤 {getTeacherName(lesson.teacherId)}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400">Cost: <span className="font-semibold text-slate-700">${lesson.cost}</span></p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Past lessons */}
        <div>
          <h2 className="font-bold text-slate-700 text-lg mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Past Lessons
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {past.map((lesson, i) => (
              <div key={lesson.id} className={`px-5 py-3.5 flex items-center justify-between ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                <div className="flex items-center gap-3">
                  {statusIcon(lesson.status)}
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{lesson.title}</p>
                    <p className="text-xs text-slate-400 font-mono">{lesson.date} · {lesson.startTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    lesson.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                    lesson.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {lesson.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">${lesson.cost}</span>
                </div>
              </div>
            ))}
            {past.length === 0 && (
              <div className="text-center py-10 text-slate-400">No past lessons</div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MyLessonsPage;
