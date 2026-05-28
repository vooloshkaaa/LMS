import { Student, Teacher, Group, Lesson, Payment, User, Notification } from '@/types/lms';

export const mockUsers: User[] = [
  { id: 'u1', email: 'admin@lms.com', name: 'Олександр Петренко', role: 'admin', avatar: 'ОП' },
  { id: 'u2', email: 'teacher@lms.com', name: 'Марія Ковальчук', role: 'teacher', avatar: 'МК' },
  { id: 'u3', email: 'student@lms.com', name: 'Андрій Шевченко', role: 'student', avatar: 'АШ' },
];

export const mockStudents: Student[] = [
  { id: 's1', userId: 'u3', name: 'Андрій Шевченко', email: 'andriy@example.com', phone: '+380 50 123-45-67', level: 'B1', balance: 13500, enrolledGroups: ['g1'], createdAt: '2024-01-15', avatar: 'АШ' },
  { id: 's2', userId: 'u4', name: 'Олена Мельник', email: 'olena@example.com', phone: '+380 67 234-56-78', level: 'A2', balance: 6000, enrolledGroups: ['g1', 'g2'], createdAt: '2024-01-20', avatar: 'ОМ' },
  { id: 's3', userId: 'u5', name: 'Іван Бондаренко', email: 'ivan@example.com', phone: '+380 63 345-67-89', level: 'C1', balance: 24000, enrolledGroups: ['g2'], createdAt: '2024-02-01', avatar: 'ІБ' },
  { id: 's4', userId: 'u6', name: 'Катерина Савченко', email: 'kateryna@example.com', phone: '+380 99 456-78-90', level: 'B2', balance: 3600, enrolledGroups: ['g1'], createdAt: '2024-02-10', avatar: 'КС' },
  { id: 's5', userId: 'u7', name: 'Максим Коваль', email: 'maksym@example.com', phone: '+380 73 567-89-01', level: 'A1', balance: 10500, enrolledGroups: [], createdAt: '2024-02-15', avatar: 'МК' },
  { id: 's6', userId: 'u8', name: 'Юлія Ткаченко', email: 'yulia@example.com', phone: '+380 95 678-90-12', level: 'B1', balance: 18000, enrolledGroups: ['g2'], createdAt: '2024-03-01', avatar: 'ЮТ' },
  { id: 's7', userId: 'u9', name: 'Дмитро Романенко', email: 'dmytro@example.com', phone: '+380 66 789-01-23', level: 'C2', balance: 36000, enrolledGroups: ['g3'], createdAt: '2024-03-05', avatar: 'ДР' },
  { id: 's8', userId: 'u10', name: 'Анна Григоренко', email: 'anna@example.com', phone: '+380 97 890-12-34', level: 'B2', balance: 2250, enrolledGroups: ['g1', 'g3'], createdAt: '2024-03-10', avatar: 'АГ' },
];

export const mockTeachers: Teacher[] = [
  { id: 't1', userId: 'u2', name: 'Марія Ковальчук', email: 'maria@lms.com', phone: '+380 50 111-22-33', specialization: 'Ділова англійська', assignedGroups: ['g1', 'g2'], createdAt: '2023-09-01', avatar: 'МК' },
  { id: 't2', userId: 'u11', name: 'Петро Сидоренко', email: 'petro@lms.com', phone: '+380 67 222-33-44', specialization: 'Розмовна практика', assignedGroups: ['g3'], createdAt: '2023-09-15', avatar: 'ПС' },
  { id: 't3', userId: 'u12', name: 'Оксана Павленко', email: 'oksana@lms.com', phone: '+380 63 333-44-55', specialization: 'Граматика та письмо', assignedGroups: [], createdAt: '2024-01-10', avatar: 'ОП' },
];

export const mockGroups: Group[] = [
  { id: 'g1', name: 'Ділова англійська середній рівень', level: 'B1', teacherId: 't1', studentIds: ['s1', 's2', 's4', 's8'], maxStudents: 6, createdAt: '2024-01-10' },
  { id: 'g2', name: 'Розмовна практика просунутий', level: 'C1', teacherId: 't1', studentIds: ['s2', 's3', 's6'], maxStudents: 5, createdAt: '2024-01-15' },
  { id: 'g3', name: 'Підготовка до IELTS', level: 'B2', teacherId: 't2', studentIds: ['s7', 's8'], maxStudents: 8, createdAt: '2024-02-01' },
];

const today = new Date();
const formatDate = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

export const mockLessons: Lesson[] = [
  { id: 'l1', title: 'Ділова англійська - 8 тиждень', type: 'GROUP', status: 'SCHEDULED', groupId: 'g1', teacherId: 't1', classroom: 'Аудиторія А', date: formatDate(0), startTime: '09:00', endTime: '10:30', cost: 750, maxStudents: 6 },
  { id: 'l2', title: 'Розмовна практика - 8 тиждень', type: 'GROUP', status: 'SCHEDULED', groupId: 'g2', teacherId: 't1', classroom: 'Аудиторія Б', date: formatDate(0), startTime: '11:00', endTime: '12:30', cost: 900, maxStudents: 5 },
  { id: 'l3', title: 'Індивідуальне заняття - Андрій Шевченко', type: 'INDIVIDUAL', status: 'SCHEDULED', teacherId: 't2', classroom: 'Аудиторія В', date: formatDate(1), startTime: '14:00', endTime: '15:00', cost: 1500 },
  { id: 'l4', title: 'Підготовка до IELTS - 5 тиждень', type: 'GROUP', status: 'SCHEDULED', groupId: 'g3', teacherId: 't2', classroom: 'Аудиторія А', date: formatDate(1), startTime: '10:00', endTime: '11:30', cost: 1050, maxStudents: 8 },
  { id: 'l5', title: 'Ділова англійська - 7 тиждень', type: 'GROUP', status: 'COMPLETED', groupId: 'g1', teacherId: 't1', classroom: 'Аудиторія А', date: formatDate(-7), startTime: '09:00', endTime: '10:30', cost: 750, attendees: ['s1', 's2', 's4'], maxStudents: 6 },
  { id: 'l6', title: 'Індивідуальне заняття - Катерина Савченко', type: 'INDIVIDUAL', status: 'COMPLETED', teacherId: 't2', classroom: 'Аудиторія В', date: formatDate(-5), startTime: '15:00', endTime: '16:00', cost: 1500, attendees: ['s4'] },
  { id: 'l7', title: 'Розмовна практика - 7 тиждень', type: 'GROUP', status: 'COMPLETED', groupId: 'g2', teacherId: 't1', classroom: 'Аудиторія Б', date: formatDate(-7), startTime: '11:00', endTime: '12:30', cost: 900, attendees: ['s2', 's3', 's6'], maxStudents: 5 },
  { id: 'l8', title: 'Ділова англійська - 9 тиждень', type: 'GROUP', status: 'SCHEDULED', groupId: 'g1', teacherId: 't1', classroom: 'Аудиторія А', date: formatDate(7), startTime: '09:00', endTime: '10:30', cost: 750, maxStudents: 6 },
  { id: 'l9', title: 'Підготовка до IELTS - 4 тиждень', type: 'GROUP', status: 'COMPLETED', groupId: 'g3', teacherId: 't2', classroom: 'Аудиторія А', date: formatDate(-3), startTime: '10:00', endTime: '11:30', cost: 1050, attendees: ['s7', 's8'], maxStudents: 8 },
  { id: 'l10', title: 'Індивідуальне заняття - Іван Бондаренко', type: 'INDIVIDUAL', status: 'SCHEDULED', teacherId: 't3', classroom: 'Аудиторія Г', date: formatDate(2), startTime: '13:00', endTime: '14:00', cost: 1500 },
  { id: 'l11', title: 'Граматичний воркшоп', type: 'GROUP', status: 'SCHEDULED', groupId: 'g1', teacherId: 't3', classroom: 'Аудиторія Б', date: formatDate(3), startTime: '10:00', endTime: '11:30', cost: 600, maxStudents: 6 },
  { id: 'l12', title: 'Розмовна практика', type: 'INDIVIDUAL', status: 'SCHEDULED', teacherId: 't1', classroom: 'Аудиторія В', date: formatDate(4), startTime: '16:00', endTime: '17:00', cost: 1500 },
];

export const mockPayments: Payment[] = [
  { id: 'p1', studentId: 's1', amount: 15000, type: 'DEPOSIT', description: 'Початковий внесок', date: formatDate(-30) },
  { id: 'p2', studentId: 's1', amount: -750, type: 'LESSON_PAYMENT', description: 'Ділова англійська - 6 тиждень', date: formatDate(-14), lessonId: 'l5' },
  { id: 'p3', studentId: 's1', amount: -750, type: 'LESSON_PAYMENT', description: 'Ділова англійська - 7 тиждень', date: formatDate(-7), lessonId: 'l5' },
  { id: 'p4', studentId: 's2', amount: 9000, type: 'DEPOSIT', description: 'Доповнення балансу', date: formatDate(-20) },
  { id: 'p5', studentId: 's2', amount: -900, type: 'LESSON_PAYMENT', description: 'Розмовна практика - 7 тиждень', date: formatDate(-7), lessonId: 'l7' },
  { id: 'p6', studentId: 's3', amount: 30000, type: 'DEPOSIT', description: 'Семестровий внесок', date: formatDate(-60) },
  { id: 'p7', studentId: 's3', amount: -900, type: 'LESSON_PAYMENT', description: 'Розмовна практика - 7 тиждень', date: formatDate(-7), lessonId: 'l7' },
  { id: 'p8', studentId: 's4', amount: 6000, type: 'DEPOSIT', description: 'Початковий внесок', date: formatDate(-25) },
  { id: 'p9', studentId: 's4', amount: -750, type: 'LESSON_PAYMENT', description: 'Ділова англійська - 7 тиждень', date: formatDate(-7), lessonId: 'l5' },
  { id: 'p10', studentId: 's4', amount: -1500, type: 'LESSON_PAYMENT', description: 'Індивідуальне заняття', date: formatDate(-5), lessonId: 'l6' },
  { id: 'p11', studentId: 's7', amount: 45000, type: 'DEPOSIT', description: 'Семестрова оплата', date: formatDate(-45) },
  { id: 'p12', studentId: 's7', amount: -1050, type: 'LESSON_PAYMENT', description: 'Підготовка до IELTS - 4 тиждень', date: formatDate(-3), lessonId: 'l9' },
  { id: 'p13', studentId: 's8', amount: 4500, type: 'DEPOSIT', description: 'Часткова оплата', date: formatDate(-15) },
  { id: 'p14', studentId: 's8', amount: -1050, type: 'LESSON_PAYMENT', description: 'Підготовка до IELTS - 4 тиждень', date: formatDate(-3), lessonId: 'l9' },
  { id: 'p15', studentId: 's5', amount: 12000, type: 'DEPOSIT', description: 'Початковий внесок', date: formatDate(-10) },
  { id: 'p16', studentId: 's6', amount: 21000, type: 'DEPOSIT', description: 'Семестровий внесок', date: formatDate(-50) },
  { id: 'p17', studentId: 's6', amount: -900, type: 'LESSON_PAYMENT', description: 'Розмовна практика - 7 тиждень', date: formatDate(-7), lessonId: 'l7' },
  { id: 'p18', studentId: 's2', amount: 6000, type: 'DEPOSIT', description: 'Додатковий внесок', date: formatDate(-5) },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'Новий студент зареєстрований', message: 'Максим Коваль приєднався до групи "Ділова англійська середній рівень"', read: false, createdAt: formatDate(0), type: 'info' },
  { id: 'n2', title: 'Отримано платіж', message: 'Дмитро Романенко поповнив баланс на 15000 грн', read: false, createdAt: formatDate(0), type: 'success' },
  { id: 'n3', title: 'Заняття завершено', message: 'Підготовка до IELTS - 4 тиждень відзначено як завершене', read: true, createdAt: formatDate(-1), type: 'success' },
  { id: 'n4', title: 'Низький баланс', message: 'Анна Григоренко має баланс нижче 3000 грн', read: false, createdAt: formatDate(-1), type: 'warning' },
];

export const revenueData = [
  { month: 'Січ', revenue: 96000 },
  { month: 'Лют', revenue: 123000 },
  { month: 'Бер', revenue: 114000 },
  { month: 'Квіт', revenue: 156000 },
  { month: 'Трав', revenue: 141000 },
  { month: 'Черв', revenue: 183000 },
  { month: 'Лип', revenue: 174000 },
  { month: 'Серп', revenue: 216000 },
  { month: 'Вер', revenue: 195000 },
  { month: 'Жовт', revenue: 234000 },
  { month: 'Лист', revenue: 246000 },
  { month: 'Груд', revenue: 273000 },
];

export const attendanceData = [
  { week: 'Т1', rate: 88 },
  { week: 'Т2', rate: 92 },
  { week: 'Т3', rate: 85 },
  { week: 'Т4', rate: 94 },
  { week: 'Т5', rate: 91 },
  { week: 'Т6', rate: 87 },
  { week: 'Т7', rate: 96 },
  { week: 'Т8', rate: 93 },
];

export const workloadData = [
  { teacher: 'Марія Ковальчук', lessons: 24 },
  { teacher: 'Петро Сидоренко', lessons: 18 },
  { teacher: 'Оксана Павленко', lessons: 12 },
];
