import { LogEntry, LogFormat, LogLevel } from './interfaces';

// Форматери для різних типів виводу логів
export class LogFormatter {
  static format(entry: LogEntry, format: LogFormat): string {
    switch (format) {
      case LogFormat.JSON:
        return this.formatAsJson(entry);
      case LogFormat.TEXT:
        return this.formatAsText(entry);
      case LogFormat.STRUCTURED:
        return this.formatAsStructured(entry);
      default:
        return this.formatAsText(entry);
    }
  }

  private static formatAsJson(entry: LogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp,
      level: LogLevel[entry.level],
      message: entry.message,
      context: entry.context,
      stack: entry.stack
    });
  }

  private static formatAsText(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = LogLevel[entry.level].padEnd(5);
    let message = `[${timestamp}] [${level}] ${entry.message}`;
    
    if (entry.context) {
      const contextParts: string[] = [];
      
      if (entry.context.userId) contextParts.push(`user:${entry.context.userId}`);
      if (entry.context.sessionId) contextParts.push(`session:${entry.context.sessionId}`);
      if (entry.context.requestId) contextParts.push(`req:${entry.context.requestId}`);
      if (entry.context.component) contextParts.push(`comp:${entry.context.component}`);
      if (entry.context.action) contextParts.push(`action:${entry.context.action}`);
      if (entry.context.endpoint) contextParts.push(`endpoint:${entry.context.endpoint}`);
      if (entry.context.duration) contextParts.push(`duration:${entry.context.duration}ms`);
      
      if (contextParts.length > 0) {
        message += ` [${contextParts.join(' ')}]`;
      }
    }
    
    return message;
  }

  private static formatAsStructured(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = LogLevel[entry.level];
    
    let message = `${timestamp} | ${level} | ${entry.message}`;
    
    if (entry.context) {
      const contextLines: string[] = [];
      Object.entries(entry.context).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          contextLines.push(`  ${key}: ${value}`);
        }
      });
      
      if (contextLines.length > 0) {
        message += `\nContext:\n${contextLines.join('\n')}`;
      }
    }
    
    if (entry.stack) {
      message += `\nStack:\n${entry.stack}`;
    }
    
    return message;
  }
}

// Кольоровий форматер для консолі
export class ConsoleFormatter {
  private static colors = {
    [LogLevel.DEBUG]: '\x1b[36m', // cyan
    [LogLevel.INFO]: '\x1b[32m',  // green
    [LogLevel.WARN]: '\x1b[33m',  // yellow
    [LogLevel.ERROR]: '\x1b[31m', // red
    reset: '\x1b[0m'
  };

  static formatWithColors(entry: LogEntry, useColors: boolean = true): string {
    const formatted = LogFormatter.format(entry, LogFormat.TEXT);
    
    if (!useColors) {
      return formatted;
    }
    
    const color = this.colors[entry.level] || this.colors.reset;
    return `${color}${formatted}${this.colors.reset}`;
  }
}
