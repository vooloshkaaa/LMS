import { LogLevel, LogFormat, LoggerConfig } from './interfaces';
import { ConsoleHandler, FileHandler, RemoteHandler } from './handlers';
import { ContextUtils } from './contextManager';

// Фабрика для створення конфігурації логування
export class LoggingConfigFactory {
  // Створення конфігурації для development середовища
  public static createDevelopmentConfig(): LoggerConfig {
    return {
      globalMinLevel: LogLevel.DEBUG,
      handlers: [
        new ConsoleHandler({
          format: LogFormat.TEXT,
          colors: true,
          minLevel: LogLevel.DEBUG
        }),
        new FileHandler({
          filename: 'app-dev.log',
          format: LogFormat.STRUCTURED,
          minLevel: LogLevel.INFO,
          rotation: {
            enabled: true,
            maxSize: 5 * 1024 * 1024, // 5MB
            maxFiles: 5,
            maxAge: '1d',
            compress: false
          }
        })
      ],
      context: {
        environment: 'development',
        version: process.env.npm_package_version || '1.0.0'
      }
    };
  }

  // Створення конфігурації для production середовища
  public static createProductionConfig(): LoggerConfig {
    return {
      globalMinLevel: LogLevel.INFO,
      handlers: [
        new ConsoleHandler({
          format: LogFormat.JSON,
          colors: false,
          minLevel: LogLevel.WARN
        }),
        new FileHandler({
          filename: 'app-prod.log',
          format: LogFormat.JSON,
          minLevel: LogLevel.INFO,
          rotation: {
            enabled: true,
            maxSize: 50 * 1024 * 1024, // 50MB
            maxFiles: 10,
            maxAge: '7d',
            compress: true
          }
        }),
        new RemoteHandler({
          url: process.env.REACT_APP_LOGGING_URL || 'https://api.example.com/logs',
          apiKey: process.env.REACT_APP_LOGGING_API_KEY,
          format: LogFormat.JSON,
          minLevel: LogLevel.ERROR,
          batchSize: 50,
          flushInterval: 30000, // 30 секунд
          retryAttempts: 3
        })
      ],
      context: {
        environment: 'production',
        version: process.env.npm_package_version || '1.0.0'
      }
    };
  }

  // Створення конфігурації для тестування
  public static createTestConfig(): LoggerConfig {
    return {
      globalMinLevel: LogLevel.SILENT,
      handlers: [
        new ConsoleHandler({
          format: LogFormat.TEXT,
          colors: false,
          minLevel: LogLevel.ERROR
        })
      ],
      context: {
        environment: 'test',
        version: process.env.npm_package_version || '1.0.0'
      }
    };
  }

  // Створення конфігурації на основі змінних середовища
  public static createConfigFromEnv(): LoggerConfig {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    switch (nodeEnv) {
      case 'production':
        return this.createProductionConfig();
      case 'test':
        return this.createTestConfig();
      default:
        return this.createDevelopmentConfig();
    }
  }

  // Створення кастомної конфігурації
  public static createCustomConfig(options: {
    logLevel?: LogLevel;
    enableConsole?: boolean;
    enableFile?: boolean;
    enableRemote?: boolean;
    fileRotation?: {
      maxSize?: number;
      maxFiles?: number;
      maxAge?: string;
    };
    remoteConfig?: {
      url: string;
      apiKey?: string;
    };
  }): LoggerConfig {
    const handlers: any[] = [];
    const logLevel = options.logLevel || LogLevel.INFO;

    if (options.enableConsole !== false) {
      handlers.push(new ConsoleHandler({
        format: LogFormat.TEXT,
        colors: process.env.NODE_ENV !== 'production',
        minLevel: logLevel
      }));
    }

    if (options.enableFile !== false) {
      handlers.push(new FileHandler({
        filename: `app-${process.env.NODE_ENV || 'dev'}.log`,
        format: LogFormat.STRUCTURED,
        minLevel: logLevel,
        rotation: {
          enabled: true,
          maxSize: options.fileRotation?.maxSize || 10 * 1024 * 1024, // 10MB
          maxFiles: options.fileRotation?.maxFiles || 5,
          maxAge: options.fileRotation?.maxAge || '3d',
          compress: process.env.NODE_ENV === 'production'
        }
      }));
    }

    if (options.enableRemote && options.remoteConfig) {
      handlers.push(new RemoteHandler({
        url: options.remoteConfig.url,
        apiKey: options.remoteConfig.apiKey,
        format: LogFormat.JSON,
        minLevel: LogLevel.ERROR,
        batchSize: 100,
        flushInterval: 60000, // 1 хвилина
        retryAttempts: 3
      }));
    }

    return {
      globalMinLevel: logLevel,
      handlers,
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Предвизначені конфігурації
export const LOGGING_CONFIGS = {
  DEVELOPMENT: LoggingConfigFactory.createDevelopmentConfig(),
  PRODUCTION: LoggingConfigFactory.createProductionConfig(),
  TEST: LoggingConfigFactory.createTestConfig(),
  FROM_ENV: LoggingConfigFactory.createConfigFromEnv()
};

// Утиліти для роботи з конфігурацією
export class ConfigUtils {
  // Отримання конфігурації на основі URL параметрів (для debugging)
  public static getConfigFromURL(): LoggerConfig | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug');
    const logLevel = urlParams.get('logLevel');

    if (debugMode === 'true' || logLevel) {
      const level = this.parseLogLevel(logLevel) || LogLevel.DEBUG;
      
      return LoggingConfigFactory.createCustomConfig({
        logLevel: level,
        enableConsole: true,
        enableFile: true,
        enableRemote: false
      });
    }

    return null;
  }

  // Парсинг рівня логування з рядка
  private static parseLogLevel(level?: string | null): LogLevel | null {
    if (!level) return null;
    
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      case 'silent': return LogLevel.SILENT;
      default: return null;
    }
  }

  // Валідація конфігурації
  public static validateConfig(config: LoggerConfig): boolean {
    if (!config.handlers || config.handlers.length === 0) {
      console.warn('Logging config: No handlers specified');
      return false;
    }

    if (config.globalMinLevel === undefined) {
      console.warn('Logging config: globalMinLevel not specified');
      return false;
    }

    return true;
  }

  // Експорт конфігурації в JSON (для debugging)
  public static exportConfig(config: LoggerConfig): string {
    return JSON.stringify({
      globalMinLevel: LogLevel[config.globalMinLevel],
      handlersCount: config.handlers.length,
      handlers: config.handlers.map(h => ({
        name: h.name,
        minLevel: LogLevel[h.minLevel],
        format: h.format
      })),
      context: config.context
    }, null, 2);
  }
}
