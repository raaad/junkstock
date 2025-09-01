import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input } from '@angular/core';

export interface DialogOptions {
  dismissable?: boolean;
  title?: string;
  message?: string;
  accept?: string;
  reject?: string;
}

export interface DialogRequest<R = void> {
  options?: DialogOptions;
  accept: (r: R) => void;
  reject: () => void;
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'dialog[request]',
  template: `
    @if (options(); as options) {
      <div class="p-4 flex items-center">
        <ng-content select="header">
          <span class="truncate">
            <ng-content select="title">{{ options.title ?? 'Confirm title' }}</ng-content>
          </span>
          @if (options.dismissable) {
            <button (click)="reject()" class="ml-auto btn btn-sm btn-icon">✖</button>
          }
        </ng-content>
      </div>
      <div class="px-4 overflow-auto">
        <ng-content>{{ options.message ?? 'Default message?' }}</ng-content>
      </div>
      <div class="p-4 mt-auto flex gap-4">
        <ng-content select="footer">
          <ng-content select="footer-extra" />
          <button (click)="accept()" class="ml-auto btn btn-sm btn-primary min-w-[4rem]">{{ options.accept ?? 'Ok' }}</button>
          <button (click)="reject()" class="btn btn-sm btn-reject min-w-[4rem]">{{ options.reject ?? 'Cancel' }}</button>
        </ng-content>
      </div>
    }
  `,
  styles: [
    `
      /*:host > div > :first-child,
      :host > div > :last-child {
        padding: var(--gap);
      }

      :host > div > :nth-child(2) {
        padding-left: var(--gap);
        padding-right: var(--gap);
      }*/

      /* :host > :first-child:empty + :not(:empty) {
        margin-top: var(--gap);
      } */

      /* :host > :nth-child(2) :host > :empty {
        display: none;
      } */

      /* footer-extra */

      /* :host > div > :last-child > :nth-last-child(n + 3) {
        overflow-wrap: break-word;
        min-width: 0;
      } */
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(close)': 'reject()',
    '(click)': '(isBackdrop($event) && options()?.dismissable && reject()) || true',
    '(keydown.esc)': 'options()?.dismissable || $event.preventDefault()'
  }
})
export class DialogComponent {
  protected readonly el = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;

  readonly request = input.required<DialogRequest | null>();

  protected options = computed(() => (this.request() ? { ...this.request()?.options } : null));

  constructor() {
    effect(() => (this.request() ? this.el.showModal() : this.el.close()));
  }

  protected accept() {
    this.request()?.accept();
  }

  protected reject() {
    this.request()?.reject();
  }

  protected isBackdrop({ target, currentTarget: host, clientX: x, clientY: y }: MouseEvent) {
    return target === host && host instanceof HTMLElement && out(host);

    function out(e: HTMLElement) {
      const { left, right, top, bottom } = e.getBoundingClientRect();
      return !(left <= x && x <= right && top <= y && y <= bottom);
    }
  }
}
