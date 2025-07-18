import { Observable, Subject, catchError, concatMap, defer, filter, from, map, mergeAll, mergeMap, of, share, takeUntil, takeWhile, throwError } from 'rxjs';
import { QueueUpload, UploadId } from '../upload.types';

type Upload = QueueUpload & { abort$: Observable<unknown> };

/**
 * Progressive upload utility fuction:
 * - upload progress notification
 * - upload cancellation
 * - limited number of parallel uploads
 *
 * Case 0 (primal): no upload URLs needed, no rate limit
 * @example
 * ```
 * progressiveUpload(Promise.resolve, uploadFile, 0);
 * ```
 *
 *
 * Case 1: no upload URLs batching
 * @example
 * ```
 * progressiveUpload((id) => http.get(`/api/${id}`), uploadFile, 0);
 * ```
 *
 * Case 2: full package
 * @example
 * ```
 * progressiveUpload(batchUploadUrls(getUploadUrls), uploadFile);
 * ```
 */
export function progressiveUpload(
  getUploadUrl: (id: UploadId) => Promise<string>,
  uploadFile: (url: string, file: File, abort$: Observable<unknown>) => Observable<{ uploaded: number | true }>,
  rateLimit = 10
) {
  const inputs$ = new Subject<Upload>();

  // an upload queue with a concurrent upload rate limit,
  // where no more than the amount specified by the limit can be uploaded at the same time
  const uploads$ = inputs$.pipe(
    map(({ id, file, abort$ }) =>
      defer(() =>
        from(getUploadUrl(id)).pipe(
          concatMap(url => uploadFile(url, file, abort$).pipe(map(i => ({ id, ...i })))),
          catchError((error: Error) => of({ id, error })),
          takeUntil(abort$)
        )
      )
    ),
    mergeAll(Math.max(rateLimit, 0) || Number.MAX_SAFE_INTEGER),
    share()
  );

  // returns per-upload stream
  return (id: UploadId, file: File, abort$: Observable<unknown>) => (
    queueMicrotask(() => inputs$.next({ id, file, abort$ })),
    uploads$.pipe(
      filter(i => i.id === id),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mergeMap(({ id, ...i }) => ('error' in i ? throwError(() => i.error) : of(i))),
      takeWhile(i => !('error' in i || i.uploaded === true), true)
    )
  );
}
