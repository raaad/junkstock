import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CryptoComponent } from './crypto.component';

@Component({
  selector: 'app-utils',
  imports: [CryptoComponent],
  template: `
    <div class="collapse">
      <input type="radio" name="list" checked="checked" />
      <div class="collapse-title text-xl font-light">Crypto</div>
      <div class="collapse-content visible p-0">
        <app-crypto />
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UtilsComponent {}
