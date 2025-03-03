import {
  Observable,
  Subject,
  buffer,
  bufferCount,
  catchError,
  debounceTime,
  defer,
  filter,
  from,
  map,
  merge,
  mergeAll,
  mergeMap,
  of,
  share,
  takeUntil,
  throwError
} from 'rxjs';
import { QueueUpload, UploadId } from '../uploader/uploader.types';

/**
 * Progressive upload helper:
 * - bulk request for uploaded URLs (debounced with limit)
 * - upload progress notification
 * - upload cancellation
 * - limited number of parallel uploads
 */
export function progressiveUpload(
  getUploadUrls: (ids: UploadId[]) => Promise<Record<UploadId, string>>,
  uploadFile: (url: string, file: File) => Observable<{ uploaded: number | true }>,
  { rateLimit, batchDebounce, batchLimit } = { rateLimit: 5, batchDebounce: 300, batchLimit: 100 }
) {
  const requests$ = new Subject<QueueUpload & { abort$: Observable<unknown> }>();

  // Get a batch of upload URLs in one request, reject the whole batch if there is an error
  const urls$ = requests$.pipe(
    buffer(merge(requests$.pipe(debounceTime(batchDebounce)), requests$.pipe(bufferCount(batchLimit)))),
    filter(batch => !!batch.length),
    map(batch => Object.fromEntries(batch.map(({ id, ...rest }) => [id, rest]))),
    mergeMap(batch =>
      defer(() => from(getUploadUrls(Object.keys(batch)))).pipe(
        catchError((e: Error) => of(Object.fromEntries(Object.keys(batch).map(id => [id, e])))), // just pass over an error
        mergeMap(urls => merge(...Object.entries(batch).map(([id, { file, abort$ }]) => of({ id, file, abort$, url: urls[id] }))))
      )
    ),
    share()
  );

  // An upload queue with a concurrent upload rate limit,
  // where no more than the amount specified by the limit can be uploaded at the same time
  const uploads$ = urls$.pipe(
    map(({ id, file, url, abort$ }) =>
      defer(() =>
        (typeof url === 'string' ? uploadFile(url, file).pipe(mergeMap(event => of({ id, event }))) : throwError(() => url)).pipe(
          takeUntil(abort$),
          catchError((event: Error) => of({ id, event })) // just pass over an error
        )
      )
    ),
    mergeAll(rateLimit),
    share()
  );

  // returns per-upload stream
  return (id: UploadId, file: File, abort$: Observable<unknown>) => (
    queueMicrotask(() => requests$.next({ id, file, abort$ })),
    uploads$.pipe(
      filter(({ id: i }) => i === id),
      mergeMap(({ event }) => (event instanceof Error ? throwError(() => event) : of(event)))
    )
  );
}
