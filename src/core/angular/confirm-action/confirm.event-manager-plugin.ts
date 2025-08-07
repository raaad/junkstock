import { ClassProvider, inject, ListenerOptions } from '@angular/core';
import { EVENT_MANAGER_PLUGINS, EventManagerPlugin } from '@angular/platform-browser';
import { throwIt } from '../../utils/throw-it';
import { LOGGER } from '../logger';
import { CONFIRM_ACTION } from './confirm-action.token';
import { CustomConfirmRegistry } from './custom-confirm.directive';

type EventType = 'confirmed' | 'rejected';

const EVENT_TYPES = new Array<EventType>('confirmed', 'rejected');

export function provideConfirmActionEventPlugin(): ClassProvider {
  return { provide: EVENT_MANAGER_PLUGINS, multi: true, useClass: ConfirmEventManagerPlugin };
}

/** Adds support for the {event}.confirmed | {event}.rejected. After an event occurs, CONFIRM_ACTION must be used to confirm it before the handler is executed */
export class ConfirmEventManagerPlugin extends EventManagerPlugin {
  private readonly logger = inject(LOGGER, { optional: true });
  private readonly default = inject(CONFIRM_ACTION, { optional: true });
  private readonly custom = inject(CustomConfirmRegistry);

  private readonly rejects = new Map<Element, () => void>();

  override supports(eventName: string): boolean {
    return EVENT_TYPES.some(e => eventName.endsWith(`.${e}`));
  }

  override addEventListener(element: HTMLElement, eventName: string, handler: () => void, options?: ListenerOptions) {
    const event = eventName.substring(0, eventName.lastIndexOf('.'));
    const type: EventType = eventName.substring(eventName.lastIndexOf('.') + 1) as EventType;

    return type === 'confirmed' ?
        this.manager.addEventListener(element, event, this.onConfirm.bind(this, element, handler), options)
      : (this.rejects.set(element, handler), this.rejects.delete.bind(this.rejects, element));
  }

  private async onConfirm(element: Element, handler: (result?: unknown) => void, event: Event) {
    const confirm = this.custom.get(element) ?? this.default ?? throwIt('No generic confirm action found');

    try {
      handler(await confirm(element, event));
    } catch (e) {
      this.rejects.get(element)?.();
      e && this.logger?.trace(e);
    }
  }
}
