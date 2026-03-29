import { performanceTestRunner, PerformanceReport } from './performanceTests';
import { TestDataGenerator, PerformanceTestScenarios, BenchmarkUtils } from './testScenarios';

// Конфігурація для load тестів
export interface LoadTestConfig {
  name: string;
  duration: number; // в секундах
  concurrentUsers: number;
  rampUpTime: number; // в секундах
  requestsPerSecond?: number;
  scenarios: LoadTestScenario[];
}

export interface LoadTestScenario {
  name: string;
  weight: number; // вага сценарію (0-1)
  actions: LoadTestAction[];
}

export interface LoadTestAction {
  type: 'navigate' | 'search' | 'filter' | 'api_call' | 'form_submit';
  target: string;
  payload?: any;
  expectedResponseTime?: number; // в ms
}

// Результати load тесту
export interface LoadTestResult {
  testName: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: string[];
  scenarios: {
    [scenarioName: string]: {
      count: number;
      avgResponseTime: number;
      errorRate: number;
    };
  };
}

// Load Test Runner
export class LoadTestRunner {
  private results: LoadTestResult[] = [];
  private isRunning = false;
  private currentTest: LoadTestResult | null = null;

  // Запуск load тесту
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Another test is already running');
    }

    this.isRunning = true;
    const startTime = new Date().toISOString();
    
    console.log(`Starting load test: ${config.name}`);
    console.log(`Duration: ${config.duration}s, Concurrent users: ${config.concurrentUsers}`);

    this.currentTest = {
      testName: config.name,
      startTime,
      endTime: '',
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errors: [],
      scenarios: {}
    };

    try {
      await this.executeLoadTest(config);
      const endTime = new Date().toISOString();
      
      if (this.currentTest) {
        this.currentTest.endTime = endTime;
        this.currentTest.duration = config.duration;
        this.currentTest.requestsPerSecond = this.currentTest.totalRequests / config.duration;
        
        // Розрахунок percentile
        this.calculatePercentiles();
        
        this.results.push(this.currentTest);
      }
    } catch (error) {
      console.error('Load test failed:', error);
      if (this.currentTest) {
        this.currentTest.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      this.isRunning = false;
      const result = this.currentTest!;
      this.currentTest = null;
      
      console.log(`Load test completed: ${result.testName}`);
      console.log(`Total requests: ${result.totalRequests}`);
      console.log(`Success rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
      console.log(`Average response time: ${result.averageResponseTime.toFixed(2)}ms`);
      
      return result;
    }
  }

  // Виконання load тесту
  private async executeLoadTest(config: LoadTestConfig): Promise<void> {
    const { duration, concurrentUsers, rampUpTime, scenarios } = config;
    const endTime = Date.now() + (duration * 1000);
    
    // Створення пулу користувачів
    const users = Array.from({ length: concurrentUsers }, (_, i) => ({
      id: `user_${i}`,
      startTime: Date.now() + (rampUpTime * 1000 * i / concurrentUsers)
    }));

    // Запуск користувачів
    const userPromises = users.map(user => this.simulateUser(user, endTime, scenarios));
    await Promise.all(userPromises);
  }

  // Симуляція дій користувача
  private async simulateUser(
    user: { id: string; startTime: number },
    endTime: number,
    scenarios: LoadTestScenario[]
  ): Promise<void> {
    // Чекаємо час старту для цього користувача
    if (Date.now() < user.startTime) {
      await new Promise(resolve => setTimeout(resolve, user.startTime - Date.now()));
    }

    while (Date.now() < endTime) {
      // Вибір сценарію на основі ваги
      const scenario = this.selectScenario(scenarios);
      if (!scenario) break;

      // Виконання дій сценарію
      for (const action of scenario.actions) {
        if (Date.now() >= endTime) break;
        
        await this.executeAction(action, scenario.name);
        
        // Невелика затримка між діями
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      }
    }
  }

  // Вибір сценарію на основі ваги
  private selectScenario(scenarios: LoadTestScenario[]): LoadTestScenario | null {
    const totalWeight = scenarios.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const scenario of scenarios) {
      random -= scenario.weight;
      if (random <= 0) {
        return scenario;
      }
    }
    
    return scenarios[0] || null;
  }

  // Виконання дії
  private async executeAction(action: LoadTestAction, scenarioName: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      switch (action.type) {
        case 'navigate':
          await this.simulateNavigation(action.target);
          break;
        case 'search':
          await this.simulateSearch(action.target, action.payload);
          break;
        case 'filter':
          await this.simulateFilter(action.target, action.payload);
          break;
        case 'api_call':
          await this.simulateApiCall(action.target, action.payload);
          break;
        case 'form_submit':
          await this.simulateFormSubmit(action.target, action.payload);
          break;
      }
      
      const duration = performance.now() - startTime;
      this.recordSuccess(duration, scenarioName);
      
      // Перевірка очікуваного часу відповіді
      if (action.expectedResponseTime && duration > action.expectedResponseTime) {
        this.currentTest!.errors.push(
          `Slow response: ${action.type} to ${action.target} took ${duration.toFixed(2)}ms (expected < ${action.expectedResponseTime}ms)`
        );
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordFailure(duration, scenarioName, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  // Симуляції різних дій
  private async simulateNavigation(page: string): Promise<void> {
    // Симуляція навігації між сторінками
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
  }

  private async simulateSearch(query: string, filters?: any): Promise<void> {
    // Симуляція пошуку
    const scenario = PerformanceTestScenarios.getLargeDatasetScenario();
    const students = scenario.data.students;
    
    students.filter(student => 
      student.name.toLowerCase().includes(query.toLowerCase())
    );
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
  }

  private async simulateFilter(field: string, value: any): Promise<void> {
    // Симуляція фільтрації
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  }

  private async simulateApiCall(endpoint: string, payload?: any): Promise<void> {
    // Симуляція API виклику
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100));
  }

  private async simulateFormSubmit(form: string, data?: any): Promise<void> {
    // Симуляція відправки форми
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
  }

  // Запис успішного запиту
  private recordSuccess(duration: number, scenarioName: string): void {
    if (!this.currentTest) return;
    
    this.currentTest.totalRequests++;
    this.currentTest.successfulRequests++;
    
    // Оновлення статистики часу відповіді
    this.currentTest.averageResponseTime = 
      (this.currentTest.averageResponseTime * (this.currentTest.totalRequests - 1) + duration) / 
      this.currentTest.totalRequests;
    
    this.currentTest.minResponseTime = Math.min(this.currentTest.minResponseTime, duration);
    this.currentTest.maxResponseTime = Math.max(this.currentTest.maxResponseTime, duration);
    
    // Оновлення статистики сценарію
    if (!this.currentTest.scenarios[scenarioName]) {
      this.currentTest.scenarios[scenarioName] = { count: 0, avgResponseTime: 0, errorRate: 0 };
    }
    
    const scenario = this.currentTest.scenarios[scenarioName];
    scenario.count++;
    scenario.avgResponseTime = 
      (scenario.avgResponseTime * (scenario.count - 1) + duration) / scenario.count;
  }

  // Запис невдалого запиту
  private recordFailure(duration: number, scenarioName: string, error: string): void {
    if (!this.currentTest) return;
    
    this.currentTest.totalRequests++;
    this.currentTest.failedRequests++;
    this.currentTest.errors.push(error);
    
    // Оновлення статистики сценарію
    if (!this.currentTest.scenarios[scenarioName]) {
      this.currentTest.scenarios[scenarioName] = { count: 0, avgResponseTime: 0, errorRate: 0 };
    }
    
    const scenario = this.currentTest.scenarios[scenarioName];
    scenario.count++;
    scenario.errorRate = this.currentTest.failedRequests / this.currentTest.totalRequests;
  }

  // Розрахунок percentile
  private calculatePercentiles(): void {
    if (!this.currentTest) return;
    
    // Симуляція розрахунку (в реальному сценарії потрібно зберігати всі часи відповіді)
    this.currentTest.p95ResponseTime = this.currentTest.averageResponseTime * 1.5;
    this.currentTest.p99ResponseTime = this.currentTest.averageResponseTime * 2;
  }

  // Отримання результатів
  getResults(): LoadTestResult[] {
    return this.results;
  }

  // Очищення результатів
  clearResults(): void {
    this.results = [];
  }

  // Експорт результатів в JSON
  exportResults(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: this.generateSummary()
    }, null, 2);
  }

  // Генерація звіту
  private generateSummary() {
    if (this.results.length === 0) return null;
    
    const totalRequests = this.results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = this.results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.averageResponseTime, 0) / this.results.length;
    
    return {
      totalTests: this.results.length,
      totalRequests,
      overallSuccessRate: (totalSuccessful / totalRequests * 100).toFixed(2) + '%',
      averageResponseTime: avgResponseTime.toFixed(2) + 'ms',
      slowestTest: this.results.reduce((slowest, r) => 
        r.averageResponseTime > slowest.averageResponseTime ? r : slowest
      ),
      fastestTest: this.results.reduce((fastest, r) => 
        r.averageResponseTime < fastest.averageResponseTime ? r : fastest
      )
    };
  }
}

// Предdefined load test конфігурації
export const LOAD_TEST_CONFIGS = {
  // Легкий тест
  LIGHT_LOAD: {
    name: 'Light Load Test',
    duration: 60, // 1 хвилина
    concurrentUsers: 10,
    rampUpTime: 10,
    scenarios: [
      {
        name: 'Browse Dashboard',
        weight: 0.6,
        actions: [
          { type: 'navigate', target: '/dashboard' },
          { type: 'api_call', target: '/api/dashboard/stats' }
        ]
      },
      {
        name: 'View Students',
        weight: 0.4,
        actions: [
          { type: 'navigate', target: '/students' },
          { type: 'search', target: 'students', payload: { query: 'test' } }
        ]
      }
    ]
  } as LoadTestConfig,

  // Середній тест
  MEDIUM_LOAD: {
    name: 'Medium Load Test',
    duration: 300, // 5 хвилин
    concurrentUsers: 50,
    rampUpTime: 30,
    scenarios: [
      {
        name: 'Full Workflow',
        weight: 0.7,
        actions: [
          { type: 'navigate', target: '/dashboard' },
          { type: 'navigate', target: '/students' },
          { type: 'search', target: 'students', payload: { query: 'john' } },
          { type: 'filter', target: 'students', payload: { level: 'B1' } },
          { type: 'navigate', target: '/schedule' },
          { type: 'api_call', target: '/api/schedule/lessons' }
        ]
      },
      {
        name: 'Analytics',
        weight: 0.3,
        actions: [
          { type: 'navigate', target: '/analytics' },
          { type: 'api_call', target: '/api/analytics/reports' },
          { type: 'api_call', target: '/api/analytics/charts' }
        ]
      }
    ]
  } as LoadTestConfig,

  // Важкий тест
  HEAVY_LOAD: {
    name: 'Heavy Load Test',
    duration: 600, // 10 хвилин
    concurrentUsers: 200,
    rampUpTime: 60,
    scenarios: [
      {
        name: 'Intensive Operations',
        weight: 0.8,
        actions: [
          { type: 'navigate', target: '/dashboard' },
          { type: 'search', target: 'students', payload: { query: 'student' } },
          { type: 'filter', target: 'students', payload: { level: 'B2' } },
          { type: 'navigate', target: '/groups' },
          { type: 'form_submit', target: '/groups/create', payload: { name: 'Test Group' } },
          { type: 'navigate', target: '/schedule' },
          { type: 'api_call', target: '/api/schedule/lessons' },
          { type: 'navigate', target: '/payments' },
          { type: 'api_call', target: '/api/payments/history' }
        ]
      },
      {
        name: 'Complex Analytics',
        weight: 0.2,
        actions: [
          { type: 'navigate', target: '/analytics' },
          { type: 'api_call', target: '/api/analytics/comprehensive' },
          { type: 'api_call', target: '/api/analytics/export' }
        ]
      }
    ]
  } as LoadTestConfig
};

// Експорт для використання
export const loadTestRunner = new LoadTestRunner();
