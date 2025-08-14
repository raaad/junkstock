import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BoundingBoxComponent } from './bounding-box.component';
import { FitToSizeComponent } from './fit-to-size.component';

@Component({
  selector: 'app-sizes',
  imports: [BoundingBoxComponent, FitToSizeComponent],
  template: `
    <app-bounding-box class="flex-1 min-w-[20rem]" />
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SizesComponent {}
