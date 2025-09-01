import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CryptoComponent } from './crypto.component';
import { DateComponent } from './date.component';
import { SizesComponent } from './sizes/sizes.component';

@Component({
  selector: 'app-utils',
  imports: [SizesComponent, DateComponent, CryptoComponent],
  template: `
    <app-sizes />
    <app-date />
    <app-crypto />
  `,
  styles: [
    `
      @reference "#main";

      :host {
        @apply separator;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UtilsComponent {}
