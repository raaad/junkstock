import { InjectionToken } from '@angular/core';

export enum LogLevel {
  Trace,
  Debug,
  Info,
  Warn,
  Error
}

/** Not for direct use, only for logger implementation */
export interface LoggerImpl {
  (this: void, level: LogLevel, ...data: unknown[]): void;
  severity?: LogLevel | 'none';
}

/** Not for direct use, only for logger implementation */
export const LOGGER_IMPL = new InjectionToken<LoggerImpl[]>('LOGGER_IMPL');

export type Logger = Pick<typeof console, 'trace' | 'debug' | 'info' | 'warn' | 'error'>;

/**
 * For heavy logging operations, deferred function could be provided, it will only be called if at least one severity fits
 * ```
 * trace(deferred: () => unknown[]): void
 * ```
 */
export const LOGGER = new InjectionToken<Logger>('LOGGER');
