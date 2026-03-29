import { logger } from '@/utils/logger';

// Інтерфейси для CPU профілювання
export interface CPUProfile {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  samples: CPUSample[];
  functions: ProfiledFunction[];
  summary: ProfileSummary;
}

export interface CPUSample {
  timestamp: number;
  stackTrace: string[];
  cpuTime: number;
}

export interface ProfiledFunction {
  name: string;
  totalTime: number;
  callCount: number;
  averageTime: number;
  maxTime: number;
  percentage: number;
}

export interface ProfileSummary {
  totalSamples: number;
  totalCPUTime: number;
  topFunctions: ProfiledFunction[];
  bottlenecks: ProfiledFunction[];
}

// CPU Profiler клас
export class CPUProfiler {
  private profiles: Map<string, CPUProfile> = new Map();
  private activeProfile: CPUProfile | null = null;
  private samplingInterval: number = 1000; // 1ms
  private samplingTimer: NodeJS.Timeout | null = null;
  private functionStack: string[] = [];
  private functionTimes: Map<string, number[]> = new Map();

  // Початок профілювання
  startProfiling(name: string): string {
    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeProfile = {
      id: profileId,
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      samples: [],
      functions: [],
      summary: {
        totalSamples: 0,
        totalCPUTime: 0,
        topFunctions: [],
        bottlenecks: []
      }
    };

    this.functionStack = [];
    this.functionTimes.clear();
    
    // Початок семплювання
    this.startSampling();
    
    logger.info(`CPU profiling started: ${name} (${profileId})`);
    return profileId;
  }

  // Зупинка профілювання
  stopProfiling(): CPUProfile | null {
    if (!this.activeProfile) {
      logger.warn('No active profile to stop');
      return null;
    }

    this.stopSampling();
    
    const endTime = performance.now();
    this.activeProfile.endTime = endTime;
    this.activeProfile.duration = endTime - this.activeProfile.startTime;
    
    // Аналіз результатів
    this.analyzeProfile();
    
    const profile = this.activeProfile;
    this.profiles.set(profile.id, profile);
    this.activeProfile = null;
    
    logger.info(`CPU profiling completed: ${profile.name} in ${profile.duration.toFixed(2)}ms`);
    return profile;
  }

  // Вимірювання функції
  profileFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    this.functionStack.push(name);
    
    try {
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordFunctionTime(name, duration);
      this.functionStack.pop();
      
      return result;
    } catch (error) {
      this.functionStack.pop();
      throw error;
    }
  }

  // Асинхронне вимірювання функції
  async profileAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    this.functionStack.push(name);
    
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordFunctionTime(name, duration);
      this.functionStack.pop();
      
      return result;
    } catch (error) {
      this.functionStack.pop();
      throw error;
    }
  }

  // Декоратор для профілювання функцій
  static profile(name?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      const profileName = name || `${target.constructor.name}.${propertyKey}`;
      
      descriptor.value = function (...args: any[]) {
        const profiler = (this as any).cpuProfiler || globalCPUProfiler;
        if (profiler) {
          return profiler.profileFunction(profileName, () => originalMethod.apply(this, args));
        }
        return originalMethod.apply(this, args);
      };
      
      return descriptor;
    };
  }

  // Приватні методи
  private startSampling(): void {
    this.samplingTimer = setInterval(() => {
      this.takeSample();
    }, this.samplingInterval);
  }

  private stopSampling(): void {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = null;
    }
  }

  private takeSample(): void {
    if (!this.activeProfile) return;
    
    const sample: CPUSample = {
      timestamp: performance.now(),
      stackTrace: [...this.functionStack],
      cpuTime: this.samplingInterval
    };
    
    this.activeProfile.samples.push(sample);
  }

  private recordFunctionTime(name: string, duration: number): void {
    if (!this.functionTimes.has(name)) {
      this.functionTimes.set(name, []);
    }
    this.functionTimes.get(name)!.push(duration);
  }

  private analyzeProfile(): void {
    if (!this.activeProfile) return;
    
    const functions: ProfiledFunction[] = [];
    const totalCPUTime = this.activeProfile.samples.reduce((sum, sample) => sum + sample.cpuTime, 0);
    
    // Аналіз часу виконання функцій
    for (const [name, times] of this.functionTimes.entries()) {
      const totalTime = times.reduce((sum, time) => sum + time, 0);
      const callCount = times.length;
      const averageTime = totalTime / callCount;
      const maxTime = Math.max(...times);
      const percentage = (totalTime / totalCPUTime) * 100;
      
      functions.push({
        name,
        totalTime,
        callCount,
        averageTime,
        maxTime,
        percentage
      });
    }
    
    // Сортування за загальним часом
    functions.sort((a, b) => b.totalTime - a.totalTime);
    
    // Визначення bottleneck'ів (функції з > 10% часу)
    const bottlenecks = functions.filter(fn => fn.percentage > 10);
    
    this.activeProfile.functions = functions;
    this.activeProfile.summary = {
      totalSamples: this.activeProfile.samples.length,
      totalCPUTime,
      topFunctions: functions.slice(0, 10),
      bottlenecks
    };
  }

  // Отримання результатів
  getProfile(id: string): CPUProfile | undefined {
    return this.profiles.get(id);
  }

  getAllProfiles(): CPUProfile[] {
    return Array.from(this.profiles.values());
  }

  // Очищення результатів
  clearProfiles(): void {
    this.profiles.clear();
  }

  // Експорт профілю в Chrome DevTools формат
  exportProfile(id: string): string | null {
    const profile = this.profiles.get(id);
    if (!profile) return null;
    
    const chromeProfile = {
      'heads-up': 'Chrome Profiler',
      'pid': 0,
      'tid': 0,
      'time': profile.startTime,
      'samples': profile.samples.map((sample, index) => ({
        'timestamp': sample.timestamp - profile.startTime,
        'stackTrace': sample.stackTrace
      })),
      'functions': profile.functions.map(fn => ({
        'name': fn.name,
        'totalTime': fn.totalTime,
        'callCount': fn.callCount,
        'percentage': fn.percentage
      }))
    };
    
    return JSON.stringify(chromeProfile, null, 2);
  }

  // Експорт всіх даних
  exportData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      profiles: this.getAllProfiles(),
      statistics: this.getStatistics()
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Отримання статистики
  getStatistics(): {
    totalProfiles: number;
    averageDuration: number;
    slowestFunction: string;
    bottleneckCount: number;
  } {
    const profiles = this.getAllProfiles();
    if (profiles.length === 0) {
      return {
        totalProfiles: 0,
        averageDuration: 0,
        slowestFunction: '',
        bottleneckCount: 0
      };
    }
    
    const totalDuration = profiles.reduce((sum, p) => sum + p.duration, 0);
    const allFunctions = profiles.flatMap(p => p.functions);
    const slowestFunction = allFunctions.reduce((slowest, fn) => 
      fn.totalTime > (slowest?.totalTime || 0) ? fn : slowest, 
      allFunctions[0]
    );
    const bottleneckCount = profiles.reduce((sum, p) => sum + p.summary.bottlenecks.length, 0);
    
    return {
      totalProfiles: profiles.length,
      averageDuration: totalDuration / profiles.length,
      slowestFunction: slowestFunction?.name || '',
      bottleneckCount
    };
  }
}

// Глобальний екземпляр профайлера
export const globalCPUProfiler = new CPUProfiler();

// Hook для використання в React компонентах
export const useCPUProfiler = (profileName?: string) => {
  const startProfiling = () => globalCPUProfiler.startProfiling(profileName || 'Component Profile');
  const stopProfiling = () => globalCPUProfiler.stopProfiling();
  const profileFunction = <T>(name: string, fn: () => T) => 
    globalCPUProfiler.profileFunction(name, fn);
  
  return { startProfiling, stopProfiling, profileFunction };
};

// Утиліти для автоматичного профілювання
export class ProfilingUtils {
  // Автоматичне профілювання при навантаженні
  static async profileWithLoad<T>(
    name: string, 
    loadFn: () => Promise<T>, 
    iterations: number = 10
  ): Promise<{ result: T; profile: CPUProfile }> {
    const profileId = globalCPUProfiler.startProfiling(name);
    
    try {
      const results = [];
      for (let i = 0; i < iterations; i++) {
        results.push(await loadFn());
      }
      
      const profile = globalCPUProfiler.stopProfiling();
      if (!profile) throw new Error('Profile failed to complete');
      
      return { result: results[0], profile };
    } catch (error) {
      globalCPUProfiler.stopProfiling();
      throw error;
    }
  }
  
  // Порівняльне профілювання
  static async comparePerformance<T>(
    name1: string,
    fn1: () => T,
    name2: string,
    fn2: () => T,
    iterations: number = 100
  ): Promise<{ 
    result1: T; 
    result2: T; 
    profile1: CPUProfile; 
    profile2: CPUProfile;
    comparison: {
      faster: string;
      speedup: number;
    };
  }> {
    // Профілювання першої функції
    const profile1Id = globalCPUProfiler.startProfiling(name1);
    let result1: T;
    try {
      for (let i = 0; i < iterations; i++) {
        result1 = fn1();
      }
      const profile1 = globalCPUProfiler.stopProfiling();
      if (!profile1) throw new Error('Profile 1 failed');
      
      // Профілювання другої функції
      const profile2Id = globalCPUProfiler.startProfiling(name2);
      let result2: T;
      try {
        for (let i = 0; i < iterations; i++) {
          result2 = fn2();
        }
        const profile2 = globalCPUProfiler.stopProfiling();
        if (!profile2) throw new Error('Profile 2 failed');
        
        // Порівняння
        const speedup = profile1.duration / profile2.duration;
        const faster = speedup > 1 ? name2 : name1;
        const actualSpeedup = speedup > 1 ? speedup : 1 / speedup;
        
        return {
          result1: result1!,
          result2: result2!,
          profile1,
          profile2,
          comparison: {
            faster,
            speedup: actualSpeedup
          }
        };
      } catch (error) {
        globalCPUProfiler.stopProfiling();
        throw error;
      }
    } catch (error) {
      globalCPUProfiler.stopProfiling();
      throw error;
    }
  }
}
