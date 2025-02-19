import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { buffer, debounceTime, filter, map, pairwise, shareReplay, startWith, Subject } from 'rxjs';
import { canalize, enqueue } from './operators';
import { toLog } from './operators.helpers';
import { LOGGER, UPLOAD_PIPELINE } from './uploader.tokens';
import { QueueUpload, Upload, UploadId, UploadState } from './uploader.types';

@Injectable()
export class Uploader {
  private readonly flush$ = new Subject<void>();

  private readonly abort$ = new Subject<UploadId>();

  private readonly queue$ = new Subject<QueueUpload>();

  private readonly pipeline$ = this.queue$.pipe(
    enqueue(this.abort$, toLog(inject(LOGGER))),
    inject(UPLOAD_PIPELINE)(this.abort$),
    canalize(this.flush$, toLog(inject(LOGGER)))
  );

  // #region streams

  readonly uploads$ = this.pipeline$;

  readonly newlyUnloaded$ = this.uploads$.pipe(
    map(items => items.filter(({ state }) => state === UploadState.Uploaded)),
    startWith(new Array<Upload>()),
    pairwise(),
    map(([prev, current]) => {
      const ids = prev.map(({ id }) => id);
      return current.filter(({ id }) => !ids.includes(id));
    }),
    buffer(this.uploads$.pipe(debounceTime(300))),
    map(items => items.flat()),
    filter(items => !!items.length),
    shareReplay(1)
  );

  // #endregion

  // #region signals

  readonly uploads = toSignal(this.uploads$, { initialValue: [] });

  readonly active = computed(() => this.uploads().filter(({ state }) => state < UploadState.Uploaded));

  readonly hasActive = computed(() => !!this.active().length);

  readonly progress = computed(() =>
    this.uploads()
      .filter(({ state }) => state <= UploadState.Uploaded)
      .reduce(({ uploaded: u, total: t }, { uploaded: c, size: s }) => ({ uploaded: u + c, total: t + s }), {
        uploaded: 0,
        total: 0
      })
  );

  // #endregion

  // #region methods

  upload(...uploads: QueueUpload[]) {
    uploads.forEach(i => this.queue$.next(i));
  }

  flush() {
    this.abortAll();

    this.revokeThumbs();

    this.flush$.next(void 0);
  }

  abort(id: UploadId) {
    this.abort$.next(id);
  }

  abortAll() {
    this.active()
      .map(({ id }) => id)
      .forEach(id => this.abort(id));
  }

  private revokeThumbs() {
    this.uploads()
      .map(({ thumb }) => thumb?.url)
      .filter((i): i is string => !!i)
      .forEach(url => URL.revokeObjectURL(url));
  }

  // #endregion
}
