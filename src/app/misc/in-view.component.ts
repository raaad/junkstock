import { Component, signal } from '@angular/core';
import { InViewHostDirective, InViewTargetDirective } from '@core/angular';

@Component({
  selector: 'app-in-view',
  imports: [InViewHostDirective, InViewTargetDirective],
  template: `
    <div class="bg-gray-100 p-4">in view: {{ inView().join(', ') }}</div>
    <ul (useInView)="update($event)" class="flex flex-col gap-4 overflow-auto px-4">
      @for (item of items; track item) {
        @let disabled = !(item % 5);
        <li [useInViewTarget]="item" [inViewDisabled]="disabled">
          Item {{ item }}
          @if (disabled) {
            <small class="pl-1 text-neutral-400">(disabled)</small>
          }
        </li>
      }
    </ul>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
    `
  ]
})
export class InViewComponent {
  protected readonly items = Array.from({ length: 100 }, (_, i) => i + 1);

  protected inView = signal(new Array<number>());

  protected update(items: { data: unknown }[]) {
    this.inView.set(items.map(({ data }) => data as number));
  }
}
