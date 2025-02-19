import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CryptoComponent } from './crypto.component';

@Component({
  selector: 'app-utils',
  imports: [CryptoComponent],
  template: `<app-crypto />`,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UtilsComponent {}
