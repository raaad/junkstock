import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { mocks } from '../../core/upload/presets/mocks';
import { provideUploadPipeline } from '../../core/upload/presets/provide-upload-pipeline';
import { LOGGER, Uploader, UploadState } from '../../core/upload/uploader';
import { getFiles } from '../../core/upload/utils/get-files';
import { FilesizePipe } from './filesize.pipe';

@Component({
  selector: 'app-uploads',
  standalone: true,
  imports: [FilesizePipe, NgClass],
  template: `
    <!--selector-->
    <div
      class="selector progress flex flex-col gap-5 p-5 border-1 border-dashed rounded-xs border-neutral-400 mb-5"
      [style.--progress.%]="(uploader.progress().uploaded / (uploader.progress().total || 1)) * 100"
      [class.active]="uploader.hasActive()"
      [class.dropover]="dropover()"
      (dragover)="dropover.set(true); $event.preventDefault()"
      (dragleave)="dropover.set(false)"
      (drop)="dropOrPaste($event); $event.preventDefault(); dropover.set(false)"
      (paste)="dropOrPaste($event)"
      tabindex="0">
      <div class="flex gap-5 items-center flex-wrap">
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
      <div class="flex gap-5 items-center flex-wrap text-xs text-neutral-400">
        <span>Drop/Paste from clipboard</span><span>files/folders/screenshot here</span>
      </div>
    </div>
    <!--list-->
    <ul class="text-xs flex flex-col gap-1">
      @for (item of uploader.uploads(); track item.id) {
        <li
          [style.--progress.%]="(item.uploaded / (item.size || 1)) * 100"
          [class.active]="item.state === UploadState.Uploading"
          [ngClass]="UploadState[item.state].toLocaleLowerCase()"
          class="progress flex gap-2 items-center">
          <div class="size-8 bg-neutral-100">
            @if (item.thumb?.url; as url) {
              <img [src]="url" [alt]="item.name" class="size-full object-cover" />
            }
          </div>
          <div class="flex-1 truncate" [title]="item.path || item.name">{{ item.id }}: {{ item.path || item.name }}</div>
          <div class="state truncate text-right">{{ UploadState[item.state] }}</div>
          <div class="flex items-center truncate w-48 justify-end">
            @if (item.state < UploadState.Failed) {
              <span class="min-w-0">{{ item.uploaded | filesize }} / {{ item.size | filesize }}, {{ ((item.uploaded / item.size) * 100).toFixed(2) }}%</span>
              @if (item.state < UploadState.Uploaded) {
                <button class="text-xs cursor-pointer pl-1 text-red-400" (click)="uploader.abort(item.id)">🛇</button>
              }
            } @else {
              {{ item.errors.join('; ') }}
            }
          </div>
        </li>
      }
    </ul>
  `,
  styles: [
    `
      :host {
        margin: 1em;
      }

      .selector {
        transition:
          border-color 0.2s,
          background 0.2s;

        &.dropover,
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
        position: relative;

        &:before,
        &:after {
          position: absolute;
          left: 0;
          bottom: 0;
          content: '';
          display: block;
          height: 2px;
          pointer-events: none;
        }

        &.active:before {
          width: 100%;
          background: var(--color-base-200);
        }

        &.active:after {
          width: var(--progress);
          transition: width 0.2s;
          background: var(--color-blue-500);
        }
      }

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

  protected dropover = signal(false);

  constructor() {
    this.uploader.newlyUnloaded$.subscribe(items =>
      this.logger.trace(
        'uploader:',
        'newly uploaded',
        items.map(({ id }) => id)
      )
    );
  }

  private upload(files: File[]) {
    !this.uploader.hasActive() && files.length && this.uploader.flush();

    this.uploader.upload(...files.map(file => ({ id: mocks.newIds(), file })));
  }

  protected selected({ target }: Event) {
    if (target instanceof HTMLInputElement) {
      const files = Array.from(target.files ?? []);
      target.value = '';

      this.upload(files);
    }
  }

  protected async dropOrPaste(e: DragEvent | ClipboardEvent) {
    try {
      const files = await getFiles((e instanceof DragEvent ? e.dataTransfer : e.clipboardData)?.items);

      this.upload(files);
    } catch (e) {
      this.logger.warn('uploader:', e);
    }
  }
}
