import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';

/** Animates the transitions of children to the new positions when the index changes
 * @usageNotes
 * ```html
 * <ul appAniIndex><li>...</li><li>...</li></ul>
 * ```
 * ...
 * ```css
 * li {
 *   transition: translate 300ms;
 *   will-change: translate;
 * }
 * ```
 */
@Directive({ selector: '[appAniIndex]', exportAs: 'aniIndex' })
export class AniIndexDirective {
  private readonly host = inject<ElementRef<Element>>(ElementRef).nativeElement;

  private readonly mutation = new MutationObserver(this.animate.bind(this));

  private readonly resize = new ResizeObserver(debounced(this.update.bind(this, true)));

  private prevIndexes = new Map<Element, number>();
  private prevPoints = new Map<Element, Pick<DOMRect, 'x' | 'y'>>();

  constructor() {
    this.mutation.observe(this.host, { childList: true });

    this.resize.observe(this.host);

    inject(DestroyRef).onDestroy(() => (this.mutation.disconnect(), this.resize.disconnect()));
  }

  private animate() {
    const indexes = new Map(Array.from(this.host.children).map((i, idx) => [i, idx]));

    const changed = Array.from(indexes.entries())
      .filter(([i, idx]) => idx !== (this.prevIndexes.get(i) ?? idx))
      .map(([i]) => i as HTMLElement);

    this.prevIndexes = indexes;

    this.update();

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

  update(force = false) {
    this.prevPoints = new Map(Array.from(this.prevIndexes.keys()).map(i => [i, (!force && this.prevPoints.get(i)) || i.getBoundingClientRect()]));
  }
}

function debounced<A extends unknown[]>(action: (...a: A) => void, debounce = 100, skitFirst = true) {
  let id = 0;
  return (...a: A) =>
    skitFirst ? (skitFirst = !skitFirst) : (clearTimeout(id), (id = setTimeout(action.bind<undefined, A, never, void>(undefined, ...a), debounce)));
}
