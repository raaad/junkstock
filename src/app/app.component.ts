import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { getFlatMenu } from './common/get-flat-menu';
import { ViewLoadingDirective } from './common/view-loading.direcitve';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="min-w-3xs">
      <ul>
        <li>
          <a [routerLink]="['']">Home</a>
        </li>
        @for (item of menu; track item) {
          <li [style.--indent]="item.indent">
            @if (item.path !== undefined) {
              <a [routerLink]="[item.path]" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ item.title }}</a>
            } @else {
              <span>{{ item.title }}</span>
            }
          </li>
        }
      </ul>
    </nav>
    <router-outlet />
  `,
  host: {
    class: 'flex-col md:flex-row'
  },
  styles: [
    `
      @reference "#main";

      :host {
        display: flex;
        height: inherit;
      }

      router-outlet::ng-deep + * {
        view-transition-name: page;

        flex: 1;
        overflow: auto;
      }

      /* view-loading */

      :host.view-loading > router-outlet {
        @apply progress-bar progress-unknown;
        width: 100%;
        height: 0;
      }
    `
  ],
  hostDirectives: [ViewLoadingDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  protected menu = getFlatMenu();
}
