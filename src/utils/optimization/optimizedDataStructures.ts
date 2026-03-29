// Оптимізовані структури даних для LMS системи
import { Student, EnglishLevel, Lesson, LessonStatus } from '@/types/lms';

// Оптимізована структура для студентів з індексуванням
export class OptimizedStudentRegistry {
  private studentsById = new Map<string, Student>();
  private studentsByLevel = new Map<EnglishLevel, Set<string>>();
  private studentsByGroup = new Map<string, Set<string>>();
  private studentsByEmail = new Map<string, string>();
  private searchIndex = new Map<string, Set<string>>(); // Для пошуку
  
  // Додавання студента з O(1) складністю
  addStudent(student: Student): void {
    this.studentsById.set(student.id, student);
    
    // Оновлення індексів
    if (!this.studentsByLevel.has(student.level)) {
      this.studentsByLevel.set(student.level, new Set());
    }
    this.studentsByLevel.get(student.level)!.add(student.id);
    
    if (student.enrolledGroups) {
      student.enrolledGroups.forEach(groupId => {
        if (!this.studentsByGroup.has(groupId)) {
          this.studentsByGroup.set(groupId, new Set());
        }
        this.studentsByGroup.get(groupId)!.add(student.id);
      });
    }
    
    this.studentsByEmail.set(student.email, student.id);
    
    // Побудова пошукового індексу
    this.buildSearchIndex(student);
  }
  
  // Швидкий пошук за ID - O(1)
  getStudentById(id: string): Student | undefined {
    return this.studentsById.get(id);
  }
  
  // Швидкий пошук за рівнем - O(1) для отримання Set, O(n) для конвертації
  getStudentsByLevel(level: EnglishLevel): Student[] {
    const ids = this.studentsByLevel.get(level);
    if (!ids) return [];
    
    return Array.from(ids).map(id => this.studentsById.get(id)!).filter(Boolean);
  }
  
  // Швидкий пошук за групою - O(1) для отримання Set, O(n) для конвертації
  getStudentsByGroup(groupId: string): Student[] {
    const ids = this.studentsByGroup.get(groupId);
    if (!ids) return [];
    
    return Array.from(ids).map(id => this.studentsById.get(id)!).filter(Boolean);
  }
  
  // Оптимізований пошук з індексом
  searchStudents(query: string): Student[] {
    const normalizedQuery = query.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);
    
    if (words.length === 0) return [];
    
    // Починаємо з найрідкісного слова
    const sortedWords = words.sort((a, b) => 
      (this.searchIndex.get(b)?.size || 0) - (this.searchIndex.get(a)?.size || 0)
    );
    
    let resultIds: Set<string> | null = null;
    
    for (const word of sortedWords) {
      const wordIds = this.searchIndex.get(word);
      if (!wordIds) {
        resultIds = null;
        break;
      }
      
      if (!resultIds) {
        resultIds = new Set(wordIds);
      } else {
        // Перетин результатів
        resultIds = new Set([...resultIds].filter(id => wordIds.has(id)));
        if (resultIds.size === 0) break;
      }
    }
    
    if (!resultIds) return [];
    
    return Array.from(resultIds)
      .map(id => this.studentsById.get(id)!)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Оптимізована фільтрація
  filterStudents(filters: {
    level?: EnglishLevel;
    groupId?: string;
    minBalance?: number;
    maxBalance?: number;
    nameQuery?: string;
  }): Student[] {
    let candidates: Student[];
    
    // Починаємо з найменшого набору
    if (filters.level) {
      candidates = this.getStudentsByLevel(filters.level);
    } else if (filters.groupId) {
      candidates = this.getStudentsByGroup(filters.groupId);
    } else if (filters.nameQuery) {
      candidates = this.searchStudents(filters.nameQuery);
    } else {
      candidates = Array.from(this.studentsById.values());
    }
    
    // Подальша фільтрація
    return candidates.filter(student => {
      if (filters.minBalance !== undefined && student.balance < filters.minBalance) return false;
      if (filters.maxBalance !== undefined && student.balance > filters.maxBalance) return false;
      if (filters.groupId && !student.enrolledGroups?.includes(filters.groupId)) return false;
      if (filters.nameQuery && !this.matchesQuery(student, filters.nameQuery)) return false;
      return true;
    });
  }
  
  // Побудова пошукового індексу
  private buildSearchIndex(student: Student): void {
    const words = [
      student.name.toLowerCase(),
      student.email.toLowerCase(),
      ...student.name.toLowerCase().split(/\s+/),
      ...student.email.toLowerCase().split(/[@._-]/)
    ];
    
    words.forEach(word => {
      if (word.length < 2) return;
      
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(student.id);
    });
  }
  
  private matchesQuery(student: Student, query: string): boolean {
    const normalizedQuery = query.toLowerCase();
    return student.name.toLowerCase().includes(normalizedQuery) ||
           student.email.toLowerCase().includes(normalizedQuery);
  }
  
  // Статистика
  getStats(): {
    total: number;
    byLevel: Record<EnglishLevel, number>;
    byGroup: Record<string, number>;
    averageBalance: number;
  } {
    const students = Array.from(this.studentsById.values());
    
    const byLevel: Record<EnglishLevel, number> = {
      'A1': 0, 'A2': 0, 'B1': 0, 'B2': 0, 'C1': 0, 'C2': 0
    };
    
    students.forEach(student => {
      byLevel[student.level]++;
    });
    
    const byGroup: Record<string, number> = {};
    this.studentsByGroup.forEach((ids, groupId) => {
      byGroup[groupId] = ids.size;
    });
    
    const averageBalance = students.length > 0 
      ? students.reduce((sum, s) => sum + s.balance, 0) / students.length 
      : 0;
    
    return {
      total: students.length,
      byLevel,
      byGroup,
      averageBalance
    };
  }
}

// Оптимізована структура для уроків з часовим індексуванням
export class OptimizedLessonRegistry {
  private lessonsById = new Map<string, Lesson>();
  private lessonsByDate = new Map<string, Set<string>>();
  private lessonsByTeacher = new Map<string, Set<string>>();
  private lessonsByGroup = new Map<string, Set<string>>();
  private lessonsByStatus = new Map<LessonStatus, Set<string>>();
  
  // Часовий індекс для швидкого пошуку по діапазону дат
  private dateIndex: string[] = [];
  
  addLesson(lesson: Lesson): void {
    this.lessonsById.set(lesson.id, lesson);
    
    // Індексування по даті
    if (!this.lessonsByDate.has(lesson.date)) {
      this.lessonsByDate.set(lesson.date, new Set());
    }
    this.lessonsByDate.get(lesson.date)!.add(lesson.id);
    
    // Індексування по викладачу
    if (!this.lessonsByTeacher.has(lesson.teacherId)) {
      this.lessonsByTeacher.set(lesson.teacherId, new Set());
    }
    this.lessonsByTeacher.get(lesson.teacherId)!.add(lesson.id);
    
    // Індексування по групі
    if (lesson.groupId) {
      if (!this.lessonsByGroup.has(lesson.groupId)) {
        this.lessonsByGroup.set(lesson.groupId, new Set());
      }
      this.lessonsByGroup.get(lesson.groupId)!.add(lesson.id);
    }
    
    // Індексування по статусу
    if (!this.lessonsByStatus.has(lesson.status)) {
      this.lessonsByStatus.set(lesson.status, new Set());
    }
    this.lessonsByStatus.get(lesson.status)!.add(lesson.id);
    
    // Оновлення часового індексу
    this.updateDateIndex(lesson.date);
  }
  
  // Швидкий пошук уроків по діапазону дат
  getLessonsByDateRange(startDate: string, endDate: string): Lesson[] {
    const result: Lesson[] = [];
    
    // Використовуємо бінарний пошук для ефективного знаходження діапазону
    const startIndex = this.findDateIndex(startDate, true);
    const endIndex = this.findDateIndex(endDate, false);
    
    for (let i = startIndex; i <= endIndex; i++) {
      const date = this.dateIndex[i];
      const lessonIds = this.lessonsByDate.get(date);
      if (lessonIds) {
        lessonIds.forEach(id => {
          const lesson = this.lessonsById.get(id);
          if (lesson) result.push(lesson);
        });
      }
    }
    
    return result.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }
  
  // Швидкий пошук уроків для викладача
  getLessonsByTeacher(teacherId: string, options?: {
    startDate?: string;
    endDate?: string;
    status?: LessonStatus;
  }): Lesson[] {
    const ids = this.lessonsByTeacher.get(teacherId);
    if (!ids) return [];
    
    let lessons = Array.from(ids).map(id => this.lessonsById.get(id)!).filter(Boolean);
    
    // Додаткова фільтрація
    if (options?.startDate || options?.endDate) {
      lessons = lessons.filter(lesson => {
        if (options.startDate && lesson.date < options.startDate) return false;
        if (options.endDate && lesson.date > options.endDate) return false;
        return true;
      });
    }
    
    if (options?.status) {
      lessons = lessons.filter(lesson => lesson.status === options.status);
    }
    
    return lessons.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }
  
  // Оптимізована статистика по групах
  getGroupStatistics(groupId: string): {
    totalLessons: number;
    completedLessons: number;
    upcomingLessons: number;
    averageAttendance: number;
    totalRevenue: number;
  } {
    const lessonIds = this.lessonsByGroup.get(groupId);
    if (!lessonIds) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        upcomingLessons: 0,
        averageAttendance: 0,
        totalRevenue: 0
      };
    }
    
    const lessons = Array.from(lessonIds).map(id => this.lessonsById.get(id)!).filter(Boolean);
    
    const completedLessons = lessons.filter(l => l.status === 'COMPLETED').length;
    const upcomingLessons = lessons.filter(l => l.status === 'SCHEDULED').length;
    
    // Розрахунок середньої відвідуваності
    const attendedLessons = lessons.filter(l => l.status === 'COMPLETED' && l.attendees);
    const totalAttendees = attendedLessons.reduce((sum, l) => sum + (l.attendees?.length || 0), 0);
    const averageAttendance = attendedLessons.length > 0 ? totalAttendees / attendedLessons.length : 0;
    
    // Загальний дохід
    const totalRevenue = lessons
      .filter(l => l.status === 'COMPLETED')
      .reduce((sum, l) => sum + (l.cost * (l.attendees?.length || 0)), 0);
    
    return {
      totalLessons: lessons.length,
      completedLessons,
      upcomingLessons,
      averageAttendance,
      totalRevenue
    };
  }
  
  private updateDateIndex(date: string): void {
    if (!this.dateIndex.includes(date)) {
      this.dateIndex.push(date);
      this.dateIndex.sort();
    }
  }
  
  private findDateIndex(targetDate: string, findStart: boolean): number {
    let left = 0;
    let right = this.dateIndex.length - 1;
    let result = findStart ? this.dateIndex.length : 0;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midDate = this.dateIndex[mid];
      
      if (midDate === targetDate) {
        return mid;
      } else if (midDate < targetDate) {
        left = mid + 1;
        if (findStart) result = mid + 1;
      } else {
        right = mid - 1;
        if (!findStart) result = mid;
      }
    }
    
    return result;
  }
}

// Object Pool для зменшення алокації пам'яті
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;
  
  constructor(createFn: () => T, resetFn: (obj: T) => void, maxSize: number = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }
  
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }
  
  clear(): void {
    this.pool.length = 0;
  }
  
  getStats(): { available: number; created: number } {
    return {
      available: this.pool.length,
      created: this.maxSize - this.pool.length
    };
  }
}

// Оптимізований кеш для результатів обчислень
export class ComputationCache<K, V> {
  private cache = new Map<string, { value: V; timestamp: number; ttl: number }>();
  private defaultTTL: number;
  
  constructor(defaultTTL: number = 300000) { // 5 хвилин за замовчуванням
    this.defaultTTL = defaultTTL;
  }
  
  set(key: K, value: V, ttl?: number): void {
    const keyStr = this.serializeKey(key);
    this.cache.set(keyStr, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }
  
  get(key: K): V | undefined {
    const keyStr = this.serializeKey(key);
    const entry = this.cache.get(keyStr);
    
    if (!entry) return undefined;
    
    // Перевірка TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(keyStr);
      return undefined;
    }
    
    return entry.value;
  }
  
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }
  
  delete(key: K): boolean {
    const keyStr = this.serializeKey(key);
    return this.cache.delete(keyStr);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // Очищення застарілих записів
  cleanup(): number {
    let removed = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }
  
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  } {
    return {
      size: this.cache.size,
      hitRate: 0, // Потрібно відстежувати hits/misses
      memoryUsage: this.cache.size * 100 // Приблизно
    };
  }
  
  private serializeKey(key: K): string {
    if (typeof key === 'string') return key;
    if (typeof key === 'number') return key.toString();
    return JSON.stringify(key);
  }
}

// Оптимізований масив з підтримкою ефективних операцій
export class OptimizedArray<T> {
  private items: T[] = [];
  private indexMap = new Map<string, number>();
  private getKeyFn: (item: T) => string;
  
  constructor(getKeyFn: (item: T) => string) {
    this.getKeyFn = getKeyFn;
  }
  
  add(item: T): void {
    const key = this.getKeyFn(item);
    if (this.indexMap.has(key)) {
      // Оновлення існуючого елемента
      const index = this.indexMap.get(key)!;
      this.items[index] = item;
    } else {
      // Додавання нового елемента
      this.indexMap.set(key, this.items.length);
      this.items.push(item);
    }
  }
  
  remove(key: string): boolean {
    const index = this.indexMap.get(key);
    if (index === undefined) return false;
    
    // Видаляємо елемент та оновлюємо індекси
    this.items.splice(index, 1);
    this.indexMap.delete(key);
    
    // Оновлюємо індекси для елементів після видаленого
    for (let i = index; i < this.items.length; i++) {
      const itemKey = this.getKeyFn(this.items[i]);
      this.indexMap.set(itemKey, i);
    }
    
    return true;
  }
  
  get(key: string): T | undefined {
    const index = this.indexMap.get(key);
    return index !== undefined ? this.items[index] : undefined;
  }
  
  has(key: string): boolean {
    return this.indexMap.has(key);
  }
  
  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }
  
  sort(compareFn?: (a: T, b: T) => number): this {
    this.items.sort(compareFn);
    
    // Оновлюємо індекси після сортування
    this.indexMap.clear();
    this.items.forEach((item, index) => {
      this.indexMap.set(this.getKeyFn(item), index);
    });
    
    return this;
  }
  
  toArray(): T[] {
    return [...this.items];
  }
  
  get size(): number {
    return this.items.length;
  }
  
  clear(): void {
    this.items.length = 0;
    this.indexMap.clear();
  }
}
