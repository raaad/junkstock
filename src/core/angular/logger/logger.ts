import { coerceArray } from '@angular/cdk/coercion';
import { FactoryProvider, inject } from '@angular/core';
import { lazy } from '../../utils/lazy';
import { Logger, LOGGER, LOGGER_IMPL, LoggerImpl, LogLevel } from './logger.types';

const LEVEL_MAP = new Map<LogLevel, keyof Logger>([
  [LogLevel.Trace, 'trace'],
  [LogLevel.Debug, 'debug'],
  [LogLevel.Info, 'info'],
  [LogLevel.Warn, 'warn'],
  [LogLevel.Error, 'error']
]);
export function provideLogger(): FactoryProvider {
  return {
    provide: LOGGER,
    useFactory: () => createLogger(inject(LOGGER_IMPL))
  };
}

function createLogger(loggers: LoggerImpl[]) {
  const log: LoggerImpl = (level: LogLevel, ...data: unknown[]) => {
    const args = lazy(() => coerceArray(isDeferred(data) ? data[0]() : data));
    loggers.forEach(log => shouldLog(log.severity ?? 'none', level, data) && log(level, ...args()));
  };

  return Object.fromEntries(Array.from(LEVEL_MAP.entries()).map(([level, value]) => [value, log.bind(void 0, level)])) as Logger;
}

function shouldLog(severity: LogLevel | 'none', level: LogLevel, data: unknown[]) {
  return severity !== 'none' && severity <= level && data.length;
}

function isDeferred(data: unknown[]): data is [() => unknown[]] {
  return data.length === 1 && typeof data[0] === 'function' && !data[0].length;
}
