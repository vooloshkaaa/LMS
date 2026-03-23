import { Student, Teacher, Group, Lesson, Payment, User, Notification } from '@/types/lms';

export const mockUsers: User[] = [
  { id: 'u1', email: 'admin@lms.com', name: 'Alex Morgan', role: 'admin', avatar: 'AM' },
  { id: 'u2', email: 'teacher@lms.com', name: 'Sarah Chen', role: 'teacher', avatar: 'SC' },
  { id: 'u3', email: 'student@lms.com', name: 'James Wilson', role: 'student', avatar: 'JW' },
];

export const mockStudents: Student[] = [
  { id: 's1', userId: 'u3', name: 'James Wilson', email: 'james@example.com', phone: '+1 555-0101', level: 'B1', balance: 450, enrolledGroups: ['g1'], createdAt: '2024-01-15', avatar: 'JW' },
  { id: 's2', userId: 'u4', name: 'Emma Rodriguez', email: 'emma@example.com', phone: '+1 555-0102', level: 'A2', balance: 200, enrolledGroups: ['g1', 'g2'], createdAt: '2024-01-20', avatar: 'ER' },
  { id: 's3', userId: 'u5', name: 'Liam Nakamura', email: 'liam@example.com', phone: '+1 555-0103', level: 'C1', balance: 800, enrolledGroups: ['g2'], createdAt: '2024-02-01', avatar: 'LN' },
  { id: 's4', userId: 'u6', name: 'Sophia Patel', email: 'sophia@example.com', phone: '+1 555-0104', level: 'B2', balance: 120, enrolledGroups: ['g1'], createdAt: '2024-02-10', avatar: 'SP' },
  { id: 's5', userId: 'u7', name: 'Noah Kim', email: 'noah@example.com', phone: '+1 555-0105', level: 'A1', balance: 350, enrolledGroups: [], createdAt: '2024-02-15', avatar: 'NK' },
  { id: 's6', userId: 'u8', name: 'Olivia Brown', email: 'olivia@example.com', phone: '+1 555-0106', level: 'B1', balance: 600, enrolledGroups: ['g2'], createdAt: '2024-03-01', avatar: 'OB' },
  { id: 's7', userId: 'u9', name: 'Ethan Davis', email: 'ethan@example.com', phone: '+1 555-0107', level: 'C2', balance: 1200, enrolledGroups: ['g3'], createdAt: '2024-03-05', avatar: 'ED' },
  { id: 's8', userId: 'u10', name: 'Ava Martinez', email: 'ava@example.com', phone: '+1 555-0108', level: 'B2', balance: 75, enrolledGroups: ['g1', 'g3'], createdAt: '2024-03-10', avatar: 'AM' },
];

export const mockTeachers: Teacher[] = [
  { id: 't1', userId: 'u2', name: 'Sarah Chen', email: 'sarah@lms.com', phone: '+1 555-0201', specialization: 'Business English', assignedGroups: ['g1', 'g2'], createdAt: '2023-09-01', avatar: 'SC' },
  { id: 't2', userId: 'u11', name: 'Michael Torres', email: 'michael@lms.com', phone: '+1 555-0202', specialization: 'Conversation & Fluency', assignedGroups: ['g3'], createdAt: '2023-09-15', avatar: 'MT' },
  { id: 't3', userId: 'u12', name: 'Anna Kowalski', email: 'anna@lms.com', phone: '+1 555-0203', specialization: 'Grammar & Writing', assignedGroups: [], createdAt: '2024-01-10', avatar: 'AK' },
];

export const mockGroups: Group[] = [
  { id: 'g1', name: 'Business English Intermediate', level: 'B1', teacherId: 't1', studentIds: ['s1', 's2', 's4', 's8'], maxStudents: 6, createdAt: '2024-01-10' },
  { id: 'g2', name: 'Advanced Conversation', level: 'C1', teacherId: 't1', studentIds: ['s2', 's3', 's6'], maxStudents: 5, createdAt: '2024-01-15' },
  { id: 'g3', name: 'IELTS Preparation', level: 'B2', teacherId: 't2', studentIds: ['s7', 's8'], maxStudents: 8, createdAt: '2024-02-01' },
];

const today = new Date();
const formatDate = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

export const mockLessons: Lesson[] = [
  { id: 'l1', title: 'Business English Intermediate - Week 8', type: 'GROUP', status: 'SCHEDULED', groupId: 'g1', teacherId: 't1', classroom: 'Room A', date: formatDate(0), startTime: '09:00', endTime: '10:30', cost: 25, maxStudents: 6 },
  { id: 'l2', title: 'Advanced Conversation - Week 8', type: 'GROUP', status: 'SCHEDULED', groupId: 'g2', teacherId: 't1', classroom: 'Room B', date: formatDate(0), startTime: '11:00', endTime: '12:30', cost: 30, maxStudents: 5 },
  { id: 'l3', title: 'Individual Session - James Wilson', type: 'INDIVIDUAL', status: 'SCHEDULED', teacherId: 't2', classroom: 'Room C', date: formatDate(1), startTime: '14:00', endTime: '15:00', cost: 50 },
  { id: 'l4', title: 'IELTS Preparation - Week 5', type: 'GROUP', status: 'SCHEDULED', groupId: 'g3', teacherId: 't2', classroom: 'Room A', date: formatDate(1), startTime: '10:00', endTime: '11:30', cost: 35, maxStudents: 8 },
  { id: 'l5', title: 'Business English Intermediate - Week 7', type: 'GROUP', status: 'COMPLETED', groupId: 'g1', teacherId: 't1', classroom: 'Room A', date: formatDate(-7), startTime: '09:00', endTime: '10:30', cost: 25, attendees: ['s1', 's2', 's4'], maxStudents: 6 },
  { id: 'l6', title: 'Individual Session - Sophia Patel', type: 'INDIVIDUAL', status: 'COMPLETED', teacherId: 't2', classroom: 'Room C', date: formatDate(-5), startTime: '15:00', endTime: '16:00', cost: 50, attendees: ['s4'] },
  { id: 'l7', title: 'Advanced Conversation - Week 7', type: 'GROUP', status: 'COMPLETED', groupId: 'g2', teacherId: 't1', classroom: 'Room B', date: formatDate(-7), startTime: '11:00', endTime: '12:30', cost: 30, attendees: ['s2', 's3', 's6'], maxStudents: 5 },
  { id: 'l8', title: 'Business English Intermediate - Week 9', type: 'GROUP', status: 'SCHEDULED', groupId: 'g1', teacherId: 't1', classroom: 'Room A', date: formatDate(7), startTime: '09:00', endTime: '10:30', cost: 25, maxStudents: 6 },
  { id: 'l9', title: 'IELTS Preparation - Week 4', type: 'GROUP', status: 'COMPLETED', groupId: 'g3', teacherId: 't2', classroom: 'Room A', date: formatDate(-3), startTime: '10:00', endTime: '11:30', cost: 35, attendees: ['s7', 's8'], maxStudents: 8 },
  { id: 'l10', title: 'Individual Session - Liam Nakamura', type: 'INDIVIDUAL', status: 'SCHEDULED', teacherId: 't3', classroom: 'Room D', date: formatDate(2), startTime: '13:00', endTime: '14:00', cost: 50 },
  { id: 'l11', title: 'Grammar Workshop', type: 'GROUP', status: 'SCHEDULED', groupId: 'g1', teacherId: 't3', classroom: 'Room B', date: formatDate(3), startTime: '10:00', endTime: '11:30', cost: 20, maxStudents: 6 },
  { id: 'l12', title: 'Speaking Practice', type: 'INDIVIDUAL', status: 'SCHEDULED', teacherId: 't1', classroom: 'Room C', date: formatDate(4), startTime: '16:00', endTime: '17:00', cost: 50 },
];

export const mockPayments: Payment[] = [
  { id: 'p1', studentId: 's1', amount: 500, type: 'DEPOSIT', description: 'Initial deposit', date: formatDate(-30) },
  { id: 'p2', studentId: 's1', amount: -25, type: 'LESSON_PAYMENT', description: 'Business English - Week 6', date: formatDate(-14), lessonId: 'l5' },
  { id: 'p3', studentId: 's1', amount: -25, type: 'LESSON_PAYMENT', description: 'Business English - Week 7', date: formatDate(-7), lessonId: 'l5' },
  { id: 'p4', studentId: 's2', amount: 300, type: 'DEPOSIT', description: 'Top-up deposit', date: formatDate(-20) },
  { id: 'p5', studentId: 's2', amount: -30, type: 'LESSON_PAYMENT', description: 'Advanced Conversation - Week 7', date: formatDate(-7), lessonId: 'l7' },
  { id: 'p6', studentId: 's3', amount: 1000, type: 'DEPOSIT', description: 'Term deposit', date: formatDate(-60) },
  { id: 'p7', studentId: 's3', amount: -30, type: 'LESSON_PAYMENT', description: 'Advanced Conversation - Week 7', date: formatDate(-7), lessonId: 'l7' },
  { id: 'p8', studentId: 's4', amount: 200, type: 'DEPOSIT', description: 'Initial deposit', date: formatDate(-25) },
  { id: 'p9', studentId: 's4', amount: -25, type: 'LESSON_PAYMENT', description: 'Business English - Week 7', date: formatDate(-7), lessonId: 'l5' },
  { id: 'p10', studentId: 's4', amount: -50, type: 'LESSON_PAYMENT', description: 'Individual Session', date: formatDate(-5), lessonId: 'l6' },
  { id: 'p11', studentId: 's7', amount: 1500, type: 'DEPOSIT', description: 'Term payment', date: formatDate(-45) },
  { id: 'p12', studentId: 's7', amount: -35, type: 'LESSON_PAYMENT', description: 'IELTS Preparation - Week 4', date: formatDate(-3), lessonId: 'l9' },
  { id: 'p13', studentId: 's8', amount: 150, type: 'DEPOSIT', description: 'Partial payment', date: formatDate(-15) },
  { id: 'p14', studentId: 's8', amount: -35, type: 'LESSON_PAYMENT', description: 'IELTS Preparation - Week 4', date: formatDate(-3), lessonId: 'l9' },
  { id: 'p15', studentId: 's5', amount: 400, type: 'DEPOSIT', description: 'Initial deposit', date: formatDate(-10) },
  { id: 'p16', studentId: 's6', amount: 700, type: 'DEPOSIT', description: 'Term deposit', date: formatDate(-50) },
  { id: 'p17', studentId: 's6', amount: -30, type: 'LESSON_PAYMENT', description: 'Advanced Conversation - Week 7', date: formatDate(-7), lessonId: 'l7' },
  { id: 'p18', studentId: 's2', amount: 200, type: 'DEPOSIT', description: 'Additional deposit', date: formatDate(-5) },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'New student enrolled', message: 'Noah Kim has joined Business English Intermediate', read: false, createdAt: formatDate(0), type: 'info' },
  { id: 'n2', title: 'Payment received', message: 'Ethan Davis deposited $500', read: false, createdAt: formatDate(0), type: 'success' },
  { id: 'n3', title: 'Lesson completed', message: 'IELTS Preparation Week 4 marked as completed', read: true, createdAt: formatDate(-1), type: 'success' },
  { id: 'n4', title: 'Low balance alert', message: 'Ava Martinez has balance below $100', read: false, createdAt: formatDate(-1), type: 'warning' },
];

export const revenueData = [
  { month: 'Jan', revenue: 3200 },
  { month: 'Feb', revenue: 4100 },
  { month: 'Mar', revenue: 3800 },
  { month: 'Apr', revenue: 5200 },
  { month: 'May', revenue: 4700 },
  { month: 'Jun', revenue: 6100 },
  { month: 'Jul', revenue: 5800 },
  { month: 'Aug', revenue: 7200 },
  { month: 'Sep', revenue: 6500 },
  { month: 'Oct', revenue: 7800 },
  { month: 'Nov', revenue: 8200 },
  { month: 'Dec', revenue: 9100 },
];

export const attendanceData = [
  { week: 'W1', rate: 88 },
  { week: 'W2', rate: 92 },
  { week: 'W3', rate: 85 },
  { week: 'W4', rate: 94 },
  { week: 'W5', rate: 91 },
  { week: 'W6', rate: 87 },
  { week: 'W7', rate: 96 },
  { week: 'W8', rate: 93 },
];

export const workloadData = [
  { teacher: 'Sarah Chen', lessons: 24 },
  { teacher: 'Michael Torres', lessons: 18 },
  { teacher: 'Anna Kowalski', lessons: 12 },
];
