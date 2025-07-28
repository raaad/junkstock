import { Component } from '@angular/core';
import { InViewComponent } from './in-view.component';

@Component({
  selector: 'app-misc',
  imports: [InViewComponent],
  template: ` <app-in-view /> `
})
export class MiscComponent {}
