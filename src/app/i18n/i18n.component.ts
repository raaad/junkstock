import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { InterpolatePipe } from '@core/angular';
import { I18N_LOCALE, I18nDirective, I18nPipe, injectI18n, injectNonI18nBaseHref } from '@core/angular/i18n';

// eslint-disable-next-line @typescript-eslint/naming-convention
import type COMMON from './common.i18n';

@Component({
  selector: 'app-i18n',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, I18nPipe, I18nDirective, InterpolatePipe],
  template: `
    <div class="flex p-4">
      <a [attr.href]="'\${base}\${path}' | interpolate: { base, path }" [class.text-sky-600]="locale === 'en'" class="px-2">EN</a>
      <a [attr.href]="'\${base}/us\${path}' | interpolate: { base, path }" [class.text-sky-600]="locale === 'us'" class="px-2">US</a>
    </div>
    <div class="flex gap-4 p-4 items-center">
      <span class="note">{{ 'SOME_KEY' | i18n: { price: 666 } }}</span>
      <span class="note" x18n>Static string</span>
      <span class="note">{{ codeOnly }}</span>
      <button routerLink="lazy" routerLinkActive #link="routerLinkActive" [class.hidden]="link.isActive" class="btn">Load lazy</button>
      <router-outlet hidden />
      <button routerLink="./" routerLinkActive #link="routerLinkActive" [class.hidden]="!link.isActive" class="btn">Reset</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class I18nComponent {
  private router = inject(Router);

  protected base = injectNonI18nBaseHref().replace(/\/$/, '');

  protected get path() {
    return this.router.url;
  }

  protected locale = inject(I18N_LOCALE);

  protected codeOnly = injectI18n()('Code only string');
  protected typedKeys = injectI18n<typeof COMMON>()('SOME_KEY', { price: 0 });
}
