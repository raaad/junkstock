import { ValueProvider } from '@angular/core';
import { LOGGER } from '../uploader/uploader.tokens';

export function provideLogger(): ValueProvider {
  return { provide: LOGGER, useValue: { trace: console.log, debug: console.log, error: console.error, warn: console.warn } };
}
