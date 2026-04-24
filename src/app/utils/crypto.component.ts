import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { LOGGER } from '@core/angular';
import { decrypt, encrypt } from '@core/utils';

@Component({
  selector: 'app-crypto',
  imports: [FormField],
  template: `
    <div class="title">Crypto</div>
    <div class="m-4 flex gap-4">
      <input [formField]="form.text" type="text" placeholder="text to encrypt" class="input flex-2" />
      <input [formField]="form.password" type="text" placeholder="password" class="input flex-1" />
    </div>
    <div class="m-4 flex gap-4">
      <button (click)="encrypt(form.text().value(), form.password().value())" [disabled]="form().invalid()" class="btn">encrypt</button>
      <span class="note flex-1">{{ encrypted() }}</span>
    </div>
    <div class="m-4 flex gap-4">
      <button (click)="decrypt(encrypted(), form.password().value())" [disabled]="form.password().invalid() || !encrypted()" class="btn">decrypt</button>
      <span class="note flex-1">{{ decrypted() }}</span>
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoComponent {
  private readonly logger = inject(LOGGER);

  protected form = form(signal({ text: '', password: '' }), path => {
    required(path.text);
    required(path.password);
  });

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
