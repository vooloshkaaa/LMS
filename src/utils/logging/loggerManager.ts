import { 
  LogHandler, 
  LogEntry, 
  LogLevel, 
  LogContext, 
  LoggerConfig,
  LogFormat 
} from './interfaces';
import { logContextManager } from './contextManager';

// Розширений менеджер логів
export class LoggerManager {
  private static instance: LoggerManager;
  private handlers: LogHandler[] = [];
  private globalMinLevel: LogLevel = LogLevel.INFO;
  private isEnabled: boolean = true;

  private constructor() {}

  public static getInstance(): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager();
    }
    return LoggerManager.instance;
  }

  // Конфігурація менеджера
  public configure(config: LoggerConfig): void {
    this.handlers = config.handlers;
    this.globalMinLevel = config.globalMinLevel;
    
    if (config.context) {
      logContextManager.setGlobalContext(config.context);
    }
  }

  // Додавання обробника
  public addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }

  // Видалення обробника
  public removeHandler(handlerName: string): void {
    this.handlers = this.handlers.filter(h => h.name !== handlerName);
  }

  // Отримання обробників
  public getHandlers(): LogHandler[] {
    return [...this.handlers];
  }

  // Включення/виключення логування
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Встановлення глобального рівня логування
  public setGlobalMinLevel(level: LogLevel): void {
    this.globalMinLevel = level;
  }

  // Головний метод логування
  public async log(
    level: LogLevel,
    message: string,
    context?: Partial<LogContext>,
    error?: Error
  ): Promise<void> {
    if (!this.isEnabled || level < this.globalMinLevel) {
      return;
    }

    const fullContext = logContextManager.getFullContext();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...fullContext, ...context },
      stack: error?.stack
    };

    // Асинхронна обробка всіма обробниками
    const promises = this.handlers.map(handler => 
      this.safeHandle(handler, entry)
    );

    await Promise.allSettled(promises);
  }

  // Безпечна обробка помилок в обробниках
  private async safeHandle(handler: LogHandler, entry: LogEntry): Promise<void> {
    try {
      await handler.handle(entry);
    } catch (error) {
      console.error(`Error in log handler '${handler.name}':`, error);
    }
  }

  // Зручні методи для різних рівнів логування
  public async debug(message: string, context?: Partial<LogContext>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, context);
  }

  public async info(message: string, context?: Partial<LogContext>): Promise<void> {
    await this.log(LogLevel.INFO, message, context);
  }

  public async warn(message: string, context?: Partial<LogContext>): Promise<void> {
    await this.log(LogLevel.WARN, message, context);
  }

  public async error(
    message: string, 
    context?: Partial<LogContext>, 
    error?: Error
  ): Promise<void> {
    await this.log(LogLevel.ERROR, message, context, error);
  }

  // Логування HTTP запитів
  public async logRequest(
    method: string,
    url: string,
    headers?: Record<string, string>,
    body?: any
  ): Promise<string> {
    const requestId = require('./contextManager').ContextUtils.generateRequestId();
    
    await this.info(`HTTP ${method} ${url}`, {
      requestId,
      method,
      endpoint: url,
      headers: this.sanitizeHeaders(headers),
      body: body ? JSON.stringify(body) : undefined,
      type: 'http_request'
    });
    
    return requestId;
  }

  // Логування HTTP відповідей
  public async logResponse(
    requestId: string,
    statusCode: number,
    responseTime: number,
    response?: any
  ): Promise<void> {
    await this.info(`HTTP Response ${statusCode}`, {
      requestId,
      statusCode,
      responseTime,
      response: response ? JSON.stringify(response) : undefined,
      type: 'http_response',
      success: statusCode >= 200 && statusCode < 300
    });
  }

  // Логування операцій з вимірюванням часу
  public async logOperation<T>(
    operationName: string,
    operation: () => Promise<T> | T,
    context?: Partial<LogContext>
  ): Promise<T> {
    const timer = require('./contextManager').ContextUtils.createTimer();
    const operationId = require('./contextManager').ContextUtils.generateRequestId();
    
    await this.debug(`Starting operation: ${operationName}`, {
      operationId,
      operationName,
      type: 'operation_start',
      ...context
    });

    try {
      const result = await operation();
      const duration = timer();
      
      await this.info(`Completed operation: ${operationName}`, {
        operationId,
        operationName,
        duration,
        type: 'operation_success',
        ...context
      });
      
      return result;
    } catch (error) {
      const duration = timer();
      
      await this.error(`Failed operation: ${operationName}`, {
        operationId,
        operationName,
        duration,
        type: 'operation_failure',
        error: error instanceof Error ? error.message : String(error),
        ...context
      }, error instanceof Error ? error : undefined);
      
      throw error;
    }
  }

  // Очищення чутливої інформації з заголовків
  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined;
    
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  // Отримання статистики логування
  public getStats(): {
    handlersCount: number;
    globalMinLevel: LogLevel;
    isEnabled: boolean;
    handlers: Array<{ name: string; minLevel: LogLevel; format: LogFormat }>;
  } {
    return {
      handlersCount: this.handlers.length,
      globalMinLevel: this.globalMinLevel,
      isEnabled: this.isEnabled,
      handlers: this.handlers.map(h => ({
        name: h.name,
        minLevel: h.minLevel,
        format: h.format
      }))
    };
  }

  // Очищення ресурсів
  public destroy(): void {
    this.handlers.forEach(handler => {
      if ('destroy' in handler && typeof handler.destroy === 'function') {
        (handler as any).destroy();
      }
    });
    this.handlers = [];
  }
}

// Експорт singleton екземпляру
export const loggerManager = LoggerManager.getInstance();
