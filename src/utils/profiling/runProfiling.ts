// Скрипт для запуску базового профілювання LMS застосунку
import { 
  globalCPUProfiler, 
  globalMemoryProfiler, 
  globalDatabaseProfiler,
  globalCombinedProfiler 
} from './index';
import { TestDataGenerator, PerformanceTestScenarios, BenchmarkUtils } from '../performance/testScenarios';
import { performanceTestRunner } from '../performance/performanceTests';
import { logger } from '@/utils/logger';

export class ApplicationProfiler {
  private results: {
    cpu: any;
    memory: any;
    database: any;
    combined: any;
    performance: any;
  } = {
    cpu: null,
    memory: null,
    database: null,
    combined: null,
    performance: null
  };

  // Запуск базового профілювання
  async runBasicProfiling(): Promise<void> {
    logger.info('Starting basic application profiling...');
    
    try {
      // 1. Встановлення baseline для memory
      globalMemoryProfiler.setBaseline('profiling-start');
      
      // 2. CPU профілювання основних операцій
      await this.profileCPUOperations();
      
      // 3. Memory профілювання при роботі з даними
      await this.profileMemoryOperations();
      
      // 4. Database профілювання (симуляція)
      await this.profileDatabaseOperations();
      
      // 5. Комбіноване профілювання тестових сценаріїв
      await this.profileTestScenarios();
      
      // 6. Запуск performance тестів
      await this.runPerformanceTests();
      
      // 7. Аналіз результатів
      this.analyzeResults();
      
      logger.info('Basic profiling completed successfully');
    } catch (error) {
      logger.error('Profiling failed:', error);
      throw error;
    }
  }

  // CPU профілювання основних операцій
  private async profileCPUOperations(): Promise<void> {
    logger.info('Profiling CPU operations...');
    
    const cpuProfileId = globalCPUProfiler.startProfiling('basic-operations');
    
    try {
      // Тест 1: Обробка великих масивів даних
      globalCPUProfiler.profileFunction('array-processing', () => {
        const largeArray = Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random() * 100,
          category: `Category ${i % 10}`
        }));
        
        // Сортування
        largeArray.sort((a, b) => a.value - b.value);
        
        // Фільтрація
        const filtered = largeArray.filter(item => item.value > 50);
        
        // Групування
        const grouped = largeArray.reduce((acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, {} as Record<string, any[]>);
        
        return { filtered, grouped };
      });
      
      // Тест 2: Обробка рядків
      globalCPUProfiler.profileFunction('string-processing', () => {
        const text = 'Lorem ipsum '.repeat(1000);
        
        // Регулярні вирази
        const words = text.match(/\b\w+\b/g) || [];
        const sentences = text.split('.').filter(s => s.trim());
        
        // Пошук та заміна
        const processed = text.replace(/ipsum/g, 'REPLACED');
        
        return { wordCount: words.length, sentenceCount: sentences.length };
      });
      
      // Тест 3: Математичні обчислення
      globalCPUProfiler.profileFunction('math-operations', () => {
        const numbers = Array.from({ length: 50000 }, () => Math.random() * 1000);
        
        // Статистика
        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / numbers.length;
        const variance = numbers.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / numbers.length;
        const stdDev = Math.sqrt(variance);
        
        // Складні обчислення
        const processed = numbers.map(n => Math.sin(n) * Math.cos(n) + Math.sqrt(Math.abs(n)));
        
        return { mean, variance, stdDev, processedCount: processed.length };
      });
      
      // Тест 4: DOM маніпуляції (симуляція)
      globalCPUProfiler.profileFunction('dom-simulation', () => {
        // Симуляція створення елементів
        const elements = Array.from({ length: 1000 }, (_, i) => ({
          id: `element-${i}`,
          type: ['div', 'span', 'button', 'input'][i % 4],
          className: `class-${i % 10}`,
          text: `Element ${i}`,
          children: []
        }));
        
        // Симуляція обходу DOM дерева
        const traverse = (elements: any[]) => {
          let count = 0;
          elements.forEach(el => {
            count++;
            if (el.children.length > 0) {
              count += traverse(el.children);
            }
          });
          return count;
        };
        
        return { elementCount: elements.length, traversedCount: traverse(elements) };
      });
      
    } finally {
      this.results.cpu = globalCPUProfiler.stopProfiling();
    }
  }

  // Memory профілювання
  private async profileMemoryOperations(): Promise<void> {
    logger.info('Profiling memory operations...');
    
    // Snapshot перед операціями
    const beforeSnapshot = globalMemoryProfiler.takeSnapshot('memory-test-before');
    
    try {
      // Тест 1: Створення великої кількості об'єктів
      globalMemoryProfiler.takeSnapshot('before-object-creation');
      
      const objects = Array.from({ length: 5000 }, (_, i) => ({
        id: i,
        data: new Array(100).fill(0).map(() => Math.random()),
        metadata: {
          created: new Date(),
          type: `type-${i % 20}`,
          tags: [`tag-${i % 10}`, `category-${i % 5}`]
        }
      }));
      
      globalMemoryProfiler.takeSnapshot('after-object-creation');
      
      // Тест 2: Робота з великими рядками
      globalMemoryProfiler.takeSnapshot('before-string-operations');
      
      const largeStrings = Array.from({ length: 1000 }, (_, i) => 
        'Large string data '.repeat(100) + i
      );
      
      const processedStrings = largeStrings.map(s => 
        s.toUpperCase().replace(/\s+/g, ' ').trim()
      );
      
      globalMemoryProfiler.takeSnapshot('after-string-operations');
      
      // Тест 3: Масиви з вкладеними структурами
      globalMemoryProfiler.takeSnapshot('before-nested-structures');
      
      const nestedData = Array.from({ length: 100 }, (_, i) => ({
        level1: {
          level2: {
            level3: {
              data: new Array(50).fill(0).map(() => ({
                value: Math.random(),
                info: `info-${Math.random()}`
              }))
            }
          }
        }
      }));
      
      globalMemoryProfiler.takeSnapshot('after-nested-structures');
      
      // Очищення для тестування GC
      objects.length = 0;
      largeStrings.length = 0;
      processedStrings.length = 0;
      nestedData.length = 0;
      
      globalMemoryProfiler.takeSnapshot('after-cleanup');
      
    } finally {
      const afterSnapshot = globalMemoryProfiler.takeSnapshot('memory-test-after');
      this.results.memory = {
        before: beforeSnapshot,
        after: afterSnapshot,
        leaks: globalMemoryProfiler.detectLeaks(),
        analysis: globalMemoryProfiler.analyzeUsage()
      };
    }
  }

  // Database профілювання (симуляція)
  private async profileDatabaseOperations(): Promise<void> {
    logger.info('Profiling database operations...');
    
    const dbProfileId = globalDatabaseProfiler.startProfiling('database-operations');
    
    try {
      // Симуляція даних
      const students = TestDataGenerator.generateStudents(1000);
      const teachers = TestDataGenerator.generateTeachers(50);
      const groups = TestDataGenerator.generateGroups(100, students, teachers);
      
      // Тест 1: SELECT операції
      await globalDatabaseProfiler.profileQuery(
        'SELECT * FROM students',
        async () => {
          // Симуляція затримки
          await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
          return students.slice(0, 100);
        },
        [],
        { tableName: 'students', operation: 'select-all', complexity: 'simple' }
      );
      
      // Тест 2: SELECT з фільтрацією
      await globalDatabaseProfiler.profileQuery(
        'SELECT * FROM students WHERE level = ?',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 70));
          return students.filter(s => s.level === 'B1');
        },
        ['B1'],
        { tableName: 'students', operation: 'select-filtered', complexity: 'moderate' }
      );
      
      // Тест 3: JOIN операція (симуляція)
      await globalDatabaseProfiler.profileQuery(
        'SELECT s.*, t.name as teacher_name FROM students s JOIN groups g ON s.group_id = g.id JOIN teachers t ON g.teacher_id = t.id',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
          return students.slice(0, 50).map(student => ({
            ...student,
            teacher_name: `Teacher ${Math.floor(Math.random() * 50)}`
          }));
        },
        [],
        { tableName: 'students', operation: 'join-query', complexity: 'complex' }
      );
      
      // Тест 4: Агрегатні функції
      await globalDatabaseProfiler.profileQuery(
        'SELECT level, COUNT(*) as count, AVG(balance) as avg_balance FROM students GROUP BY level',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 120));
          const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
          return levels.map(level => ({
            level,
            count: students.filter(s => s.level === level).length,
            avg_balance: students.filter(s => s.level === level).reduce((sum, s) => sum + s.balance, 0) / students.filter(s => s.level === level).length
          }));
        },
        [],
        { tableName: 'students', operation: 'aggregate', complexity: 'moderate' }
      );
      
      // Тест 5: INSERT операція
      await globalDatabaseProfiler.profileQuery(
        'INSERT INTO students (name, email, level) VALUES (?, ?, ?)',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 50));
          return { id: Math.floor(Math.random() * 10000), affectedRows: 1 };
        },
        ['New Student', 'new@example.com', 'A1'],
        { tableName: 'students', operation: 'insert', complexity: 'simple' }
      );
      
    } finally {
      this.results.database = globalDatabaseProfiler.stopProfiling();
    }
  }

  // Комбіноване профілювання тестових сценаріїв
  private async profileTestScenarios(): Promise<void> {
    logger.info('Profiling test scenarios...');
    
    // Сценарій 1: Великий датасет
    const sessionId1 = globalCombinedProfiler.startSession('large-dataset-scenario');
    
    try {
      const scenario = PerformanceTestScenarios.getLargeDatasetScenario();
      
      // Симуляція обробки великого датасету
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Обробка студентів
      scenario.data.students.forEach(student => {
        JSON.stringify(student);
      });
      
      // Обробка викладачів
      scenario.data.teachers.forEach(teacher => {
        JSON.stringify(teacher);
      });
      
      // Обробка груп
      scenario.data.groups.forEach(group => {
        JSON.stringify(group);
      });
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } finally {
      this.results.combined = globalCombinedProfiler.stopSession(sessionId1);
    }
  }

  // Запуск performance тестів
  private async runPerformanceTests(): Promise<void> {
    logger.info('Running performance tests...');
    
    try {
      this.results.performance = await performanceTestRunner.runAllTests();
    } catch (error) {
      logger.error('Performance tests failed:', error);
      this.results.performance = { error: error.message };
    }
  }

  // Аналіз результатів та визначення "гарячих точок"
  private analyzeResults(): void {
    logger.info('Analyzing profiling results...');
    
    const hotspots: string[] = [];
    
    // Аналіз CPU результатів
    if (this.results.cpu) {
      const topFunctions = this.results.cpu.functions.slice(0, 5);
      hotspots.push(`🔥 CPU Hotspot: ${topFunctions[0]?.name} - ${topFunctions[0]?.totalTime.toFixed(2)}ms`);
      
      if (topFunctions[0]?.percentage > 30) {
        hotspots.push(`⚠️ Critical CPU usage: ${topFunctions[0]?.name} uses ${topFunctions[0]?.percentage.toFixed(1)}% of time`);
      }
    }
    
    // Аналіз Memory результатів
    if (this.results.memory?.analysis) {
      const memoryGrowth = this.results.memory.analysis.growth;
      if (memoryGrowth > 10 * 1024 * 1024) { // > 10MB
        hotspots.push(`🧠 Memory Hotspot: High memory growth of ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      }
      
      const leaks = this.results.memory.leaks;
      if (leaks.length > 0) {
        hotspots.push(`🚨 Memory Leak Detected: ${leaks.length} potential leaks found`);
      }
    }
    
    // Аналіз Database результатів
    if (this.results.database) {
      const slowQueries = this.results.database.summary.slowQueries;
      if (slowQueries.length > 0) {
        hotspots.push(`🗄️ Database Hotspot: ${slowQueries.length} slow queries detected`);
        const slowest = slowQueries[0];
        hotspots.push(`🐌 Slowest Query: ${slowest.query} - ${slowest.duration.toFixed(2)}ms`);
      }
    }
    
    // Аналіз комбінованих результатів
    if (this.results.combined?.analysis) {
      const bottlenecks = this.results.combined.analysis.bottlenecks;
      if (bottlenecks.length > 0) {
        hotspots.push(`⚡ Performance Bottleneck: ${bottlenecks.join(', ')}`);
      }
      
      const grade = this.results.combined.analysis.performanceGrade;
      if (grade !== 'A') {
        hotspots.push(`📉 Performance Grade: ${grade} (needs optimization)`);
      }
    }
    
    // Вивід результатів
    logger.info('\n=== PROFILING RESULTS ===');
    logger.info(`🔥 Top 3 Hotspots:`);
    hotspots.slice(0, 3).forEach((hotspot, index) => {
      logger.info(`${index + 1}. ${hotspot}`);
    });
    
    if (hotspots.length > 3) {
      logger.info(`\n📊 Additional findings:`);
      hotspots.slice(3).forEach(hotspot => {
        logger.info(`• ${hotspot}`);
      });
    }
    
    // Збереження результатів
    this.saveResults();
  }

  // Збереження результатів
  private saveResults(): void {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        cpuHotspots: this.results.cpu?.functions?.slice(0, 3) || [],
        memoryIssues: this.results.memory?.leaks || [],
        databaseIssues: this.results.database?.summary?.slowQueries || [],
        performanceGrade: this.results.combined?.analysis?.performanceGrade || 'N/A',
        bottlenecks: this.results.combined?.analysis?.bottlenecks || []
      }
    };
    
    // Збереження в localStorage
    localStorage.setItem(`profiling_report_${Date.now()}`, JSON.stringify(report, null, 2));
    
    logger.info('📄 Profiling report saved to localStorage');
  }

  // Отримання результатів
  getResults() {
    return this.results;
  }
}

// Функція для запуску профілювання
export const runApplicationProfiling = async () => {
  const profiler = new ApplicationProfiler();
  await profiler.runBasicProfiling();
  return profiler.getResults();
};

// Автоматичний запуск при import (тільки в development)
if (import.meta.env.DEV) {
  // Запуск через 3 секунди після старту застосунку
  setTimeout(() => {
    runApplicationProfiling().catch(error => {
      console.error('Auto-profiling failed:', error);
    });
  }, 3000);
}
