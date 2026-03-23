import React, { createContext, useContext, useState } from 'react';
import { Student, Teacher, Group, Lesson, Payment, Notification } from '@/types/lms';
import {
  mockStudents, mockTeachers, mockGroups,
  mockLessons, mockPayments, mockNotifications
} from '@/data/mockData';

interface LMSContextType {
  students: Student[];
  teachers: Teacher[];
  groups: Group[];
  lessons: Lesson[];
  payments: Payment[];
  notifications: Notification[];
  addStudent: (s: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (id: string, s: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addTeacher: (t: Omit<Teacher, 'id' | 'createdAt'>) => void;
  updateTeacher: (id: string, t: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addGroup: (g: Omit<Group, 'id' | 'createdAt'>) => void;
  updateGroup: (id: string, g: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  addLesson: (l: Omit<Lesson, 'id'>) => void;
  updateLesson: (id: string, l: Partial<Lesson>) => void;
  deleteLesson: (id: string) => void;
  addPayment: (p: Omit<Payment, 'id'>) => void;
  markAttendance: (lessonId: string, attendees: string[]) => void;
  markNotificationRead: (id: string) => void;
}

const LMSContext = createContext<LMSContextType | null>(null);

const genId = () => Math.random().toString(36).substr(2, 9);

export const LMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [teachers, setTeachers] = useState<Teacher[]>(mockTeachers);
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [lessons, setLessons] = useState<Lesson[]>(mockLessons);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const addStudent = (s: Omit<Student, 'id' | 'createdAt'>) =>
    setStudents(prev => [...prev, { ...s, id: genId(), createdAt: new Date().toISOString().split('T')[0] }]);

  const updateStudent = (id: string, s: Partial<Student>) =>
    setStudents(prev => prev.map(x => x.id === id ? { ...x, ...s } : x));

  const deleteStudent = (id: string) =>
    setStudents(prev => prev.filter(x => x.id !== id));

  const addTeacher = (t: Omit<Teacher, 'id' | 'createdAt'>) =>
    setTeachers(prev => [...prev, { ...t, id: genId(), createdAt: new Date().toISOString().split('T')[0] }]);

  const updateTeacher = (id: string, t: Partial<Teacher>) =>
    setTeachers(prev => prev.map(x => x.id === id ? { ...x, ...t } : x));

  const deleteTeacher = (id: string) =>
    setTeachers(prev => prev.filter(x => x.id !== id));

  const addGroup = (g: Omit<Group, 'id' | 'createdAt'>) =>
    setGroups(prev => [...prev, { ...g, id: genId(), createdAt: new Date().toISOString().split('T')[0] }]);

  const updateGroup = (id: string, g: Partial<Group>) =>
    setGroups(prev => prev.map(x => x.id === id ? { ...x, ...g } : x));

  const deleteGroup = (id: string) =>
    setGroups(prev => prev.filter(x => x.id !== id));

  const addLesson = (l: Omit<Lesson, 'id'>) =>
    setLessons(prev => [...prev, { ...l, id: genId() }]);

  const updateLesson = (id: string, l: Partial<Lesson>) =>
    setLessons(prev => prev.map(x => x.id === id ? { ...x, ...l } : x));

  const deleteLesson = (id: string) =>
    setLessons(prev => prev.filter(x => x.id !== id));

  const addPayment = (p: Omit<Payment, 'id'>) => {
    const newPayment = { ...p, id: genId() };
    setPayments(prev => [...prev, newPayment]);
    // Update student balance
    setStudents(prev => prev.map(s =>
      s.id === p.studentId ? { ...s, balance: s.balance + p.amount } : s
    ));
  };

  const markAttendance = (lessonId: string, attendees: string[]) => {
    setLessons(prev => prev.map(l =>
      l.id === lessonId ? { ...l, status: 'COMPLETED', attendees } : l
    ));
    const lesson = lessons.find(l => l.id === lessonId);
    if (lesson) {
      attendees.forEach(studentId => {
        const newPayment: Payment = {
          id: genId(),
          studentId,
          amount: -lesson.cost,
          type: 'LESSON_PAYMENT',
          description: `${lesson.title}`,
          date: new Date().toISOString().split('T')[0],
          lessonId,
        };
        setPayments(prev => [...prev, newPayment]);
        setStudents(prev => prev.map(s =>
          s.id === studentId ? { ...s, balance: s.balance - lesson.cost } : s
        ));
      });
    }
  };

  const markNotificationRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <LMSContext.Provider value={{
      students, teachers, groups, lessons, payments, notifications,
      addStudent, updateStudent, deleteStudent,
      addTeacher, updateTeacher, deleteTeacher,
      addGroup, updateGroup, deleteGroup,
      addLesson, updateLesson, deleteLesson,
      addPayment, markAttendance, markNotificationRead,
    }}>
      {children}
    </LMSContext.Provider>
  );
};

export const useLMS = () => {
  const ctx = useContext(LMSContext);
  if (!ctx) throw new Error('useLMS must be used within LMSProvider');
  return ctx;
};
