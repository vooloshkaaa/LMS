import { LogHandler, LogEntry, LogFormat, LogLevel, FileHandlerConfig, ConsoleHandlerConfig, RotationConfig } from './interfaces';
import { LogFormatter, ConsoleFormatter } from './formatters';

// Консольний обробник
export class ConsoleHandler implements LogHandler {
  public name: string;
  public minLevel: LogLevel;
  public format: LogFormat;
  public colors: boolean;

  constructor(config: ConsoleHandlerConfig) {
    this.name = 'console';
    this.minLevel = config.minLevel;
    this.format = config.format;
    this.colors = config.colors;
  }

  handle(entry: LogEntry): void {
    if (entry.level < this.minLevel) {
      return;
    }

    const message = ConsoleFormatter.formatWithColors(entry, this.colors);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }
}

// Файловий обробник з ротацією
export class FileHandler implements LogHandler {
  public name: string;
  public minLevel: LogLevel;
  public format: LogFormat;
  private filename: string;
  private rotation: RotationConfig;

  constructor(config: FileHandlerConfig) {
    this.name = 'file';
    this.minLevel = config.minLevel;
    this.format = config.format;
    this.filename = config.filename;
    this.rotation = config.rotation;
  }

  async handle(entry: LogEntry): Promise<void> {
    if (entry.level < this.minLevel) {
      return;
    }

    const message = LogFormatter.format(entry, this.format);
    
    try {
      // В браузері використовуємо localStorage для симуляції файлового логування
      if (typeof window !== 'undefined') {
        await this.writeToBrowserStorage(message);
      } else {
        // В Node.js використовуємо файлову систему
        await this.writeToFile(message);
      }
      
      if (this.rotation.enabled) {
        await this.checkRotation();
      }
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  private async writeToBrowserStorage(message: string): Promise<void> {
    const key = `lms_logs_${this.filename}`;
    const existingLogs = localStorage.getItem(key) || '';
    const newLogs = existingLogs + message + '\n';
    
    try {
      localStorage.setItem(key, newLogs);
    } catch (error) {
      // Якщо localStorage переповнений, очищаємо старі логи
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanOldLogs();
        localStorage.setItem(key, message + '\n');
      }
    }
  }

  private async writeToFile(message: string): Promise<void> {
    // В реальному Node.js оточенні тут був би код для запису в файл
    // Для браузерного середовища це не застосовується
    console.log('File write (Node.js only):', message);
  }

  private async checkRotation(): Promise<void> {
    if (typeof window === 'undefined') {
      return; // Ротація тільки для браузерного середовища
    }

    const key = `lms_logs_${this.filename}`;
    const logs = localStorage.getItem(key) || '';
    
    // Перевірка розміру
    if (this.rotation.maxSize && logs.length > this.rotation.maxSize) {
      await this.rotateLogs();
    }
    
    // Перевірка часу (спрощена версія)
    if (this.rotation.maxAge) {
      const maxAgeMs = this.parseMaxAge(this.rotation.maxAge);
      const logsKey = `lms_logs_${this.filename}_timestamp`;
      const lastRotation = localStorage.getItem(logsKey);
      
      if (!lastRotation || Date.now() - parseInt(lastRotation) > maxAgeMs) {
        await this.rotateLogs();
        localStorage.setItem(logsKey, Date.now().toString());
      }
    }
  }

  private parseMaxAge(maxAge: string): number {
    const value = parseInt(maxAge.slice(0, -1));
    const unit = maxAge.slice(-1);
    
    switch (unit) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'M': return value * 30 * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      default: return value * 60 * 1000; // хвилини за замовчуванням
    }
  }

  private async rotateLogs(): Promise<void> {
    const key = `lms_logs_${this.filename}`;
    const currentLogs = localStorage.getItem(key) || '';
    
    // Створюємо бекап поточних логів
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `lms_logs_${this.filename}_${timestamp}`;
    localStorage.setItem(backupKey, currentLogs);
    
    // Очищуємо поточні логи
    localStorage.setItem(key, '');
    
    // Обмежуємо кількість бекапів
    this.cleanupOldBackups();
  }

  private cleanupOldBackups(): void {
    if (!this.rotation.maxFiles) {
      return;
    }
    
    const prefix = `lms_logs_${this.filename}_`;
    const keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
    
    if (keys.length > this.rotation.maxFiles) {
      // Сортуємо за часом (ключі містять timestamp)
      keys.sort();
      const keysToDelete = keys.slice(0, keys.length - this.rotation.maxFiles);
      
      keysToDelete.forEach(key => localStorage.removeItem(key));
    }
  }

  private cleanOldLogs(): void {
    const key = `lms_logs_${this.filename}`;
    const logs = localStorage.getItem(key) || '';
    
    // Залишаємо тільки останні 50% логів
    const lines = logs.split('\n');
    const halfLines = lines.slice(-Math.floor(lines.length / 2));
    localStorage.setItem(key, halfLines.join('\n'));
  }

  // Метод для отримання логів з браузерного сховища
  public getLogs(): string[] {
    if (typeof window === 'undefined') {
      return [];
    }
    
    const key = `lms_logs_${this.filename}`;
    const logs = localStorage.getItem(key) || '';
    return logs.split('\n').filter(line => line.trim());
  }

  // Метод для очищення логів
  public clearLogs(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    const key = `lms_logs_${this.filename}`;
    localStorage.removeItem(key);
  }
}

// Обробник для віддаленого логування (наприклад, до Sentry, LogRocket, etc.)
export class RemoteHandler implements LogHandler {
  public name: string;
  public minLevel: LogLevel;
  public format: LogFormat;
  private url: string;
  private apiKey?: string;
  private batchSize: number;
  private flushInterval: number;
  private retryAttempts: number;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: any) {
    this.name = 'remote';
    this.minLevel = config.minLevel;
    this.format = config.format;
    this.url = config.url;
    this.apiKey = config.apiKey;
    this.batchSize = config.batchSize;
    this.flushInterval = config.flushInterval;
    this.retryAttempts = config.retryAttempts;
    
    this.startFlushTimer();
  }

  async handle(entry: LogEntry): Promise<void> {
    if (entry.level < this.minLevel) {
      return;
    }

    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  private startFlushTimer(): void {
    if (this.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        if (this.buffer.length > 0) {
          this.flush();
        }
      }, this.flushInterval);
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      await this.sendBatch(batch);
    } catch (error) {
      console.error('Failed to send logs to remote service:', error);
      // Повертаємо логи в буфер для повторної спроби
      this.buffer.unshift(...batch);
    }
  }

  private async sendBatch(batch: LogEntry[]): Promise<void> {
    const payload = {
      logs: batch.map(entry => ({
        timestamp: entry.timestamp,
        level: entry.level,
        message: entry.message,
        context: entry.context,
        stack: entry.stack
      })),
      apiKey: this.apiKey
    };

    // В реальному додатку тут був би fetch запит до віддаленого сервісу
    console.log('Remote logs (would be sent to):', this.url, payload);
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}
