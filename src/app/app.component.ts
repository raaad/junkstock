import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { flatRoutes } from './home.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <aside>
      <ul class="menu bg-base-200 [&_li>*]:rounded-none p-0 h-full">
        @for(item of menu; track item){ @if(item.path !== undefined){
        <li>
          <a [routerLink]="[item.path]" routerLinkActive="menu-active" [routerLinkActiveOptions]="{ exact: true }">{{ item.title }}</a>
        </li>
        } @else {
        <li class="menu-disabled">
          <span>{{ item.title }}</span>
        </li>
        } }
      </ul>
    </aside>
    <router-outlet />
  `,
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
