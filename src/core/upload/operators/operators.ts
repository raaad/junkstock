import {
  catchError,
  concatMap,
  defer,
  filter,
  from,
  isObservable,
  map,
  merge,
  mergeMap,
  Observable,
  ObservableInput,
  of,
  shareReplay,
  startWith,
  take,
  takeWhile,
  timeout,
  withLatestFrom
} from 'rxjs';
import { Logger } from '../logger.token';
import { FileUpload, QueueUpload, Upload, UploadId, UploadState } from '../upload.types';
import { ifFileUpload, takeUntilAbort, toFailed, toLog, toUpload } from './operators.utils';

export function enqueue(logger: Logger, abort$: Observable<UploadId>) {
  const log = toLog(logger);

  return (source: Observable<QueueUpload>) =>
    source.pipe(
      mergeMap(({ id, file }) => {
        const upload: FileUpload = {
          id,
          name: file.name,
          path: file.webkitRelativePath ?? '',
          size: file.size,
          uploaded: 0,
          state: UploadState.Enqueued,
          file
        };

        return merge(
          of(upload).pipe(log('trace', 'enqueued')),
          abort$.pipe(
            filter(i => i === id),
            take(1),
            map(() => toUpload(upload, UploadState.Aborted)),
            log('debug', 'aborted', upload)
          )
        );
      })
    );
}

export function preProcessing(
  process: (file: File) => ObservableInput<File>,
  logger: Logger,
  abort$: Observable<UploadId>,
  errorText = 'preprocessing failed'
) {
  const log = toLog(logger);

  return ifFileUpload(({ file, ...rest }) => [
    of((rest = toUpload(rest, UploadState.Processing))).pipe(log('trace', 'preprocessing')),
    defer(() => process(file)).pipe(
      takeUntilAbort(abort$, rest.id),
      map(file => ({ ...rest, file, name: file.name, size: file.size }) as FileUpload),
      log('debug', 'preprocessed'),
      catchError(e => of(toFailed(rest, errorText)).pipe(log('error', errorText, e)))
    )
  ]);
}

export function validate(
  rules: Record<string, (file: File) => boolean | Promise<boolean> | Observable<boolean>>,
  logger: Logger,
  abort$: Observable<UploadId>,
  errorText = 'invalid file',
  timeoutIn = 6e4 // 1min
) {
  const log = toLog(logger);

  return ifFileUpload(({ file, ...rest }) => [
    of((rest = toUpload(rest, UploadState.Processing))).pipe(log('trace', 'validation')),
    defer(() =>
      Object.entries(rules).reduce(
        (prev, [error, rule]) => prev.pipe(concatMap(e => (e ? of(e) : validate(rule, file, error)))),
        of(undefined as string | undefined)
      )
    ).pipe(
      takeUntilAbort(abort$, rest.id),
      timeout({ first: timeoutIn }),
      catchError(e => of(errorText).pipe(log('error', e, rest))),
      map(error => (error ? toFailed(rest, error) : ({ ...rest, file } as FileUpload))),
      log('debug', ({ error }) => (error ? 'invalid' : 'valid'))
    )
  ]);

  function validate(rule: (typeof rules)[keyof typeof rules], file: File, error: string) {
    const result = rule(file);
    return (
      isObservable(result) ? result
      : typeof result === 'boolean' ? of(result)
      : from(result)).pipe(map(valid => (valid ? undefined : error)));
  }
}

export function upload(
  uploadFile: (id: UploadId, file: File, abort$: Observable<unknown>) => ObservableInput<{ uploaded: number | true }>,
  logger: Logger,
  abort$: Observable<UploadId>,
  errorText = 'upload failed',
  timeoutIn = 36e5 // 1h
) {
  const log = toLog(logger);

  return ifFileUpload(({ file, ...rest }) => [
    of((rest = toUpload(rest, UploadState.Uploading))).pipe(log('trace', 'uploading')),
    defer(() =>
      uploadFile(
        rest.id,
        file,
        abort$.pipe(
          filter(id => id === rest.id),
          take(1)
        )
      )
    ).pipe(
      takeUntilAbort(abort$, rest.id),
      timeout({ first: timeoutIn }),
      map(({ uploaded }) =>
        typeof uploaded === 'number' ? toUpload({ ...rest, uploaded }, UploadState.Uploading) : toUpload({ ...rest, uploaded: file.size }, UploadState.Uploaded)
      ),
      log(
        ({ state }) => (state === UploadState.Uploading ? 'trace' : 'debug'),
        ({ state, uploaded, size }) => (state === UploadState.Uploading ? `uploading ${uploaded}/${size}` : 'uploaded')
      ),
      takeWhile(({ state }) => state !== UploadState.Uploaded, true),
      catchError(e => of(toFailed(rest, errorText)).pipe(log('error', e)))
    )
  ]);
}

export function clientThumb(
  getThumb: (file: File) => ObservableInput<Exclude<Upload['thumb'], undefined>>,
  logger: Logger,
  abort$: Observable<UploadId>,
  errorText = 'client thumb failed'
) {
  const log = toLog(logger);

  return ifFileUpload(({ id, file, state, ...upload }) => [
    of({ id, file, state, ...upload } as FileUpload).pipe(log('trace', 'client thumb')),
    defer(() => getThumb(file)).pipe(
      takeUntilAbort(abort$, id),
      catchError(e =>
        of(e).pipe(
          log('warn', errorText, { id, file, ...upload }),
          filter((i): i is Exclude<Upload['thumb'], undefined> => false) // just to log error and suppress
        )
      ),
      map(thumb =>
        toUpload({ id, ...upload, thumb, state: undefined as unknown as UploadState /* To not overwrite the latest state, will be filled on canalize phaze */ })
      )
    )
  ]);
}

export function postProcessing(
  process: (id: UploadId) => ObservableInput<void>,
  logger: Logger,
  abort$: Observable<UploadId>,
  errorText = 'postprocessing failed',
  timeoutIn = 6e4 // 1min
) {
  const log = toLog(logger);

  return (source: Observable<Upload>) =>
    source.pipe(
      mergeMap(upload =>
        upload.state === UploadState.Uploaded ?
          merge(
            of((upload = toUpload(upload, UploadState.Uploading))).pipe(log('trace', 'postprocessing')),
            defer(() => process(upload.id)).pipe(
              takeUntilAbort(abort$, upload.id),
              timeout({ first: timeoutIn }),
              catchError(e => of(toFailed(upload, typeof e === 'string' ? e : errorText)).pipe(log('error', e, upload))),
              mergeMap(() => of(toUpload(upload, UploadState.Uploaded)).pipe(log('debug', 'postprocessed')))
            )
          )
        : of(upload)
      )
    );
}

/** Should be on a final step to collect all the emits */
export function canalize(logger: Logger, flush$: Observable<void>) {
  const log = toLog(logger);

  const store$ = flush$.pipe(
    log('trace', 'uploads flushed'),
    startWith(void 0),
    map(() => new Map<UploadId, Upload>())
  );

  // Accumulates all previously emitted values (like scan operator), starting from the last flush,
  // returns an array of all items with single item per each uploadId

  return (source: Observable<Upload>) =>
    source.pipe(
      withLatestFrom(store$),
      map(([{ id, state, error, ...rest }, m]) => {
        const { state: prevState = UploadState.Enqueued, error: prevError, ...prev } = m.get(id) ?? { id };
        return m.set(id, {
          ...prev,
          ...rest,
          error: prevError ?? error,
          state: prevState > UploadState.Uploaded ? prevState : (state ?? prevState)
        });
      }),
      map(m => Array.from(m.values())),
      shareReplay(1)
    );
}
