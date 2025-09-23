import { coerceArray } from '@angular/cdk/coercion';
import { PathLocationStrategy } from '@angular/common';
import {
  Directive,
  ElementRef,
  FactoryProvider,
  inject,
  InjectionToken,
  OnInit,
  Pipe,
  PipeTransform,
  provideAppInitializer,
  SecurityContext,
  ValueProvider
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { interpolate } from './interpolate.pipe';
import { LOGGER } from './logger';

const I18N = new InjectionToken<Record<string, string>>('I18N');

export const I18N_LOCALE = new InjectionToken<string>('I18N_LOCALE');

interface I18nModule {
  default: Record<string, string>;
}

type Fetch<L extends string> = (locale: L) => Promise<I18nModule> | Promise<I18nModule>[];

/** Provide internationalization tokens, fetch common translations and for them */
export function provideI18n<L extends string>(fetch: Fetch<L>, locale: (() => L) | L) {
  return [
    { provide: I18N, useValue: {} } as ValueProvider,
    { provide: I18N_LOCALE, useFactory: typeof locale === 'function' ? locale : () => locale } as FactoryProvider,
    provideAppInitializer(fetchI18n.bind(undefined, fetch as Fetch<string>))
  ];
}

/** Fetch additional translations, preferably in lazy loading */
export async function fetchI18n<L extends string>(fetch: Fetch<L>) {
  const i18n = inject(I18N);
  const locale = inject(I18N_LOCALE);
  const logger = inject(LOGGER);

  try {
    const items = (await Promise.allSettled(coerceArray(fetch(locale as L)))).map(i =>
      i.status === 'fulfilled' && typeof i.value?.default === 'object' ? i.value.default : {}
    );

    Object.assign(i18n, ...items);
  } catch (e) {
    logger.warn('i18n:', e);
  }
}

/** Inject a getter for instant translation */
export function injectI18n<T extends Record<string, string> = Record<string, string>>() {
  const i18n = inject(I18N) as T;
  const logger = inject(LOGGER);

  return <C = unknown>(key: Exclude<keyof T, number | symbol>, context?: C) =>
    interpolate(i18n[key] || (logger.trace(`i18n: using '${key}' key as value`), key), context);
}

/** Translate, key and interpolate if needed */
@Pipe({ name: 'i18n' })
export class I18nPipe implements PipeTransform {
  readonly transform = injectI18n();
}

/**
 * Translate static content, executed only once on init.
 * x - to not interfere with built-in i18n
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[x18n]'
})
export class I18nDirective implements OnInit {
  private readonly i18n = injectI18n();
  private readonly sanitizer = inject(DomSanitizer);
  private readonly el = inject<ElementRef<Element>>(ElementRef).nativeElement;

  ngOnInit() {
    this.el.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, this.i18n(this.el.innerHTML)) ?? this.el.innerHTML;
  }
}

/** Get baseHref for the locale-agnostic assets and resouces */
export function injectNonI18nBaseHref() {
  return inject(PathLocationStrategy)
    .getBaseHref()
    .replace(new RegExp(`/${inject(I18N_LOCALE)}/$`), '/');
}
