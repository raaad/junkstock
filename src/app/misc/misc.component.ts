import { Component } from '@angular/core';
import { DateComponent } from './date.component';
import { InViewComponent } from './in-view.component';

@Component({
  selector: 'app-misc',
  imports: [InViewComponent, DateComponent],
  template: `<app-date /> <app-in-view class="min-h-0" /> `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
      }
    `
  ]
})
export class MiscComponent {}
