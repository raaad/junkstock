import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideConfirmActionEventPlugin, provideConsoleLogger, provideLogger, provideResizedEventPlugin } from '@core/angular';
import { provideI18n } from '@core/angular/i18n';
import { provideTitleStrategy } from './common/provide-title-strategy';
import { skipSubsets, withReversed } from './common/view-transition.rules';
import { ensureLocale } from './i18n/ensure-locale';
import { provideConfirmAction } from './misc/confirm.component';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(routes, withViewTransitions({ onViewTransitionCreated: t => (withReversed(t), skipSubsets(t)) })),
    provideTitleStrategy(),

    provideLogger(),
    provideConsoleLogger(),

    provideConfirmActionEventPlugin(),
    provideConfirmAction(),

    provideResizedEventPlugin(),

    provideI18n(lc => (lc === 'en' ? import('./i18n/common.i18n') : import(`./i18n/common.i18n.${lc}.ts`)), ensureLocale(['en', 'us'] as const, 'en'))
  ]
};
