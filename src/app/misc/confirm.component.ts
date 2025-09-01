import { booleanAttribute, ChangeDetectionStrategy, Component, inject, InjectionToken, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CONFIRM_ACTION, ConfirmAction, CustomConfirmDirective } from '@core/angular';
import { DialogComponent, DialogOptions, DialogRequest } from './dialog.component';

export interface ConfirmOptions {
  type: 'dialog' | 'popover';
  // disabled?: 'true';
  dismissible?: 'false';
  title?: string;
  message?: string;
  accept?: string;
  reject?: string;
}

function getOptions(element: Element, attrPrefix = 'confirm-') {
  return Object.fromEntries(
    Array.from(element.attributes ?? [])
      .filter(({ name, value }) => name.startsWith(attrPrefix) && value)
      .map(({ name, value }) => [name.substring(attrPrefix.length), value])
  );
}

const DIALOG_REQUEST = new InjectionToken<Signal<DialogRequest | null>>('DIALOG_REQUEST');

export function provideConfirmAction() {
  const request = signal<DialogRequest | null>(null);

  return [
    {
      provide: DIALOG_REQUEST,
      useValue: request
    },
    {
      provide: CONFIRM_ACTION,
      useFactory: (): ConfirmAction<unknown> => {
        return el =>
          new Promise<unknown>((resolve, reject) => {
            const { disabled, dismissable, ...options } = getOptions(el);

            booleanAttribute(disabled) ?
              resolve('ok')
            : request.set({
                options: {
                  ...(options as Omit<DialogOptions, 'dismissable'>),
                  dismissable: booleanAttribute(dismissable || true)
                } as DialogOptions,
                accept: (result?: unknown) => (resolve(result), request.set(null)),
                reject: () => (reject(), request.set(null))
              });
          });
      }
    }
  ];
}

@Component({
  selector: 'app-confirm',
  imports: [FormsModule, CustomConfirmDirective, DialogComponent],
  template: `
    <!-- <dialog #dEl (close)="dialog()?.reject()" (click)="$event.target === $event.currentTarget && dEl.close()">
      @if (dialog(); as dlg) {
        @let options = $any(dEl.showModal()) || dlg.options;
        <div class="flex items-center p-4">
          <span class="truncate">Confirm title</span>
          <button (click)="dEl.close()" class="btn btn-sm btn-icon ml-auto">✖</button>
        </div>
        <div class="px-4 overflow-auto">{{ options.message ?? 'Default message?' }}</div>
        <div class="flex p-4 gap-4">
          <button (click)="dEl.close(); dlg.accept('ok')" class="btn btn-sm btn-primary min-w-[4rem] ml-auto">{{ options.accept ?? 'Ok' }}</button>
          <button (click)="dEl.close()" class="btn btn-sm min-w-[4rem] btn-reject">{{ options.reject ?? 'Cancel' }}</button>
        </div>
      }
    </dialog> -->
    <dialog [request]="dialog()" [class]="classes">
      Default message?Default message?Default message?Default message?Default message?Default message?Default message?Default message?
      <div class="flex">
        <div class="m-auto inline-grid grid-cols-5  grid-rows-5 gap-4">
          <button (click)="classes = 'edge top'" [disabled]="classes === 'edge top'" class="btn btn-sm col-start-2 col-span-3">↟</button>
          <button (click)="classes = 'edge left'" [disabled]="classes === 'edge left'" class="btn btn-sm row-start-2 row-span-3">↞</button>
          <button (click)="classes = 'edge right'" [disabled]="classes === 'edge right'" class="btn btn-sm row-start-2 row-span-3">↠</button>
          <button (click)="classes = 'edge bottom'" [disabled]="classes === 'edge bottom'" class="btn btn-sm col-start-2 col-span-3">↡</button>
          <button (click)="classes = 'top left'" [disabled]="classes === 'top left'" class="btn btn-sm row-start-2 col-start-2">⇖</button>
          <button (click)="classes = 'top'" [disabled]="classes === 'top'" class="btn btn-sm row-start-2 col-start-3">⇑</button>
          <button (click)="classes = 'top right'" [disabled]="classes === 'top right'" class="btn btn-sm row-start-2 col-start-4">⇗</button>
          <button (click)="classes = 'left'" [disabled]="classes === 'left'" class="btn btn-sm row-start-3 col-start-2">⇐</button>
          <button (click)="classes = ''" [disabled]="classes === ''" class="btn btn-sm row-start-3 col-start-3">x</button>
          <button (click)="classes = 'right'" [disabled]="classes === 'right'" class="btn btn-sm row-start-3 col-start-4">⇒</button>
          <button (click)="classes = 'bottom left'" [disabled]="classes === 'bottom left'" class="btn btn-sm row-start-4 col-start-2">⇙</button>
          <button (click)="classes = 'bottom'" [disabled]="classes === 'bottom'" class="btn btn-sm row-start-4 col-start-3">⇓</button>
          <button (click)="classes = 'bottom right'" [disabled]="classes === 'bottom right'" class="btn btn-sm row-start-4 col-start-4">⇘</button>
        </div>
      </div>

      <!-- <ng-container ngProjectAs="header" /> -->
      <!-- <ng-container ngProjectAs="footer">
        <div class="-m-4 flex flex-1">
         
        </div>
      </ng-container> -->
      <!-- <ng-container ngProjectAs="footer-extra"><span>sfsfsd</span></ng-container> -->
    </dialog>

    <div class="title">Confirm Action</div>
    <div (mousedown)="reset()" class="flex flex-wrap gap-4 m-4">
      <button (click.confirmed)="confirmed($event)" class="btn btn-sm">Action</button>
      <button (dblclick.confirmed)="confirmed($event)" class="btn btn-sm">Double click</button>
      <button (click.confirmed)="confirmed($event)" confirm-message="Custom message?" confirm-accept="Do it" confirm-reject="Don't do it" class="btn btn-sm">
        Custom message
      </button>
      <button (click.confirmed)="confirmed($event)" [appCustomConfirm]="custom" class="btn btn-sm">Custom confirm</button>
      <button (click.confirmed)="confirmed($event)" (click.rejected)="rejected()" class="btn btn-sm">With rejected</button>

      <label class="flex items-center gap-1"> <input [(ngModel)]="disabled" [ngModelOptions]="{ standalone: true }" type="checkbox" /> disable </label>
      <button (click.confirmed)="confirmed($event)" [attr.confirm-disabled]="disabled" class="btn btn-sm">{{ disabled ? 'No confirm' : 'Confirm' }}</button>

      <!-- Not working without {event}.confirmed -->
      <button (click.rejected)="rejected()" class="btn btn-sm">Not working</button>
    </div>

    <div class="m-4">Result: {{ result() }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmComponent {
  protected dialog = inject(DIALOG_REQUEST);

  protected disabled = false;

  protected result = signal('');

  protected classes = '';

  confirmed(result?: unknown) {
    this.result.set(`confirmed: ${result}`);
  }

  rejected() {
    this.result.set('rejected');
  }

  protected reset() {
    this.result.set('');
  }

  protected custom() {
    return confirm('Custom confirm?') ? Promise.resolve() : Promise.reject();
  }
}
