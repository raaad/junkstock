import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideConsoleLogger, provideLogger } from '../core/shared/logger';
import { provideTitleStrategy } from './common/provide-title-strategy';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(routes, withViewTransitions()),
    provideTitleStrategy(),

    provideLogger(),
    provideConsoleLogger()
  ]
};
