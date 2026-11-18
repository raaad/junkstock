import { DestroyRef, Directive, ElementRef, InjectionToken, computed, debounced, effect, inject, output, signal } from '@angular/core';

export const INVIEW_OPTIONS = new InjectionToken<{
  threshold: number;
  /** ms */
  scrollDebounce: number;
}>('INVIEW_OPTIONS');

const DOCUMENT_POSITION_PRECEDING = 2; // Node.DOCUMENT_POSITION_PRECEDING

@Directive({ selector: '[useInView]' })
export class InViewHostDirective {
  private readonly options = inject(INVIEW_OPTIONS, { optional: true }) ?? { threshold: 0.8, scrollDebounce: 100 };

  private readonly observer = new IntersectionObserver(v => this.callback(v), {
    root: inject<ElementRef<Element>>(ElementRef).nativeElement,
    threshold: this.options.threshold
  });

  private readonly data = new Map<Element, unknown>();

  private readonly targets = signal(new Array<Element>());

  private readonly items = debounced(
    computed(() => this.targets().map(target => ({ target, data: this.data.get(target) }))),
    this.options.scrollDebounce
  );

  readonly output = output<{ target: Element; data: unknown }[]>({ alias: 'useInView' });

  constructor() {
    effect(() => this.output.emit(this.items.value()));

    inject(DestroyRef).onDestroy(() => this.observer.disconnect());
  }

  observe(target: Element, data: unknown) {
    this.data.set(target, data);
    this.observer.observe(target);
  }

  unobserve(target: Element) {
    this.data.delete(target);

    this.observer.unobserve(target);

    this.targets.update(targets => targets.filter(i => i !== target));
  }

  private callback(entries: IntersectionObserverEntry[]) {
    const remove = entries.filter(({ isIntersecting }) => !isIntersecting).map(({ target }) => target);

    const targets = Array.from(
      new Set([
        ...this.targets().filter(i => !remove.includes(i)),
        ...entries.filter(({ isIntersecting }) => isIntersecting).map(({ target }) => target)
      ])
    ).sort((a, b) => (a.compareDocumentPosition(b) & DOCUMENT_POSITION_PRECEDING) - 1);

    this.targets.set(targets);
  }
}
