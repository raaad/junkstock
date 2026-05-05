import { coerceArray } from '@angular/cdk/coercion';
import { FactoryProvider, inject } from '@angular/core';
import { evalIfFn } from '@core/utils';
import { lazy } from '../../utils/lazy';
import { Logger, LOGGER, LOGGER_IMPL, LoggerImpl, LogLevel } from './logger.types';

const LEVEL_MAP = new Map<LogLevel, keyof Logger>([
  [LogLevel.Trace, 'trace'],
  [LogLevel.Debug, 'debug'],
  [LogLevel.Info, 'info'],
  [LogLevel.Warn, 'warn'],
  [LogLevel.Error, 'error']
]);

export function provideLogger({ suppress = [] }: { suppress?: string[] } = {}): FactoryProvider {
  return {
    provide: LOGGER,
    useFactory: () => createLogger(inject(LOGGER_IMPL), suppress)
  };
}

function createLogger(loggers: LoggerImpl[], suppress: string[]) {
  const log: LoggerImpl = (level: LogLevel, ...data: unknown[]) => {
    const args = lazy(() => dropSuppressed(coerceArray(data).map(evalIfFn)));
    loggers.forEach(log => matchSeverity(log.severity, level) && args().length && log(level, ...args()));
  };

  return Object.fromEntries(Array.from(LEVEL_MAP.entries()).map(([level, value]) => [value, log.bind(void 0, level)])) as Logger;

  function dropSuppressed(data: unknown[]) {
    const [prefix] = data;
    return typeof prefix === 'string' && suppress.some(s => s && prefix.startsWith(s)) ? [] : data;
  }

  function matchSeverity(severity: LogLevel | 'none' = 'none', level: LogLevel) {
    return severity !== 'none' && severity <= level;
  }
}
