import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LOGGER } from '../core/upload/uploader';
import { flatRoutes } from './common/home.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  // eslint-disable-next-line no-console
  providers: [{ provide: LOGGER, useValue: { trace: console.log, debug: console.log, error: console.error, warn: console.warn } }],
  template: `
    <aside class="min-w-3xs">
      <ul class="menu [&_li>*]:rounded-none p-0 size-full bg-base-200">
        @for (item of menu; track item; let i = $index) {
          <li [class.menu-disabled]="item.path === undefined" class="[&:not(:first-child)]:hidden md:[&:not(:first-child)]:flex">
            @if (item.path !== undefined) {
              <a [routerLink]="[item.path]" routerLinkActive="menu-active" [routerLinkActiveOptions]="{ exact: true }">{{ item.title }}</a>
            } @else {
              <span>{{ item.title }}</span>
            }
          </li>
        }
      </ul>
    </aside>
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
    `
  ]
})
export class AppComponent {
  protected menu = flatRoutes(inject(Router).config);
}
