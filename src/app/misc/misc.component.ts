import { Component } from '@angular/core';
import { ConfirmComponent } from './confirm.component';
import { InViewComponent } from './in-view.component';

@Component({
  selector: 'app-misc',
  imports: [ConfirmComponent, InViewComponent],
  template: `
    <app-confirm />
    <app-in-view />
  `,
  styles: [
    `
      @reference "../../styles.css";

      :host {
        display: flex;
        flex-direction: column;

        @apply separator;
      }
    `
  ]
})
export class MiscComponent {}
