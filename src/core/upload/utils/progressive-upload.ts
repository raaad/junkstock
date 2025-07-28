import { Observable, ObservableInput, Subject, catchError, defer, filter, map, mergeAll, mergeMap, of, share, takeUntil, takeWhile, throwError } from 'rxjs';
import { QueueUpload, UploadId } from '../upload.types';

type Upload = QueueUpload & { abort$: Observable<unknown> };

/**
 * Progressive upload utility fuction:
 * - upload progress notification
 * - upload cancellation
 * - limited number of parallel uploads
 */
export function progressiveUpload(
  uploadFile: (
    id: UploadId,
    file: File,
    /** In case the implementation does not support canceling on unsubscribe */ abort$: Observable<unknown>
  ) => ObservableInput<{ uploaded: number | true }>,
  rateLimit = 10
) {
  const inputs$ = new Subject<Upload>();

  // an upload queue with a concurrent upload rate limit,
  // where no more than the amount specified by the limit can be uploaded at the same time
  const uploads$ = inputs$.pipe(
    map(({ id, file, abort$ }) =>
      defer(() => uploadFile(id, file, abort$)).pipe(
        takeUntil(abort$),
        map(i => ({ id, ...i })),
        catchError((error: Error) => of({ id, error }))
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
      mergeMap(({ id, ...i }) => ('error' in i ? throwError(() => i.error) : of(i))),
      takeWhile(i => !('error' in i || i.uploaded === true), true)
    )
  );
}
