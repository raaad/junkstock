import { InjectionToken } from '@angular/core';

export type ConfirmAction<R = void> = (el: Element, e: Event) => Promise<R>;

/** To implement the confirm action, used for {event}.confirmed */
export const CONFIRM_ACTION = new InjectionToken<ConfirmAction>('CONFIRM_ACTION');
