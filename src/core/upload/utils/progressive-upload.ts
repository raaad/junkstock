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
  groupBy,
  map,
  merge,
  mergeAll,
  mergeMap,
  of,
  pairwise,
  share,
  take,
  takeUntil,
  takeWhile,
  throwError
} from 'rxjs';
import { QueueUpload, UploadId } from '../upload.types';

/** Get a batch of upload URLs in one request, reject the whole batch if there is an error */
export function batchUploadUrls(getUploadUrls: (ids: UploadId[]) => Promise<Record<UploadId, string>>, debounce = 300, limit = 100) {
  return (id$: Observable<UploadId>) => {
    const shared$ = id$.pipe(share());

    return shared$.pipe(
      buffer(merge(shared$.pipe(debounceTime(debounce)), shared$.pipe(bufferCount(limit)))),
      filter(batch => !!batch.length),
      mergeMap(batch =>
        defer(() => from(getUploadUrls(batch))).pipe(
          mergeMap(urls => merge(...batch.map(id => of({ id, url: urls[id] })))),
          catchError((error: Error) => merge(...batch.map(id => of({ id, error }))))
        )
      )
    );
  };
}

type Upload = QueueUpload & { abort$: Observable<unknown> };

/**
 * Progressive upload helper:
 * - upload progress notification
 * - upload cancellation
 * - limited number of parallel uploads
 *
 * Case 0 (primal): no upload URLs needed, no rate limit
 * @example
 * ```
 * progressiveUpload(s => s.pipe(map(id => ({ id, url: '' }))), uploadFile, 0);
 * ```
 *
 *
 * Case 1: no upload URLs batching
 * @example
 * ```
 * progressiveUpload(s => s.pipe(concatMap(id => forkJoin({ id: of(id), url: from(getUploadUrl) }))), uploadFile, 0);
 * ```
 *
 * Case 2: full package
 * @example
 * ```
 * progressiveUpload(batchUploadUrls(getUploadUrls), uploadFile);
 * ```
 */
export function progressiveUpload(
  getUploadUrl: ReturnType<typeof batchUploadUrls>,
  uploadFile: (url: string, file: File, abort$: Observable<unknown>) => Observable<{ uploaded: number | true }>,
  rateLimit = 10
) {
  const inputs$ = new Subject<Upload>();

  const urls$ = inputs$.pipe(
    map(({ id }) => id),
    getUploadUrl
  );

  const requests$ = merge(inputs$, urls$).pipe(
    groupBy(({ id }) => id),
    mergeMap(g =>
      g.pipe(
        pairwise(),
        map(([upload, url]) => ({ ...upload, ...url }) as Upload & { url?: string; error?: Error }),
        take(1)
      )
    )
  );

  // an upload queue with a concurrent upload rate limit,
  // where no more than the amount specified by the limit can be uploaded at the same time
  const uploads$ = requests$.pipe(
    map(({ id, file, url, error, abort$ }) =>
      defer(() =>
        (typeof url === 'string' ? uploadFile(url, file, abort$).pipe(map(event => ({ id, ...event }))) : throwError(() => error)).pipe(
          takeUntil(abort$),
          catchError((error: Error) => of({ id, error }))
        )
      )
    ),
    mergeAll(rateLimit || Number.MAX_SAFE_INTEGER),
    share()
  );

  // returns per-upload stream
  return (id: UploadId, file: File, abort$: Observable<unknown>) => (
    queueMicrotask(() => inputs$.next({ id, file, abort$ })),
    uploads$.pipe(
      filter(i => i.id === id),
      takeWhile(i => !('error' in i || i.uploaded === true), true),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mergeMap(({ id, ...i }) => ('error' in i ? throwError(() => i.error) : of(i)))
    )
  );
}
