import { ValueProvider } from '@angular/core';
import { LOG_METHOD, LogLevel } from './logger.types';

const LEVEL_MAP = new Map<LogLevel, Extract<keyof typeof console, 'log' | 'debug' | 'info' | 'warn' | 'error'>>([
  [LogLevel.Trace, 'log'],
  [LogLevel.Debug, 'debug'],
  [LogLevel.Info, 'info'],
  [LogLevel.Warn, 'warn'],
  [LogLevel.Error, 'error']
]);

export function provideConsoleLogger(severity: LogLevel | 'none' = LogLevel.Trace): ValueProvider {
  return {
    provide: LOG_METHOD,
    useValue: (level: LogLevel, ...data: unknown[]) =>
      // eslint-disable-next-line no-console
      shouldLog(severity, level, data) && console[LEVEL_MAP.get(level) ?? 'debug'](...data),
    multi: true
  };
}

function shouldLog(severity: LogLevel | 'none', level: LogLevel, data: unknown[]) {
  return severity !== 'none' && severity <= level && data.length;
}
