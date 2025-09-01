import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AniIndexComponent } from './ani-index.component';
import { ConfirmComponent } from './confirm.component';
import { InViewComponent } from './in-view.component';

@Component({
  selector: 'app-misc',
  imports: [ConfirmComponent, InViewComponent, AniIndexComponent],
  template: `
    <app-confirm />
    <app-ani-index />
    <app-in-view />
  `,
  styles: [
    `
      @reference "#main";

      :host {
        display: flex;
        flex-direction: column;

        @apply separator;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiscComponent {}
