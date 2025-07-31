import { ObservableInput, Subject, buffer, bufferCount, catchError, debounceTime, defer, filter, merge, mergeMap, of, share, take, throwError } from 'rxjs';

/** Accumulate several item requests to get them all at once, reject the whole batch if there is an error */
export function batched<K extends string, R>(action: (keys: K[]) => ObservableInput<Record<K, R>>, debounce = 300, limit = 100) {
  const queue$ = new Subject<K>();

  const shared$ = queue$.pipe(share());

  const items$ = shared$.pipe(
    buffer(merge(shared$.pipe(debounceTime(debounce)), shared$.pipe(bufferCount(limit)))),
    filter(batch => !!batch.length),
    mergeMap(batch =>
      defer(() => action(batch)).pipe(
        mergeMap(items => merge(...batch.map(key => (items[key] ? of({ key, item: items[key] }) : of({ key, error: new Error(`Item not found: ${key}`) }))))),
        catchError((error: Error) => merge(...batch.map(key => of({ key, error }))))
      )
    ),
    share()
  );

  return (key: K) => (
    queueMicrotask(() => queue$.next(key)),
    items$.pipe(
      filter(({ key: k }) => k === key),
      mergeMap(i => ('error' in i ? throwError(() => i.error) : of(i.item))),
      take(1)
    )
  );
}
