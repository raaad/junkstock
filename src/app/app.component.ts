import { Component, inject, ValueProvider } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LOGGER } from '../core/upload/uploader';
import { getMenu } from './common/home.component';

function provideLogger(): ValueProvider {
  // eslint-disable-next-line no-console
  return { provide: LOGGER, useValue: { trace: console.log, debug: console.log, error: console.error, warn: console.warn } };
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
        border-right: thin dashed var(--color-neutral-200);
      }
    `
  ]
})
export class AppComponent {
  protected menu = getMenu(inject(Router).config);
}
