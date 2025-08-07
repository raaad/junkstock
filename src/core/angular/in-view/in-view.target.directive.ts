import { Directive, ElementRef, OnDestroy, effect, inject, input } from '@angular/core';
import { InViewHostDirective } from './in-view.host.directive';

@Directive({
  selector: '[appInViewTarget]'
})
export class InViewTargetDirective implements OnDestroy {
  private readonly host = inject(InViewHostDirective, { optional: true });
  private readonly element = inject(ElementRef).nativeElement;

  readonly data = input<unknown>(undefined, { alias: 'appInViewTarget' });
  readonly disabled = input(false, { alias: 'appInViewTargetDisabled' });

  constructor() {
    const host = this.host;
    if (host) {
      effect(() => {
        const data = this.data();
        const disabled = this.disabled();

        host.unobserve(this.element);
        !disabled && host.observe(this.element, data);
      });
    }
  }

  ngOnDestroy() {
    this.host?.unobserve(this.element);
  }
}
