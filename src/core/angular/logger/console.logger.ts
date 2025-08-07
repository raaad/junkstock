import { ValueProvider } from '@angular/core';
import { LOGGER_IMPL, LogLevel } from './logger.types';

const LEVEL_MAP = new Map<LogLevel, Extract<keyof typeof console, 'log' | 'debug' | 'info' | 'warn' | 'error'>>([
  [LogLevel.Trace, 'log'],
  [LogLevel.Debug, 'debug'],
  [LogLevel.Info, 'info'],
  [LogLevel.Warn, 'warn'],
  [LogLevel.Error, 'error']
]);

export function provideConsoleLogger(severity: LogLevel | 'none' = LogLevel.Trace): ValueProvider {
  return {
    provide: LOGGER_IMPL,
    // eslint-disable-next-line no-console
    useValue: Object.assign((level: LogLevel, ...data: unknown[]) => console[LEVEL_MAP.get(level) ?? 'debug'](...data), { severity }),
    multi: true
  };
}
