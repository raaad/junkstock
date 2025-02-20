import { Component, inject } from '@angular/core';
import { Route, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    @for (item of menu; track item) {
      @if (item.path) {
        <div [routerLink]="[item.path]" class="card bg-base-200 shadow-sm cursor-pointer">
          <figure>
            <img src="/icons/gears.svg" alt="Shoes" />
          </figure>
          <div class="card-body p-3 bg-base-200">
            <span class="card-title text-xl font-light">{{ item.title }}</span>
          </div>
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: 10rem;
        gap: 2rem;
        align-items: stretch;
        padding: 2rem;
      }

      img {
        object-fit: scale-down;
        transform: translate(-25%, 0%);
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
