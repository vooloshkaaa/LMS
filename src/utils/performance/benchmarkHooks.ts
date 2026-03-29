import { useEffect, useRef, useCallback, useState } from 'react';
import { BenchmarkUtils } from './testScenarios';

// Hook для вимірювання продуктивності компонентів
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    totalRenderTime: 0,
    memoryUsage: 0
  });

  const measureRender = useCallback(() => {
    const now = performance.now();
    const renderTime = now - lastRenderTime.current;
    
    renderCount.current++;
    const totalRenderTime = metrics.totalRenderTime + renderTime;
    const averageRenderTime = totalRenderTime / renderCount.current;
    const memoryUsage = BenchmarkUtils.getMemoryUsage().used;

    setMetrics({
      renderCount: renderCount.current,
      averageRenderTime,
      totalRenderTime,
      memoryUsage
    });

    lastRenderTime.current = now;
    
    console.log(`${componentName} render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
  }, [componentName, metrics.totalRenderTime]);

  useEffect(() => {
    measureRender();
  });

  return metrics;
};

// Hook для вимірювання часу виконання функцій
export const useExecutionTimer = () => {
  const timers = useRef<Record<string, number>>({});

  const startTimer = useCallback((name: string) => {
    timers.current[name] = performance.now();
  }, []);

  const endTimer = useCallback((name: string): number => {
    const startTime = timers.current[name];
    if (!startTime) {
      console.warn(`Timer "${name}" was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    delete timers.current[name];
    
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }, []);

  const measureFunction = useCallback(async <T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    startTimer(name);
    try {
      const result = await fn();
      endTimer(name);
      return result;
    } catch (error) {
      endTimer(name);
      throw error;
    }
  }, [startTimer, endTimer]);

  return { startTimer, endTimer, measureFunction };
};

// Hook для моніторингу memory usage
export const useMemoryMonitor = (intervalMs: number = 1000) => {
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const [currentMemory, setCurrentMemory] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const memory = BenchmarkUtils.getMemoryUsage().used;
      setCurrentMemory(memory);
      
      setMemoryHistory(prev => {
        const newHistory = [...prev, memory];
        // Зберігаємо тільки останні 100 вимірів
        return newHistory.slice(-100);
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  const getMemoryStats = useCallback(() => {
    if (memoryHistory.length === 0) {
      return { min: 0, max: 0, average: 0, trend: 'stable' };
    }

    const min = Math.min(...memoryHistory);
    const max = Math.max(...memoryHistory);
    const average = memoryHistory.reduce((sum, val) => sum + val, 0) / memoryHistory.length;
    
    // Визначення тренду
    const recent = memoryHistory.slice(-10);
    const older = memoryHistory.slice(-20, -10);
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, val) => sum + val, 0) / older.length : recentAvg;
    
    let trend: 'increasing' | 'decreasing' | 'stable';
    if (recentAvg > olderAvg * 1.1) {
      trend = 'increasing';
    } else if (recentAvg < olderAvg * 0.9) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }

    return { min, max, average, trend };
  }, [memoryHistory]);

  return {
    currentMemory,
    memoryHistory,
    stats: getMemoryStats()
  };
};

// Hook для вимірювання продуктивності API запитів
export const useApiPerformance = () => {
  const [apiMetrics, setApiMetrics] = useState<Record<string, {
    count: number;
    totalTime: number;
    averageTime: number;
    lastCalled: string;
  }>>({});

  const trackApiCall = useCallback(async <T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      
      setApiMetrics(prev => {
        const current = prev[apiName] || { count: 0, totalTime: 0, averageTime: 0, lastCalled: '' };
        const newCount = current.count + 1;
        const newTotalTime = current.totalTime + duration;
        
        return {
          ...prev,
          [apiName]: {
            count: newCount,
            totalTime: newTotalTime,
            averageTime: newTotalTime / newCount,
            lastCalled: new Date().toISOString()
          }
        };
      });
      
      console.log(`${apiName}: ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`${apiName} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  const getSlowestApi = useCallback(() => {
    const apis = Object.entries(apiMetrics);
    if (apis.length === 0) return null;
    
    return apis.reduce((slowest, [name, metrics]) => 
      !slowest || metrics.averageTime > slowest.metrics.averageTime 
        ? { name, metrics } 
        : slowest
    , null as { name: string; metrics: any } | null);
  }, [apiMetrics]);

  const resetMetrics = useCallback(() => {
    setApiMetrics({});
  }, []);

  return {
    apiMetrics,
    trackApiCall,
    getSlowestApi,
    resetMetrics
  };
};

// Hook для моніторингу Core Web Vitals
export const useWebVitals = () => {
  const [vitals, setVitals] = useState({
    FCP: 0,
    LCP: 0,
    CLS: 0,
    FID: 0,
    TTFB: 0
  });

  useEffect(() => {
    // Вимірювання FCP (First Contentful Paint)
    const measureFCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setVitals(prev => ({ ...prev, FCP: entry.startTime }));
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });
    };

    // Вимірювання LCP (Largest Contentful Paint)
    const measureLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setVitals(prev => ({ ...prev, LCP: lastEntry.startTime }));
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    };

    // Вимірювання CLS (Cumulative Layout Shift)
    const measureCLS = () => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
            setVitals(prev => ({ ...prev, CLS: clsValue }));
          }
        });
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    };

    // Вимірювання FID (First Input Delay)
    const measureFID = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            setVitals(prev => ({ ...prev, FID: (entry as any).processingStart - entry.startTime }));
          }
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    };

    // Вимірювання TTFB (Time to First Byte)
    const measureTTFB = () => {
      if (performance.navigation) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          setVitals(prev => ({ 
            ...prev, 
            TTFB: navigation.responseStart - navigation.requestStart 
          }));
        }
      }
    };

    measureFCP();
    measureLCP();
    measureCLS();
    measureFID();
    measureTTFB();
  }, []);

  const getPerformanceScore = useCallback(() => {
    const { FCP, LCP, CLS, FID, TTFB } = vitals;
    
    let score = 100;
    
    // FCP scoring (0-1800ms good, 1800-3000ms needs improvement, >3000ms poor)
    if (FCP > 3000) score -= 30;
    else if (FCP > 1800) score -= 15;
    
    // LCP scoring (0-2500ms good, 2500-4000ms needs improvement, >4000ms poor)
    if (LCP > 4000) score -= 30;
    else if (LCP > 2500) score -= 15;
    
    // CLS scoring (0-0.1 good, 0.1-0.25 needs improvement, >0.25 poor)
    if (CLS > 0.25) score -= 20;
    else if (CLS > 0.1) score -= 10;
    
    // FID scoring (0-100ms good, 100-300ms needs improvement, >300ms poor)
    if (FID > 300) score -= 20;
    else if (FID > 100) score -= 10;
    
    // TTFB scoring (0-800ms good, 800-1800ms needs improvement, >1800ms poor)
    if (TTFB > 1800) score -= 20;
    else if (TTFB > 800) score -= 10;
    
    return Math.max(0, score);
  }, [vitals]);

  return {
    vitals,
    score: getPerformanceScore(),
    isGood: getPerformanceScore() >= 90
  };
};
