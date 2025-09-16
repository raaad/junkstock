import { ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, output } from '@angular/core';

export interface DialogOptions {
  title?: string;
  message?: string;
  accept?: string;
  reject?: string;
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'dialog',
  template: `
    <div class="p-4 empty:hidden has-[+:empty]:pb-2 flex items-center">
      <ng-content select="header">
        <span class="truncate">
          <ng-content select="title">{{ options().title ?? 'Confirm title' }}</ng-content>
        </span>
        @if (dismissable()) {
          <button (click)="reject.emit()" class="ml-auto btn btn-sm btn-icon" title="Close">✖</button>
        }
      </ng-content>
    </div>
    <div class="px-4 overflow-auto empty:hidden [:empty+&]:mt-4 has-[+:empty]:mb-4">
      <ng-content>{{ options().message ?? 'Default message?' }}</ng-content>
    </div>
    <div class="p-4 mt-auto empty:hidden [:empty+&]:pt-2 flex gap-4 wrap-anywhere">
      <ng-content select="footer">
        <ng-content select="footer-extra" />
        <button (click)="accept.emit()" class="ml-auto btn btn-sm btn-primary min-w-[4rem]">{{ options().accept ?? 'Ok' }}</button>
        <button (click)="reject.emit()" class="btn btn-sm btn-reject min-w-[4rem]">{{ options().reject ?? 'Cancel' }}</button>
      </ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.closedby]': 'dismissable() ? "any": "none"',
    '(close)': 'reject.emit()'
  }
})
export class DialogComponent {
  private readonly dialog = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;

  readonly show = input.required<boolean>();

  readonly dismissable = input(true);

  readonly options = input({}, { transform: (o: DialogOptions | undefined | null) => o ?? {} });

  readonly accept = output();

  readonly reject = output();

  constructor() {
    effect(() => (this.show() ? this.dialog.showModal() : this.dialog.close()));
  }
}
