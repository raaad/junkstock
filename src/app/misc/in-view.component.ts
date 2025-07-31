import { Component, computed, signal } from '@angular/core';
import { InViewHostDirective, InViewTargetDirective } from '@core/common';

@Component({
  selector: 'app-in-view',
  imports: [InViewHostDirective, InViewTargetDirective],
  template: `
    <ul (appInViewHost)="update($event)" class="flex flex-col gap-4 p-4 h-full overflow-auto">
      <li class="sticky top-0 bg-neutral-100 p-4 -m-4 -translate-y-4">in view: {{ inView().join(', ') }}</li>
      @for (item of items; track item) {
        @let disabled = !(item % 5);
        <li [appInViewTarget]="item" [appInViewTargetDisabled]="disabled">
          Item {{ item }}
          @if (disabled) {
            <small class="pl-1 text-neutral-400">(disabled)</small>
          }
        </li>
      }
    </ul>
  `
})
export class InViewComponent {
  protected readonly items = new Array(100).fill(0).map((_, i) => i + 1);

  private itemsInView = signal(new Array<{ data: unknown }>());

  protected inView = computed(() => this.itemsInView().map(({ data }) => data as number));

  protected update = this.itemsInView.set;
}
