import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatISODate } from '@core/utils';

@Component({
  selector: 'app-date',
  template: `
    <div class="title">Date</div>
    @for (item of items; track item) {
      <div class="flex items-center gap-4 m-4">
        <span class="flex-1 capitalize">{{ item.kind }}:</span>
        <span class="flex-2 note border-1" [class.!text-neutral-200]="item.now()">{{ item.input() }}</span>
        <button (click)="item.now.set(!item.now())" class="btn btn-sm">Now</button>
        <span class="flex-2 note border-1">{{ item.date() }}</span>
        <span class="flex-2 note border-1">{{ item.formatted() }}</span>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DateComponent {
  private now = new Date();

  protected items = Object.entries({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    UTC: '2025-06-01T09:00:00.000Z',
    offset: '2025-06-01T08:00:00.000-01:00',
    local: '2025-06-01T12:00:00.000'
  }).map(([k, value]) => {
    const kind = k as 'UTC' | 'offset' | 'local';
    const input = signal(value);
    const now = signal(false);
    const date = computed(() => (now() ? this.now : new Date(input())));
    const formatted = computed(() => formatISODate(date(), kind));
    return { input, now, date, formatted, kind };
  });
}
