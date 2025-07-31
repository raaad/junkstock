import { InjectionToken } from '@angular/core';

export enum LogLevel {
  Trace,
  Debug,
  Info,
  Warn,
  Error
}

export type LogMethod = (this: void, level: LogLevel, ...data: unknown[]) => void;

/** Not for direct use, only for log method implementation */
export const LOG_METHOD = new InjectionToken<LogMethod[]>('LOG_METHOD');

export type Logger = Pick<typeof console, 'trace' | 'debug' | 'info' | 'warn' | 'error'>;

export const LOGGER = new InjectionToken<Logger>('LOGGER');
