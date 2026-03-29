import { logger } from '@/utils/logger';

// Інтерфейси для memory профілювання
export interface MemorySnapshot {
  id: string;
  name: string;
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  detailed?: MemoryDetails;
}

export interface MemoryDetails {
  objects: MemoryObject[];
  totalObjects: number;
  totalSize: number;
  largestObjects: MemoryObject[];
  objectTypes: ObjectTypeStats[];
}

export interface MemoryObject {
  id: string;
  type: string;
  size: number;
  name?: string;
  retainedSize: number;
  retainedPath: string[];
}

export interface ObjectTypeStats {
  type: string;
  count: number;
  totalSize: number;
  averageSize: number;
  percentage: number;
}

export interface MemoryLeak {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  objects: MemoryObject[];
  recommendation: string;
}

export interface MemoryTrend {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  growth: number;
  growthRate: number;
}

// Memory Profiler клас
export class MemoryProfiler {
  private snapshots: Map<string, MemorySnapshot> = new Map();
  private trends: MemoryTrend[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private baseline: MemorySnapshot | null = null;
  private objectRegistry: Map<string, MemoryObject> = new Map();

  // Створення snapshot пам'яті
  takeSnapshot(name: string): MemorySnapshot {
    const memory = this.getMemoryInfo();
    const snapshot: MemorySnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external || 0,
      arrayBuffers: memory.arrayBuffers || 0
    };

    // Детальний аналіз (якщо доступно)
    if ('memory' in performance && (performance as any).memory) {
      snapshot.detailed = this.analyzeMemoryDetails();
    }

    this.snapshots.set(snapshot.id, snapshot);
    this.updateTrend(snapshot);
    
    logger.info(`Memory snapshot taken: ${name} - ${(snapshot.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    return snapshot;
  }

  // Початок моніторингу пам'яті
  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      this.takeSnapshot('auto-monitoring');
    }, intervalMs);
    
    logger.info(`Memory monitoring started (interval: ${intervalMs}ms)`);
  }

  // Зупинка моніторингу
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Memory monitoring stopped');
    }
  }

  // Встановлення baseline
  setBaseline(name: string = 'baseline'): MemorySnapshot {
    this.baseline = this.takeSnapshot(name);
    logger.info(`Memory baseline set: ${(this.baseline.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    return this.baseline;
  }

  // Пошук memory leaks
  detectLeaks(): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    
    if (!this.baseline) {
      logger.warn('No baseline set for leak detection');
      return leaks;
    }

    const snapshots = Array.from(this.snapshots.values()).sort((a, b) => a.timestamp - b.timestamp);
    if (snapshots.length < 2) {
      logger.warn('Not enough snapshots for leak detection');
      return leaks;
    }

    // Аналіз росту пам'яті
    const growth = this.calculateGrowth(this.baseline, snapshots[snapshots.length - 1]);
    const growthRate = this.calculateGrowthRate();

    // Детекція potential leaks
    if (growth > 50 * 1024 * 1024) { // > 50MB growth
      leaks.push({
        id: `leak_${Date.now()}`,
        description: `Significant memory growth detected: ${(growth / 1024 / 1024).toFixed(2)}MB`,
        severity: growth > 100 * 1024 * 1024 ? 'critical' : 'high',
        objects: [],
        recommendation: 'Check for event listeners, timers, or circular references'
      });
    }

    if (growthRate > 1) { // > 1MB/min
      leaks.push({
        id: `leak_rate_${Date.now()}`,
        description: `High memory growth rate: ${growthRate.toFixed(2)}MB/min`,
        severity: growthRate > 5 ? 'high' : growthRate > 2 ? 'medium' : 'low',
        objects: [],
        recommendation: 'Monitor for memory leaks in long-running operations'
      });
    }

    // Аналіз об'єктів (якщо доступно)
    const recentSnapshots = snapshots.slice(-5);
    const objectLeaks = this.analyzeObjectLeaks(recentSnapshots);
    leaks.push(...objectLeaks);

    return leaks;
  }

  // Аналіз використання пам'яті
  analyzeUsage(): {
    current: MemorySnapshot;
    baseline: MemorySnapshot | null;
    growth: number;
    growthPercentage: number;
    trend: 'stable' | 'increasing' | 'decreasing';
    recommendations: string[];
  } {
    const current = this.getCurrentSnapshot();
    const baseline = this.baseline;
    
    if (!baseline) {
      return {
        current,
        baseline: null,
        growth: 0,
        growthPercentage: 0,
        trend: 'stable',
        recommendations: ['Set a baseline for comparison']
      };
    }

    const growth = current.heapUsed - baseline.heapUsed;
    const growthPercentage = (growth / baseline.heapUsed) * 100;
    
    // Визначення тренду
    const recentTrends = this.trends.slice(-10);
    let trend: 'stable' | 'increasing' | 'decreasing' = 'stable';
    
    if (recentTrends.length >= 3) {
      const avgGrowth = recentTrends.reduce((sum, t) => sum + t.growth, 0) / recentTrends.length;
      trend = avgGrowth > 1024 * 1024 ? 'increasing' : avgGrowth < -1024 * 1024 ? 'decreasing' : 'stable';
    }

    // Генерація рекомендацій
    const recommendations: string[] = [];
    
    if (growthPercentage > 50) {
      recommendations.push('Consider implementing object pooling or recycling');
    }
    
    if (trend === 'increasing') {
      recommendations.push('Monitor for potential memory leaks');
    }
    
    if (current.heapUsed > 500 * 1024 * 1024) { // > 500MB
      recommendations.push('Consider implementing lazy loading or pagination');
    }

    return {
      current,
      baseline,
      growth,
      growthPercentage,
      trend,
      recommendations
    };
  }

  // Очищення об'єктів
  forceGC(): void {
    if ('gc' in global) {
      (global as any).gc();
      logger.info('Manual garbage collection triggered');
    } else {
      logger.warn('Manual garbage collection not available');
    }
  }

  // Отримання поточного snapshot
  getCurrentSnapshot(): MemorySnapshot {
    return this.takeSnapshot('current');
  }

  // Отримання всіх snapshots
  getSnapshots(): MemorySnapshot[] {
    return Array.from(this.snapshots.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  // Експорт даних
  exportData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      snapshots: this.getSnapshots(),
      trends: this.trends,
      baseline: this.baseline,
      leaks: this.detectLeaks(),
      analysis: this.analyzeUsage()
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Очищення даних
  clearData(): void {
    this.snapshots.clear();
    this.trends = [];
    this.baseline = null;
    this.objectRegistry.clear();
    logger.info('Memory profiler data cleared');
  }

  // Приватні методи
  private getMemoryInfo(): {
    heapUsed: number;
    heapTotal: number;
    external?: number;
    arrayBuffers?: number;
  } {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: memory.external || 0,
        arrayBuffers: memory.arrayBuffers || 0
      };
    }
    
    // Fallback для Node.js
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: 0
      };
    }
    
    throw new Error('Memory information not available');
  }

  private analyzeMemoryDetails(): MemoryDetails {
    // Симуляція детального аналізу (в реальному сценарії потрібно використовувати heap snapshot API)
    const objects: MemoryObject[] = [];
    const objectTypes: Map<string, ObjectTypeStats> = new Map();
    
    // Симуляція різних типів об'єктів
    const commonTypes = ['Array', 'Object', 'String', 'Function', 'Date', 'RegExp'];
    
    commonTypes.forEach(type => {
      const count = Math.floor(Math.random() * 1000) + 100;
      const avgSize = Math.floor(Math.random() * 1000) + 100;
      const totalSize = count * avgSize;
      
      objectTypes.set(type, {
        type,
        count,
        totalSize,
        averageSize: avgSize,
        percentage: 0 // буде розраховано нижче
      });
    });
    
    const totalSize = Array.from(objectTypes.values()).reduce((sum, stat) => sum + stat.totalSize, 0);
    
    // Розрахунок процентів
    objectTypes.forEach(stat => {
      stat.percentage = (stat.totalSize / totalSize) * 100;
    });
    
    return {
      objects,
      totalObjects: Array.from(objectTypes.values()).reduce((sum, stat) => sum + stat.count, 0),
      totalSize,
      largestObjects: objects.slice(0, 10),
      objectTypes: Array.from(objectTypes.values()).sort((a, b) => b.totalSize - a.totalSize)
    };
  }

  private updateTrend(snapshot: MemorySnapshot): void {
    const lastTrend = this.trends[this.trends.length - 1];
    const growth = lastTrend ? snapshot.heapUsed - lastTrend.heapUsed : 0;
    const growthRate = this.trends.length >= 2 ? 
      growth / ((snapshot.timestamp - this.trends[this.trends.length - 2].timestamp) / 60000) : 0; // MB/min
    
    const trend: MemoryTrend = {
      timestamp: snapshot.timestamp,
      heapUsed: snapshot.heapUsed,
      heapTotal: snapshot.heapTotal,
      growth,
      growthRate
    };
    
    this.trends.push(trend);
    
    // Зберігаємо тільки останні 100 точок
    if (this.trends.length > 100) {
      this.trends = this.trends.slice(-100);
    }
  }

  private calculateGrowth(snapshot1: MemorySnapshot, snapshot2: MemorySnapshot): number {
    return snapshot2.heapUsed - snapshot1.heapUsed;
  }

  private calculateGrowthRate(): number {
    if (this.trends.length < 2) return 0;
    
    const recentTrends = this.trends.slice(-10);
    const totalGrowth = recentTrends.reduce((sum, t) => sum + t.growth, 0);
    const timeSpan = (recentTrends[recentTrends.length - 1].timestamp - recentTrends[0].timestamp) / 60000; // minutes
    
    return timeSpan > 0 ? totalGrowth / timeSpan / (1024 * 1024) : 0; // MB/min
  }

  private analyzeObjectLeaks(snapshots: MemorySnapshot[]): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    
    // Симуляція аналізу об'єктів для детекції leaks
    // В реальному сценарії потрібно аналізувати heap snapshots
    
    return leaks;
  }
}

// Глобальний екземпляр memory profiler
export const globalMemoryProfiler = new MemoryProfiler();

// Hook для використання в React компонентах
export const useMemoryProfiler = () => {
  const takeSnapshot = (name: string) => globalMemoryProfiler.takeSnapshot(name);
  const startMonitoring = (intervalMs?: number) => globalMemoryProfiler.startMonitoring(intervalMs);
  const stopMonitoring = () => globalMemoryProfiler.stopMonitoring();
  const setBaseline = (name?: string) => globalMemoryProfiler.setBaseline(name);
  const detectLeaks = () => globalMemoryProfiler.detectLeaks();
  const analyzeUsage = () => globalMemoryProfiler.analyzeUsage();
  
  return {
    takeSnapshot,
    startMonitoring,
    stopMonitoring,
    setBaseline,
    detectLeaks,
    analyzeUsage
  };
};

// Утиліти для memory management
export class MemoryUtils {
  // Очищення масивів
  static clearArray<T>(array: T[]): void {
    array.length = 0;
  }
  
  // Очищення об'єкта
  static clearObject(obj: Record<string, any>): void {
    Object.keys(obj).forEach(key => delete obj[key]);
  }
  
  // Очищення Map
  static clearMap<K, V>(map: Map<K, V>): void {
    map.clear();
  }
  
  // Очищення Set
  static clearSet<T>(set: Set<T>): void {
    set.clear();
  }
  
  // Видалення event listeners
  static removeEventListeners(element: Element | Window, events: { type: string; handler: EventListener }[]): void {
    events.forEach(({ type, handler }) => {
      element.removeEventListener(type, handler);
    });
  }
  
  // Очищення інтервалів
  static clearInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
  }
  
  // Очищення timeout
  static clearTimeout(timeoutId: NodeJS.Timeout): void {
    clearTimeout(timeoutId);
  }
  
  // Слабке посилання на об'єкти (fallback для старих браузерів)
  static createWeakRef<T extends object>(obj: T): { deref: () => T | undefined } {
    // WeakRef може бути недоступний в старих браузерах
    const WeakRefConstructor = (globalThis as any).WeakRef;
    if (WeakRefConstructor) {
      const weakRef = new WeakRefConstructor(obj);
      return { deref: () => weakRef.deref() };
    }
    // Fallback для старих браузерів
    let ref = obj;
    return {
      deref: () => ref
    };
  }
  
  // Перевірка чи об'єкт все ще існує
  static getWeakRef<T extends object>(ref: { deref: () => T | undefined }): T | undefined {
    return ref.deref();
  }
}

// Декоратор для автоматичного моніторингу пам'яті
export function MonitorMemory(options: {
  name?: string;
  interval?: number;
  detectLeaks?: boolean;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const monitorName = options.name || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = function (...args: any[]) {
      const snapshotBefore = globalMemoryProfiler.takeSnapshot(`${monitorName}_before`);
      
      try {
        const result = originalMethod.apply(this, args);
        
        const snapshotAfter = globalMemoryProfiler.takeSnapshot(`${monitorName}_after`);
        const growth = snapshotAfter.heapUsed - snapshotBefore.heapUsed;
        
        if (growth > 10 * 1024 * 1024) { // > 10MB
          logger.warn(`High memory usage in ${monitorName}: ${(growth / 1024 / 1024).toFixed(2)}MB`);
        }
        
        return result;
      } catch (error) {
        const snapshotAfter = globalMemoryProfiler.takeSnapshot(`${monitorName}_error`);
        logger.error(`Error in ${monitorName}, memory usage: ${((snapshotAfter.heapUsed - snapshotBefore.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
        throw error;
      }
    };
    
    return descriptor;
  };
}
