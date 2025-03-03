import { Component, inject } from '@angular/core';
import { Route, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    @for (item of menu; track item) {
      @if (item.path) {
        <div [routerLink]="[item.path]" class="grid border border-dashed bg-neutral-50 border-neutral-300 rounded-xs cursor-pointer">
          <figure class="row-start-1 row-end-3 col-start-1 overflow-hidden">
            <img src="/icons/gears.svg" alt class="object-scale-down size-full" />
          </figure>
          <div class="row-start-2 col-start-1 backdrop-blur-md border-t border-neutral-200">
            <span class="block title">{{ item.title }}</span>
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
    `
  ]
})
export class HomeComponent {
  protected menu = getMenu(inject(Router).config);
}

export function getMenu(routes: Route[], base = new Array<string | undefined>()): Pick<Route, 'title' | 'path'>[] {
  return routes.flatMap(({ title, path, children }) => [
    ...(title && path ? [{ title, path: children ? undefined : [...base, path].join('/') }] : []),
    ...getMenu(children ?? [], [...base, path])
  ]);
}
