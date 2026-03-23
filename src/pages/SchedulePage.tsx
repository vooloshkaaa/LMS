import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Lesson, LessonType, LessonStatus } from '@/types/lms';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, MapPin, Users, BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import {
  startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks,
  parseISO, isSameDay, isToday
} from 'date-fns';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8am - 7pm

interface LessonFormData {
  title: string;
  type: LessonType;
  status: LessonStatus;
  groupId: string;
  teacherId: string;
  classroom: string;
  date: string;
  startTime: string;
  endTime: string;
  cost: number;
}

const defaultForm: LessonFormData = {
  title: '', type: 'GROUP', status: 'SCHEDULED',
  groupId: '', teacherId: '', classroom: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00', endTime: '10:30', cost: 25,
};

const SchedulePage: React.FC = () => {
  const { lessons, teachers, groups, addLesson, updateLesson, deleteLesson } = useLMS();
  const { user } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState<LessonFormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<LessonFormData>>({});

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const isTeacher = user?.role === 'teacher';
  const teacher = isTeacher ? teachers.find(t => t.userId === user?.id) : null;

  const visibleLessons = isTeacher
    ? lessons.filter(l => l.teacherId === teacher?.id)
    : lessons;

  const getLessonsForDay = (date: Date) =>
    visibleLessons.filter(l => isSameDay(parseISO(l.date), date));

  const timeToY = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return (h - 8) * 60 + m;
  };

  const durationMinutes = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const lessonColor = (type: LessonType, status: LessonStatus) => {
    if (status === 'COMPLETED') return 'bg-slate-100 border-slate-300 text-slate-600';
    if (status === 'CANCELLED') return 'bg-red-50 border-red-200 text-red-600';
    return type === 'GROUP'
      ? 'bg-teal-50 border-teal-300 text-teal-800'
      : 'bg-amber-50 border-amber-300 text-amber-800';
  };

  const openCreate = (date?: string) => {
    setEditLesson(null);
    setForm({ ...defaultForm, date: date || new Date().toISOString().split('T')[0] });
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditLesson(lesson);
    setForm({
      title: lesson.title, type: lesson.type, status: lesson.status,
      groupId: lesson.groupId || '', teacherId: lesson.teacherId,
      classroom: lesson.classroom, date: lesson.date,
      startTime: lesson.startTime, endTime: lesson.endTime, cost: lesson.cost,
    });
    setErrors({});
    setShowModal(true);
    setSelectedLesson(null);
  };

  const validate = () => {
    const e: Partial<LessonFormData> = {};
    if (!form.title.trim()) e.title = 'Title required' as any;
    if (!form.teacherId) e.teacherId = 'Teacher required' as any;
    if (!form.classroom.trim()) e.classroom = 'Classroom required' as any;

    // Conflict check
    const conflict = lessons.find(l =>
      l.id !== editLesson?.id &&
      l.date === form.date &&
      l.status !== 'CANCELLED' &&
      ((l.teacherId === form.teacherId || l.classroom === form.classroom)) &&
      !(form.endTime <= l.startTime || form.startTime >= l.endTime)
    );
    if (conflict) {
      toast.error(`Conflict: "${conflict.title}" already scheduled at this time`);
      return { ...e, conflict: true };
    }
    return e;
  };

  const handleSave = () => {
    const e = validate();
    const { conflict, ...rest } = e as any;
    if (Object.keys(rest).length || conflict) { setErrors(rest); return; }

    const data = {
      ...form,
      groupId: form.groupId || undefined,
      maxStudents: form.type === 'GROUP' ? groups.find(g => g.id === form.groupId)?.maxStudents : undefined,
    };

    if (editLesson) {
      updateLesson(editLesson.id, data);
      toast.success('Lesson updated');
    } else {
      addLesson(data);
      toast.success('Lesson scheduled');
    }
    setShowModal(false);
  };

  return (
    <MainLayout title="Schedule" allowedRoles={['admin', 'teacher']}>
      <div className="space-y-4">
        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentWeek(d => subWeeks(d, 1))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>
              {format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
            </h2>
            <button
              onClick={() => setCurrentWeek(d => addWeeks(d, 1))}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1.5 text-xs font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-200 border border-teal-300" />Group</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-300" />Individual</span>
            </div>
            {!isTeacher && (
              <button
                onClick={() => openCreate()}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.97]"
              >
                <Plus className="w-4 h-4" /> Schedule Lesson
              </button>
            )}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-slate-100">
            <div className="w-16 py-3 px-3 text-xs text-slate-400 text-center" />
            {days.map(day => (
              <div key={day.toISOString()} className={`py-3 text-center border-l border-slate-100 ${isToday(day) ? 'bg-teal-50' : ''}`}>
                <p className="text-xs text-slate-400 uppercase tracking-wide">{format(day, 'EEE')}</p>
                <p className={`text-lg font-bold mt-0.5 ${isToday(day) ? 'text-teal-600' : 'text-slate-700'}`}
                  style={{ fontFamily: 'Syne, sans-serif' }}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}
          </div>

          {/* Time grid */}
          <div className="relative overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '500px' }}>
            <div className="grid grid-cols-8">
              {/* Time labels */}
              <div className="w-16">
                {HOURS.map(h => (
                  <div key={h} className="h-16 px-2 border-b border-slate-50 flex items-start pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">{h}:00</span>
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {days.map(day => {
                const dayLessons = getLessonsForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`relative border-l border-slate-100 ${isToday(day) ? 'bg-teal-50/30' : ''}`}
                    style={{ minHeight: `${HOURS.length * 64}px` }}
                    onClick={() => !isTeacher && openCreate(format(day, 'yyyy-MM-dd'))}
                  >
                    {/* Hour lines */}
                    {HOURS.map(h => (
                      <div key={h} className="absolute w-full border-b border-slate-100" style={{ top: `${(h - 8) * 64}px`, height: '64px' }} />
                    ))}
                    {/* Lesson blocks */}
                    {dayLessons.map(lesson => {
                      const top = (timeToY(lesson.startTime) / 60) * 64;
                      const height = (durationMinutes(lesson.startTime, lesson.endTime) / 60) * 64;
                      return (
                        <div
                          key={lesson.id}
                          className={`absolute left-1 right-1 rounded-lg border px-2 py-1 cursor-pointer hover:shadow-md transition-shadow overflow-hidden z-10 ${lessonColor(lesson.type, lesson.status)}`}
                          style={{ top: `${top}px`, height: `${Math.max(height, 32)}px` }}
                          onClick={e => { e.stopPropagation(); setSelectedLesson(lesson); }}
                        >
                          <p className="text-[10px] font-bold truncate leading-tight">{lesson.title}</p>
                          <p className="text-[9px] opacity-70 font-mono">{lesson.startTime}–{lesson.endTime}</p>
                          {height > 48 && <p className="text-[9px] opacity-60 truncate">{lesson.classroom}</p>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Detail Modal */}
      <AnimatePresence>
        {selectedLesson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className={`px-6 py-4 rounded-t-2xl ${selectedLesson.type === 'GROUP' ? 'bg-teal-600' : 'bg-amber-500'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedLesson.type === 'GROUP' ? 'bg-white/20 text-white' : 'bg-white/20 text-white'} mb-2 inline-block`}>
                      {selectedLesson.type}
                    </span>
                    <h2 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {selectedLesson.title}
                    </h2>
                  </div>
                  <button onClick={() => setSelectedLesson(null)} className="text-white/70 hover:text-white mt-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {([
                  [Clock, `${selectedLesson.date} · ${selectedLesson.startTime} – ${selectedLesson.endTime}`],
                  [MapPin, selectedLesson.classroom],
                  [BookOpen, `Cost: $${selectedLesson.cost} per student`],
                  [Users, `Attendees: ${selectedLesson.attendees?.length ?? 0}`],
                ] as [React.ElementType, string][]).map(([Icon, text], i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    {text}
                  </div>
                ))}
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedLesson.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                  selectedLesson.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedLesson.status}
                </div>
              </div>
              {!isTeacher && (
                <div className="flex gap-3 px-5 pb-5">
                  <button
                    onClick={() => openEdit(selectedLesson)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      deleteLesson(selectedLesson.id);
                      setSelectedLesson(null);
                      toast.success('Lesson deleted');
                    }}
                    className="flex-1 py-2 bg-red-500 hover:bg-red-400 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                <h2 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {editLesson ? 'Edit Lesson' : 'Schedule Lesson'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${(errors as any).title ? 'border-red-400' : 'border-slate-200'}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as LessonType }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      <option value="GROUP">Group</option>
                      <option value="INDIVIDUAL">Individual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Classroom</label>
                    <input
                      type="text"
                      value={form.classroom}
                      onChange={e => setForm(f => ({ ...f, classroom: e.target.value }))}
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${(errors as any).classroom ? 'border-red-400' : 'border-slate-200'}`}
                      placeholder="Room A"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teacher</label>
                  <select
                    value={form.teacherId}
                    onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))}
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${(errors as any).teacherId ? 'border-red-400' : 'border-slate-200'}`}
                  >
                    <option value="">Select teacher...</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                {form.type === 'GROUP' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Group</label>
                    <select value={form.groupId} onChange={e => setForm(f => ({ ...f, groupId: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      <option value="">Select group...</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Start</label>
                    <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">End</label>
                    <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
                    <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSave} className="flex-1 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-semibold transition-colors">
                  {editLesson ? 'Save Changes' : 'Schedule'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default SchedulePage;
