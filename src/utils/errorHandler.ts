import { logger } from './logger';

// Типи для обробки помилок
export interface ErrorContext {
  [key: string]: any;
  userId?: string;
  action?: string;
  component?: string;
  endpoint?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
}

export interface ErrorDetails {
  id: string;
  message: string;
  originalError?: Error;
  context?: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'network' | 'validation' | 'authentication' | 'authorization' | 'business' | 'system' | 'ui';
  timestamp: string;
  stack?: string;
}

// Клас для управління помилками
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorDetails[] = [];
  private maxQueueSize = 100;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Генерація унікального ID помилки
  private generateErrorId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ERR_${timestamp}_${random}`;
  }

  // Створення інформативного повідомлення про помилку
  private createErrorMessage(
    category: ErrorDetails['category'],
    originalMessage: string,
    context?: ErrorContext
  ): string {
    const categoryMessages = {
      network: `Помилка мережі: ${originalMessage}`,
      validation: `Помилка валідації: ${originalMessage}`,
      authentication: `Помилка автентифікації: ${originalMessage}`,
      authorization: `Помилка авторизації: ${originalMessage}`,
      business: `Бізнес-помилка: ${originalMessage}`,
      system: `Системна помилка: ${originalMessage}`,
      ui: `Помилка інтерфейсу: ${originalMessage}`
    };

    let message = categoryMessages[category] || originalMessage;
    
    if (context?.component) {
      message += ` (компонент: ${context.component})`;
    }
    
    if (context?.action) {
      message += ` (дія: ${context.action})`;
    }

    return message;
  }

  // Головний метод обробки помилки
  public handleError(
    error: Error | string,
    category: ErrorDetails['category'] = 'system',
    severity: ErrorDetails['severity'] = 'medium',
    context?: ErrorContext
  ): ErrorDetails {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    const originalError = typeof error === 'string' ? new Error(error) : error;
    const message = this.createErrorMessage(category, originalError.message, context);

    const errorDetails: ErrorDetails = {
      id: errorId,
      message,
      originalError,
      context: {
        ...context,
        timestamp,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined
      },
      severity,
      category,
      timestamp,
      stack: originalError.stack
    };

    // Додати до черги
    this.addToQueue(errorDetails);

    // Логування помилки
    this.logError(errorDetails);

    return errorDetails;
  }

  // Додавання помилки до черги
  private addToQueue(errorDetails: ErrorDetails): void {
    this.errorQueue.push(errorDetails);
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  // Логування помилки
  private logError(errorDetails: ErrorDetails): void {
    const logMessage = `[${errorDetails.id}] ${errorDetails.message}`;
    const logData = {
      ...errorDetails.context,
      stack: errorDetails.stack
    };

    switch (errorDetails.severity) {
      case 'low':
        logger.debug(logMessage, logData);
        break;
      case 'medium':
        logger.info(logMessage, logData);
        break;
      case 'high':
        logger.warn(logMessage, logData);
        break;
      case 'critical':
        logger.error(logMessage, logData);
        break;
    }
  }

  // Глобальні обробники помилок
  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Обробка неперехоплених помилок
      window.addEventListener('error', (event) => {
        this.handleError(
          event.error || event.message,
          'system',
          'high',
          {
            component: 'GlobalErrorHandler',
            action: 'uncaughtError',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        );
      });

      // Обробка неперехоплених Promise rejection
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(
          event.reason || 'Unhandled Promise Rejection',
          'system',
          'high',
          {
            component: 'GlobalErrorHandler',
            action: 'unhandledRejection'
          }
        );
      });
    }
  }

  // Отримання історії помилок
  public getErrorHistory(): ErrorDetails[] {
    return [...this.errorQueue];
  }

  // Очищення черги помилок
  public clearErrorHistory(): void {
    this.errorQueue = [];
  }

  // Отримання помилки за ID
  public getErrorById(id: string): ErrorDetails | undefined {
    return this.errorQueue.find(error => error.id === id);
  }

  // Статистика помилок
  public getErrorStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  } {
    const stats = {
      total: this.errorQueue.length,
      byCategory: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    };

    this.errorQueue.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Експорт singleton екземпляру
export const errorHandler = ErrorHandler.getInstance();

// Утиліти для зручного використання
export const createError = (
  message: string,
  category: ErrorDetails['category'] = 'system',
  severity: ErrorDetails['severity'] = 'medium',
  context?: ErrorContext
): ErrorDetails => {
  return errorHandler.handleError(message, category, severity, context);
};

export const handleNetworkError = (
  error: Error,
  context?: Omit<ErrorContext, 'category'>
): ErrorDetails => {
  return errorHandler.handleError(error, 'network', 'high', {
    ...context,
    action: context?.action || 'networkRequest'
  });
};

export const handleValidationError = (
  message: string,
  context?: Omit<ErrorContext, 'category'>
): ErrorDetails => {
  return errorHandler.handleError(message, 'validation', 'medium', {
    ...context,
    action: context?.action || 'validation'
  });
};

export const handleAuthError = (
  error: Error,
  isAuthentication = true,
  context?: Omit<ErrorContext, 'category'>
): ErrorDetails => {
  const category = isAuthentication ? 'authentication' : 'authorization';
  return errorHandler.handleError(error, category, 'high', {
    ...context,
    action: context?.action || (isAuthentication ? 'login' : 'access')
  });
};

// React Error Boundary компонент буде додано окремо в components/ui

// Експорт хука для зручності
export { useErrorHandler } from '../components/ui/ErrorBoundary';
