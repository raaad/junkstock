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
          class="grid cursor-pointer rounded-xs border border-dashed border-neutral-300 bg-neutral-50">
          <figure class="col-start-1 row-start-1 row-end-3 overflow-hidden"></figure>
          <div class="col-start-1 row-start-2 flex items-end justify-end border-t border-neutral-200 backdrop-blur-md">
            <span class="title block">{{ item.title }}</span>
          </div>
        </li>
      }
    }
  `,
  styles: [
    `
      @reference "#main";

      :host {
        @apply grid auto-rows-[10rem] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4;

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
