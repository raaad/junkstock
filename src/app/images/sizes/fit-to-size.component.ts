import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, HostListener, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fitToSize } from '../../../core/utils';

const INITIAL = { x: 0, y: 0, width: 200, height: 100 };

@Component({
  selector: 'app-fit-to-size',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="title">fitToSize</div>
    <div class="container">
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
    <div class="actions">
      <button (click)="reset()">reset</button>
      <div>
        <label><input [(ngModel)]="mode" [ngModelOptions]="{ standalone: true }" value="contain" type="radio" /> contain</label>
        <label><input [(ngModel)]="mode" [ngModelOptions]="{ standalone: true }" value="scale-down" type="radio" /> scale-down</label>
        <label><input [(ngModel)]="mode" [ngModelOptions]="{ standalone: true }" value="cover" type="radio" /> cover</label>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex-direction: column;
        min-width: 300px;
        min-height: 300px;
        user-select: none;
      }

      .title {
        padding: 1rem;
      }

      .actions {
        padding: 1rem;
        display: flex;
        gap: 1rem;
      }

      .container {
        position: relative;
        flex: 1;
        margin-left: 2rem;
      }

      .box {
        position: absolute;
        outline: 1px dashed blue;
        pointer-events: none;

        &:before {
          content: '';
          position: absolute;
          width: 0.5rem;
          height: 0.5rem;
          right: 0;
          bottom: 0;
          transform: translate(50%, 50%);
          background: #0003;
          outline: thin solid #000a;
          pointer-events: all;
          cursor: grabbing;
          border-radius: 50%;
        }
      }

      .rect {
        position: absolute;
        outline: 1px solid red;
        background: #ff000010;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  @HostListener('document:mousemove', ['$event'])
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

  @HostListener('document:mouseup') protected stop() {
    this.resizing = false;
  }
}
