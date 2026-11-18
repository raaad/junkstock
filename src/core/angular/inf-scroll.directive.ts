import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  InjectionToken,
  Injector,
  input,
  linkedSignal,
  signal,
  Signal,
  untracked
} from '@angular/core';
import { LOGGER } from './logger';

export const INF_SCROLL_HOST = new InjectionToken<HTMLElement>('INF_SCROLL_HOST');

@Directive({ selector: '[useInfScroll]', exportAs: 'infScroll' })
export class InfScrollDirective {
  readonly loader = input.required<(abort: AbortSignal) => Promise<void>>({ alias: 'useInfScroll' });

  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly enabled = input(false, { alias: 'infScrollEnabled' });

  private trigger = signal<Element>(inject(ElementRef).nativeElement);

  private host = inject(INF_SCROLL_HOST, { optional: true });

  private scroll = useInfiniteScroll(
    this.trigger,
    computed(() => this.host ?? this.trigger()?.parentElement),
    this.loader,
    this.enabled,
    inject(new HostAttributeToken('data-scroll-reverse'), { optional: true }) !== null ? 'reverse' : undefined,
    { scrollMargin: inject(new HostAttributeToken('data-scroll-margin'), { optional: true }) || '100px 0px' }
  );

  get active() {
    return this.scroll.active;
  }

  get failed() {
    return this.scroll.failed;
  }

  get retry() {
    return this.scroll.retry;
  }
}

@Directive({
  selector: '[useInfScrollHost]',
  providers: [{ provide: INF_SCROLL_HOST, useFactory: () => inject(ElementRef).nativeElement }]
})
export class InfScrollHostDirective {}

export function useInfiniteScroll(
  trigger: Signal<Element | null>,
  host: Signal<Element | null>,
  loader: Signal<(abort: AbortSignal) => Promise<void>>,
  enabled: Signal<boolean>,
  mode: 'default' | 'reverse' = 'default',
  options?: Omit<IntersectionObserverInit, 'root'>
) {
  const logger = inject(LOGGER);

  const isIntersecting = useObserver(
    trigger,
    computed(() => enabled() && !loading() && !failed()),
    host,
    options
  );

  const abort = useAbort();
  const waitNextRender = useNextRender();

  const loading = signal(false);
  const failed = linkedSignal({ source: enabled, computation: (on, p) => !on && !!p?.value });

  effect(async () => isIntersecting() && (await untracked(fetch)) && untracked(keepScroll));

  effect(() => !enabled() && abort.emit());

  inject(DestroyRef).onDestroy(abort.emit);

  return { active: computed(() => loading() || failed()), failed: failed.asReadonly(), retry: () => failed.set(false) };

  async function fetch() {
    loading.set(true);
    const { signal, promise } = abort.create();

    try {
      await Promise.race([promise, loader()(signal)]);
    } catch (e) {
      if (!isAbortError(e)) {
        logger.warn(e);
        failed.set(true);
      }

      return false;
    } finally {
      abort.emit();
      loading.set(false);
    }

    return true;
  }

  async function keepScroll() {
    const root = host();
    if (root && mode === 'reverse') {
      const height = root.scrollHeight;
      await waitNextRender();
      root.scrollTop += root.scrollHeight - height;
    }
  }
}

function useObserver(
  target: Signal<Element | null>,
  enabled: Signal<boolean>,
  root?: Signal<Element | null>,
  options?: Omit<IntersectionObserverInit, 'root'>
) {
  const observer = linkedSignal({
    source: () => root?.(),
    computation: (root, p): IntersectionObserver => (
      p?.value.disconnect(),
      new IntersectionObserver(([{ isIntersecting: value }]) => isIntersecting.set(value), { root, ...options })
    )
  });

  const isIntersecting = linkedSignal({ source: () => enabled() && !!target(), computation: (on, p) => on && !!p?.value });

  let current: Element | null = null;

  effect(() => {
    current && observer().unobserve(current);
    (current = (enabled() && target()) || null) && observer().observe(current);
  });

  inject(DestroyRef).onDestroy(() => observer().disconnect());

  return isIntersecting;
}

function useAbort() {
  let ctrl: AbortController | null = null;

  return {
    create() {
      ctrl = new AbortController();

      return {
        signal: ctrl.signal,
        promise: new Promise<void>((_, rj) =>
          ctrl?.signal.addEventListener('abort', ({ target: t }) => rj((t as AbortSignal).reason), { once: true })
        )
      };
    },
    emit() {
      ctrl = ctrl?.abort() || null;
    }
  };
}

function useNextRender() {
  const injector = inject(Injector);

  return () => new Promise<void>(r => afterNextRender(r, { injector }));
}

function isAbortError(e: unknown) {
  return e instanceof DOMException && e.name === 'AbortError';
}
