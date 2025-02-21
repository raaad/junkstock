import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CryptoComponent } from './crypto.component';

@Component({
  selector: 'app-utils',
  imports: [CryptoComponent],
  template: ` <div><span class="m-5 block text-xl font-light">Crypto</span><app-crypto /></div> `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UtilsComponent {}
