import { Component, inject, ValueProvider } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LOGGER } from '../core/upload/logger.token';
import { getMenu } from './common/home.component';
import { ViewPageLoadingDirective } from './common/view-page-loading.direcitve';

function provideLogger(): ValueProvider {
  return {
    provide: LOGGER,
    // eslint-disable-next-line no-console
    useValue: Object.create(console, { trace: { value: console.log } })
  };
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  providers: [provideLogger()],
  template: `
    <nav class="min-w-3xs">
      <ul class="menu md:hidden">
        <li [routerLink]="['']">
          <span>Home</span>
        </li>
      </ul>
      <ul class="menu size-full hidden md:block">
        @for (item of menu; track item) {
          <li [routerLink]="[item.path]" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" [class.disabled]="item.path === undefined">
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
        position: relative;
        width: 100%;
        height: 0;

        &:before {
          content: '';
          position: absolute;
          height: 2px;
          background-color: var(--color-neutral-600);
          animation: 30s cubic-bezier(0, 1, 0, 1) 300ms width-fill;
          will-change: width;
        }
      }

      @keyframes width-fill {
        from {
          width: 0;
        }
        to {
          width: 100%;
        }
      }
    `
  ],
  hostDirectives: [ViewPageLoadingDirective]
})
export class AppComponent {
  protected menu = getMenu(inject(Router).config);
}
