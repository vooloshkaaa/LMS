// Інтерфейси для розширеної системи логування

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  action?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  stack?: string;
  error?: Error;
}

export interface LogHandler {
  name: string;
  minLevel: LogLevel;
  format: LogFormat;
  handle(entry: LogEntry): Promise<void> | void;
}

export enum LogFormat {
  JSON = 'json',
  TEXT = 'text',
  STRUCTURED = 'structured'
}

export interface RotationConfig {
  enabled: boolean;
  maxSize?: number; // в байтах
  maxFiles?: number;
  maxAge?: string; // '1d', '7d', '1M'
  compress?: boolean;
}

export interface FileHandlerConfig {
  filename: string;
  format: LogFormat;
  rotation: RotationConfig;
  minLevel: LogLevel;
}

export interface ConsoleHandlerConfig {
  format: LogFormat;
  colors: boolean;
  minLevel: LogLevel;
}

export interface RemoteHandlerConfig {
  url: string;
  apiKey?: string;
  batchSize: number;
  flushInterval: number; // в мс
  minLevel: LogLevel;
  retryAttempts: number;
}

export interface LoggerConfig {
  handlers: LogHandler[];
  context?: LogContext;
  globalMinLevel: LogLevel;
}
