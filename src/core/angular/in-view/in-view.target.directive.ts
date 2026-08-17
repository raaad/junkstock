import { DestroyRef, Directive, ElementRef, effect, inject, input } from '@angular/core';
import { InViewHostDirective } from './in-view.host.directive';

@Directive({
  selector: '[useInViewTarget]'
})
export class InViewTargetDirective {
  private readonly host = inject(InViewHostDirective, { optional: true });
  private readonly element = inject<ElementRef<Element>>(ElementRef).nativeElement;

  readonly data = input<unknown>(undefined, { alias: 'useInViewTarget' });

  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly disabled = input(false, { alias: 'inViewDisabled' });

  constructor() {
    const host = this.host;

    if (host) {
      effect(() => {
        const data = this.data();
        const disabled = this.disabled();

        host.unobserve(this.element);
        !disabled && host.observe(this.element, data);
      });

      inject(DestroyRef).onDestroy(() => host.unobserve(this.element));
    }
  }
}
