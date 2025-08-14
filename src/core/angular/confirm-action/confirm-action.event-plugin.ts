import { ClassProvider, inject, ListenerOptions } from '@angular/core';
import { EVENT_MANAGER_PLUGINS, EventManagerPlugin } from '@angular/platform-browser';
import { throwIt } from '../../utils/throw-it';
import { LOGGER } from '../logger';
import { CONFIRM_ACTION } from './confirm-action.token';
import { CustomConfirmRegistry } from './custom-confirm.directive';

type EventKind = 'confirmed' | 'rejected';

const EVENT_KINDS = new Array<EventKind>('confirmed', 'rejected');

export function provideConfirmActionEventPlugin(): ClassProvider {
  return { provide: EVENT_MANAGER_PLUGINS, multi: true, useClass: ConfirmActionEventPlugin };
}

/** Adds support for the {event}.confirmed | {event}.rejected. After an event occurs, CONFIRM_ACTION must be used to confirm it before the handler is executed */
export class ConfirmActionEventPlugin extends EventManagerPlugin {
  private readonly logger = inject(LOGGER, { optional: true });
  private readonly default = inject(CONFIRM_ACTION, { optional: true });
  private readonly custom = inject(CustomConfirmRegistry);

  private readonly rejects = new Map<Element, Map<string, () => void>>();

  override supports(eventName: string): boolean {
    return EVENT_KINDS.some(e => eventName.endsWith(`.${e}`));
  }

  override addEventListener(element: HTMLElement, eventName: string, handler: () => void, options?: ListenerOptions) {
    const type = eventName.substring(0, eventName.lastIndexOf('.'));
    const kind: EventKind = eventName.substring(eventName.lastIndexOf('.') + 1) as EventKind;

    return kind === 'confirmed' ?
        this.manager.addEventListener(element, type, this.onConfirm.bind(this, element, handler), options)
      : (this.addReject(element, type, handler), () => this.removeReject(element, type));
  }

  private async onConfirm(element: Element, handler: (result?: unknown) => void, event: Event) {
    const confirm = this.custom.get(element) ?? this.default ?? throwIt('No generic confirm action found');

    try {
      handler(await confirm(element, event));
    } catch (e) {
      this.rejects.get(element)?.get(event.type)?.();
      e && this.logger?.trace(e);
    }
  }

  private addReject(element: Element, type: string, handler: () => void) {
    this.rejects.set(element, (this.rejects.get(element) ?? new Map()).set(type, handler));
  }

  private removeReject(element: Element, type: string) {
    this.rejects.get(element)?.delete(type) && !this.rejects.get(element)?.size && this.rejects.delete(element);
  }
}
