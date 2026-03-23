import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, X, Users, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const AttendancePage: React.FC = () => {
  const { lessons, students, groups, teachers, markAttendance } = useLMS();
  const { user } = useAuth();
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  const teacher = teachers.find(t => t.userId === user?.id);
  const today = new Date().toISOString().split('T')[0];

  const todayLessons = lessons.filter(l =>
    l.date === today &&
    l.teacherId === teacher?.id &&
    l.status === 'SCHEDULED'
  );

  const upcomingLessons = lessons.filter(l =>
    l.date > today &&
    l.teacherId === teacher?.id &&
    l.status === 'SCHEDULED'
  ).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)).slice(0, 5);

  const openAttendance = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return;
    setSelectedLesson(lessonId);
    // Pre-populate with group students
    if (lesson.groupId) {
      const group = groups.find(g => g.id === lesson.groupId);
      setAttendees(group?.studentIds || []);
    } else {
      setAttendees([]);
    }
  };

  const getLessonStudents = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return [];
    if (lesson.groupId) {
      const group = groups.find(g => g.id === lesson.groupId);
      return students.filter(s => group?.studentIds.includes(s.id));
    }
    return students;
  };

  const handleSubmit = () => {
    if (!selectedLesson) return;
    markAttendance(selectedLesson, attendees);
    setSubmitted(prev => new Set(prev).add(selectedLesson));
    setSelectedLesson(null);
    toast.success('Attendance marked! Balances updated.');
  };

  const toggleAttendee = (studentId: string) => {
    setAttendees(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const lessonStudents = selectedLesson ? getLessonStudents(selectedLesson) : [];
  const currentLesson = lessons.find(l => l.id === selectedLesson);

  return (
    <MainLayout title="Attendance" allowedRoles={['teacher']}>
      <div className="space-y-5">
        {/* Today's lessons */}
        <div>
          <h2 className="font-bold text-slate-700 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Today's Lessons — {format(new Date(), 'EEEE, MMMM d')}
          </h2>
          {todayLessons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-teal-300" />
              <p className="text-slate-500">No lessons scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayLessons.map((lesson, i) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lesson.type === 'GROUP' ? 'bg-teal-50' : 'bg-amber-50'}`}>
                      {lesson.type === 'GROUP' ? <Users className="w-6 h-6 text-teal-600" /> : <Clock className="w-6 h-6 text-amber-600" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>{lesson.title}</h3>
                      <p className="text-sm text-slate-400 mt-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {lesson.startTime} – {lesson.endTime} · {lesson.classroom}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {submitted.has(lesson.id) ? (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-4 h-4" /> Submitted
                      </span>
                    ) : (
                      <button
                        onClick={() => openAttendance(lesson.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.97]"
                      >
                        Mark Attendance <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming lessons */}
        {upcomingLessons.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-700 mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Upcoming Lessons</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {upcomingLessons.map((lesson, i) => (
                <div key={lesson.id} className={`px-5 py-3.5 flex items-center justify-between ${i !== 0 ? 'border-t border-slate-100' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{lesson.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {lesson.date} · {lesson.startTime}–{lesson.endTime}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lesson.type === 'GROUP' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>
                    {lesson.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attendance Modal */}
      <AnimatePresence>
        {selectedLesson && currentLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
            >
              <div className="bg-teal-600 px-6 py-4 rounded-t-2xl flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-teal-100 text-xs mb-1">Mark Attendance</p>
                    <h2 className="text-white font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{currentLesson.title}</h2>
                    <p className="text-teal-200 text-xs mt-0.5">{currentLesson.startTime}–{currentLesson.endTime} · {currentLesson.classroom}</p>
                  </div>
                  <button onClick={() => setSelectedLesson(null)} className="text-white/70 hover:text-white mt-0.5">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Students ({lessonStudents.length})</p>
                  <p className="text-xs text-teal-600 font-semibold">{attendees.length} present</p>
                </div>
                <div className="space-y-2">
                  {lessonStudents.map(student => (
                    <label
                      key={student.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        attendees.includes(student.id)
                          ? 'bg-teal-50 border-teal-200'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={attendees.includes(student.id)}
                        onChange={() => toggleAttendee(student.id)}
                        className="accent-teal-600 w-4 h-4"
                      />
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-xs font-bold text-teal-700">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-700">{student.name}</p>
                        <p className="text-xs text-slate-400">Balance: ${student.balance.toFixed(2)}</p>
                      </div>
                      {attendees.includes(student.id) ? (
                        <span className="text-xs font-semibold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">Present</span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Absent</span>
                      )}
                    </label>
                  ))}
                  {lessonStudents.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">No students in this lesson</p>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 flex gap-3 flex-shrink-0 border-t border-slate-100 pt-4">
                <div className="flex-1 bg-amber-50 rounded-xl px-3 py-2">
                  <p className="text-xs text-amber-600 font-medium">Deduction per student</p>
                  <p className="text-lg font-bold text-amber-700">${currentLesson.cost}</p>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={lessonStudents.length === 0}
                  className="flex-1 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Submit Attendance
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default AttendancePage;
