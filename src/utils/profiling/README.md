# Профілювання в LMS проєкті

Комплексна система профілювання для моніторингу продуктивності веб-застосунку LMS.

## 📁 Структура

```
src/utils/profiling/
├── cpuProfiler.ts       # CPU профілювання
├── memoryProfiler.ts    # Memory профілювання
├── databaseProfiler.ts  # Database профілювання
├── index.ts            # Комбінований профілер
├── setup.ts            # Налаштування та ініціалізація
└── README.md           # Документація
```

## 🚀 Швидкий старт

### 1. Ініціалізація

Профілери автоматично ініціалізуються в `src/main.tsx`:

```typescript
import { initializeAppProfilers } from "./utils/profiling/setup";

initializeAppProfilers().catch(error => {
  logger.error("Failed to initialize profilers:", error);
});
```

### 2. Базове використання

```typescript
import { globalCPUProfiler, globalMemoryProfiler, globalDatabaseProfiler } from '@/utils/profiling';

// CPU профілювання
const profileId = globalCPUProfiler.startProfiling('my-operation');
// ... ваш код
const profile = globalCPUProfiler.stopProfiling();

// Memory профілювання
const snapshot = globalMemoryProfiler.takeSnapshot('before-operation');
// ... ваш код
const afterSnapshot = globalMemoryProfiler.takeSnapshot('after-operation');

// Database профілювання
const result = await globalDatabaseProfiler.profileQuery(
  'SELECT * FROM students',
  () => supabase.from('students').select('*'),
  [],
  { tableName: 'students', operation: 'select' }
);
```

## 📊 CPU Профілювання

### Функції

- **Вимірювання часу виконання функцій**
- **Виявлення bottleneck'ів**
- **Аналіз stack trace**
- **Експорт в Chrome DevTools формат**

### Приклади

```typescript
// Декоратор для автоматичного профілювання
import { CPUProfiler } from '@/utils/profiling';

class MyService {
  @CPUProfiler.profile('expensive-operation')
  async processData() {
    // Код для профілювання
  }
}

// Ручне профілювання
const result = globalCPUProfiler.profileFunction('calculation', () => {
  return expensiveCalculation();
});
```

## 🧠 Memory Профілювання

### Функції

- **Моніторинг heap usage**
- **Виявлення memory leaks**
- **Аналіз росту пам'яті**
- **Automatic garbage collection**

### Приклади

```typescript
// Моніторинг пам'яті
globalMemoryProfiler.startMonitoring(5000); // Кожні 5 секунд

// Встановлення baseline
globalMemoryProfiler.setBaseline('initial');

// Детекція leaks
const leaks = globalMemoryProfiler.detectLeaks();
if (leaks.length > 0) {
  console.warn('Memory leaks detected:', leaks);
}

// Декоратор для моніторингу
import { MonitorMemory } from '@/utils/profiling';

class DataManager {
  @MonitorMemory({ name: 'data-processing' })
  processLargeDataset() {
    // Код що використовує багато пам'яті
  }
}
```

## 🗄️ Database Профілювання

### Функції

- **Вимірювання часу запитів**
- **Аналіз повільних запитів**
- **Статистика по таблицях**
- **Виявлення неефективних запитів**

### Приклади

```typescript
// Профілювання Supabase запитів
import { SupabaseProfiler } from '@/utils/profiling';

const students = await SupabaseProfiler.profileSupabaseQuery(
  'get-students',
  () => supabase.from('students').select('*'),
  'students'
);

// Декоратор для database методів
import { ProfileQuery } from '@/utils/profiling';

class DatabaseService {
  @ProfileQuery({ 
    tableName: 'students', 
    operation: 'select-all',
    complexity: 'moderate' 
  })
  async getAllStudents() {
    return supabase.from('students').select('*');
  }
}
```

## 🔧 Комбіноване профілювання

### Функції

- **Комплексний моніторинг**
- **Автоматична оцінка продуктивності**
- **Генерація рекомендацій**
- **Періодичне профілювання**

### Приклади

```typescript
import { globalCombinedProfiler } from '@/utils/profiling';

// Комплексна сесія профілювання
const sessionId = globalCombinedProfiler.startSession('user-registration');

// ... ваш код що включає CPU, memory та database операції

const session = globalCombinedProfiler.stopSession(sessionId);
console.log('Performance grade:', session.analysis?.performanceGrade);
console.log('Bottlenecks:', session.analysis?.bottlenecks);
console.log('Recommendations:', session.analysis?.recommendations);
```

## 🎯 Декоратори

### AutoProfile

Автоматичне профілювання методів з порогами:

```typescript
import { AutoProfile } from '@/utils/profiling';

class UserService {
  @AutoProfile({ 
    name: 'user-registration',
    includeMemory: true,
    includeDatabase: true,
    threshold: 1000 // 1 секунда
  })
  async registerUser(userData: UserRegistration) {
    // Код реєстрації користувача
  }
}
```

### MonitorMemory

Моніторинг використання пам'яті:

```typescript
import { MonitorMemory } from '@/utils/profiling';

class DataProcessor {
  @MonitorMemory({ 
    name: 'large-data-processing',
    interval: 1000,
    detectLeaks: true 
  })
  processLargeData(data: any[]) {
    // Обробка великих даних
  }
}
```

## 📈 Конфігурація

Конфігурація знаходиться в `src/utils/profiling/setup.ts`:

```typescript
export const PROFILER_CONFIG = {
  cpu: {
    enabled: true,
    samplingInterval: 1000, // 1ms
    maxProfiles: 50,
    autoStart: false
  },
  memory: {
    enabled: true,
    monitoringInterval: 10000, // 10 секунд
    maxSnapshots: 100,
    leakDetectionThreshold: 50 * 1024 * 1024, // 50MB
    autoStart: true,
    gcInterval: 60000 // 1 хвилина
  },
  database: {
    enabled: true,
    maxQueryHistory: 10000,
    slowQueryThreshold: 1000, // 1 секунда
    autoStart: false,
    trackParameters: true
  },
  combined: {
    enabled: true,
    periodicProfiling: false,
    periodicInterval: 60000, // 1 хвилина
    autoExport: true,
    exportInterval: 300000 // 5 хвилин
  }
};
```

## 🔍 React Hooks

Для використання в React компонентах:

```typescript
import { 
  useCPUProfiler, 
  useMemoryProfiler, 
  useDatabaseProfiler,
  useCombinedProfiler 
} from '@/utils/profiling';

function MyComponent() {
  const { startProfiling, stopProfiling } = useCPUProfiler();
  const { takeSnapshot, detectLeaks } = useMemoryProfiler();
  const { profileQuery } = useDatabaseProfiler();
  
  useEffect(() => {
    const sessionId = startProfiling('component-render');
    
    return () => {
      stopProfiling();
    };
  }, []);
  
  // ... код компонента
}
```

## 📊 Метрики

### CPU метрики
- **Total execution time**
- **Function call count**
- **Average execution time**
- **Bottleneck identification**

### Memory метрики
- **Heap usage**
- **Memory growth**
- **Leak detection**
- **Object statistics**

### Database метрики
- **Query execution time**
- **Slow query identification**
- **Table access statistics**
- **Error rates**

## 🚨 Алерти

Система автоматично генерує алерти для:

- **Повільних операцій** (> 1 секунда)
- **Memory leaks** (> 50MB ріст)
- **Повільних запитів** (> 1 секунда)
- **High error rates** (> 5%)

## 📤 Експорт даних

```typescript
// Експорт всіх даних профілювання
const data = globalCombinedProfiler.exportAllData();

// Експорт окремих профілерів
const cpuData = globalCPUProfiler.exportData();
const memoryData = globalMemoryProfiler.exportData();
const dbData = globalDatabaseProfiler.exportData();
```

## 🛠️ Налаштування для Production

В production режимі профілери працюють в мінімальному режимі:

```typescript
// Автоматичне налаштування в залежності від середовища
if (import.meta.env.DEV) {
  // Full profiling in development
  await profilerSetup.initialize();
} else {
  // Minimal profiling in production
  initializeProfilers();
}
```

## 📝 Найкращі практики

1. **Використовуйте декоратори** для автоматичного профілювання
2. **Встановлюйте baseline** для memory профілювання
3. **Моніторьте повільні запити** в базі даних
4. **Періодично перевіряйте** на memory leaks
5. **Експортуйте дані** для аналізу
6. **Налаштуйте пороги** відповідно до ваших потреб

## 🔧 Troubleshooting

### Проблема: High memory usage
**Рішення:** Використовуйте `MonitorMemory` декоратор та перевірте на leaks

### Проблема: Slow database queries
**Рішення:** Використовуйте `ProfileQuery` декоратор та аналізуйте повільні запити

### Проблема: CPU bottlenecks
**Рішення:** Використовуйте `CPUProfiler` для виявлення повільних функцій

### Проблема: Performance degradation
**Рішення:** Використовуйте `AutoProfile` для комплексного моніторингу

## 📚 Додаткові ресурси

- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Memory Profiling Guide](https://developer.chrome.com/docs/devtools/memory-problems/)
- [React Performance](https://reactjs.org/docs/optimizing-performance.html)
- [Supabase Performance](https://supabase.com/docs/guides/performance)
