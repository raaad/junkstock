import { MonoTypeOperatorFunction, Observable, filter, merge, mergeMap, of, take, takeUntil, tap } from 'rxjs';
import { FileUpload, Logger, Upload, UploadId, UploadState } from '../upload.types';

export function ifFileUpload(operators: (u: FileUpload) => Observable<FileUpload | Upload>[]) {
  return (source: Observable<FileUpload | Upload>) =>
    source.pipe(mergeMap(upload => (isFileUpload(upload) ? of(upload).pipe(mergeMap(upload => merge(...operators(upload)))) : of(upload))));
}

function isFileUpload(item: Upload | FileUpload): item is FileUpload {
  return 'file' in item;
}

export function toFailed(item: Upload, error?: string): Upload {
  return { ...toUpload(item, UploadState.Failed), error: item.error ?? error };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function toUpload({ file, state: currentState, ...rest }: FileUpload | (Upload & Partial<Pick<FileUpload, 'file'>>), state?: UploadState): Upload {
  return { ...rest, state: state ?? currentState };
}

export function takeUntilAbort<T>(abort$: Observable<UploadId>, id: UploadId) {
  return (source: Observable<T>) =>
    source.pipe(
      takeUntil(
        abort$.pipe(
          filter(i => i === id),
          take(1)
        )
      )
    );
}

export type Log = <T>(level: keyof Logger | ((i: T) => keyof Logger), message: string | ((i: T) => string), ...rest: unknown[]) => MonoTypeOperatorFunction<T>;

export function toLog(logger: Logger, prefix = 'uploader:'): Log {
  return (level, message, ...rest) =>
    tap(i => logger[typeof level === 'function' ? level(i) : level](prefix, typeof message === 'function' ? message(i) : message, ...rest, i));
}
