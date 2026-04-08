import { User, Student, Teacher, Group, Lesson, Payment, UserRole, EnglishLevel, LessonType, LessonStatus, PaymentType } from '@/types/lms';

// Генератор тестових даних для продуктивності
export class TestDataGenerator {
  private static readonly ENGLISH_LEVELS: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  private static readonly SPECIALIZATIONS = [
    'Business English', 'IELTS Preparation', 'Conversation', 
    'Grammar', 'Pronunciation', 'Academic Writing'
  ];

  // Генерація великої кількості студентів
  static generateStudents(count: number): Student[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `student_${index}`,
      userId: `user_${index}`,
      name: `Student ${index}`,
      email: `student${index}@test.com`,
      phone: `+38050${index.toString().padStart(7, '0')}`,
      level: this.ENGLISH_LEVELS[index % this.ENGLISH_LEVELS.length],
      balance: Math.floor(Math.random() * 10000),
      enrolledGroups: [],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=student${index}`
    }));
  }

  // Генерація викладачів
  static generateTeachers(count: number): Teacher[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `teacher_${index}`,
      userId: `teacher_user_${index}`,
      name: `Teacher ${index}`,
      email: `teacher${index}@test.com`,
      phone: `+38067${index.toString().padStart(7, '0')}`,
      specialization: this.SPECIALIZATIONS[index % this.SPECIALIZATIONS.length],
      assignedGroups: [],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=teacher${index}`
    }));
  }

  // Генерація груп
  static generateGroups(count: number, students: Student[], teachers: Teacher[]): Group[] {
    return Array.from({ length: count }, (_, index) => {
      const level = this.ENGLISH_LEVELS[index % this.ENGLISH_LEVELS.length];
      const levelStudents = students.filter(s => s.level === level);
      const selectedStudents = levelStudents.slice(0, Math.min(12, levelStudents.length));
      
      return {
        id: `group_${index}`,
        name: `${level} Group ${index + 1}`,
        level,
        teacherId: teachers[index % teachers.length].id,
        studentIds: selectedStudents.map(s => s.id),
        maxStudents: 12,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      };
    });
  }

  // Генерація уроків на місяць
  static generateLessons(groups: Group[], teachers: Teacher[]): Lesson[] {
    const lessons: Lesson[] = [];
    const now = new Date();
    
    groups.forEach(group => {
      // Генеруємо уроки на 30 днів вперед
      for (let day = 0; day < 30; day++) {
        const lessonDate = new Date(now);
        lessonDate.setDate(now.getDate() + day);
        
        // 2 уроки на тиждень для кожної групи
        if (lessonDate.getDay() % 3 === 0 || lessonDate.getDay() % 3 === 1) {
          lessons.push({
            id: `lesson_${group.id}_${day}`,
            title: `${group.level} Lesson - ${lessonDate.toLocaleDateString()}`,
            type: 'GROUP' as LessonType,
            status: Math.random() > 0.2 ? 'SCHEDULED' : 'COMPLETED' as LessonStatus,
            groupId: group.id,
            teacherId: group.teacherId,
            classroom: `Room ${Math.floor(Math.random() * 10) + 1}`,
            date: lessonDate.toISOString().split('T')[0],
            startTime: `${16 + Math.floor(Math.random() * 4)}:00`,
            endTime: `${17 + Math.floor(Math.random() * 4)}:00`,
            cost: 350,
            attendees: group.studentIds.slice(0, Math.floor(Math.random() * group.studentIds.length) + 1),
            maxStudents: group.maxStudents
          });
        }
      }
    });
    
    return lessons;
  }

  // Генерація платежів
  static generatePayments(students: Student[], lessons: Lesson[]): Payment[] {
    const payments: Payment[] = [];
    
    students.forEach(student => {
      // Депозити
      if (Math.random() > 0.3) {
        payments.push({
          id: `deposit_${student.id}`,
          studentId: student.id,
          amount: 2000 + Math.floor(Math.random() * 8000),
          type: 'DEPOSIT' as PaymentType,
          description: 'Поповнення балансу',
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      
      // Оплати за уроки
      const studentLessons = lessons.filter(l => l.attendees?.includes(student.id));
      studentLessons.slice(0, 10).forEach(lesson => {
        payments.push({
          id: `payment_${student.id}_${lesson.id}`,
          studentId: student.id,
          amount: lesson.cost,
          type: 'LESSON_PAYMENT' as PaymentType,
          description: `Оплата уроку ${lesson.title}`,
          date: lesson.date,
          lessonId: lesson.id
        });
      });
    });
    
    return payments;
  }
}

// Тестові сценарії для навантаження
export class PerformanceTestScenarios {
  // Сценарій 1: Велика кількість студентів
  static getLargeDatasetScenario() {
    const students = TestDataGenerator.generateStudents(1000);
    const teachers = TestDataGenerator.generateTeachers(50);
    const groups = TestDataGenerator.generateGroups(100, students, teachers);
    const lessons = TestDataGenerator.generateLessons(groups, teachers);
    const payments = TestDataGenerator.generatePayments(students, lessons);
    
    return {
      name: 'Large Dataset',
      description: '1000 студентів, 50 викладачів, 100 груп',
      data: { students, teachers, groups, lessons, payments },
      metrics: {
        studentCount: students.length,
        teacherCount: teachers.length,
        groupCount: groups.length,
        lessonCount: lessons.length,
        paymentCount: payments.length
      }
    };
  }

  // Сценарій 2: Інтенсивне створення уроків
  static getIntensiveLessonScenario() {
    const students = TestDataGenerator.generateStudents(100);
    const teachers = TestDataGenerator.generateTeachers(10);
    const groups = TestDataGenerator.generateGroups(20, students, teachers);
    
    // Створюємо багато уроків на короткий період
    const lessons: Lesson[] = [];
    const now = new Date();
    
    for (let day = 0; day < 7; day++) {
      const lessonDate = new Date(now);
      lessonDate.setDate(now.getDate() + day);
      
      groups.forEach(group => {
        // 3 уроки на день для кожної групи
        for (let hour = 9; hour <= 21; hour += 4) {
          lessons.push({
            id: `intensive_lesson_${group.id}_${day}_${hour}`,
            title: `Intensive ${group.level} - Day ${day + 1}`,
            type: 'GROUP' as LessonType,
            status: 'SCHEDULED' as LessonStatus,
            groupId: group.id,
            teacherId: group.teacherId,
            classroom: `Room ${Math.floor(Math.random() * 10) + 1}`,
            date: lessonDate.toISOString().split('T')[0],
            startTime: `${hour}:00`,
            endTime: `${hour + 2}:00`,
            cost: 350,
            attendees: group.studentIds,
            maxStudents: group.maxStudents
          });
        }
      });
    }
    
    return {
      name: 'Intensive Lessons',
      description: 'Багато уроків на короткий період',
      data: { students, teachers, groups, lessons },
      metrics: {
        lessonsPerDay: lessons.length / 7,
        totalLessons: lessons.length,
        concurrentLessons: groups.length * 3
      }
    };
  }

  // Сценарій 3: Багато одночасних користувачів
  static getConcurrentUsersScenario() {
    const users = Array.from({ length: 200 }, (_, index) => ({
      id: `user_${index}`,
      email: `user${index}@test.com`,
      name: `User ${index}`,
      role: ['admin', 'teacher', 'student'][index % 3] as UserRole,
      lastActivity: new Date(Date.now() - Math.random() * 60000).toISOString()
    }));
    
    return {
      name: 'Concurrent Users',
      description: '200 одночасних користувачів',
      data: { users },
      metrics: {
        totalUsers: users.length,
        adminCount: users.filter(u => u.role === 'admin').length,
        teacherCount: users.filter(u => u.role === 'teacher').length,
        studentCount: users.filter(u => u.role === 'student').length
      }
    };
  }

  // Сценарій 4: Complex Analytics
  static getComplexAnalyticsScenario() {
    const students = TestDataGenerator.generateStudents(500);
    const teachers = TestDataGenerator.generateTeachers(25);
    const groups = TestDataGenerator.generateGroups(50, students, teachers);
    const lessons = TestDataGenerator.generateLessons(groups, teachers);
    const payments = TestDataGenerator.generatePayments(students, lessons);
    
    return {
      name: 'Complex Analytics',
      description: 'Складні аналітичні запити',
      data: { students, teachers, groups, lessons, payments },
      queries: [
        'Average lesson attendance per group',
        'Revenue by teacher and month',
        'Student progress by level',
        'Classroom utilization',
        'Payment trends analysis'
      ]
    };
  }
}

// Бенчмарк утиліти
export class BenchmarkUtils {
  // Вимірювання часу рендерингу компонентів
  static async measureRenderTime(componentName: string, renderFunction: () => Promise<void>): Promise<number> {
    const start = performance.now();
    await renderFunction();
    const end = performance.now();
    
    console.log(`${componentName} render time: ${end - start}ms`);
    return end - start;
  }

  // Вимірювання часу API запиту
  static async measureApiCall(apiName: string, apiFunction: () => Promise<any>): Promise<{ result: any; duration: number }> {
    const start = performance.now();
    const result = await apiFunction();
    const end = performance.now();
    
    console.log(`${apiName} API call time: ${end - start}ms`);
    return { result, duration: end - start };
  }

  // Вимірювання memory usage
  static getMemoryUsage(): { used: number; total: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize
      };
    }
    return { used: 0, total: 0 };
  }

  // Створення навантаження
  static async createLoadTest(testName: string, concurrentRequests: number, requestFunction: () => Promise<any>) {
    console.log(`Starting load test: ${testName} with ${concurrentRequests} concurrent requests`);
    
    const promises = Array.from({ length: concurrentRequests }, () => requestFunction());
    const results = await Promise.all(promises);
    
    const durations = results.map(r => r.duration || 0);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    console.log(`Load test results for ${testName}:`, {
      requests: concurrentRequests,
      avgDuration: avgDuration.toFixed(2) + 'ms',
      maxDuration: maxDuration.toFixed(2) + 'ms',
      minDuration: minDuration.toFixed(2) + 'ms'
    });
    
    return { avgDuration, maxDuration, minDuration, results };
  }
}

// Експорт для використання в тестах
export { TestDataGenerator as default };
