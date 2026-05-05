import { computed, DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, from, map, merge, mergeMap, Observable, ObservableInput, share, Subject, takeUntil } from 'rxjs';
import { LOGGER } from '../angular/logger';
import { canalize, enqueue } from './operators/operators';
import { toLog } from './operators/operators.utils';
import { UPLOAD_PIPELINE } from './upload-pipeline.token';
import { QueueUpload, Upload, UploadId, UploadState } from './upload.types';

@Injectable()
export class Uploader {
  private readonly queue$ = new Subject<QueueUpload>();

  private readonly abortAll$ = new Subject<void>();
  private readonly abortOf$ = new Subject<UploadId>();
  private readonly abort$ = merge(this.abortAll$.pipe(mergeMap(() => this.active().map(({ id }) => id))), this.abortOf$).pipe(takeUntilDestroyed());

  private readonly flush$ = new Subject<void>();

  readonly uploads$: Observable<Upload[]> = this.queue$.pipe(
    enqueue(toLog(inject(LOGGER)), this.abort$),
    inject(UPLOAD_PIPELINE)(this.abort$, this.flush$),
    canalize(toLog(inject(LOGGER)), this.flush$),
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

  constructor() {
    inject(DestroyRef).onDestroy(() => this.abortAll());
  }

  // #region methods

  upload(uploads: ObservableInput<[id: string, file: File]>) {
    const input$ = from(uploads).pipe(takeUntil(this.abortAll$), share());

    input$.subscribe(([id, file]) => this.queue$.next({ id, file }));

    return combineLatest([this.uploads$, input$.pipe(map(id => id))]).pipe(map(([items, ids]) => items.filter(({ id }) => ids.includes(id))));
  }

  abort(...ids: UploadId[]) {
    ids.forEach(id => this.abortOf$.next(id));
  }

  abortAll() {
    this.abortAll$.next(void 0);
  }

  flush() {
    this.abortAll();

    this.flush$.next(void 0);
  }

  // #endregion
}
