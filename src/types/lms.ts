export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Student {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  level: EnglishLevel;
  balance: number;
  enrolledGroups: string[];
  createdAt: string;
  avatar?: string;
}

export interface Teacher {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  specialization: string;
  assignedGroups: string[];
  createdAt: string;
  avatar?: string;
}

export type LessonType = 'GROUP' | 'INDIVIDUAL';
export type LessonStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  status: LessonStatus;
  groupId?: string;
  teacherId: string;
  classroom: string;
  date: string;
  startTime: string;
  endTime: string;
  cost: number;
  attendees?: string[];
  maxStudents?: number;
}

export interface Group {
  id: string;
  name: string;
  level: EnglishLevel;
  teacherId: string;
  studentIds: string[];
  maxStudents: number;
  createdAt: string;
}

export type PaymentType = 'DEPOSIT' | 'LESSON_PAYMENT';

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  type: PaymentType;
  description: string;
  date: string;
  lessonId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
