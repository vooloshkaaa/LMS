// Оптимізовані запити до бази даних для LMS системи
import { supabase } from '@/lib/supabase';
import { Student, Teacher, Group, Lesson, Payment } from '@/types/lms';
import { ComputationCache } from './optimizedDataStructures';
import { memoize, throttle } from './optimizedAlgorithms';
import { useState, useEffect } from 'react';

// Кеш для результатів запитів
const queryCache = new ComputationCache<string, any>(5 * 60 * 1000); // 5 хвилин

// Оптимізований сервіс для роботи зі студентами
export class OptimizedStudentService {
  // Кешовані запити з автоматичним оновленням
  static getStudents = memoize(async (filters?: {
    level?: string;
    groupId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Student[]> => {
    const cacheKey = `students_${JSON.stringify(filters)}`;
    
    // Перевіряємо кеш
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;
    
    let query = supabase.from('students').select('*');
    
    // Оптимізовані фільтри з індексами
    if (filters?.level) {
      query = query.eq('level', filters.level);
    }
    
    if (filters?.groupId) {
      // Використовуємо спеціальний індекс для group_id
      query = query.contains('enrolledGroups', [filters.groupId]);
    }
    
    // Пагінація для великих наборів даних
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Кешуємо результат
    queryCache.set(cacheKey, data);
    
    return data || [];
  }, (filters) => JSON.stringify(filters));
  
  // Оптимізований пошук з повнотекстовим індексом
  static searchStudents = throttle(async (query: string): Promise<Student[]> => {
    if (!query.trim()) return [];
    
    const cacheKey = `search_students_${query}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;
    
    // Використовуємо повнотекстовий пошук Supabase
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .textSearch('name', query)
      .limit(50); // Обмежуємо результати для продуктивності
    
    if (error) throw error;
    
    queryCache.set(cacheKey, data);
    return data || [];
  }, 300);
  
  // Batch операція для множинних вставок
  static async createStudentsBatch(students: Partial<Student>[]): Promise<Student[]> {
    if (students.length === 0) return [];
    
    // Розбиваємо на частини по 100 записів для уникнення обмежень
    const batches = [];
    for (let i = 0; i < students.length; i += 100) {
      batches.push(students.slice(i, i + 100));
    }
    
    const results: Student[] = [];
    
    for (const batch of batches) {
      const { data, error } = await supabase
        .from('students')
        .insert(batch)
        .select();
      
      if (error) throw error;
      if (data) results.push(...data);
      
      // Очищуємо кеш після вставки
      this.invalidateStudentCache();
    }
    
    return results;
  }
  
  // Оптимізована агрегація
  static async getStudentStatistics(): Promise<{
    total: number;
    byLevel: Record<string, number>;
    averageBalance: number;
    activeGroups: number;
  }> {
    const cacheKey = 'student_statistics';
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;
    
    // Використовуємо RPC функцію для оптимізації
    const { data, error } = await supabase.rpc('get_student_statistics');
    
    if (error) {
      // Fallback до окремих запитів
      const { data: students } = await supabase.from('students').select('level, balance, enrolledGroups');
      
      if (!students) return { total: 0, byLevel: {}, averageBalance: 0, activeGroups: 0 };
      
      const byLevel: Record<string, number> = {};
      let totalBalance = 0;
      const allGroups = new Set<string>();
      
      students.forEach(student => {
        byLevel[student.level] = (byLevel[student.level] || 0) + 1;
        totalBalance += student.balance;
        student.enrolledGroups?.forEach(groupId => allGroups.add(groupId));
      });
      
      const stats = {
        total: students.length,
        byLevel,
        averageBalance: students.length > 0 ? totalBalance / students.length : 0,
        activeGroups: allGroups.size
      };
      
      queryCache.set(cacheKey, stats);
      return stats;
    }
    
    queryCache.set(cacheKey, data);
    return data;
  }
  
  private static invalidateStudentCache(): void {
    // Очищуємо всі пов'язані записи з кешу
    const keysToDelete = Array.from(queryCache['cache'].keys())
      .filter(key => key.startsWith('students_') || key.startsWith('search_students_'));
    
    keysToDelete.forEach(key => queryCache.delete(key));
  }
}

// Оптимізований сервіс для роботи з уроками
export class OptimizedLessonService {
  // Отримання уроків з оптимізованими фільтрами
  static getLessons = memoize(async (filters: {
    teacherId?: string;
    groupId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
  }): Promise<Lesson[]> => {
    const cacheKey = `lessons_${JSON.stringify(filters)}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;
    
    let query = supabase.from('lessons').select('*');
    
    // Використовуємо композитні індекси
    if (filters?.teacherId && filters?.startDate && filters?.endDate) {
      // Композитний індекс (teacher_id, date)
      query = query
        .eq('teacher_id', filters.teacherId)
        .gte('date', filters.startDate)
        .lte('date', filters.endDate);
    } else {
      if (filters?.teacherId) query = query.eq('teacher_id', filters.teacherId);
      if (filters?.groupId) query = query.eq('group_id', filters.groupId);
      if (filters?.startDate) query = query.gte('date', filters.startDate);
      if (filters?.endDate) query = query.lte('date', filters.endDate);
      if (filters?.status) query = query.eq('status', filters.status);
    }
    
    // Сортування по даті та часу для оптимізації
    query = query.order('date').order('startTime');
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    queryCache.set(cacheKey, data);
    return data || [];
  }, (filters) => JSON.stringify(filters));
  
  // Оптимізоване отримання розкладу для викладача
  static async getTeacherSchedule(teacherId: string, weekStart: string): Promise<Lesson[]> {
    const cacheKey = `teacher_schedule_${teacherId}_${weekStart}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;
    
    // Використовуємо оптимізований запит з тижневим діапазоном
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('teacher_id', teacherId)
      .gte('date', weekStart)
      .lte('date', weekEnd.toISOString().split('T')[0])
      .order('date')
      .order('startTime');
    
    if (error) throw error;
    
    queryCache.set(cacheKey, data);
    return data || [];
  }
  
  // Batch операція для створення уроків
  static async createLessonsBatch(lessons: Partial<Lesson>[]): Promise<Lesson[]> {
    if (lessons.length === 0) return [];
    
    // Розбиваємо на частини по 50 для уникнення timeout
    const batches = [];
    for (let i = 0; i < lessons.length; i += 50) {
      batches.push(lessons.slice(i, i + 50));
    }
    
    const results: Lesson[] = [];
    
    for (const batch of batches) {
      const { data, error } = await supabase
        .from('lessons')
        .insert(batch)
        .select();
      
      if (error) throw error;
      if (data) results.push(...data);
      
      // Невелика затримка між batch'ами
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.invalidateLessonCache();
    return results;
  }
  
  // Оптимізована статистика по групах
  static async getGroupStatistics(groupId: string): Promise<{
    totalLessons: number;
    completedLessons: number;
    upcomingLessons: number;
    averageAttendance: number;
    totalRevenue: number;
  }> {
    const cacheKey = `group_stats_${groupId}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;
    
    // Використовуємо RPC функцію для складної агрегації
    const { data, error } = await supabase.rpc('get_group_statistics', { group_id: groupId });
    
    if (error) {
      // Fallback до окремих запитів
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('group_id', groupId);
      
      if (!lessons) return {
        totalLessons: 0,
        completedLessons: 0,
        upcomingLessons: 0,
        averageAttendance: 0,
        totalRevenue: 0
      };
      
      const completedLessons = lessons.filter(l => l.status === 'COMPLETED').length;
      const upcomingLessons = lessons.filter(l => l.status === 'SCHEDULED').length;
      
      const totalAttendees = lessons.reduce((sum, l) => sum + (l.attendees?.length || 0), 0);
      const averageAttendance = completedLessons > 0 ? totalAttendees / completedLessons : 0;
      
      const totalRevenue = lessons
        .filter(l => l.status === 'COMPLETED')
        .reduce((sum, l) => sum + (l.cost * (l.attendees?.length || 0)), 0);
      
      const stats = {
        totalLessons: lessons.length,
        completedLessons,
        upcomingLessons,
        averageAttendance,
        totalRevenue
      };
      
      queryCache.set(cacheKey, stats);
      return stats;
    }
    
    queryCache.set(cacheKey, data);
    return data;
  }
  
  private static invalidateLessonCache(): void {
    const keysToDelete = Array.from(queryCache['cache'].keys())
      .filter(key => key.startsWith('lessons_') || key.startsWith('teacher_schedule_'));
    
    keysToDelete.forEach(key => queryCache.delete(key));
  }
}

// Оптимізований сервіс для платежів
export class OptimizedPaymentService {
  // Отримання платежів з пагінацією
  static getPayments = memoize(async (filters: {
    studentId?: string;
    startDate?: string;
    endDate?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Payment[]> => {
    const cacheKey = `payments_${JSON.stringify(filters)}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;
    
    let query = supabase.from('payments').select('*');
    
    if (filters?.studentId) query = query.eq('student_id', filters.studentId);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.startDate) query = query.gte('date', filters.startDate);
    if (filters?.endDate) query = query.lte('date', filters.endDate);
    
    // Сортування по даті (найновіші перші)
    query = query.order('date', { ascending: false });
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    queryCache.set(cacheKey, data);
    return data || [];
  }, (filters) => JSON.stringify(filters));
  
  // Фінансова статистика з оптимізацією
  static async getFinancialStatistics(dateRange?: {
    startDate: string;
    endDate: string;
  }): Promise<{
    totalRevenue: number;
    revenueByType: Record<string, number>;
    revenueByMonth: Record<string, number>;
    averagePayment: number;
    paymentCount: number;
  }> {
    const cacheKey = `financial_stats_${dateRange ? JSON.stringify(dateRange) : 'all'}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;
    
    let query = supabase.from('payments').select('*');
    
    if (dateRange) {
      query = query
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        totalRevenue: 0,
        revenueByType: {},
        revenueByMonth: {},
        averagePayment: 0,
        paymentCount: 0
      };
    }
    
    // Агрегація на клієнті для зменшення навантаження на БД
    const totalRevenue = data.reduce((sum, p) => sum + p.amount, 0);
    const revenueByType: Record<string, number> = {};
    const revenueByMonth: Record<string, number> = {};
    
    data.forEach(payment => {
      // По типах
      revenueByType[payment.type] = (revenueByType[payment.type] || 0) + payment.amount;
      
      // По місяцях
      const month = payment.date.substring(0, 7); // YYYY-MM
      revenueByMonth[month] = (revenueByMonth[month] || 0) + payment.amount;
    });
    
    const stats = {
      totalRevenue,
      revenueByType,
      revenueByMonth,
      averagePayment: totalRevenue / data.length,
      paymentCount: data.length
    };
    
    queryCache.set(cacheKey, stats);
    return stats;
  }
  
  // Batch створення платежів
  static async createPaymentsBatch(payments: Partial<Payment>[]): Promise<Payment[]> {
    if (payments.length === 0) return [];
    
    const { data, error } = await supabase
      .from('payments')
      .insert(payments)
      .select();
    
    if (error) throw error;
    
    // Очищуємо кеш фінансової статистики
    this.invalidatePaymentCache();
    
    return data || [];
  }
  
  private static invalidatePaymentCache(): void {
    const keysToDelete = Array.from(queryCache['cache'].keys())
      .filter(key => key.startsWith('payments_') || key.startsWith('financial_stats_'));
    
    keysToDelete.forEach(key => queryCache.delete(key));
  }
}

// Сервіс для управління кешем
class DatabaseCacheManager {
  // Очищення застарілого кешу
  static cleanupCache(): number {
    return queryCache.cleanup();
  }
  
  // Примусове очищення кешу для конкретної сутності
  static invalidateEntityCache(entity: 'students' | 'lessons' | 'payments'): void {
    const keysToDelete = Array.from(queryCache['cache'].keys())
      .filter(key => key.startsWith(entity));
    
    keysToDelete.forEach(key => queryCache.delete(key));
  }
  
  // Отримання статистики кешу
  static getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return queryCache.getStats();
  }
  
  // Передзавантаження популярних даних
  static async preloadCommonData(): Promise<void> {
    try {
      // Завантажуємо статистику студентів
      await OptimizedStudentService.getStudentStatistics();
      
      // Завантажуємо фінансову статистику за останній місяць
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      await OptimizedPaymentService.getFinancialStatistics({
        startDate: lastMonth.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      
      console.log('Common data preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload common data:', error);
    }
  }
}

// Оптимізований hook для React компонентів
export function useOptimizedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const staleTime = options?.staleTime || 5 * 60 * 1000; // 5 хвилин
  const cacheTime = options?.cacheTime || 10 * 60 * 1000; // 10 хвилин
  const enabled = options?.enabled !== false;
  
  useEffect(() => {
    if (!enabled) return;
    
    const cacheKey = key;
    const cached = queryCache.get(cacheKey);
    
    if (cached) {
      setData(cached);
      return;
    }
    
    let cancelled = false;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await queryFn();
        
        if (!cancelled) {
          setData(result);
          queryCache.set(cacheKey, result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [key, queryFn, staleTime, cacheTime, enabled]);
  
  // Автоматичне оновлення
  useEffect(() => {
    if (!enabled || !data) return;
    
    const interval = setInterval(async () => {
      try {
        const result = await queryFn();
        setData(result);
        queryCache.set(key, result);
      } catch (err) {
        console.warn('Failed to refresh data:', err);
      }
    }, staleTime);
    
    return () => clearInterval(interval);
  }, [key, queryFn, staleTime, enabled, data]);
  
  return { data, loading, error, refetch: () => queryFn().then(setData) };
}

// Експорт сервісів
export {
  OptimizedStudentService as StudentService,
  OptimizedLessonService as LessonService,
  OptimizedPaymentService as PaymentService,
  DatabaseCacheManager as CacheManager
};
