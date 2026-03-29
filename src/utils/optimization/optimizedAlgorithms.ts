// Оптимізовані алгоритми для LMS системи

// Оптимізована сортування з використанням різних алгоритмів
export class OptimizedSort {
  // Швидке сортування для великих масивів
  static quickSort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
    if (array.length <= 10) {
      // Для малих масивів використовуємо вставне сортування
      return this.insertionSort(array, compareFn);
    }
    
    const result = [...array];
    this.quickSortRecursive(result, 0, result.length - 1, compareFn);
    return result;
  }
  
  private static quickSortRecursive<T>(
    array: T[], 
    left: number, 
    right: number, 
    compareFn: (a: T, b: T) => number
  ): void {
    if (left >= right) return;
    
    const pivotIndex = this.partition(array, left, right, compareFn);
    this.quickSortRecursive(array, left, pivotIndex - 1, compareFn);
    this.quickSortRecursive(array, pivotIndex + 1, right, compareFn);
  }
  
  private static partition<T>(
    array: T[], 
    left: number, 
    right: number, 
    compareFn: (a: T, b: T) => number
  ): number {
    const pivot = array[right];
    let i = left - 1;
    
    for (let j = left; j < right; j++) {
      if (compareFn(array[j], pivot) <= 0) {
        i++;
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    
    [array[i + 1], array[right]] = [array[right], array[i + 1]];
    return i + 1;
  }
  
  // Вставне сортування для малих масивів
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
  
  // Сортування злиттям для стабільного сортування
  static mergeSort<T>(array: T[], compareFn: (a: T, b: T) => number): T[] {
    if (array.length <= 1) return array;
    
    const mid = Math.floor(array.length / 2);
    const left = this.mergeSort(array.slice(0, mid), compareFn);
    const right = this.mergeSort(array.slice(mid), compareFn);
    
    return this.merge(left, right, compareFn);
  }
  
  private static merge<T>(
    left: T[], 
    right: T[], 
    compareFn: (a: T, b: T) => number
  ): T[] {
    const result: T[] = [];
    let leftIndex = 0;
    let rightIndex = 0;
    
    while (leftIndex < left.length && rightIndex < right.length) {
      if (compareFn(left[leftIndex], right[rightIndex]) <= 0) {
        result.push(left[leftIndex++]);
      } else {
        result.push(right[rightIndex++]);
      }
    }
    
    return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
  }
}

// Оптимізований пошук з різними стратегіями
export class OptimizedSearch {
  // Бінарний пошук для відсортованих масивів
  static binarySearch<T>(
    array: T[], 
    target: T, 
    compareFn: (a: T, b: T) => number
  ): number {
    let left = 0;
    let right = array.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const comparison = compareFn(array[mid], target);
      
      if (comparison === 0) return mid;
      if (comparison < 0) left = mid + 1;
      else right = mid - 1;
    }
    
    return -1;
  }
  
  // Інтерполяційний пошук для рівномірно розподілених даних
  static interpolationSearch<T>(
    array: T[], 
    target: T, 
    getValue: (item: T) => number
  ): number {
    if (array.length === 0) return -1;
    
    let left = 0;
    let right = array.length - 1;
    const targetValue = getValue(target);
    
    while (left <= right && targetValue >= getValue(array[left]) && targetValue <= getValue(array[right])) {
      if (left === right) {
        return getValue(array[left]) === targetValue ? left : -1;
      }
      
      // Інтерполяційна формула
      const pos = left + Math.floor(
        ((targetValue - getValue(array[left])) * (right - left)) /
        (getValue(array[right]) - getValue(array[left]))
      );
      
      if (getValue(array[pos]) === targetValue) return pos;
      if (getValue(array[pos]) < targetValue) left = pos + 1;
      else right = pos - 1;
    }
    
    return -1;
  }
  
  // Нечіткий пошук для текстових даних
  static fuzzySearch<T>(
    items: T[], 
    query: string, 
    getText: (item: T) => string,
    threshold: number = 0.6
  ): Array<{ item: T; score: number }> {
    const normalizedQuery = query.toLowerCase();
    const results: Array<{ item: T; score: number }> = [];
    
    for (const item of items) {
      const text = getText(item).toLowerCase();
      const score = this.calculateFuzzyScore(normalizedQuery, text);
      
      if (score >= threshold) {
        results.push({ item, score });
      }
    }
    
    return results.sort((a, b) => b.score - a.score);
  }
  
  private static calculateFuzzyScore(query: string, text: string): number {
    if (query === text) return 1;
    if (text.includes(query)) return 0.8;
    
    // Levenshtein distance
    const distance = this.levenshteinDistance(query, text);
    const maxLength = Math.max(query.length, text.length);
    return 1 - (distance / maxLength);
  }
  
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Оптимізована обробка масивів
export class OptimizedArrayProcessor {
  // Пакетна обробка для великих масивів
  static async processBatch<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      // Даємо можливість event loop обробити інші задачі
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  }
  
  // Паралельна обробка з Web Workers
  static async processParallel<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrency: number = 4
  ): Promise<R[]> {
    const results: R[] = [];
    const inProgress: Promise<void>[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const promise = processor(items[i]).then(result => {
        results[i] = result;
      });
      
      inProgress.push(promise);
      
      // Обмежуємо кількість одночасних операцій
      if (inProgress.length >= maxConcurrency) {
        await Promise.race(inProgress);
        inProgress.splice(inProgress.findIndex(p => p === promise), 1);
      }
    }
    
    await Promise.all(inProgress);
    return results;
  }
  
  // Ефективна фільтрація з раннім виходом
  static filterEarly<T>(
    items: T[],
    predicates: Array<(item: T) => boolean>,
    sortedByComplexity: boolean = true
  ): T[] {
    // Сортуємо предикати по складності (прості перші)
    if (sortedByComplexity) {
      predicates.sort((a, b) => {
        // Проста евристика: коротші функції зазвичай простіші
        const aComplexity = a.toString().length;
        const bComplexity = b.toString().length;
        return aComplexity - bComplexity;
      });
    }
    
    return items.filter(item => {
      for (const predicate of predicates) {
        if (!predicate(item)) return false; // Ранній вихід
      }
      return true;
    });
  }
  
  // Групування з оптимізацією пам'яті
  static groupByOptimized<T, K>(
    items: T[],
    keyFn: (item: T) => K,
    mapFactory?: () => Map<K, T[]>
  ): Map<K, T[]> {
    const groups = mapFactory?.() || new Map<K, T[]>();
    
    for (const item of items) {
      const key = keyFn(item);
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key)!.push(item);
    }
    
    return groups;
  }
}

// Оптимізована обробка рядків
export class OptimizedStringProcessor {
  // Кешування скомпільованих регулярних виразів
  private static regexCache = new Map<string, RegExp>();
  
  static getCompiledRegex(pattern: string, flags?: string): RegExp {
    const key = `${pattern}:${flags || ''}`;
    
    if (!this.regexCache.has(key)) {
      this.regexCache.set(key, new RegExp(pattern, flags));
    }
    
    return this.regexCache.get(key)!;
  }
  
  // Оптимізована заміна з кешуванням
  static replaceOptimized(
    text: string,
    pattern: string | RegExp,
    replacement: string
  ): string {
    if (typeof pattern === 'string') {
      // Для простих рядків використовуємо вбудований метод
      return text.split(pattern).join(replacement);
    }
    
    // Для regex використовуємо кешовану версію
    const regex = this.getCompiledRegex(pattern.source, pattern.flags);
    return text.replace(regex, replacement);
  }
  
  // Ефективний пошук підрядків
  static indexOfOptimized(text: string, search: string, startIndex: number = 0): number {
    // Для коротких текстів використовуємо вбудований метод
    if (text.length < 1000) {
      return text.indexOf(search, startIndex);
    }
    
    // Для великих текстів використовуємо Boyer-Moore алгоритм
    return this.boyerMooreSearch(text, search, startIndex);
  }
  
  private static boyerMooreSearch(text: string, pattern: string, startIndex: number): number {
    const patternLength = pattern.length;
    const textLength = text.length;
    
    if (patternLength === 0) return startIndex;
    if (patternLength > textLength) return -1;
    
    // Побудова таблиці пропусків
    const skipTable = new Map<string, number>();
    for (let i = 0; i < patternLength - 1; i++) {
      skipTable.set(pattern[i], patternLength - 1 - i);
    }
    
    let i = startIndex;
    while (i <= textLength - patternLength) {
      let j = patternLength - 1;
      
      while (j >= 0 && text[i + j] === pattern[j]) {
        j--;
      }
      
      if (j < 0) return i;
      
      const skipChar = text[i + patternLength - 1];
      i += skipTable.get(skipChar) || patternLength;
    }
    
    return -1;
  }
  
  // Оптимізована обробка великих рядків частинами
  static processLargeString(
    text: string,
    processor: (chunk: string) => string,
    chunkSize: number = 10000
  ): string {
    if (text.length <= chunkSize) {
      return processor(text);
    }
    
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      chunks.push(processor(chunk));
    }
    
    return chunks.join('');
  }
}

// Оптимізовані математичні операції
export class OptimizedMath {
  // Кешування обчислень
  private static computationCache = new Map<string, number>();
  
  // Оптимізоване обчислення статистики
  static calculateStatistics(numbers: number[]): {
    mean: number;
    median: number;
    mode: number[];
    variance: number;
    standardDeviation: number;
  } {
    if (numbers.length === 0) {
      return { mean: 0, median: 0, mode: [], variance: 0, standardDeviation: 0 };
    }
    
    // Середнє значення
    const sum = numbers.reduce((acc, num) => acc + num, 0);
    const mean = sum / numbers.length;
    
    // Медіана
    const sorted = [...numbers].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    // Мода
    const frequencyMap = new Map<number, number>();
    numbers.forEach(num => {
      frequencyMap.set(num, (frequencyMap.get(num) || 0) + 1);
    });
    
    const maxFrequency = Math.max(...frequencyMap.values());
    const mode = Array.from(frequencyMap.entries())
      .filter(([_, freq]) => freq === maxFrequency)
      .map(([num]) => num);
    
    // Дисперсія та стандартне відхилення
    const variance = numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) / numbers.length;
    const standardDeviation = Math.sqrt(variance);
    
    return { mean, median, mode, variance, standardDeviation };
  }
  
  // Оптимізоване обчислення факторіалу з мемоізацією
  static factorial(n: number): number {
    if (n < 0) throw new Error('Factorial is not defined for negative numbers');
    if (n === 0 || n === 1) return 1;
    
    const cacheKey = `factorial_${n}`;
    if (this.computationCache.has(cacheKey)) {
      return this.computationCache.get(cacheKey)!;
    }
    
    // Ітеративний підхід замість рекурсивного
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    
    this.computationCache.set(cacheKey, result);
    return result;
  }
  
  // Оптимізовані тригонометричні обчислення з таблицями
  private static trigTable = new Map<number, { sin: number; cos: number }>();
  private static readonly PRECISION = 1000; // Кількість точок в таблиці
  
  static sin(angle: number): number {
    const normalizedAngle = this.normalizeAngle(angle);
    const tableKey = Math.round(normalizedAngle * this.PRECISION / (2 * Math.PI));
    
    if (this.trigTable.has(tableKey)) {
      return this.trigTable.get(tableKey)!.sin;
    }
    
    const result = Math.sin(normalizedAngle);
    this.trigTable.set(tableKey, { sin: result, cos: Math.cos(normalizedAngle) });
    return result;
  }
  
  static cos(angle: number): number {
    const normalizedAngle = this.normalizeAngle(angle);
    const tableKey = Math.round(normalizedAngle * this.PRECISION / (2 * Math.PI));
    
    if (this.trigTable.has(tableKey)) {
      return this.trigTable.get(tableKey)!.cos;
    }
    
    const result = Math.cos(normalizedAngle);
    this.trigTable.set(tableKey, { sin: Math.sin(normalizedAngle), cos: result });
    return result;
  }
  
  private static normalizeAngle(angle: number): number {
    while (angle < 0) angle += 2 * Math.PI;
    while (angle > 2 * Math.PI) angle -= 2 * Math.PI;
    return angle;
  }
  
  // Очищення кешу
  static clearCache(): void {
    this.computationCache.clear();
    this.trigTable.clear();
  }
  
  // Отримання статистики кешу
  static getCacheStats(): {
    computationCacheSize: number;
    trigTableSize: number;
    memoryUsage: number;
  } {
    return {
      computationCacheSize: this.computationCache.size,
      trigTableSize: this.trigTable.size,
      memoryUsage: (this.computationCache.size + this.trigTable.size) * 8 // Приблизно
    };
  }
}

// Дебаунс для оптимізації викликів функцій
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Тротлінг для обмеження частоти викликів
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Мемоізація функцій
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
