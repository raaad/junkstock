import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { exhaustMap, from, lastValueFrom, ObservableInput, share, Subject, take } from 'rxjs';

/** Ensures only one async operation at a time */
export function oneAtTime<A extends unknown[], R>(action: (...args: A) => ObservableInput<R>) {
  const input$ = new Subject<A>();

  const output$ = input$.pipe(
    exhaustMap(args => from(action(...args))),
    takeUntilDestroyed(),
    share()
  );

  return (...args: A) => (queueMicrotask(() => input$.next(args)), lastValueFrom(output$.pipe(take(1))));
}
