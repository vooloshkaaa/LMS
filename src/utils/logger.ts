import log from 'loglevel';
import { loggerManager } from './logging/loggerManager';
import { LOGGING_CONFIGS, ConfigUtils } from './logging/config';
import { LogLevel } from './logging/interfaces';
import { logContextManager } from './logging/contextManager';

// Ініціалізація розширеної системи логування
const initializeAdvancedLogger = () => {
  try {
    // Спроба отримати конфігурацію з URL параметрів
    const urlConfig = ConfigUtils.getConfigFromURL();
    const config = urlConfig || LOGGING_CONFIGS.FROM_ENV;
    
    if (ConfigUtils.validateConfig(config)) {
      loggerManager.configure(config);
      
      // Додавання глобального контексту
      const browserInfo = require('./logging/contextManager').ContextUtils.getBrowserInfo();
      logContextManager.setGlobalContext({
        userAgent: browserInfo.userAgent,
        language: browserInfo.language,
        platform: browserInfo.platform,
        timestamp: new Date().toISOString()
      });
      
      console.log('Advanced logging system initialized');
    }
  } catch (error) {
    console.warn('Failed to initialize advanced logging, falling back to basic logger:', error);
  }
};

// Ініціалізуємо розширену систему
initializeAdvancedLogger();

// Configure basic logger
log.setLevel(process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

// Add custom method for API calls
const originalFactory = log.methodFactory;
log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  
  return (...message: any[]) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${methodName.toUpperCase()}]`;
    
    // Логування через розширену систему
    const level = methodName === 'debug' ? LogLevel.DEBUG :
                  methodName === 'info' ? LogLevel.INFO :
                  methodName === 'warn' ? LogLevel.WARN :
                  methodName === 'error' ? LogLevel.ERROR : LogLevel.INFO;
    
    loggerManager.log(level, message.join(' ')).catch(() => {
      // Fallback to console if advanced logging fails
    });
    
    // Оригінальне логування в консоль
    if (methodName === 'error') {
      console.error(prefix, ...message);
    } else if (methodName === 'warn') {
      console.warn(prefix, ...message);
    } else if (methodName === 'info') {
      console.info(prefix, ...message);
    } else {
      console.log(prefix, ...message);
    }
  };
};

// Apply the factory
log.setLevel(log.getLevel());

export const logger = log;

// Export convenience methods
export const debug = logger.debug;
export const info = logger.info;
export const warn = logger.warn;
export const error = logger.error;

// Export level setter
export const setLogLevel = (level: log.LogLevelDesc) => {
  logger.setLevel(level);
};

// Export current level
export const getLogLevel = () => logger.getLevel();

// Export advanced logging utilities
export { loggerManager, logContextManager };
export { LogLevel } from './logging/interfaces';
export type { LogContext } from './logging/interfaces';
export { ContextUtils } from './logging/contextManager';
export { useLogContext } from './logging/contextManager';
export { LoggingConfigFactory, LOGGING_CONFIGS } from './logging/config';

// Default export for convenience
export default logger;

log.setLevel(import.meta.env.VITE_LOG_LEVEL || "info");