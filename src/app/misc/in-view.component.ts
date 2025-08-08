import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { InViewHostDirective, InViewTargetDirective } from '@core/angular';

@Component({
  selector: 'app-in-view',
  imports: [InViewHostDirective, InViewTargetDirective],
  template: `
    <div class="p-4">in view: {{ inView().join(', ') }}</div>
    <ul (inView)="update($event)" class="flex flex-col gap-4 px-4 overflow-auto">
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
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InViewComponent {
  protected readonly items = new Array(100).fill(0).map((_, i) => i + 1);

  private itemsInView = signal(new Array<{ data: unknown }>());

  protected inView = computed(() => this.itemsInView().map(({ data }) => data as number));

  protected update = this.itemsInView.set;
}
