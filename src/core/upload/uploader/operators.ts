import {
  catchError,
  defer,
  filter,
  from,
  map,
  merge,
  mergeMap,
  mergeWith,
  Observable,
  of,
  shareReplay,
  startWith,
  take,
  takeWhile,
  timeout,
  withLatestFrom
} from 'rxjs';
import { ifFileUpload, Log, takeUntilAbort, toFailed, toUpload } from './operators.helpers';
import { FileUpload, QueueUpload, Upload, UploadId, UploadState } from './uploader.types';

export function enqueue(abort$: Observable<UploadId>, log: Log) {
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
          errors: [],
          file
        };

        return merge(
          of(upload).pipe(log('debug', 'enqueued')),
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
  abort$: Observable<UploadId>,
  log: Log,
  required: (file: File) => boolean,
  process: (file: File) => Promise<File>,
  errorText = 'preprocessing failed'
) {
  return ifFileUpload(
    ({ file }) => required(file),
    ({ file, ...rest }) => [
      of((rest = toUpload(rest, UploadState.Processing))).pipe(log('debug', 'preprocessing')),
      defer(() => from(process(file))).pipe(
        takeUntilAbort(abort$, rest.id),
        map(file => ({ ...rest, file, name: file.name, size: file.size }) as FileUpload),
        log('debug', 'preprocessed'),
        catchError(e => of(toFailed(rest, errorText)).pipe(log('error', errorText, e)))
      )
    ]
  );
}

export function validate(abort$: Observable<UploadId>, log: Log, validateFile: (file: File) => string[] | Promise<string[]>) {
  return ifFileUpload(Boolean, ({ file, ...rest }) => [
    of((rest = toUpload(rest, UploadState.Processing))).pipe(log('debug', 'validation')),
    defer(() => from(Promise.resolve(validateFile(file)))).pipe(
      takeUntilAbort(abort$, rest.id),
      catchError(e => of([e?.message ?? 'unknown error']).pipe(log('error', e, rest))),
      map(errors => (errors.length ? toFailed(rest, ...errors) : ({ ...rest, file } as FileUpload))),
      log('debug', ({ errors }) => (errors.length ? 'invalid' : 'valid'))
    )
  ]);
}

export function upload(
  abort$: Observable<UploadId>,
  log: Log,
  uploadFile: (id: UploadId, file: File, abort$: Observable<unknown>) => Observable<{ uploaded: number | true }>,
  timeoutIn = 1000 * 60 * 60,
  errorText = 'upload failed'
) {
  return ifFileUpload(Boolean, ({ file, ...rest }) => [
    of((rest = toUpload(rest, UploadState.Uploading))).pipe(log('debug', 'uploading')),
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
  abort$: Observable<UploadId>,
  log: Log,
  getThumb: (file: File) => Promise<Exclude<Upload['thumb'], undefined>>,
  errorText = 'client thumb failed'
) {
  return ifFileUpload(Boolean, ({ id, file, state, ...upload }) => [
    of({ id, file, state, ...upload } as FileUpload).pipe(log('debug', 'client thumb')),
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
  log: Log,
  process: (id: UploadId) => Promise<{ success: boolean } & Pick<Upload, 'thumb'>>,
  timeoutIn = 1000 * 30,
  errorText = 'postprocessing failed'
) {
  return (source: Observable<Upload>) =>
    source.pipe(
      mergeMap(upload =>
        upload.state === UploadState.Uploaded ?
          merge(
            of((upload = toUpload(upload, UploadState.Uploading))).pipe(log('debug', 'postprocessing')),
            defer(() => process(upload.id)).pipe(
              timeout({ first: timeoutIn }),
              catchError(e => of({ success: false }).pipe(log('error', e, upload))),
              mergeMap(({ success, ...rest }) =>
                success ?
                  of(toUpload({ ...upload, ...rest }, UploadState.Uploaded)).pipe(log('debug', 'postprocessed'))
                : of(toFailed(upload, errorText)).pipe(log('error', errorText))
              )
            )
          )
        : of(upload)
      )
    );
}

export function mergeExternal(log: Log, external$: Observable<Exclude<Upload, 'state'> & { state: UploadState.Failed | UploadState.Uploaded; file?: never }>) {
  return (source: Observable<Upload>) =>
    source.pipe(
      mergeWith(
        external$.pipe(
          map(i => toUpload(i)),
          log('debug', 'externally injected')
        )
      )
    );
}

/** Should be on a final step to collect all the emits */
export function canalize(flush$: Observable<void>, log: Log) {
  const store$ = flush$.pipe(
    log('debug', 'uploads flushed'),
    startWith(void 0),
    map(() => new Map<UploadId, Upload>())
  );

  // Accumulates all previously emitted values (like scan operator), starting from the last flush,
  // returns an array of all items with single item per each uploadId

  return (source: Observable<Upload>) =>
    source.pipe(
      withLatestFrom(store$),
      map(([{ id, state, errors, ...rest }, m]) => {
        const { state: prevState = UploadState.Enqueued, errors: prevErrors = [], ...prev } = m.get(id) ?? { id };
        return m.set(id, {
          ...prev,
          ...rest,
          errors: Array.from(new Set([...prevErrors, ...errors])),
          state: prevState > UploadState.Uploaded ? prevState : (state ?? prevState)
        });
      }),
      map(m => Array.from(m.values())),
      shareReplay(1)
    );
}
