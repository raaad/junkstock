import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { decrypt, encrypt } from '../../core/utils';

@Component({
  selector: 'app-crypto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <input [(ngModel)]="text" [ngModelOptions]="{ standalone: true }" type="text" placeholder="text to encrypt" />
      <input [(ngModel)]="password" [ngModelOptions]="{ standalone: true }" type="text" placeholder="password" />
    </div>
    <div>
      <button (click)="encrypt(text, password)" [disabled]="!text || !password">encrypt</button>
      <span class="output">{{ encrypted() }}</span>
    </div>
    <div>
      <button (click)="decrypt(encrypted(), password)" [disabled]="!encrypted() || !password">decrypt</button>
      <span class="output">{{ decrypted() }}</span>
    </div>
  `,
  styles: [
    `
      div {
        display: flex;
        gap: 1rem;
        margin: 1rem;
      }

      input {
        padding: 0.5rem;
        min-width: 0;

        &:first-child {
          flex: 1;
        }
      }

      .output {
        flex: 1;

        padding: 1rem;
        border: thin dashed #0003;
        border-radius: 4px;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:empty:before {
          content: '';
          display: inline-block;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CryptoComponent {
  protected text = '';
  protected password = '';

  protected encrypted = signal('');
  protected decrypted = signal('');

  protected async encrypt(text: string, password: string) {
    try {
      this.encrypted.set(await encrypt(text, password));
    } catch (e) {
      this.encrypted.set('ERROR');
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  protected async decrypt(dataUrl: string, password: string) {
    try {
      this.decrypted.set(await decrypt(dataUrl, password));
    } catch (e) {
      this.decrypted.set('ERROR');
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }
}
