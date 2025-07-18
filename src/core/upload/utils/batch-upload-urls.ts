import { buffer, bufferCount, catchError, debounceTime, defer, filter, from, lastValueFrom, merge, mergeMap, of, share, Subject, take, throwError } from 'rxjs';
import { UploadId } from '../upload.types';

/** Accumulate several requests to get them all at once, reject the whole batch if there is an error */
export function batchUploadUrls(getUploadUrls: (ids: UploadId[]) => Promise<Record<UploadId, string>>, debounce = 300, limit = 100) {
  const id$ = new Subject<UploadId>();

  const shared$ = id$.pipe(share());

  const urls$ = shared$.pipe(
    buffer(merge(shared$.pipe(debounceTime(debounce)), shared$.pipe(bufferCount(limit)))),
    filter(batch => !!batch.length),
    mergeMap(batch =>
      defer(() => from(getUploadUrls(batch))).pipe(
        mergeMap(urls => merge(...batch.map(id => of({ id, url: urls[id] })))),
        catchError((error: Error) => merge(...batch.map(id => of({ id, error }))))
      )
    ),
    share()
  );

  return (id: UploadId) =>
    lastValueFrom(
      (queueMicrotask(() => id$.next(id)),
      urls$.pipe(
        filter(i => i.id === id),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mergeMap(({ id, ...i }) => ('error' in i ? throwError(() => i.error) : of(i.url))),
        take(1)
      ))
    );
}
