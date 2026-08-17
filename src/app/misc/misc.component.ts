import { Component } from '@angular/core';
import { AniIndexComponent } from './ani-index.component';
import { ConfirmComponent } from './confirm.component';
import { InViewComponent } from './in-view.component';
import { InfScrollComponent } from './inf-scroll.component';

@Component({
  imports: [ConfirmComponent, InViewComponent, AniIndexComponent, InfScrollComponent],
  template: `
    <app-confirm />
    <app-ani-index class="max-h-[30vh] min-h-[20vh] overflow-auto" />
    <div class="flex flex-1">
      <div class="flex flex-1 flex-wrap gap-4 pt-4">
        <app-in-view class="max-h-[30vh] min-w-[20rem] flex-1 overflow-auto" />
        <app-inf-scroll class="max-h-[30vh] flex-1 overflow-auto" />
      </div>
    </div>
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
  ]
})
export class MiscComponent {}
