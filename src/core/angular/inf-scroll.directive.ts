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
  trigger: Signal<HTMLElement | undefined>,
  host: HTMLElement | null,
  enabled: Signal<boolean>,
  loader: Signal<(abort: AbortSignal) => Promise<void>>,
  { threshold = 0.1, ...options }: IntersectionObserverInit = {}
) {
  const loading = signal(false);
  const failed = linkedSignal({ source: enabled, computation: (on, p) => !on && !!p?.value });
  const isIntersecting = useObserver(
    trigger,
    computed(() => enabled() && !loading() && !failed()),
    { threshold, ...options }
  );
  const abort = useAbort();
  const waitNextRender = useNextRender();

  effect(() => isIntersecting() && untracked(() => keepScroll(exec)));

  effect(() => !enabled() && abort.emit());

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
    const target = host ?? trigger()?.parentElement;
    const offset = trigger()?.offsetTop;
    const height = target?.scrollHeight ?? 0;

    await action();

    await waitNextRender();

    // restore scroll position only if new elements were added before trigger's position
    (offset ?? 0) >= (trigger()?.offsetTop ?? 0) && target && (target.scrollTop += target.scrollHeight - height);
  }
}

function useObserver(target: Signal<HTMLElement | undefined>, enabled: Signal<boolean>, options?: IntersectionObserverInit) {
  const observer = new IntersectionObserver(([{ isIntersecting: value }]) => isIntersecting.set(value), options);

  const isIntersecting = linkedSignal({
    source: () => enabled() && !!target(),
    computation: (on, prev) => on && !!prev?.value
  });

  let current: HTMLElement | null = null;

  effect(() => {
    current && observer.unobserve(current);
    if ((current = (enabled() && target()) || null)) observer.observe(current);
  });

  inject(DestroyRef).onDestroy(() => observer.disconnect());

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
