import { HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { catchError, defer, filter, from, map, merge, mergeMap, Observable, of, shareReplay, startWith, take, takeWhile, timeout, withLatestFrom } from 'rxjs';
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

export function convert(
  abort$: Observable<UploadId>,
  log: Log,
  isConvertable: (file: File) => boolean,
  convertFile: (file: File) => Promise<File>,
  errorText = 'conversion failed'
) {
  return ifFileUpload(
    ({ file }) => isConvertable(file),
    ({ file, ...rest }) => [
      of((rest = toUpload(rest, UploadState.Processing))).pipe(log('debug', 'conversion')),
      defer(() => from(convertFile(file))).pipe(
        takeUntilAbort(abort$, rest.id),
        map(file => ({ ...rest, file, name: file.name, size: file.size }) as FileUpload),
        log('debug', 'converted'),
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
  uploadFile: (id: UploadId, file: File, abort$: Observable<unknown>) => Observable<HttpProgressEvent | HttpResponse<unknown>>,
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
      map(e =>
        e.type === HttpEventType.UploadProgress ?
          toUpload({ ...rest, uploaded: e.loaded ?? 0 }, UploadState.Uploading)
        : toUpload({ ...rest, uploaded: file.size }, UploadState.Uploaded)
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
  return ifFileUpload(Boolean, upload => [
    of(upload).pipe(log('debug', 'client thumb')),
    defer(() => getThumb(upload.file)).pipe(
      takeUntilAbort(abort$, upload.id),
      catchError(e =>
        of(e).pipe(
          log('warn', errorText, upload),
          filter((i): i is Exclude<Upload['thumb'], undefined> => false)
        )
      ),
      map(thumb => toUpload({ ...upload, thumb }))
    )
  ]);
}

export function serverThumb(log: Log, waitForThumb: (id: UploadId) => Promise<boolean>, timeoutIn = 1000 * 30, errorText = 'server thumb failed') {
  return (source: Observable<Upload>) =>
    source.pipe(
      mergeMap(upload =>
        upload.state === UploadState.Uploaded ?
          merge(
            of((upload = toUpload(upload, UploadState.Uploading))).pipe(log('debug', 'waiting server thumb')),
            defer(() => waitForThumb(upload.id)).pipe(
              timeout({ first: timeoutIn }),
              catchError(e => of(false).pipe(log('error', e, upload))),
              mergeMap(success =>
                success ?
                  of(toUpload(upload, UploadState.Uploaded)).pipe(log('debug', 'server thumb done'))
                : of(toFailed(upload, errorText)).pipe(log('error', errorText))
              )
            )
          )
        : of(upload)
      )
    );
}

/** Should be on a final step to collect all the emits */
export function canalize(flush$: Observable<void>, log: Log) {
  const store$ = flush$.pipe(
    startWith(),
    map(() => new Map<UploadId, Upload>()),
    log('debug', 'uploads flushed')
  );

  // Accumulates all previously emitted values (like scan operator), starting from the last flush,
  // returns an array of all items with single item per each uploadId

  return (source: Observable<Upload>) =>
    source.pipe(
      withLatestFrom(store$),
      map(([i, m]) => {
        const { state = UploadState.Enqueued, errors = [], ...prev } = m.get(i.id) ?? {};
        return m.set(i.id, { ...prev, ...i, errors: [...errors, ...i.errors], state: state > UploadState.Uploaded ? state : i.state });
      }),
      map(m => Array.from(m.values())),
      shareReplay(1)
    );
}
