import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { getMenu } from './common/home.component';
import { ViewPageLoadingDirective } from './common/view-page-loading.direcitve';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="min-w-3xs">
      <ul class="menu md:hidden">
        <li [routerLink]="['']">
          <span>Home</span>
        </li>
      </ul>
      <ul class="menu size-full hidden md:block">
        @for (item of menu; track item) {
          <li
            [routerLink]="[item.path]"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            [class.disabled]="item.path === undefined"
            [style.--indent]="item.indent"
            #el
            (keydown.enter)="el.click()"
            [attr.tabindex]="item.path ? 0 : -1">
            <span>{{ item.title }}</span>
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
      @reference "../styles/utils.css";

      :host {
        display: flex;
        height: inherit;
      }

      :host::ng-deep router-outlet + * {
        flex: 1;
        overflow: auto;
      }

      nav {
        view-transition-name: nav;

        border-right: thin dashed var(--color-neutral-200);
      }

      /* view-transition */

      router-outlet::ng-deep + * {
        view-transition-name: page;
      }

      /* view-loading */

      :host.view-loading > router-outlet {
        @apply progress-bar progress-unknown;
        width: 100%;
        height: 0;
      }
    `
  ],
  hostDirectives: [ViewPageLoadingDirective]
})
export class AppComponent {
  protected menu = getMenu(inject(Router).config);
}
