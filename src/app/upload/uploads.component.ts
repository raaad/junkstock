import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { mocks } from '../../core/upload/presets/mocks';
import { provideLogger } from '../../core/upload/presets/provide-logger';
import { provideUploadPipeline } from '../../core/upload/presets/provide-upload-pipeline';
import { LOGGER, Uploader, UploadState } from '../../core/upload/uploader';
import { getFiles } from '../../core/upload/utils/get-files';
import { FilesizePipe } from './filesize.pipe';

@Component({
  selector: 'app-uploads',
  standalone: true,
  imports: [FilesizePipe, NgClass],
  template: `
    <div
      class="selector progress"
      [style.--progress.%]="(uploader.progress().uploaded / (uploader.progress().total || 1)) * 100"
      [class.active]="uploader.hasActive()"
      [class.dropover]="dropover()"
      (dragover)="dropover.set(true); $event.preventDefault()"
      (dragleave)="dropover.set(false)"
      (drop)="drop($event); $event.preventDefault(); dropover.set(false)">
      <label class="picker action-btn">
        <input type="file" (change)="selected($event)" multiple />
        <i class="icon">🖾</i>
        <span>Select files</span>
      </label>
      <label class="picker action-btn">
        <input type="file" (change)="selected($event)" webkitdirectory />
        <i class="icon">🗁</i>
        <span>Select folder</span>
      </label>
      <div [hidden]="!uploader.hasActive()"><button (click)="uploader.abortAll()" class="action-btn">Abort All</button></div>
      <div>{{ uploader.active().length }} / {{ uploader.uploads().length }}</div>
      <div>{{ uploader.progress().uploaded | filesize }} / {{ uploader.progress().total | filesize }}</div>
    </div>
    <table>
      <tbody>
        @for (item of uploader.uploads(); track item.id) {
        <tr
          class="progress"
          [style.--progress.%]="(item.uploaded / (item.size || 1)) * 100"
          [class.active]="item.state < UploadState.Uploaded"
          [ngClass]="UploadState[item.state].toLocaleLowerCase()">
          <td class="thumb-col">
            @if(item.thumb?.url; as url){
            <img [src]="url" [alt]="item.name" class="thumb" />
            } @else{
            <span class="thumb"></span>
            }
          </td>
          <td>{{ item.id }}: {{ item.path || item.name }}</td>
          <td class="state-col">{{ UploadState[item.state] }}</td>
          <td class="size-col">
            @if(item.state < UploadState.Failed){
            <span>{{ item.uploaded | filesize }} / {{ item.size | filesize }}, {{ ((item.uploaded / item.size) * 100).toFixed(2) }}%</span>
            @if(item.state < UploadState.Uploaded){
            <i class="icon-btn abort-btn" (click)="uploader.abort(item.id)">🛇</i>
            } } @else {
            {{ item.errors.join('; ') }}
            }
          </td>
        </tr>
        }
      </tbody>
    </table>
  `,
  styles: [
    `
      :host {
        font-family: system-ui;
        font-size: 12px;
        width: 60em;
        display: block;
        margin: 1em;
      }

      .selector {
        display: flex;
        padding: 2em 0.5em;
        margin-bottom: 2em;
        border-radius: 4px;
        gap: 1em;
        align-items: stretch;
        text-align: center;
        border: thin dashed #0003;

        div {
          padding-left: 1em;
          line-height: 3;
          border-left: thin dotted #0005;
        }

        &.dropover {
          border-color: rgb(17, 151, 240);
        }
      }

      .action-btn {
        display: inline-block;
        padding: 0.5em 1em;
        border: thin dotted #0005;
        border-radius: 4px;
        cursor: pointer;
      }

      .picker {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5em;

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
          background: #0002;
        }

        &.active:after {
          width: var(--progress);
          transition: width 0.2s;
          background: rgb(17, 151, 240);
        }
      }

      table {
        width: 100%;
        border-spacing: 0;
      }

      tr + tr {
        border-top: thin dotted #0005;
      }

      td {
        padding: 0.5em;
      }

      .thumb-col {
        padding: 0.25em 0;
        width: 0;

        .thumb {
          display: inline-block;
          width: 2em;
          height: 2em;
          border-radius: 0.25em;
          object-fit: cover;
          vertical-align: middle;
          background: #0001;
        }
      }

      .failed .state-col {
        color: rgb(139, 15, 15);
      }

      .aborted .state-col {
        color: rgb(185, 174, 21);
      }

      .processing .state-col {
        color: rgb(187, 187, 185);
      }

      .uploaded .state-col {
        color: rgb(5, 128, 26);
      }

      .size-col {
        width: 16em;
        text-align: right;
      }

      .icon {
        margin-top: -6px;
        font-size: 2em;
        font-style: normal;
        line-height: 0;
      }

      .icon-btn {
        display: inline-block;
        padding: 0 0.5em;
        font-style: normal;
        cursor: pointer;
      }

      .abort-btn {
        color: rgb(231, 70, 70);
        margin: 0 -0.5em 0 0.5em;
      }
    `
  ],
  providers: [provideLogger(), provideUploadPipeline(), Uploader],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadsComponent {
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

  protected async drop({ dataTransfer }: DragEvent) {
    try {
      const files = await getFiles(dataTransfer?.items);

      this.upload(files);
    } catch (e) {
      this.logger.warn('uploader:', e);
    }
  }
}
