import { DestroyRef, Directive, effect, ElementRef, inject, Injectable, input } from '@angular/core';
import { ConfirmAction } from './confirm-action.token';

@Injectable({ providedIn: 'root' })
export class CustomConfirmRegistry {
  private readonly map = new Map<Element, ConfirmAction>();

  register(element: Element, action: ConfirmAction) {
    this.map.set(element, action);
  }

  unregister(element: Element) {
    this.map.delete(element);
  }

  get(element: Element) {
    return this.map.get(element);
  }
}

/** Allows to use a custom confirm action for a specific element */
@Directive({ selector: '[appCustomConfirm]' })
export class CustomConfirmDirective {
  private readonly element = inject(ElementRef).nativeElement;
  private readonly registry = inject(CustomConfirmRegistry);

  readonly confirm = input.required<ConfirmAction>({ alias: 'appCustomConfirm' });

  constructor() {
    effect(() => {
      const action = this.confirm();
      action ? this.registry.register(this.element, action) : this.registry.unregister(this.element);
    });

    inject(DestroyRef).onDestroy(() => this.registry.unregister(this.element));
  }
}
