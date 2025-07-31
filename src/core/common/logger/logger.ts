import { FactoryProvider, inject } from '@angular/core';
import { LOG_METHOD, Logger, LOGGER, LogLevel, LogMethod } from './logger.types';

const LEVEL_MAP = new Map<LogLevel, keyof Logger>([
  [LogLevel.Trace, 'trace'],
  [LogLevel.Debug, 'debug'],
  [LogLevel.Info, 'info'],
  [LogLevel.Warn, 'warn'],
  [LogLevel.Error, 'error']
]);

function createLogger(loggers: LogMethod[]) {
  const log: LogMethod = (level: LogLevel, ...data: unknown[]) => loggers.forEach(log => log(level, ...data));

  return Object.fromEntries(Array.from(LEVEL_MAP.entries()).map(([level, value]) => [value, log.bind(void 0, level)])) as Logger;
}

export function provideLogger(): FactoryProvider {
  return {
    provide: LOGGER,
    useFactory: () => createLogger(inject(LOG_METHOD))
  };
}
