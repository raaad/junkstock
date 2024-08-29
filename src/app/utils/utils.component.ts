import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CryptoComponent } from './crypto.component';

@Component({
  selector: 'app-utils',
  standalone: true,
  imports: [CryptoComponent],
  template: ` <app-crypto /> `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UtilsComponent {}
