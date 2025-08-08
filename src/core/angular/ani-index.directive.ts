import { DestroyRef, Directive, ElementRef, inject, Input } from '@angular/core';

@Directive({ selector: '[appAniIndex]', exportAs: 'aniIndex' })
export class AniIndexDirective {
  private readonly host = inject<ElementRef<Element>>(ElementRef).nativeElement;

  private readonly observer = new MutationObserver(this.animate.bind(this));

  private prevIndexes = new Map<Element, number>();
  private prevPoints = new Map<Element, Pick<DOMRect, 'x' | 'y'> | undefined>();

  // eslint-disable-next-line @typescript-eslint/naming-convention
  @Input() set appAniIndex(_: unknown) {
    this.updatePoints(true);
  }

  constructor() {
    this.observer.observe(this.host, { childList: true });

    inject(DestroyRef).onDestroy(this.observer.disconnect.bind(this.observer));
  }

  private animate() {
    const indexes = new Map(Array.from(this.host.children).map((i, idx) => [i, idx]));

    const changed = Array.from(indexes.entries())
      .filter(([i, idx]) => idx !== (this.prevIndexes.get(i) ?? idx))
      .map(([i]) => i as HTMLElement);

    this.prevIndexes = indexes;

    this.updatePoints();

    changed.map(i => {
      const { x, y } = i.getBoundingClientRect();
      const { x: px, y: py } = this.prevPoints.get(i) ?? { x, y };

      this.prevPoints.set(i, { x, y });

      // translate the element to its previous position immediately
      i.style.setProperty('transition', `none`, 'important');
      i.style.setProperty('translate', `${px - x}px ${py - y}px`, 'important');
    });

    // trigger transition by resetting inline styles
    requestAnimationFrame(() => changed.forEach(i => (i.style.removeProperty('transition'), i.style.removeProperty('translate'))));
  }

  private updatePoints(force = false) {
    this.prevPoints = new Map(Array.from(this.prevIndexes.keys()).map(i => [i, (force ? undefined : this.prevPoints.get(i)) ?? i.getBoundingClientRect()]));
  }
}
