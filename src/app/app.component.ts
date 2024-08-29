import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Route, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { routes } from './app.routes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  template: ` <aside>
      <a [routerLink]="['/']" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">‹ home</a>
      @for(item of routes; track item){ @if(item.path; as path){
      <a [routerLink]="[path]" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">{{ item.title }}</a>
      } @else {
      <span>{{ item.title }}</span>
      } }
    </aside>
    <main>
      <div class="title">{{ title.getTitle() }}</div>
      <router-outlet />
    </main>`,
  styles: [
    `
      :host {
        display: flex;
        height: inherit;
      }

      aside {
        display: flex;
        flex-direction: column;
        background: #0002;
        color: #0004;
        text-align: right;

        a {
          padding: 1rem;
          color: inherit;
          text-decoration: none;
          text-transform: uppercase;
          transition: background 0.3s;

          &.active {
            color: #000a;
            background: #0001;
          }
        }

        span {
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          text-transform: lowercase;
        }
      }

      main {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .title {
        padding: 1rem;
        background: #0001;
      }

      :host::ng-deep router-outlet + * {
        flex: 1;
        overflow: auto;
      }
    `
  ]
})
export class AppComponent {
  readonly title = inject(Title);
  readonly routes = this.flat(routes);

  private flat(routes: Route[], base = new Array<string | undefined>()): Pick<Route, 'title' | 'path'>[] {
    return routes.flatMap(({ title, path, children }) => [
      { title, path: children ? undefined : [...base, path].join('/') },
      ...this.flat(children ?? [], [...base, path])
    ]);
  }
}
