import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { getBoundingBox } from '@core/utils';

@Component({
  selector: 'app-bounding-box',
  imports: [],
  template: `
    <div class="title">getBoundingBox</div>
    <div class="canvas" (click)="toggle()" (keydown.enter)="toggle()" (resized)="resized($any($event))" tabindex="0">
      <div
        class="rect"
        [style.top.px]="rect.y"
        [style.left.px]="rect.x"
        [style.width.px]="rect.width"
        [style.height.px]="rect.height"
        [style.rotate.deg]="angle()"></div>
      <div class="box" [style.top.px]="box.y" [style.left.px]="box.x" [style.width.px]="box.width" [style.height.px]="box.height" role="presentation"></div>
    </div>
    <div class="note !px-4">
      Click to Pause/Resume, <b>{{ angle() }} °</b>
    </div>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        flex-direction: column;
      }

      .canvas {
        position: relative;
        flex-basis: 15rem;
      }

      .rect {
        position: absolute;
        outline: 1px solid var(--color-red-300);
        background: var(--color-red-100);
      }

      .box {
        position: absolute;
        outline: 1px dashed var(--color-blue-400);
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoundingBoxComponent {
  protected rect = this.getRect();
  protected box = this.getRect();
  protected angle = signal(0);

  private frameHandle = 0;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());

    this.start();
  }

  protected toggle() {
    this.frameHandle ? this.stop() : this.start();
  }

  protected resized(e: ResizeObserverEntry) {
    this.rect = this.getRect(e.contentRect);
    this.update(false);
  }

  private stop() {
    cancelAnimationFrame(this.frameHandle);
    this.frameHandle = 0;
  }

  private start() {
    this.frameHandle = requestAnimationFrame(() => this.update(true));
  }

  private update(start = true) {
    this.angle.set((this.angle() + 1) % 360);
    this.box = getBoundingBox(this.rect, this.angle());

    start && this.start();
  }

  private getRect({ width: w, height: h } = { width: 0, height: 0 }) {
    const factor = 1.5;
    const width = Math.min(w, h) / factor;
    const height = width / 3;

    return { x: (w - width) / 2, y: (h - height) / 2, width, height };
  }
}
