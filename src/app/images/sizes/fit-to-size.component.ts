import { ChangeDetectionStrategy, Component, effect, ElementRef, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fitToSize } from '../../../core/utils';

const INITIAL = { x: 0, y: 0, width: 200, height: 100 };

@Component({
  selector: 'app-fit-to-size',
  imports: [FormsModule],
  template: `
    <div class="title">fitToSize</div>
    <div class="canvas">
      <div class="rect" [style.top.px]="rect.y" [style.left.px]="rect.x" [style.width.px]="rect.width" [style.height.px]="rect.height"></div>
      <div
        #boxEl
        class="box"
        [style.top.px]="box.y"
        [style.left.px]="box.x"
        [style.width.px]="box.width"
        [style.height.px]="box.height"
        (mousedown)="resizing = true"></div>
    </div>
    <div class="flex gap-2 p-2 items-center">
      <label class="flex items-center gap-1"
        ><input [(ngModel)]="mode" [ngModelOptions]="{ standalone: true }" value="contain" type="radio" class="radio" />contain</label
      >
      <label class="flex items-center gap-1"
        ><input [(ngModel)]="mode" [ngModelOptions]="{ standalone: true }" value="scale-down" type="radio" class="radio" />scale-down</label
      >
      <label class="flex items-center gap-1"
        ><input [(ngModel)]="mode" [ngModelOptions]="{ standalone: true }" value="cover" type="radio" class="radio" />cover</label
      >
      <button (click)="reset()" class="btn btn-sm">reset</button>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex-direction: column;
        user-select: none;
      }

      .canvas {
        position: relative;
        flex: 1;
        width: 250px;
        min-height: 200px;
        margin: 2rem;
      }

      .box {
        position: absolute;
        outline: 1px dashed var(--color-blue-400);
        pointer-events: none;

        &:before {
          content: '';
          position: absolute;
          width: 0.5rem;
          height: 0.5rem;
          right: 0;
          bottom: 0;
          transform: translate(50%, 50%);
          background: var(--color-neutral-200);
          outline: thin solid var(--color-neutral-700);
          pointer-events: all;
          cursor: grabbing;
          border-radius: 50%;
        }
      }

      .rect {
        position: absolute;
        outline: 1px solid var(--color-red-300);
        background: var(--color-red-100);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:mousemove)': 'resize($event)',
    '(document:mouseup)': 'stop()'
  }
})
export class FitToSizeComponent {
  protected mode = signal('contain' as 'contain' | 'scale-down' | 'cover');

  protected box = { ...INITIAL, width: INITIAL.width + 20, height: INITIAL.height + 20 };
  protected rect = { ...INITIAL, ...fitToSize(INITIAL, this.box, this.mode()) };

  protected resizing = false;

  readonly boxEl = viewChild<ElementRef<HTMLDivElement>>('boxEl');

  constructor() {
    effect(() => (this.rect = { ...this.rect, ...fitToSize(this.rect, this.box, this.mode()) }));
  }

  protected reset() {
    this.box = this.rect = INITIAL;
  }

  protected resize({ x, y }: MouseEvent) {
    if (!this.resizing) return;

    const boxEl = this.boxEl()?.nativeElement;
    const containerEl = boxEl?.parentElement;
    const bounds = containerEl?.getBoundingClientRect() ?? { right: 0, bottom: 0 };

    const { left, top } = boxEl?.getBoundingClientRect() ?? { left: 0, top: 0 };

    const box = { ...this.box, width: Math.max(Math.min(x, bounds.right) - left, 10), height: Math.max(Math.min(y, bounds.bottom) - top, 10) };

    const rect = { ...this.rect, ...fitToSize(this.rect, box, this.mode()) };

    if (bounds.right > left + rect.width && bounds.bottom > top + rect.height) {
      this.box = box;
      this.rect = rect;
    }
  }

  protected stop() {
    this.resizing = false;
  }
}
