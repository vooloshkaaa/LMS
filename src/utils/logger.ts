import log from 'loglevel';

// Configure logger
log.setLevel(process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

// Add custom method for API calls
const originalFactory = log.methodFactory;
log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  
  return (...message: any[]) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${methodName.toUpperCase()}]`;
    
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

// Default export for convenience
export default logger;

log.setLevel(import.meta.env.VITE_LOG_LEVEL || "info");