import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LOGGER } from '../../core/upload/logger.token';
import { decrypt, encrypt } from '../../core/utils';

@Component({
  selector: 'app-crypto',
  imports: [FormsModule],
  template: `
    <div class="title">Crypto</div>
    <div class="flex gap-4 m-4">
      <input [(ngModel)]="text" [ngModelOptions]="{ standalone: true }" type="text" placeholder="text to encrypt" class="input flex-1" />
      <input [(ngModel)]="password" [ngModelOptions]="{ standalone: true }" type="text" placeholder="password" class="input" />
    </div>
    <div class="flex gap-4 m-4">
      <button (click)="encrypt(text, password)" [disabled]="!text || !password" class="btn">encrypt</button>
      <span class="flex-1 note border-1">{{ encrypted() }}</span>
    </div>
    <div class="flex gap-4 m-4">
      <button (click)="decrypt(encrypted(), password)" [disabled]="!encrypted() || !password" class="btn">decrypt</button>
      <span class="flex-1 note border-1">{{ decrypted() }}</span>
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoComponent {
  private readonly logger = inject(LOGGER);

  protected text = '';
  protected password = '';

  protected encrypted = signal('');
  protected decrypted = signal('');

  protected async encrypt(text: string, password: string) {
    try {
      this.encrypted.set(await encrypt(text, password));
    } catch (e) {
      this.encrypted.set('ERROR');
      this.logger.error(e);
    }
  }

  protected async decrypt(dataUrl: string, password: string) {
    try {
      this.decrypted.set(await decrypt(dataUrl, password));
    } catch (e) {
      this.decrypted.set('ERROR');
      this.logger.error(e);
    }
  }
}
