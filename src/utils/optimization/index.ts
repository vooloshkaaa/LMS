// Експорт всіх оптимізаційних утиліт
export * from './optimizedDataStructures';
export * from './optimizedAlgorithms';
export * from './optimizedDatabase';

// Комбінований оптимізатор
export class PerformanceOptimizer {
  // Оптимізація масивів даних
  static optimizeArray<T>(items: T[], options?: {
    sort?: (a: T, b: T) => number;
    filter?: (item: T) => boolean;
    groupBy?: (item: T) => string;
    limit?: number;
  }): T[] {
    let result = [...items];
    
    // Фільтрація перша для зменшення обсягу даних
    if (options?.filter) {
      result = result.filter(options.filter);
    }
    
    // Сортування
    if (options?.sort) {
      result = this.optimizedSort(result, options.sort);
    }
    
    // Групування (якщо потрібно)
    if (options?.groupBy) {
      const groups = this.groupBy(result, options.groupBy);
      return Object.values(groups).flat();
    }
    
    // Обмеження
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  // Оптимізоване сортування
  private static optimizedSort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
    // Використовуємо відповідний алгоритм залежно від розміру
    if (array.length <= 10) {
      return this.insertionSort(array, compareFn);
    }
    return this.quickSort(array, compareFn);
  }
  
  private static quickSort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
    if (array.length <= 1) return array;
    
    const pivot = array[array.length - 1];
    const left = array.slice(0, -1).filter(item => compareFn(item, pivot) <= 0);
    const right = array.slice(0, -1).filter(item => compareFn(item, pivot) > 0);
    
    return [...this.quickSort(left, compareFn), pivot, ...this.quickSort(right, compareFn)];
  }
  
  private static insertionSort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
    const result = [...array];
    
    for (let i = 1; i < result.length; i++) {
      const key = result[i];
      let j = i - 1;
      
      while (j >= 0 && compareFn(result[j], key) > 0) {
        result[j + 1] = result[j];
        j--;
      }
      
      result[j + 1] = key;
    }
    
    return result;
  }
  
  private static groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
  
  // Оптимізація рядків
  static optimizeString(text: string, operations?: {
    trim?: boolean;
    normalize?: boolean;
    compress?: boolean;
  }): string {
    let result = text;
    
    if (operations?.trim) {
      result = result.trim();
    }
    
    if (operations?.normalize) {
      result = result.normalize('NFC');
    }
    
    if (operations?.compress) {
      result = result.replace(/\s+/g, ' ');
    }
    
    return result;
  }
  
  // Оптимізація обчислень
  static memoizeFunction<T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }
  
  // Оптимізація асинхронних операцій
  static async optimizeAsync<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options?: {
      batchSize?: number;
      maxConcurrency?: number;
      progressCallback?: (completed: number, total: number) => void;
    }
  ): Promise<R[]> {
    const batchSize = options?.batchSize || 10;
    const maxConcurrency = options?.maxConcurrency || 3;
    const results: R[] = [];
    
    // Розбиваємо на частини
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    // Обробляємо частини з обмеженням конкурентності
    const semaphore = new Semaphore(maxConcurrency);
    
    const promises = batches.map(async (batch, batchIndex) => {
      await semaphore.acquire();
      
      try {
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
        
        if (options?.progressCallback) {
          options.progressCallback(
            Math.min((batchIndex + 1) * batchSize, items.length),
            items.length
          );
        }
        
        return batchResults;
      } finally {
        semaphore.release();
      }
    });
    
    await Promise.all(promises);
    return results;
  }
}

// Простий семафор для обмеження конкурентності
class Semaphore {
  private available: number;
  private waitQueue: (() => void)[] = [];
  
  constructor(maxConcurrency: number) {
    this.available = maxConcurrency;
  }
  
  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }
    
    return new Promise(resolve => {
      this.waitQueue.push(resolve);
    });
  }
  
  release(): void {
    this.available++;
    
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      resolve();
      this.available--;
    }
  }
}

// Утиліти для веб-воркерів
export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    task: any;
    resolve: (result: any) => void;
    reject: (error: any) => void;
  }> = [];
  private busyWorkers = new Set<Worker>();
  
  constructor(workerScript: string, poolSize: number = 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      worker.onmessage = this.handleWorkerMessage.bind(this);
      this.workers.push(worker);
    }
  }
  
  async execute<T>(task: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processQueue();
    });
  }
  
  private handleWorkerMessage(event: MessageEvent): void {
    const worker = event.target as Worker;
    this.busyWorkers.delete(worker);
    
    // Знаходимо відповідний task з черги
    const taskIndex = this.taskQueue.findIndex(t => 
      t.resolve.toString() === event.data.resolveId
    );
    
    if (taskIndex !== -1) {
      const task = this.taskQueue.splice(taskIndex, 1)[0];
      task.resolve(event.data.result);
    }
    
    this.processQueue();
  }
  
  private processQueue(): void {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
    if (!availableWorker) return;
    
    const task = this.taskQueue[0];
    this.busyWorkers.add(availableWorker);
    
    availableWorker.postMessage({
      task: task.task,
      resolveId: task.resolve.toString()
    });
  }
  
  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.busyWorkers.clear();
  }
}

// Експорт за замовчуванням
export default PerformanceOptimizer;
