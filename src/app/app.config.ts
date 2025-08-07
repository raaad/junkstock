import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideConfirmActionEventPlugin, provideConsoleLogger, provideLogger } from '@core/angular';
import { provideTitleStrategy } from './common/provide-title-strategy';
import { provideConfirmAction } from './misc/confirm.component';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(routes, withViewTransitions()),
    provideTitleStrategy(),

    provideLogger(),
    provideConsoleLogger(),

    provideConfirmActionEventPlugin(),
    provideConfirmAction()
  ]
};
