import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LOGGER } from '@core/angular';
import { getFiles, Upload, Uploader, UploadState, withNewly } from '@core/upload';
import { from, map, ObservableInput } from 'rxjs';
import { FilesizePipe } from './filesize.pipe';
import { mock } from './mock.data';
import { provideUploadPipeline } from './provide-upload-pipeline';

@Component({
  selector: 'app-uploads',
  imports: [FilesizePipe, NgClass],
  template: `
    <!--selector-->
    <div
      class="selector progress mb-5 flex flex-col gap-5 rounded-xs border border-dashed border-neutral-200 p-5"
      [style.--progress.%]="(uploader.progress().uploaded / (uploader.progress().total || 1)) * 100"
      [class.active]="uploader.hasActive()"
      [class.dragover]="dragover()"
      (dragover)="dragover.set(true); $event.preventDefault()"
      (dragleave)="dragover.set(false)"
      (drop)="dropOrPaste($event); $event.preventDefault(); dragover.set(false)"
      (paste)="dropOrPaste($event)"
      tabindex="0">
      <div class="flex flex-wrap items-center gap-5">
        <label class="picker btn w-56">
          <input type="file" (change)="selected($event)" multiple />
          <span>Select files</span>
        </label>
        <label class="picker btn w-56">
          <input type="file" (change)="selected($event)" webkitdirectory />
          <span>Select folder</span>
        </label>
        <div [hidden]="!uploader.hasActive()"><button (click)="uploader.abortAll()" class="btn">Abort All</button></div>
        <div class="text-xs">{{ uploader.active().length }} / {{ uploader.uploads().length }}</div>
        <div class="text-xs">{{ uploader.progress().uploaded | filesize }} / {{ uploader.progress().total | filesize }}</div>
      </div>
      <div class="flex flex-wrap items-center gap-5 text-xs"><span>Drop/Paste from clipboard</span><span>files/folders/screenshot here</span></div>
    </div>
    <!--list-->
    <ul class="flex flex-col gap-1 text-xs">
      @for (item of uploader.uploads(); track item.id) {
        <li
          [style.--progress.%]="getProgress(item)"
          [class.active]="item.state < UploadState.Uploaded"
          [class.pre-upload]="item.state < UploadState.Uploading || (item.state === UploadState.Uploading && !item.uploaded)"
          [class.post-upload]="item.state === UploadState.Uploading && item.uploaded === item.size"
          [ngClass]="UploadState[item.state].toLocaleLowerCase()"
          class="progress flex items-center gap-2">
          <div class="size-8 bg-neutral-100">
            @if (item.thumb?.url; as url) {
              <img [src]="url" [alt]="item.name" class="size-full object-cover" />
            }
          </div>
          <div class="flex-1 truncate" [attr.title]="item.path || item.name">
            {{ item.id }}: <span class="text-neutral-400">{{ item.path.substring(0, item.path.lastIndexOf('/') + 1) }}</span
            >{{ item.name }}
          </div>
          <div class="state truncate text-right">{{ UploadState[item.state] }}</div>
          <div class="flex w-48 items-center justify-end truncate">
            @if (item.state < UploadState.Failed) {
              <span class="min-w-0">{{ item.uploaded | filesize }} / {{ item.size | filesize }}, {{ getProgress(item).toFixed(2) }}%</span>
              @if (item.state < UploadState.Uploaded) {
                <button class="cursor-pointer pl-1 text-xs text-red-500" title="abort" (click)="uploader.abort(item.id)">✕</button>
              }
            } @else {
              {{ item.error ?? '' }}
            }
          </div>
        </li>
      }
    </ul>
  `,
  styles: [
    `
      @reference "#main";

      :host {
        margin: 1em;
      }

      .selector {
        transition:
          border-color 0.2s,
          background 0.2s;

        &.dragover,
        &:focus {
          border-color: var(--color-sky-400);
          background: var(--color-sky-100);
        }
      }

      .picker {
        input {
          display: none;
        }
      }

      .progress {
        &.active {
          @apply progress-bar progress-bottom;
          --progress-color: var(--color-blue-500);

          &:after {
            width: var(--progress);
          }
        }
      }

      /* #region progress with pre & post */

      li.progress {
        --pre-weight: 0.1;
        --post-weight: 0.1;

        &.active:not(.pre-upload):after {
          --progress-up: calc(var(--pre-weight) * 100% + var(--progress) * (1 - var(--pre-weight) - var(--post-weight)));
          width: var(--progress-up);
        }

        &.pre-upload,
        &.post-upload {
          @apply progress-unknown;
        }

        &.pre-upload:after {
          --progress-duration: 300s;
          --progress-from: 0%;
          --progress-to: calc(var(--pre-weight) * 100%);
        }

        &.post-upload:after {
          --progress-duration: 30s;
          --progress-from: var(--progress-up);
          --progress-to: 100%;
        }
      }

      /* #endregion */

      /* state col */
      .failed .state {
        color: var(--color-red-500);
      }

      .aborted .state {
        color: var(--color-red-300);
      }

      .processing .state {
        color: var(--color-neutral-300);
      }

      .uploading .state {
        color: var(--color-sky-600);
      }

      .uploaded .state {
        color: var(--color-green-600);
      }
    `
  ],
  providers: [provideUploadPipeline(), Uploader],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadsComponent {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  protected readonly UploadState = UploadState;

  private readonly logger = inject(LOGGER);

  protected readonly uploader = inject(Uploader);

  protected dragover = signal(false);

  constructor() {
    this.uploader.uploads$
      .pipe(
        withNewly(({ state }) => state === UploadState.Uploaded),
        takeUntilDestroyed()
      )
      .subscribe(items =>
        this.logger.trace(
          'uploader: newly uploaded',
          items.map(({ id }) => id)
        )
      );
  }

  private upload(files: ObservableInput<File>) {
    !this.uploader.hasActive() && this.uploader.flush();

    this.uploader.upload(from(files).pipe(map(file => [mock.newIds(), file])));
  }

  protected selected({ target }: Event) {
    if (target instanceof HTMLInputElement) {
      this.upload(target.files ?? []);
      target.value = '';
    }
  }

  protected async dropOrPaste(e: DragEvent | ClipboardEvent) {
    try {
      const items = (e instanceof DragEvent ? e.dataTransfer : e.clipboardData)?.items;

      this.upload(getFiles(items));
    } catch (e) {
      this.logger.warn('uploader:', e);
    }
  }

  // #region support

  protected getProgress({ uploaded, size }: Upload) {
    return (uploaded / (size || 1)) * 100;
  }

  // #endregion
}
