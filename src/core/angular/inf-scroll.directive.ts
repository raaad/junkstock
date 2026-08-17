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
  signal,
  Signal,
  untracked
} from '@angular/core';

export const INF_SCROLL_HOST = new InjectionToken<HTMLElement>('INF_SCROLL_HOST');

@Directive({
  selector: '[useInfScroll]',
  exportAs: 'infScroll'
})
export class InfScrollDirective {
  readonly loader = input.required<(abort: AbortSignal) => Promise<void>>({ alias: 'useInfScroll' });

  // eslint-disable-next-line @angular-eslint/no-input-rename
  readonly enabled = input(false, { alias: 'infScrollEnabled' });

  private host = inject(INF_SCROLL_HOST, { optional: true });

  private scroll = useInfiniteScroll(signal(inject(ElementRef).nativeElement), this.host, this.enabled, this.loader, {
    scrollMargin: inject(new HostAttributeToken('data-scroll-margin'), { optional: true }) || '100px',
    threshold: 0.1
  });

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
  target: Signal<HTMLElement | undefined>,
  host: HTMLElement | null,
  enabled: Signal<boolean>,
  loader: Signal<(abort: AbortSignal) => Promise<void>>,
  { threshold = 0.1, ...options }: IntersectionObserverInit = {}
) {
  const loading = signal(false);
  const failed = signal(false);
  const isIntersecting = useObserver(
    target,
    computed(() => enabled() && !loading() && !failed()),
    { threshold, ...options }
  );
  const abort = useAbort();
  const waitNextRender = useNextRender();

  effect(() => isIntersecting() && untracked(() => keepScroll(exec)));

  effect(() => !enabled() && (failed.set(false), abort.emit()));

  return {
    active: computed(() => loading() || failed()),
    failed,
    retry: () => failed.set(false)
  };

  async function exec() {
    loading.set(true);

    try {
      const { signal, promise } = abort.create();
      await Promise.race([loader()?.(signal), promise]);
    } catch {
      failed.set(true);
    } finally {
      abort.emit();
    }

    loading.set(false);
  }

  async function keepScroll(action: typeof exec) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const _host = host ?? target()?.parentElement;
    const offset = target()?.offsetTop;
    const height = _host?.scrollHeight ?? 0;

    await action();

    await waitNextRender();

    // restore scroll position only if new elements were added before trigger's position
    (offset ?? 0) >= (target()?.offsetTop ?? 0) && _host && (_host.scrollTop += _host.scrollHeight - height);
  }
}

function useObserver(target: Signal<HTMLElement | undefined>, enabled: Signal<boolean>, options?: IntersectionObserverInit) {
  const observer = new IntersectionObserver(([{ isIntersecting: value }]) => isIntersecting.set(value), options);

  const isIntersecting = signal(false);

  let current: HTMLElement | null = null;

  inject(DestroyRef).onDestroy(() => observer.disconnect());

  effect(() => {
    current && observer.unobserve(current);

    if ((current = (enabled() && target()) || null)) observer.observe(current);
    else isIntersecting.set(false);
  });

  return isIntersecting;
}

function useAbort() {
  let ctrl: AbortController | null = null;

  return {
    create() {
      ctrl = new AbortController();

      return {
        signal: ctrl.signal,
        promise: new Promise<void>(r => ctrl?.signal.addEventListener('abort', () => r(), { once: true }))
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
