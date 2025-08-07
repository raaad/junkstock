import { Directive, ElementRef, InjectionToken, OnDestroy, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Subject, asapScheduler, debounceTime, distinctUntilChanged, map, merge, of, startWith, switchMap } from 'rxjs';

export const INVIEW_OPTIONS = new InjectionToken<{
  threshold: number;
  /** ms */
  scrollDebounce: number;
}>('INVIEW_OPTIONS');

const EMPTY = new Array<Element>();
const DOCUMENT_POSITION_PRECEDING = 2; // Node.DOCUMENT_POSITION_PRECEDING

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[inView]',
  host: {
    '(scroll)': 'onScroll()'
  }
})
export class InViewHostDirective implements OnDestroy {
  private readonly options = inject(INVIEW_OPTIONS, { optional: true }) ?? { threshold: 0.8, scrollDebounce: 200 };

  private readonly observer = new IntersectionObserver(this.callback.bind(this), {
    root: inject(ElementRef).nativeElement,
    threshold: this.options.threshold
  });

  private readonly data = new Map<Element, unknown>();

  private readonly targets$ = new BehaviorSubject(EMPTY);

  private readonly scrolled$ = new Subject();

  private readonly output$ = this.scrolled$.pipe(
    startWith(void 0),
    switchMap(() => merge(of(EMPTY), this.targets$.pipe(debounceTime(this.options.scrollDebounce, this.options.scrollDebounce ? undefined : asapScheduler)))),
    distinctUntilChanged(),
    takeUntilDestroyed(),
    map(targets => targets.map(target => ({ target, data: this.data.get(target) })))
  );

  readonly inView = output<{ target: Element; data: unknown }[]>();

  constructor() {
    this.output$.subscribe(targets => this.inView.emit(targets));
  }

  observe(target: Element, data: unknown) {
    this.data.set(target, data);
    this.observer.observe(target);
  }

  unobserve(target: Element) {
    this.data.delete(target);
    this.observer.unobserve(target);

    this.targets$.next(this.targets$.value.filter(i => i !== target));
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }

  private callback(entries: IntersectionObserverEntry[]) {
    const remove = entries.filter(({ isIntersecting }) => !isIntersecting).map(({ target }) => target);

    const targets = Array.from(
      new Set([...this.targets$.value.filter(i => !remove.includes(i)), ...entries.filter(({ isIntersecting }) => isIntersecting).map(({ target }) => target)])
    ).sort((a, b) => (a.compareDocumentPosition(b) & DOCUMENT_POSITION_PRECEDING) - 1);

    this.targets$.next(targets);
  }

  protected onScroll() {
    this.scrolled$.next(void 0);
  }
}
