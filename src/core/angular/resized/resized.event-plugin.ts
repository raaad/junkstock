import { ClassProvider } from '@angular/core';
import { EVENT_MANAGER_PLUGINS, EventManagerPlugin } from '@angular/platform-browser';

export * from './size-vars.directive';

const EVENT = 'resized';
const DEBOUNCED_MOD = 'debounced';
const NO_INITIAL_MOD = 'no-initial';

export function provideResizedEventPlugin(): ClassProvider {
  return { provide: EVENT_MANAGER_PLUGINS, multi: true, useClass: ResizedEventPlugin };
}

/**
 * Adds support for the element resized event
 * ```
 * (resized.debounced)      // debounced
 * (resized.debounced.500)  // custom debounce time
 * (resized.no-initial)     // skip first initial event
 * ```
 */
export class ResizedEventPlugin extends EventManagerPlugin {
  private readonly observer = new ResizeObserver(entries => entries.forEach(e => this.registry.get(e.target)?.forEach(h => h(e))));

  private readonly registry = new Map<Element, Set<(e: ResizeObserverEntry) => void>>();

  override supports(eventName: string): boolean {
    return eventName.split('.').shift() === EVENT;
  }

  override addEventListener(element: HTMLElement, eventName: string, handler: () => void) {
    const mods = eventName.split('.').slice(1);

    mods.includes(DEBOUNCED_MOD) && (handler = debounced(handler, parse(mods[mods.indexOf(DEBOUNCED_MOD) + 1])));
    mods.includes(NO_INITIAL_MOD) && (handler = noInitial(handler));

    this.registry.set(element, (this.registry.get(element) ?? new Set()).add(handler));
    this.observer.observe(element);

    return () => {
      this.registry.get(element)?.delete(handler) && !this.registry.get(element)?.size && this.observer.unobserve(element);
    };
  }
}

function debounced<A extends unknown[]>(action: (...a: A) => void, debounce = 100, handle = 0) {
  return (...a: A) => (clearTimeout(handle), (handle = setTimeout(() => action(...a), debounce)));
}

function noInitial<A extends unknown[]>(action: (...a: A) => void, skip = true) {
  return (...a: A) => (skip ? (skip = !skip) : action(...a));
}

function parse(num: string) {
  return Math.max(parseInt(num), 0) || undefined;
}
