import { ChangeDetectionStrategy, Component } from '@angular/core';
import { I18nDirective } from '@core/angular/i18n';

@Component({
  selector: 'app-i18n-lazy',
  imports: [I18nDirective],
  template: `<span class="note" x18n>Lazy loaded string</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class I18nLazyComponent {}
