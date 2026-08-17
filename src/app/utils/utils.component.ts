import { Component } from '@angular/core';
import { CryptoComponent } from './crypto.component';
import { DateComponent } from './date.component';
import { SizesComponent } from './sizes/sizes.component';

@Component({
  imports: [SizesComponent, DateComponent, CryptoComponent],
  template: `
    <app-date />
    <app-crypto />
    <app-sizes />
  `,
  styles: [
    `
      @reference "#main";

      :host {
        @apply separator;
      }
    `
  ]
})
export class UtilsComponent {}
