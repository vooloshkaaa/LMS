// Експорт всіх профілерів та утиліт
export * from './cpuProfiler';
export * from './memoryProfiler';
export * from './databaseProfiler';

// Імпорт глобальних екземплярів
import { globalCPUProfiler } from './cpuProfiler';
import { globalMemoryProfiler } from './memoryProfiler';
import { globalDatabaseProfiler } from './databaseProfiler';

// Комбінований профілер для комплексного моніторингу
export class CombinedProfiler {
  private cpuProfiler = globalCPUProfiler;
  private memoryProfiler = globalMemoryProfiler;
  private databaseProfiler = globalDatabaseProfiler;
  private activeSessions: Map<string, ProfilingSession> = new Map();

  // Початок комплексної сесії профілювання
  startSession(name: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ProfilingSession = {
      id: sessionId,
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      cpuProfileId: this.cpuProfiler.startProfiling(`${name}_cpu`),
      memoryBaseline: this.memoryProfiler.takeSnapshot(`${name}_baseline`),
      databaseProfileId: this.databaseProfiler.startProfiling(`${name}_database`),
      memoryMonitoring: true
    };
    
    this.activeSessions.set(sessionId, session);
    this.memoryProfiler.startMonitoring(5000); // Моніторинг кожні 5 секунд
    
    console.log(`Combined profiling session started: ${name} (${sessionId})`);
    return sessionId;
  }

  // Зупинка сесії профілювання
  stopSession(sessionId: string): ProfilingSession | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      console.warn(`Session not found: ${sessionId}`);
      return null;
    }

    session.endTime = performance.now();
    session.duration = session.endTime - session.startTime;
    
    // Зупинка всіх профілерів
    session.cpuProfile = this.cpuProfiler.stopProfiling();
    session.memorySnapshot = this.memoryProfiler.takeSnapshot(`${session.name}_final`);
    session.databaseProfile = this.databaseProfiler.stopProfiling();
    
    this.memoryProfiler.stopMonitoring();
    
    // Аналіз результатів
    session.analysis = this.analyzeSession(session);
    
    this.activeSessions.delete(sessionId);
    
    console.log(`Combined profiling session completed: ${session.name} in ${session.duration.toFixed(2)}ms`);
    return session;
  }

  // Аналіз сесії
  private analyzeSession(session: ProfilingSession): SessionAnalysis {
    const analysis: SessionAnalysis = {
      performanceGrade: 'A',
      bottlenecks: [],
      recommendations: [],
      metrics: {
        cpuTime: session.cpuProfile?.duration || 0,
        memoryGrowth: session.memorySnapshot ? 
          session.memorySnapshot.heapUsed - session.memoryBaseline.heapUsed : 0,
        databaseTime: session.databaseProfile?.duration || 0,
        databaseQueries: session.databaseProfile?.summary.totalQueries || 0,
        slowQueries: session.databaseProfile?.summary.slowQueries.length || 0
      }
    };

    // Оцінка продуктивності
    let score = 100;
    
    // CPU оцінка
    if (analysis.metrics.cpuTime > 1000) score -= 20;
    else if (analysis.metrics.cpuTime > 500) score -= 10;
    
    // Memory оцінка
    if (analysis.metrics.memoryGrowth > 50 * 1024 * 1024) score -= 20; // > 50MB
    else if (analysis.metrics.memoryGrowth > 20 * 1024 * 1024) score -= 10; // > 20MB
    
    // Database оцінка
    if (analysis.metrics.slowQueries > 0) score -= 15;
    if (analysis.metrics.databaseTime > 2000) score -= 15;
    else if (analysis.metrics.databaseTime > 1000) score -= 5;

    // Визначення grade
    if (score >= 90) analysis.performanceGrade = 'A';
    else if (score >= 80) analysis.performanceGrade = 'B';
    else if (score >= 70) analysis.performanceGrade = 'C';
    else if (score >= 60) analysis.performanceGrade = 'D';
    else analysis.performanceGrade = 'F';

    // Генерація рекомендацій
    if (analysis.metrics.cpuTime > 500) {
      analysis.recommendations.push('Consider optimizing CPU-intensive operations');
      analysis.bottlenecks.push('High CPU usage');
    }
    
    if (analysis.metrics.memoryGrowth > 20 * 1024 * 1024) {
      analysis.recommendations.push('Check for memory leaks or optimize memory usage');
      analysis.bottlenecks.push('High memory growth');
    }
    
    if (analysis.metrics.slowQueries > 0) {
      analysis.recommendations.push('Optimize database queries or add indexes');
      analysis.bottlenecks.push('Slow database queries');
    }
    
    if (analysis.metrics.databaseTime > 1000) {
      analysis.recommendations.push('Consider database connection pooling or caching');
      analysis.bottlenecks.push('High database latency');
    }

    return analysis;
  }

  // Отримання всіх сесій
  getSessions(): ProfilingSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Експорт всіх даних
  exportAllData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      cpuData: this.cpuProfiler.exportData(),
      memoryData: this.memoryProfiler.exportData(),
      databaseData: this.databaseProfiler.exportData(),
      sessions: this.getSessions()
    };
    
    return JSON.stringify(data, null, 2);
  }
}

// Інтерфейси для комбінованого профілера
export interface ProfilingSession {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  cpuProfileId: string;
  cpuProfile?: any;
  memoryBaseline: any;
  memorySnapshot?: any;
  databaseProfileId: string;
  databaseProfile?: any;
  memoryMonitoring: boolean;
  analysis?: SessionAnalysis;
}

export interface SessionAnalysis {
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  bottlenecks: string[];
  recommendations: string[];
  metrics: {
    cpuTime: number;
    memoryGrowth: number;
    databaseTime: number;
    databaseQueries: number;
    slowQueries: number;
  };
}

// Глобальний екземпляр комбінованого профілера
export const globalCombinedProfiler = new CombinedProfiler();

// Hook для використання в React компонентах
export const useCombinedProfiler = () => {
  const startSession = (name: string) => globalCombinedProfiler.startSession(name);
  const stopSession = (sessionId: string) => globalCombinedProfiler.stopSession(sessionId);
  const getSessions = () => globalCombinedProfiler.getSessions();
  const exportData = () => globalCombinedProfiler.exportAllData();
  
  return {
    startSession,
    stopSession,
    getSessions,
    exportData
  };
};

// Утиліти для автоматичного профілювання
export class ProfilingAutomation {
  // Автоматичне профілювання при завантаженні сторінки
  static async profilePageLoad(pageName: string): Promise<ProfilingSession> {
    const sessionId = globalCombinedProfiler.startSession(`page_load_${pageName}`);
    
    // Симуляція завантаження сторінки
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return globalCombinedProfiler.stopSession(sessionId)!;
  }
  
  // Профілювання дій користувача
  static async profileUserAction(actionName: string, actionFn: () => Promise<void>): Promise<ProfilingSession> {
    const sessionId = globalCombinedProfiler.startSession(`user_action_${actionName}`);
    
    try {
      await actionFn();
      return globalCombinedProfiler.stopSession(sessionId)!;
    } catch (error) {
      globalCombinedProfiler.stopSession(sessionId);
      throw error;
    }
  }
  
  // Періодичне профілювання
  static startPeriodicProfiling(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      const sessionId = globalCombinedProfiler.startSession(`periodic_${Date.now()}`);
      
      setTimeout(() => {
        const session = globalCombinedProfiler.stopSession(sessionId);
        if (session && session.analysis?.performanceGrade === 'F') {
          console.warn(`Poor performance detected in periodic check: ${session.analysis.bottlenecks.join(', ')}`);
        }
      }, 5000); // Профілювання протягом 5 секунд
    }, intervalMs);
  }
}

// Ініціалізація профілерів
export const initializeProfilers = () => {
  // Встановлення baseline для memory
  globalMemoryProfiler.setBaseline('initial');
  
  // Початок базового моніторингу
  globalMemoryProfiler.startMonitoring(10000); // Кожні 10 секунд
  
  console.log('Profilers initialized successfully');
};

// Експорт за замовчуванням
export default {
  cpuProfiler: globalCPUProfiler,
  memoryProfiler: globalMemoryProfiler,
  databaseProfiler: globalDatabaseProfiler,
  combinedProfiler: globalCombinedProfiler,
  initializeProfilers,
  ProfilingAutomation
};
