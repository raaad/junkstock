import { InjectionToken } from '@angular/core';

export type Logger = Pick<typeof console, 'trace' | 'debug' | 'error' | 'warn'>;

export const LOGGER = new InjectionToken<Logger>('LOGGER');
