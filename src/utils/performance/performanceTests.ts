import { TestDataGenerator, PerformanceTestScenarios, BenchmarkUtils } from './testScenarios';

// Інтерфейси для результатів тестів
export interface TestResult {
  testName: string;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  success: boolean;
  error?: string;
  metrics?: Record<string, any>;
}

export interface PerformanceReport {
  timestamp: string;
  results: TestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    averageDuration: number;
    totalMemoryUsed: number;
  };
}

// Клас для запуску тестів продуктивності
export class PerformanceTestRunner {
  private results: TestResult[] = [];

  // Тест рендерингу великих списків
  async testLargeListRendering(): Promise<TestResult> {
    const testName = 'Large List Rendering';
    const memoryBefore = BenchmarkUtils.getMemoryUsage();
    
    try {
      const scenario = PerformanceTestScenarios.getLargeDatasetScenario();
      
      const duration = await BenchmarkUtils.measureRenderTime(testName, async () => {
        // Симуляція рендерингу списку студентів
        await this.simulateListRendering(scenario.data.students);
      });
      
      const memoryAfter = BenchmarkUtils.getMemoryUsage();
      
      return {
        testName,
        duration,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryAfter.used,
        success: true,
        metrics: {
          itemCount: scenario.data.students.length,
          memoryIncrease: memoryAfter.used - memoryBefore.used
        }
      };
    } catch (error) {
      return {
        testName,
        duration: 0,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryBefore.used,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Тест фільтрації та пошуку
  async testSearchAndFilter(): Promise<TestResult> {
    const testName = 'Search and Filter Performance';
    const memoryBefore = BenchmarkUtils.getMemoryUsage();
    
    try {
      const scenario = PerformanceTestScenarios.getLargeDatasetScenario();
      const students = scenario.data.students;
      
      const duration = await BenchmarkUtils.measureRenderTime(testName, async () => {
        // Тест пошуку за іменем
        await this.simulateSearch(students, 'Student 1');
        // Тест фільтрації за рівнем
        await this.simulateFilter(students, 'B1');
        // Тест комбінованого пошуку
        await this.simulateCombinedSearch(students, 'Student', 'B2');
      });
      
      const memoryAfter = BenchmarkUtils.getMemoryUsage();
      
      return {
        testName,
        duration,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryAfter.used,
        success: true,
        metrics: {
          totalItems: students.length,
          searchOperations: 3
        }
      };
    } catch (error) {
      return {
        testName,
        duration: 0,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryBefore.used,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Тест обробки дат та календаря
  async testCalendarPerformance(): Promise<TestResult> {
    const testName = 'Calendar Performance';
    const memoryBefore = BenchmarkUtils.getMemoryUsage();
    
    try {
      const scenario = PerformanceTestScenarios.getIntensiveLessonScenario();
      
      const duration = await BenchmarkUtils.measureRenderTime(testName, async () => {
        // Симуляція рендерингу календаря з уроками
        await this.simulateCalendarRendering(scenario.data.lessons);
      });
      
      const memoryAfter = BenchmarkUtils.getMemoryUsage();
      
      return {
        testName,
        duration,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryAfter.used,
        success: true,
        metrics: {
          lessonCount: scenario.data.lessons.length,
          lessonsPerDay: scenario.metrics.lessonsPerDay
        }
      };
    } catch (error) {
      return {
        testName,
        duration: 0,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryBefore.used,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Тест аналітичних запитів
  async testAnalyticsQueries(): Promise<TestResult> {
    const testName = 'Analytics Queries Performance';
    const memoryBefore = BenchmarkUtils.getMemoryUsage();
    
    try {
      const scenario = PerformanceTestScenarios.getComplexAnalyticsScenario();
      
      const duration = await BenchmarkUtils.measureRenderTime(testName, async () => {
        // Симуляція аналітичних запитів
        await this.simulateAnalyticsQueries(scenario.data, scenario.queries);
      });
      
      const memoryAfter = BenchmarkUtils.getMemoryUsage();
      
      return {
        testName,
        duration,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryAfter.used,
        success: true,
        metrics: {
          queryCount: scenario.queries.length,
          dataComplexity: 'High'
        }
      };
    } catch (error) {
      return {
        testName,
        duration: 0,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryBefore.used,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Тест навантаження (concurrent users)
  async testConcurrentUsers(): Promise<TestResult> {
    const testName = 'Concurrent Users Load';
    const memoryBefore = BenchmarkUtils.getMemoryUsage();
    
    try {
      const scenario = PerformanceTestScenarios.getConcurrentUsersScenario();
      
      const duration = await BenchmarkUtils.measureRenderTime(testName, async () => {
        await BenchmarkUtils.createLoadTest(
          'Concurrent User Simulation',
          scenario.metrics.totalUsers,
          () => this.simulateUserAction()
        );
      });
      
      const memoryAfter = BenchmarkUtils.getMemoryUsage();
      
      return {
        testName,
        duration,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryAfter.used,
        success: true,
        metrics: {
          concurrentUsers: scenario.metrics.totalUsers,
          userTypes: {
            admin: scenario.metrics.adminCount,
            teacher: scenario.metrics.teacherCount,
            student: scenario.metrics.studentCount
          }
        }
      };
    } catch (error) {
      return {
        testName,
        duration: 0,
        memoryBefore: memoryBefore.used,
        memoryAfter: memoryBefore.used,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Запуск всіх тестів
  async runAllTests(): Promise<PerformanceReport> {
    console.log('Starting performance tests...');
    
    const tests = [
      () => this.testLargeListRendering(),
      () => this.testSearchAndFilter(),
      () => this.testCalendarPerformance(),
      () => this.testAnalyticsQueries(),
      () => this.testConcurrentUsers()
    ];

    this.results = [];
    
    for (const test of tests) {
      const result = await test();
      this.results.push(result);
      
      if (result.success) {
        console.log(`✅ ${result.testName}: ${result.duration.toFixed(2)}ms`);
      } else {
        console.error(`❌ ${result.testName}: ${result.error}`);
      }
    }

    const summary = this.generateSummary();
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary
    };

    console.log('Performance tests completed:', summary);
    return report;
  }

  // Симуляційні методи
  private async simulateListRendering(items: any[]): Promise<void> {
    // Симуляція рендерингу списку
    return new Promise(resolve => {
      setTimeout(() => {
        // Симуляція обробки кожного елемента
        items.forEach(item => {
          JSON.stringify(item);
        });
        resolve();
      }, 10);
    });
  }

  private async simulateSearch(items: any[], query: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        items.filter(item => 
          item.name.toLowerCase().includes(query.toLowerCase())
        );
        resolve();
      }, 5);
    });
  }

  private async simulateFilter(items: any[], filter: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        items.filter(item => item.level === filter);
        resolve();
      }, 5);
    });
  }

  private async simulateCombinedSearch(items: any[], nameQuery: string, levelFilter: string): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        items.filter(item => 
          item.name.toLowerCase().includes(nameQuery.toLowerCase()) &&
          item.level === levelFilter
        );
        resolve();
      }, 8);
    });
  }

  private async simulateCalendarRendering(lessons: any[]): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        // Групування уроків за датами
        const lessonsByDate = lessons.reduce((acc, lesson) => {
          if (!acc[lesson.date]) {
            acc[lesson.date] = [];
          }
          acc[lesson.date].push(lesson);
          return acc;
        }, {} as Record<string, any[]>);
        
        Object.keys(lessonsByDate).length;
        resolve();
      }, 15);
    });
  }

  private async simulateAnalyticsQueries(data: any, queries: string[]): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        queries.forEach(query => {
          // Симуляція складних обчислень
          JSON.stringify(data);
        });
        resolve();
      }, 20);
    });
  }

  private async simulateUserAction(): Promise<{ duration: number }> {
    return new Promise(resolve => {
      const start = performance.now();
      setTimeout(() => {
        const duration = performance.now() - start;
        resolve({ duration });
      }, Math.random() * 100); // Рандомна затримка 0-100ms
    });
  }

  private generateSummary() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    const totalMemoryUsed = this.results.reduce((sum, r) => 
      sum + (r.memoryAfter - r.memoryBefore), 0);

    return {
      totalTests,
      passedTests,
      averageDuration,
      totalMemoryUsed,
      successRate: (passedTests / totalTests * 100).toFixed(1) + '%'
    };
  }
}

// Експорт для використання в компонентах
export const performanceTestRunner = new PerformanceTestRunner();
