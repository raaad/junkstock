import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BoundingBoxComponent } from './bounding-box.component';
import { FitToSizeComponent } from './fit-to-size.component';

@Component({
  selector: 'app-sizes',
  imports: [BoundingBoxComponent, FitToSizeComponent],
  template: `
    <app-bounding-box class="flex-1" />
    <app-fit-to-size class="flex-1" />
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-wrap: wrap;
        align-items: stretch;
        gap: 1rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex-col md:flex-row'
  }
})
export class SizesComponent {}
