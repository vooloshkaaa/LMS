import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLMS } from '@/contexts/LMSContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BookLessonPage: React.FC = () => {
  const { lessons, students, teachers, addPayment, updateLesson } = useLMS();
  const { user } = useAuth();

  const student = students.find(s => s.userId === user?.id);
  const today = new Date().toISOString().split('T')[0];

  const availableSlots = lessons.filter(l =>
    l.type === 'INDIVIDUAL' &&
    l.status === 'SCHEDULED' &&
    l.date >= today &&
    (!l.attendees || l.attendees.length === 0)
  ).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

  const handleBook = (lessonId: string) => {
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson || !student) return;

    if (student.balance < lesson.cost) {
      toast.error(`Insufficient balance. You need $${lesson.cost} but have $${student.balance.toFixed(2)}`);
      return;
    }

    // Book the lesson
    updateLesson(lessonId, { attendees: [student.id] });
    addPayment({
      studentId: student.id,
      amount: -lesson.cost,
      type: 'LESSON_PAYMENT',
      description: `Booking: ${lesson.title}`,
      date: today,
      lessonId,
    });
    toast.success('Lesson booked successfully!');
  };

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'Unknown';

  return (
    <MainLayout title="Book a Lesson" allowedRoles={['student']}>
      <div className="space-y-5">
        {/* Balance info */}
        {student && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 flex items-center gap-4 border ${student.balance < 50 ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-200'}`}
          >
            {student.balance < 50 ? (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-700">Your current balance</p>
              <p className={`text-xl font-bold ${student.balance < 50 ? 'text-red-600' : 'text-teal-700'}`}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                ${student.balance.toFixed(2)}
              </p>
            </div>
            {student.balance < 50 && (
              <p className="ml-auto text-xs text-red-600 bg-red-100 px-2 py-1 rounded-lg">Contact admin to top up</p>
            )}
          </motion.div>
        )}

        <h2 className="font-bold text-slate-700 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
          Available Individual Lesson Slots
        </h2>

        {availableSlots.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 font-medium">No individual slots available right now</p>
            <p className="text-sm text-slate-400 mt-1">Check back later or contact your teacher</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {availableSlots.map((lesson, i) => {
              const canBook = student ? student.balance >= lesson.cost : false;
              return (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                      INDIVIDUAL
                    </span>
                    <span className="text-lg font-bold text-slate-800" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      ${lesson.cost}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {lesson.title}
                  </h3>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      {lesson.date} · {lesson.startTime}–{lesson.endTime}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {lesson.classroom}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      {getTeacherName(lesson.teacherId)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBook(lesson.id)}
                    disabled={!canBook || !student}
                    className={`w-full py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
                      canBook
                        ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {canBook ? 'Book Lesson' : 'Insufficient Balance'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default BookLessonPage;
