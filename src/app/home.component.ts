import { Component, inject } from '@angular/core';
import { Route, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    @for (item of menu; track item) {
      @if (item.path) {
        <div class="card bg-base-200 w-48 shadow-sm">
          <div class="card-body">
            <a [routerLink]="[item.path]" class="link link-hover">{{ item.title }}</a>
          </div>
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        gap: 2rem;
        padding: 2rem;
        flex-wrap: wrap;
        align-items: flex-start;
      }
    `
  ]
})
export class HomeComponent {
  protected menu = flatRoutes(inject(Router).config);
}

export function flatRoutes(routes: Route[], base = new Array<string | undefined>()): Pick<Route, 'title' | 'path'>[] {
  return routes.flatMap(({ title, path, children }) => [
    ...(title ? [{ title, path: children ? undefined : [...base, path].join('/') }] : []),
    ...flatRoutes(children ?? [], [...base, path])
  ]);
}
