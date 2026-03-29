import { logger } from '@/utils/logger';

// Інтерфейси для профілювання бази даних
export interface DatabaseQuery {
  id: string;
  query: string;
  type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'DROP' | 'ALTER';
  parameters?: any[];
  startTime: number;
  endTime: number;
  duration: number;
  rowsAffected?: number;
  success: boolean;
  error?: string;
  metadata?: {
    tableName?: string;
    operation?: string;
    complexity?: 'simple' | 'moderate' | 'complex';
  };
}

export interface DatabaseProfile {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  queries: DatabaseQuery[];
  summary: DatabaseSummary;
}

export interface DatabaseSummary {
  totalQueries: number;
  totalDuration: number;
  averageDuration: number;
  queriesByType: Record<string, number>;
  slowQueries: DatabaseQuery[];
  errorQueries: DatabaseQuery[];
  topTables: TableStats[];
}

export interface TableStats {
  tableName: string;
  queryCount: number;
  totalDuration: number;
  averageDuration: number;
  lastAccessed: number;
}

export interface DatabaseMetrics {
  connectionCount: number;
  activeConnections: number;
  idleConnections: number;
  totalQueries: number;
  averageQueryTime: number;
  slowQueryCount: number;
  errorRate: number;
}

// Database Profiler клас
export class DatabaseProfiler {
  private profiles: Map<string, DatabaseProfile> = new Map();
  private activeProfile: DatabaseProfile | null = null;
  private queryHistory: DatabaseQuery[] = [];
  private metrics: DatabaseMetrics = {
    connectionCount: 0,
    activeConnections: 0,
    idleConnections: 0,
    totalQueries: 0,
    averageQueryTime: 0,
    slowQueryCount: 0,
    errorRate: 0
  };

  // Початок профілювання
  startProfiling(name: string): string {
    const profileId = `db_profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeProfile = {
      id: profileId,
      name,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      queries: [],
      summary: {
        totalQueries: 0,
        totalDuration: 0,
        averageDuration: 0,
        queriesByType: {},
        slowQueries: [],
        errorQueries: [],
        topTables: []
      }
    };

    logger.info(`Database profiling started: ${name} (${profileId})`);
    return profileId;
  }

  // Зупинка профілювання
  stopProfiling(): DatabaseProfile | null {
    if (!this.activeProfile) {
      logger.warn('No active database profile to stop');
      return null;
    }

    const endTime = performance.now();
    this.activeProfile.endTime = endTime;
    this.activeProfile.duration = endTime - this.activeProfile.startTime;
    
    // Аналіз результатів
    this.analyzeProfile();
    
    const profile = this.activeProfile;
    this.profiles.set(profile.id, profile);
    this.activeProfile = null;
    
    logger.info(`Database profiling completed: ${profile.name} - ${profile.summary.totalQueries} queries in ${profile.duration.toFixed(2)}ms`);
    return profile;
  }

  // Вимірювання запиту
  async profileQuery<T>(
    query: string,
    queryFn: () => Promise<T>,
    parameters?: any[],
    metadata?: DatabaseQuery['metadata']
  ): Promise<T> {
    const startTime = performance.now();
    const queryType = this.extractQueryType(query);
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const dbQuery: DatabaseQuery = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        type: queryType,
        parameters,
        startTime,
        endTime,
        duration,
        success: true,
        metadata
      };
      
      this.recordQuery(dbQuery);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const dbQuery: DatabaseQuery = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        type: queryType,
        parameters,
        startTime,
        endTime,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      };
      
      this.recordQuery(dbQuery);
      throw error;
    }
  }

  // Синхронне вимірювання запиту
  profileSyncQuery<T>(
    query: string,
    queryFn: () => T,
    parameters?: any[],
    metadata?: DatabaseQuery['metadata']
  ): T {
    const startTime = performance.now();
    const queryType = this.extractQueryType(query);
    
    try {
      const result = queryFn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const dbQuery: DatabaseQuery = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        type: queryType,
        parameters,
        startTime,
        endTime,
        duration,
        success: true,
        metadata
      };
      
      this.recordQuery(dbQuery);
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const dbQuery: DatabaseQuery = {
        id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        query,
        type: queryType,
        parameters,
        startTime,
        endTime,
        duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      };
      
      this.recordQuery(dbQuery);
      throw error;
    }
  }

  // Аналіз продуктивності запитів
  analyzeQueries(queries: DatabaseQuery[]): {
    slowQueries: DatabaseQuery[];
    frequentQueries: DatabaseQuery[];
    errorQueries: DatabaseQuery[];
    recommendations: string[];
  } {
    const slowQueries = queries.filter(q => q.duration > 1000); // > 1s
    const errorQueries = queries.filter(q => !q.success);
    
    // Аналіз частоти запитів
    const queryFrequency = new Map<string, DatabaseQuery[]>();
    queries.forEach(q => {
      const normalized = this.normalizeQuery(q.query);
      if (!queryFrequency.has(normalized)) {
        queryFrequency.set(normalized, []);
      }
      queryFrequency.get(normalized)!.push(q);
    });
    
    const frequentQueries = Array.from(queryFrequency.values())
      .filter(group => group.length > 5)
      .map(group => group[0])
      .sort((a, b) => b.duration - a.duration);
    
    // Генерація рекомендацій
    const recommendations: string[] = [];
    
    if (slowQueries.length > 0) {
      recommendations.push(`Found ${slowQueries.length} slow queries (>1s). Consider adding indexes or optimizing queries.`);
    }
    
    if (errorQueries.length > 0) {
      recommendations.push(`Found ${errorQueries.length} failed queries. Check query syntax and constraints.`);
    }
    
    if (frequentQueries.length > 0) {
      recommendations.push(`Found ${frequentQueries.length} frequently executed queries. Consider caching or optimization.`);
    }
    
    const complexQueries = queries.filter(q => q.metadata?.complexity === 'complex');
    if (complexQueries.length > 0) {
      recommendations.push(`Found ${complexQueries.length} complex queries. Consider breaking them into simpler parts.`);
    }
    
    return {
      slowQueries,
      frequentQueries,
      errorQueries,
      recommendations
    };
  }

  // Отримання статистики по таблицях
  getTableStats(): TableStats[] {
    const tableStats = new Map<string, TableStats>();
    
    this.queryHistory.forEach(query => {
      const tableName = query.metadata?.tableName;
      if (!tableName) return;
      
      if (!tableStats.has(tableName)) {
        tableStats.set(tableName, {
          tableName,
          queryCount: 0,
          totalDuration: 0,
          averageDuration: 0,
          lastAccessed: 0
        });
      }
      
      const stats = tableStats.get(tableName)!;
      stats.queryCount++;
      stats.totalDuration += query.duration;
      stats.averageDuration = stats.totalDuration / stats.queryCount;
      stats.lastAccessed = Math.max(stats.lastAccessed, query.endTime);
    });
    
    return Array.from(tableStats.values()).sort((a, b) => b.totalDuration - a.totalDuration);
  }

  // Отримання поточних метрик
  getMetrics(): DatabaseMetrics {
    const recentQueries = this.queryHistory.slice(-1000);
    const errorCount = recentQueries.filter(q => !q.success).length;
    const slowCount = recentQueries.filter(q => q.duration > 1000).length;
    
    this.metrics = {
      connectionCount: this.metrics.connectionCount,
      activeConnections: this.metrics.activeConnections,
      idleConnections: this.metrics.idleConnections,
      totalQueries: this.queryHistory.length,
      averageQueryTime: recentQueries.length > 0 
        ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / recentQueries.length 
        : 0,
      slowQueryCount: slowCount,
      errorRate: recentQueries.length > 0 ? (errorCount / recentQueries.length) * 100 : 0
    };
    
    return this.metrics;
  }

  // Експорт даних
  exportData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      profiles: Array.from(this.profiles.values()),
      queryHistory: this.queryHistory.slice(-1000), // Останні 1000 запитів
      metrics: this.getMetrics(),
      tableStats: this.getTableStats(),
      analysis: this.analyzeQueries(this.queryHistory.slice(-1000))
    };
    
    return JSON.stringify(data, null, 2);
  }

  // Очищення даних
  clearData(): void {
    this.profiles.clear();
    this.queryHistory = [];
    this.metrics = {
      connectionCount: 0,
      activeConnections: 0,
      idleConnections: 0,
      totalQueries: 0,
      averageQueryTime: 0,
      slowQueryCount: 0,
      errorRate: 0
    };
    logger.info('Database profiler data cleared');
  }

  // Приватні методи
  private extractQueryType(query: string): DatabaseQuery['type'] {
    const normalized = query.trim().toUpperCase();
    if (normalized.startsWith('SELECT')) return 'SELECT';
    if (normalized.startsWith('INSERT')) return 'INSERT';
    if (normalized.startsWith('UPDATE')) return 'UPDATE';
    if (normalized.startsWith('DELETE')) return 'DELETE';
    if (normalized.startsWith('CREATE')) return 'CREATE';
    if (normalized.startsWith('DROP')) return 'DROP';
    if (normalized.startsWith('ALTER')) return 'ALTER';
    
    // Fallback для Supabase/PostgreSQL специфічних запитів
    if (normalized.includes('SELECT') || normalized.includes('FROM')) return 'SELECT';
    return 'SELECT'; // Default
  }

  private normalizeQuery(query: string): string {
    // Нормалізація запиту для групування схожих запитів
    return query
      .replace(/\d+/g, '?') // Заміна чисел на ?
      .replace(/'[^']*'/g, '?') // Заміна рядків на ?
      .replace(/\s+/g, ' ') // Нормалізація пробілів
      .trim()
      .toLowerCase();
  }

  private recordQuery(query: DatabaseQuery): void {
    this.queryHistory.push(query);
    
    if (this.activeProfile) {
      this.activeProfile.queries.push(query);
    }
    
    // Оновлення метрик
    this.updateMetrics(query);
    
    // Зберігаємо тільки останні 10000 запитів
    if (this.queryHistory.length > 10000) {
      this.queryHistory = this.queryHistory.slice(-10000);
    }
  }

  private updateMetrics(query: DatabaseQuery): void {
    this.metrics.totalQueries++;
    
    if (!query.success) {
      this.metrics.errorRate = (this.metrics.errorRate * (this.metrics.totalQueries - 1) + 100) / this.metrics.totalQueries;
    } else {
      this.metrics.errorRate = (this.metrics.errorRate * (this.metrics.totalQueries - 1)) / this.metrics.totalQueries;
    }
    
    if (query.duration > 1000) {
      this.metrics.slowQueryCount++;
    }
    
    this.metrics.averageQueryTime = 
      (this.metrics.averageQueryTime * (this.metrics.totalQueries - 1) + query.duration) / this.metrics.totalQueries;
  }

  private analyzeProfile(): void {
    if (!this.activeProfile) return;
    
    const queries = this.activeProfile.queries;
    const totalDuration = queries.reduce((sum, q) => sum + q.duration, 0);
    
    const queriesByType: Record<string, number> = {};
    queries.forEach(q => {
      queriesByType[q.type] = (queriesByType[q.type] || 0) + 1;
    });
    
    const slowQueries = queries.filter(q => q.duration > 1000);
    const errorQueries = queries.filter(q => !q.success);
    
    // Аналіз таблиць
    const tableStats = new Map<string, TableStats>();
    queries.forEach(query => {
      const tableName = query.metadata?.tableName;
      if (!tableName) return;
      
      if (!tableStats.has(tableName)) {
        tableStats.set(tableName, {
          tableName,
          queryCount: 0,
          totalDuration: 0,
          averageDuration: 0,
          lastAccessed: 0
        });
      }
      
      const stats = tableStats.get(tableName)!;
      stats.queryCount++;
      stats.totalDuration += query.duration;
      stats.averageDuration = stats.totalDuration / stats.queryCount;
      stats.lastAccessed = Math.max(stats.lastAccessed, query.endTime);
    });
    
    this.activeProfile.summary = {
      totalQueries: queries.length,
      totalDuration,
      averageDuration: queries.length > 0 ? totalDuration / queries.length : 0,
      queriesByType,
      slowQueries,
      errorQueries,
      topTables: Array.from(tableStats.values()).sort((a, b) => b.totalDuration - a.totalDuration).slice(0, 10)
    };
  }
}

// Глобальний екземпляр database profiler
export const globalDatabaseProfiler = new DatabaseProfiler();

// Hook для використання в React компонентах
export const useDatabaseProfiler = () => {
  const startProfiling = (name: string) => globalDatabaseProfiler.startProfiling(name);
  const stopProfiling = () => globalDatabaseProfiler.stopProfiling();
  const profileQuery = async <T>(
    query: string,
    queryFn: () => Promise<T>,
    parameters?: any[],
    metadata?: DatabaseQuery['metadata']
  ) => globalDatabaseProfiler.profileQuery(query, queryFn, parameters, metadata);
  
  return {
    startProfiling,
    stopProfiling,
    profileQuery,
    getMetrics: () => globalDatabaseProfiler.getMetrics(),
    getTableStats: () => globalDatabaseProfiler.getTableStats(),
    analyzeQueries: () => globalDatabaseProfiler.analyzeQueries(globalDatabaseProfiler['queryHistory'])
  };
};

// Утиліти для Supabase
export class SupabaseProfiler {
  // Профілювання Supabase запитів
  static async profileSupabaseQuery<T>(
    operation: string,
    queryFn: () => Promise<T>,
    table?: string
  ): Promise<T> {
    return globalDatabaseProfiler.profileQuery(
      operation,
      queryFn,
      [],
      {
        tableName: table,
        operation,
        complexity: this.estimateComplexity(operation)
      }
    );
  }
  
  // Оцінка складності запиту
  private static estimateComplexity(query: string): 'simple' | 'moderate' | 'complex' {
    const normalized = query.toLowerCase();
    
    if (normalized.includes('join') || normalized.includes('subquery') || normalized.includes('union')) {
      return 'complex';
    }
    
    if (normalized.includes('where') && normalized.includes('order by')) {
      return 'moderate';
    }
    
    return 'simple';
  }
  
  // Декоратор для автоматичного профілювання Supabase методів
  static profileSupabaseMethod(methodName: string, table?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const operation = `${methodName}(${table || 'unknown'})`;
        return SupabaseProfiler.profileSupabaseQuery(
          operation,
          () => originalMethod.apply(this, args),
          table
        );
      };
      
      return descriptor;
    };
  }
}

// Декоратор для профілювання database методів
export function ProfileQuery(options: {
  tableName?: string;
  operation?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operation = options.operation || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: any[]) {
      return globalDatabaseProfiler.profileQuery(
        operation,
        () => originalMethod.apply(this, args),
        args,
        {
          tableName: options.tableName,
          operation,
          complexity: options.complexity || 'moderate'
        }
      );
    };
    
    return descriptor;
  };
}
