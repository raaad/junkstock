import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BoundingBoxComponent } from './bounding-box.component';
import { FitToSizeComponent } from './fit-to-size.component';

@Component({
  selector: 'app-sizes',
  imports: [BoundingBoxComponent, FitToSizeComponent],
  template: ` <app-bounding-box /> <app-fit-to-size /> `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SizesComponent {}
