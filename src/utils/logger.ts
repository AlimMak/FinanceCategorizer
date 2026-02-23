/**
 * Structured logging utility for secure server-side error logging.
 * Never logs sensitive financial data.
 *
 * WARNING: Only pass errorId, timestamps, and general context to log functions.
 * DO NOT log transaction descriptions, amounts, or other financial data.
 */

export interface LogContext {
  errorId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export function logError(message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level: 'error',
    timestamp,
    message,
    ...context,
  };

  // In production, send to logging service (e.g., Sentry, DataDog)
  // For now, use console with structured format
  console.error(JSON.stringify(logEntry));
}

export function logInfo(message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level: 'info',
    timestamp,
    message,
    ...context,
  };

  console.log(JSON.stringify(logEntry));
}

export function logWarning(message: string, context?: LogContext): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    level: 'warn',
    timestamp,
    message,
    ...context,
  };

  console.warn(JSON.stringify(logEntry));
}
