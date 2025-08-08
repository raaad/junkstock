import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Route, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    @for (item of menu; track item) {
      @if (item.path) {
        <div
          [routerLink]="[item.path]"
          #el
          (keydown.enter)="el.click()"
          tabindex="0"
          class="grid border border-dashed bg-neutral-50 border-neutral-300 rounded-xs cursor-pointer">
          <figure class="row-start-1 row-end-3 col-start-1 overflow-hidden"></figure>
          <div class="row-start-2 col-start-1 flex items-end justify-end backdrop-blur-md border-t border-neutral-200">
            <span class="block title">{{ item.title }}</span>
          </div>
        </div>
      }
    }
  `,
  styles: [
    `
      @reference "../../styles.css";

      :host {
        @apply grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-[10rem];

        gap: 2rem;
        align-items: stretch;
        padding: 2rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  protected menu = getMenu(inject(Router).config);
}

export function getMenu(routes: Route[], base = new Array<string | undefined>()): { title: string; path?: string; indent: number }[] {
  return routes.flatMap(({ title, path, children }) => [
    ...(typeof title === 'string' && path ? [{ title, path: children ? undefined : [...base, path].join('/'), indent: base.length }] : []),
    ...getMenu(children ?? [], [...base, path])
  ]);
}
