import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CryptoComponent } from './crypto.component';
import { SizesComponent } from './sizes/sizes.component';

@Component({
  selector: 'app-utils',
  imports: [SizesComponent, CryptoComponent],
  template: `
    <app-sizes />
    <app-crypto />
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UtilsComponent {}
