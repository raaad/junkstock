import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { getBoundingBox } from '@core/utils';

const INITIAL = { x: 50, y: 70, width: 200, height: 50 };

@Component({
  selector: 'app-bounding-box',
  imports: [],
  template: `
    <div class="title">getBoundingBox</div>
    <div class="canvas">
      <div
        class="rect"
        [style.top.px]="rect.y"
        [style.left.px]="rect.x"
        [style.width.px]="rect.width"
        [style.height.px]="rect.height"
        [style.rotate.deg]="angle"></div>
      <div
        class="box"
        [style.top.px]="box.y"
        [style.left.px]="box.x"
        [style.width.px]="box.width"
        [style.height.px]="box.height"
        (click)="toggle()"
        role="presentation"></div>
    </div>
    <div class="note">
      Click to Pause/Resume, <b>{{ angle }} °</b>
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
        flex: 1;
        width: 250px;
        min-height: 200px;
        margin: 2rem;
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
export class BoundingBoxComponent implements OnInit, OnDestroy {
  protected rect = INITIAL;
  protected box = INITIAL;
  protected angle = 0;

  private handleId?: number;

  private readonly ch = inject(ChangeDetectorRef);

  ngOnInit() {
    this.start();
  }

  ngOnDestroy() {
    this.stop();
  }

  protected toggle() {
    this.handleId ? this.stop() : this.start();
  }

  private stop() {
    this.handleId && cancelAnimationFrame(this.handleId);
    this.handleId = undefined;
  }

  private start() {
    this.handleId = requestAnimationFrame(this.update.bind(this));
  }

  private update() {
    this.angle = ++this.angle % 360;
    this.box = getBoundingBox(this.rect, this.angle);

    this.start();
    this.ch.markForCheck();
  }
}
