import { booleanAttribute, ChangeDetectionStrategy, Component, inject, InjectionToken, Signal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CONFIRM_ACTION, ConfirmAction, CustomConfirmDirective } from '@core/angular';

export interface ConfirmOptions {
  type: 'dialog' | 'popover';
  disabled?: 'true';
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

interface Dialog {
  options: ConfirmOptions;
  accept: (r?: unknown) => void;
  reject: () => void;
}

const DIALOG = new InjectionToken<Signal<Dialog | null>>('DIALOG');

export function provideConfirmAction() {
  const dialog = signal<Dialog | null>(null);

  return [
    {
      provide: DIALOG,
      useValue: dialog
    },
    {
      provide: CONFIRM_ACTION,
      useFactory: (): ConfirmAction => {
        return el =>
          new Promise<unknown>((resolve, reject) => {
            const { disabled, ...options } = getOptions(el);

            booleanAttribute(disabled) ?
              resolve('ok')
            : dialog.set({
                options: options as unknown as ConfirmOptions,
                accept: (result?: unknown) => (resolve(result), dialog.set(null)),
                reject: () => (reject(), dialog.set(null))
              });
          });
      }
    }
  ];
}

@Component({
  selector: 'app-confirm',
  imports: [FormsModule, CustomConfirmDirective],
  template: `
    <dialog #dEl (close)="dialog()?.reject()">
      @if (dialog(); as dlg) {
        @let options = $any(dEl.showModal()) || dlg.options;
        <div class="flex items-center p-4">
          <span class="truncate">Confirm title</span>
          <button (click)="dEl.close(); dlg.reject()" class="btn btn-sm btn-icon ml-auto">✖</button>
        </div>
        <div class="px-4 overflow-auto">{{ options.message ?? 'Default message?' }}</div>
        <div class="flex p-4 gap-4">
          <button (click)="dEl.close(); dlg.accept('ok')" class="btn btn-sm btn-primary min-w-[4rem] ml-auto">{{ options.accept ?? 'Ok' }}</button>
          <button (click)="dEl.close(); dlg.reject()" class="btn btn-sm min-w-[4rem] btn-reject">{{ options.reject ?? 'Cancel' }}</button>
        </div>
      }
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

      <label class="flex items-center gap-1">
        <input [(ngModel)]="disabled" [ngModelOptions]="{ standalone: true }" value="contain" type="checkbox" class="checkbox" /> disable
      </label>
      <button (click.confirmed)="confirmed($event)" [attr.confirm-disabled]="disabled" class="btn btn-sm">{{ disabled ? 'No confirm' : 'Confirm' }}</button>

      <!-- Not working without {event}.confirmed -->
      <button (click.rejected)="rejected()" class="btn btn-sm">Not working</button>
    </div>
    <div class="m-4">Result: {{ result() }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmComponent {
  protected dialog = inject(DIALOG);

  protected disabled = false;

  protected result = signal('');

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
