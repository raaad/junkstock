import { computed, inject, Injectable, OnDestroy } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map, Subject, tap } from 'rxjs';
import { LOGGER } from './logger.token';
import { canalize, enqueue } from './operators/operators';
import { UPLOAD_PIPELINE } from './upload-pipeline.token';
import { QueueUpload, UploadId, UploadState } from './upload.types';

@Injectable()
export class Uploader implements OnDestroy {
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

  abort(...ids: UploadId[]) {
    ids.forEach(id => this.aborting$.next(id));
  }

  abortAll() {
    this.abort(...this.active().map(({ id }) => id));
  }

  flush() {
    this.abortAll();

    this.flush$.next(void 0);
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  readonly ngOnDestroy = this.abortAll.bind(this);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  private thumbsRevocation = this.flush$
    .pipe(
      tap(() =>
        this.uploads()
          .map(({ thumb }) => thumb?.url)
          .filter((url): url is string => !!url)
          .forEach(url => url.startsWith('blob:') && URL.revokeObjectURL(url))
      ),
      takeUntilDestroyed()
    )
    .subscribe();

  // #endregion
}
