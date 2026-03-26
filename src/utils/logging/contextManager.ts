import { LogContext } from './interfaces';

// Менеджер контексту для логів
export class LogContextManager {
  private static instance: LogContextManager;
  private globalContext: LogContext = {};
  private contextStack: LogContext[] = [];

  private constructor() {}

  public static getInstance(): LogContextManager {
    if (!LogContextManager.instance) {
      LogContextManager.instance = new LogContextManager();
    }
    return LogContextManager.instance;
  }

  // Встановлення глобального контексту
  public setGlobalContext(context: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  // Отримання глобального контексту
  public getGlobalContext(): LogContext {
    return { ...this.globalContext };
  }

  // Додавання контексту в стек (для вкладених операцій)
  public pushContext(context: Partial<LogContext>): void {
    this.contextStack.push({ ...context });
  }

  // Видалення контексту зі стеку
  public popContext(): LogContext | undefined {
    return this.contextStack.pop();
  }

  // Отримання повного контексту (глобальний + стек)
  public getFullContext(): LogContext {
    const stackContext = this.contextStack.reduce(
      (acc, ctx) => ({ ...acc, ...ctx }),
      {}
    );
    
    return { ...this.globalContext, ...stackContext };
  }

  // Очищення контексту
  public clearContext(): void {
    this.globalContext = {};
    this.contextStack = [];
  }

  // Створення контексту для HTTP запиту
  public createRequestContext(
    requestId: string,
    userId?: string,
    endpoint?: string,
    method?: string
  ): LogContext {
    return {
      requestId,
      userId,
      endpoint,
      method,
      timestamp: new Date().toISOString()
    };
  }

  // Створення контексту для сесії користувача
  public createSessionContext(
    userId: string,
    sessionId: string
  ): LogContext {
    return {
      userId,
      sessionId,
      sessionStart: new Date().toISOString()
    };
  }

  // Створення контексту для компонента
  public createComponentContext(
    component: string,
    action?: string,
    additionalData?: any
  ): LogContext {
    return {
      component,
      action,
      ...additionalData
    };
  }
}

// Хук для роботи з контекстом в React
export const useLogContext = () => {
  const contextManager = LogContextManager.getInstance();

  return {
    setGlobalContext: contextManager.setGlobalContext.bind(contextManager),
    getGlobalContext: contextManager.getGlobalContext.bind(contextManager),
    pushContext: contextManager.pushContext.bind(contextManager),
    popContext: contextManager.popContext.bind(contextManager),
    getFullContext: contextManager.getFullContext.bind(contextManager),
    clearContext: contextManager.clearContext.bind(contextManager),
    createRequestContext: contextManager.createRequestContext.bind(contextManager),
    createSessionContext: contextManager.createSessionContext.bind(contextManager),
    createComponentContext: contextManager.createComponentContext.bind(contextManager)
  };
};

// Утиліти для автоматичного додавання контексту
export class ContextUtils {
  // Генерація унікального ID запиту
  public static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Генерація ID сесії
  public static generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Отримання інформації про браузер
  public static getBrowserInfo(): { userAgent: string; language: string; platform: string } {
    if (typeof window === 'undefined') {
      return { userAgent: '', language: '', platform: '' };
    }

    return {
      userAgent: window.navigator.userAgent,
      language: window.navigator.language,
      platform: window.navigator.platform
    };
  }

  // Отримання IP адреси (якщо доступно)
  public static async getClientIP(): Promise<string | null> {
    try {
      // В реальному додатку тут може бути запит до сервісу для отримання IP
      // Для прикладу використовуємо mock дані
      return null;
    } catch {
      return null;
    }
  }

  // Вимірювання тривалості операції
  public static createTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }

  // Створення контексту з інформацією про помилку
  public static createErrorContext(error: Error, additionalContext?: Partial<LogContext>): LogContext {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      ...additionalContext
    };
  }

  // Створення контексту для API відповіді
  public static createApiResponseContext(
    statusCode: number,
    responseTime: number,
    endpoint: string
  ): LogContext {
    return {
      statusCode,
      responseTime,
      endpoint,
      success: statusCode >= 200 && statusCode < 300
    };
  }
}

// Експорт singleton екземпляру
export const logContextManager = LogContextManager.getInstance();
