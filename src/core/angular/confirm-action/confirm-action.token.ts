import { InjectionToken } from '@angular/core';

export type ConfirmAction = (el: Element, e: Event) => Promise<unknown>;

/** To implement the confirm action, used for {event}.confirmed */
export const CONFIRM_ACTION = new InjectionToken<ConfirmAction>('CONFIRM_ACTION');
