// Ініціалізація та налаштування профілерів для LMS проєкту
import { initializeProfilers, ProfilingAutomation, globalCombinedProfiler } from './index';
import { globalMemoryProfiler } from './memoryProfiler';
import { logger } from '@/utils/logger';
import React from 'react';

// Конфігурація профілерів
export const PROFILER_CONFIG = {
  // CPU профілювання
  cpu: {
    enabled: true,
    samplingInterval: 1000, // 1ms
    maxProfiles: 50,
    autoStart: false
  },
  
  // Memory профілювання
  memory: {
    enabled: true,
    monitoringInterval: 10000, // 10 секунд
    maxSnapshots: 100,
    leakDetectionThreshold: 50 * 1024 * 1024, // 50MB
    autoStart: true,
    gcInterval: 60000 // 1 хвилина
  },
  
  // Database профілювання
  database: {
    enabled: true,
    maxQueryHistory: 10000,
    slowQueryThreshold: 1000, // 1 секунда
    autoStart: false,
    trackParameters: true
  },
  
  // Комбіноване профілювання
  combined: {
    enabled: true,
    periodicProfiling: false,
    periodicInterval: 60000, // 1 хвилина
    autoExport: true,
    exportInterval: 300000 // 5 хвилин
  }
};

// Клас для налаштування профілерів
export class ProfilerSetup {
  private config = PROFILER_CONFIG;
  private periodicTimer: NodeJS.Timeout | null = null;
  private exportTimer: NodeJS.Timeout | null = null;

  // Ініціалізація всіх профілерів
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing profilers...');
      
      // Ініціалізація базових профілерів
      initializeProfilers();
      
      // Налаштування memory профілера
      if (this.config.memory.enabled) {
        this.setupMemoryProfiler();
      }
      
      // Налаштування database профілера
      if (this.config.database.enabled) {
        this.setupDatabaseProfiler();
      }
      
      // Налаштування комбінованого профілювання
      if (this.config.combined.enabled) {
        this.setupCombinedProfiler();
      }
      
      // Налаштування автоматичного експорту
      if (this.config.combined.autoExport) {
        this.setupAutoExport();
      }
      
      logger.info('Profilers initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize profilers:', error);
      throw error;
    }
  }

  // Налаштування memory профілера
  private setupMemoryProfiler(): void {
    const { memory } = this.config;
    
    // Початок моніторингу
    if (memory.autoStart) {
      // Memory profiler автоматично починає моніторинг в initializeProfilers()
    }
    
    // Періодична очистка
    if (memory.gcInterval > 0) {
      setInterval(() => {
        // Виклик garbage collection якщо доступно
        if ('gc' in global) {
          (global as any).gc();
        }
      }, memory.gcInterval);
    }
    
    logger.info('Memory profiler configured');
  }

  // Налаштування database профілера
  private setupDatabaseProfiler(): void {
    const { database } = this.config;
    
    // Налаштування порогів для повільних запитів
    // Це буде використовуватись в database profiler
    
    logger.info('Database profiler configured');
  }

  // Налаштування комбінованого профілювання
  private setupCombinedProfiler(): void {
    const { combined } = this.config;
    
    // Періодичне профілювання
    if (combined.periodicProfiling && combined.periodicInterval > 0) {
      this.periodicTimer = ProfilingAutomation.startPeriodicProfiling(combined.periodicInterval);
      logger.info(`Periodic profiling started (interval: ${combined.periodicInterval}ms)`);
    }
    
    logger.info('Combined profiler configured');
  }

  // Налаштування автоматичного експорту
  private setupAutoExport(): void {
    const { combined } = this.config;
    
    if (combined.exportInterval > 0) {
      this.exportTimer = setInterval(() => {
        this.exportProfilingData();
      }, combined.exportInterval);
      
      logger.info(`Auto export configured (interval: ${combined.exportInterval}ms)`);
    }
  }

  // Експорт даних профілювання
  private async exportProfilingData(): Promise<void> {
    try {
      const data = globalCombinedProfiler.exportAllData();
      
      // Збереження в localStorage
      localStorage.setItem(`profiling_data_${Date.now()}`, data);
      
      // Логування статистики
      const parsed = JSON.parse(data);
      logger.info('Profiling data exported:', {
        profiles: parsed.cpuData?.profiles?.length || 0,
        memorySnapshots: parsed.memoryData?.snapshots?.length || 0,
        databaseQueries: parsed.databaseData?.queryHistory?.length || 0,
        sessions: parsed.sessions?.length || 0
      });
    } catch (error) {
      logger.error('Failed to export profiling data:', error);
    }
  }

  // Зупинка всіх профілерів
  stop(): void {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
    
    if (this.exportTimer) {
      clearInterval(this.exportTimer);
      this.exportTimer = null;
    }
    
    // Зупинка моніторингу
    globalMemoryProfiler.stopMonitoring();
    
    logger.info('All profilers stopped');
  }

  // Отримання конфігурації
  getConfig(): typeof PROFILER_CONFIG {
    return { ...this.config };
  }

  // Оновлення конфігурації
  updateConfig(newConfig: Partial<typeof PROFILER_CONFIG>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Profiler configuration updated');
  }
}

// Глобальний екземпляр налаштування
export const profilerSetup = new ProfilerSetup();

// Ініціалізація при import
export const initializeAppProfilers = async () => {
  // Перевірка чи ми в development режимі
  if (import.meta.env.DEV) {
    await profilerSetup.initialize();
    logger.info('Development profilers initialized');
  } else {
    // В production режимі ініціалізуємо тільки базовий моніторинг
    initializeProfilers();
    logger.info('Production profilers initialized (minimal)');
  }
};

// Декоратор для автоматичного профілювання методів
export function AutoProfile(options: {
  name?: string;
  includeMemory?: boolean;
  includeDatabase?: boolean;
  threshold?: number; // ms
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const profileName = options.name || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = performance.now();
      
      // Початок профілювання
      let sessionId: string | null = null;
      if (options.includeMemory || options.includeDatabase) {
        sessionId = globalCombinedProfiler.startSession(profileName);
      }
      
      try {
        const result = await originalMethod.apply(this, args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        // Перевірка порогів
        if (options.threshold && duration > options.threshold) {
          logger.warn(`Slow method detected: ${profileName} took ${duration.toFixed(2)}ms`);
        }
        
        // Зупинка профілювання
        if (sessionId) {
          const session = globalCombinedProfiler.stopSession(sessionId);
          if (session && session.analysis?.performanceGrade === 'F') {
            logger.error(`Poor performance in ${profileName}:`, session.analysis.bottlenecks);
          }
        }
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        logger.error(`Method ${profileName} failed after ${duration.toFixed(2)}ms:`, error);
        
        // Зупинка профілювання при помилці
        if (sessionId) {
          globalCombinedProfiler.stopSession(sessionId);
        }
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

// Утиліти для профілювання React компонентів
export const profileComponent = (componentName: string) => {
  return (WrappedComponent: React.ComponentType<any>) => {
    const ProfiledComponent = (props: any) => {
      // Використання hooks для профілювання
      // В реальному компоненті тут були б calls до профілерів
      
      return React.createElement(WrappedComponent, props);
    };
    
    ProfiledComponent.displayName = `Profiled(${componentName})`;
    return ProfiledComponent;
  };
};

// Експорт за замовчуванням
export default {
  profilerSetup,
  initializeAppProfilers,
  AutoProfile,
  profileComponent,
  PROFILER_CONFIG
};
