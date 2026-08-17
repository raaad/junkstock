import { DestroyRef, Directive, effect, ElementRef, inject, Injectable, input } from '@angular/core';
import { ConfirmAction } from './confirm-action.token';

@Injectable({ providedIn: 'root' })
export class CustomConfirmRegistry {
  private readonly registry = new Map<Element, ConfirmAction>();

  register(element: Element, action: ConfirmAction) {
    this.registry.set(element, action);
  }

  unregister(element: Element) {
    this.registry.delete(element);
  }

  get(element: Element) {
    return this.registry.get(element);
  }
}

/** Allows to use a custom confirm action for a specific element */
@Directive({ selector: '[useCustomConfirm]' })
export class CustomConfirmDirective {
  private readonly element = inject<ElementRef<Element>>(ElementRef).nativeElement;
  private readonly registry = inject(CustomConfirmRegistry);

  readonly confirm = input.required<ConfirmAction>({ alias: 'useCustomConfirm' });

  constructor() {
    effect(() => {
      const action = this.confirm();
      action ? this.registry.register(this.element, action) : this.registry.unregister(this.element);
    });

    inject(DestroyRef).onDestroy(() => this.registry.unregister(this.element));
  }
}
