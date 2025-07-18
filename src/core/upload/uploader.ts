import { computed, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map, Subject } from 'rxjs';
import { canalize, enqueue } from './operators/operators';
import { QueueUpload, UploadId, UploadState } from './upload.types';
import { LOGGER, UPLOAD_PIPELINE } from './uploader.tokens';

@Injectable()
export class Uploader {
  private readonly flush$ = new Subject<void>();

  private readonly aborting$ = new Subject<UploadId>();
  private readonly abort$ = this.aborting$.pipe(takeUntilDestroyed());

  private readonly queue$ = new Subject<QueueUpload>();

  readonly uploads$ = this.queue$.pipe(
    enqueue(inject(LOGGER), this.abort$),
    inject(UPLOAD_PIPELINE)(this.abort$),
    canalize(inject(LOGGER), this.flush$),
    takeUntilDestroyed()
  );

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

  upload(uploads: Record<UploadId, File>) {
    Object.entries(uploads).forEach(([id, file]) => this.queue$.next({ id, file }));

    return this.uploads$.pipe(map(items => items.filter(({ id }) => !!uploads[id])));
  }

  flush() {
    this.abortAll();

    this.revokeThumbs();

    this.flush$.next(void 0);
  }

  abort(...ids: UploadId[]) {
    ids.forEach(id => this.aborting$.next(id));
  }

  abortAll() {
    this.abort(...this.active().map(({ id }) => id));
  }

  private revokeThumbs() {
    this.uploads()
      .map(({ thumb }) => thumb?.url)
      .filter((i): i is string => !!i)
      .forEach(url => URL.revokeObjectURL(url));
  }

  // #endregion
}
