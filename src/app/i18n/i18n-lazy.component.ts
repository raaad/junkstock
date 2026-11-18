import { Component } from '@angular/core';
import { I18nDirective } from '@core/angular/i18n';

@Component({ imports: [I18nDirective], template: `<span class="note" useI18n>Lazy loaded string</span>` })
export class I18nLazyComponent {}
