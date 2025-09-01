import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getFlatMenu } from './get-flat-menu';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'ul[app-home]',
  imports: [RouterLink],
  template: `
    @for (item of menu; track item) {
      @if (item.path) {
        <li
          #el
          [routerLink]="[item.path]"
          (keydown.enter)="el.click()"
          tabindex="0"
          class="grid border border-dashed bg-neutral-50 border-neutral-300 rounded-xs cursor-pointer">
          <figure class="row-start-1 row-end-3 col-start-1 overflow-hidden"></figure>
          <div class="row-start-2 col-start-1 flex items-end justify-end backdrop-blur-md border-t border-neutral-200">
            <span class="block title">{{ item.title }}</span>
          </div>
        </li>
      }
    }
  `,
  styles: [
    `
      @reference "#main";

      :host {
        @apply grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[10rem];

        gap: 2rem;
        align-items: stretch;
        padding: 2rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  protected menu = getFlatMenu();
}
