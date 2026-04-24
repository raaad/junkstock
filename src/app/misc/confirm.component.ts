import { booleanAttribute, ChangeDetectionStrategy, Component, inject, InjectionToken, input, model, Signal, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, FormValueControl } from '@angular/forms/signals';
import { CONFIRM_ACTION, ConfirmAction, CustomConfirmDirective } from '@core/angular';
import { catchError, concatMap, from, map, merge, of, Subject } from 'rxjs';
import { DialogComponent, DialogOptions } from './dialog.component';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[toggleValue]',
  template: `<ng-content />`,
  host: {
    '(click)': 'toggle()',
    class: 'btn btn-icon',
    '[class.btn-focus]': 'value() === toggleValue()'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToggleValueButton implements FormValueControl<string> {
  readonly value = model.required<string>();
  readonly toggleValue = input.required<string>();

  protected toggle() {
    this.value.update(v => (this.toggleValue() === v ? '' : this.toggleValue()));
  }
}

@Component({
  selector: 'app-confirm',
  imports: [FormField, CustomConfirmDirective, DialogComponent, ToggleValueButton],
  template: `
    <dialog
      [show]="!!dialog()"
      (accept)="dialog()?.accept()"
      (reject)="dialog()?.reject()"
      [options]="dialog()?.options"
      [dismissable]="options.dismissable().value()"
      [class]="style().value()">
      @if (options.showBody().value()) {
        @if (options.showLayouts().value()) {
          <div class="mb-4 flex">
            <div class="m-auto inline-grid grid-cols-5 grid-rows-5 gap-2">
              <button [formField]="style" toggleValue="edge top" class="col-span-3 col-start-2 aspect-auto!">
                <span class="inline-block rotate-90">❮</span>
              </button>
              <button [formField]="style" toggleValue="edge left" class="row-span-3 row-start-2 aspect-auto!">❮</button>
              <button [formField]="style" toggleValue="edge right" class="row-span-3 row-start-2 aspect-auto!">❯</button>
              <button [formField]="style" toggleValue="edge bottom" class="col-span-3 col-start-2 aspect-auto!">
                <span class="inline-block -rotate-90">❮</span>
              </button>
              <button [formField]="style" toggleValue="top left" class="col-start-2 row-start-2 aspect-auto!">
                <span class="inline-block rotate-45">❮</span>
              </button>
              <button [formField]="style" toggleValue="top" class="col-start-3 row-start-2">
                <span class="inline-block rotate-90">❮</span>
              </button>
              <button [formField]="style" toggleValue="top right" class="col-start-4 row-start-2">
                <span class="inline-block -rotate-45">❯</span>
              </button>
              <button [formField]="style" toggleValue="left" class="col-start-2 row-start-3">❮</button>
              <button [formField]="style" toggleValue class="col-start-3 row-start-3">✕</button>
              <button [formField]="style" toggleValue="right" class="col-start-4 row-start-3">❯</button>
              <button [formField]="style" toggleValue="bottom left" class="col-start-2 row-start-4">
                <span class="inline-block -rotate-45">❮</span>
              </button>
              <button [formField]="style" toggleValue="bottom" class="col-start-3 row-start-4">
                <span class="inline-block -rotate-90">❮</span>
              </button>
              <button [formField]="style" toggleValue="bottom right" class="col-start-4 row-start-4">
                <span class="inline-block rotate-45">❯</span>
              </button>
            </div>
          </div>
        }

        <div class="flex max-w-sm flex-wrap gap-4">
          <label class="flex items-center gap-1">
            <input [formField]="options.dismissable" type="checkbox" />
            dismissable
          </label>
          <label class="flex items-center gap-1">
            <input [formField]="options.showLayouts" type="checkbox" />
            show layouts
          </label>
          <label class="flex items-center gap-1">
            <input [formField]="options.showBody" type="checkbox" />
            show body
          </label>
          <label class="flex items-center gap-1">
            <input [formField]="options.largeBody" type="checkbox" />
            large body
          </label>
          <label class="flex items-center gap-1">
            <input [formField]="options.footerExtra" type="checkbox" />
            show extra footer
          </label>
        </div>

        @if (options.largeBody().value()) {
          <div class="mt-4 flex gap-4">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <span class="m-1 inline-block h-8 w-32 bg-neutral-200"></span>
            }
          </div>
        }
      }

      <!-- <ng-container ngProjectAs="header" /> --><!--no header-->
      <!-- <div ngProjectAs="header" class="-m-4 flex-1 content-center self-stretch px-1 bg-neutral-200">Custom header</div> -->
      <!-- <ng-container ngProjectAs="title"><b class="uppercase">Custom title</b></ng-container> -->

      <!-- <ng-container ngProjectAs="footer" /> --><!--no footer-->
      <!-- <div ngProjectAs="footer" class="-m-4 flex-1 content-center px-1 bg-neutral-200">Custom footer</div> -->
      <ng-container ngProjectAs="footer-extra">
        @if (options.footerExtra().value()) {
          Extra footer
          <button (click)="dialog()?.accept('YES')" class="btn btn-primary ml-1 min-w-16">Accept with: YES</button>
          <button (click)="dialog()?.reject('NO')" class="btn btn-reject min-w-16">Reject with: NO</button>
        }
      </ng-container>
    </dialog>

    <div class="title">Confirm Action</div>
    <div (mousedown)="reset()" class="m-4 flex flex-wrap gap-4">
      <button (click.confirmed)="confirmed($event)" class="btn">Action</button>
      <button (dblclick.confirmed)="confirmed($event)" class="btn">Double click</button>
      <button (click.confirmed)="confirmed($event)" confirm-message="Custom message?" confirm-accept="Do it" confirm-reject="Don't do it" class="btn">
        Custom message
      </button>
      <button (click.confirmed)="confirmed($event)" [appCustomConfirm]="custom" class="btn">Custom confirm</button>
      <button (click.confirmed)="confirmed($event)" (click.rejected)="rejected($event)" class="btn">With rejected</button>

      <label class="flex items-center gap-1">
        <input [formField]="disabled" type="checkbox" />
        disable
      </label>
      <button (click.confirmed)="confirmed($event)" [attr.confirm-disabled]="disabled().value()" class="btn">
        {{ disabled().value() ? 'Without confirm' : 'Confirm' }}
      </button>

      <!-- Not working without {event}.confirmed -->
      <button (click.rejected)="rejected($event)" class="btn">Not working</button>
    </div>

    <div class="m-4">Result: {{ result() ?? '' }}</div>
  `,
  styles: [
    `
      :host {
        interpolate-size: allow-keywords;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmComponent {
  protected dialog = inject(DIALOG_REQUEST);

  protected result = signal<unknown>(undefined);
  protected disabled = form(signal(false));

  protected style = form(signal('edge top'));

  protected options = form(
    signal({
      dismissable: true,
      showLayouts: true,
      showBody: true,
      largeBody: false,
      footerExtra: false
    })
  );

  confirmed(result?: unknown) {
    this.result.set(result ?? 'confirmed');
  }

  rejected(reject?: unknown) {
    this.result.set(reject ?? 'rejected');
  }

  protected reset() {
    this.result.set(undefined);

    this.options.showBody().value.set(true);
  }

  protected readonly custom = () => (confirm('Custom confirm?') ? Promise.resolve() : Promise.reject());
}

// #region CONFIRM_ACTION / DIALOG_REQUEST

interface DialogRequest {
  options?: DialogOptions; // TODO: exclusive? abort others?
  accept: (r?: unknown) => void;
  reject: (rj?: unknown) => void;
}

const DIALOG_REQUEST = new InjectionToken<Signal<DialogRequest | null>>('DIALOG_REQUEST');

export function provideConfirmAction() {
  const queue = new Subject<DialogRequest & { promise: Promise<unknown> }>();

  return [
    {
      provide: DIALOG_REQUEST,
      useFactory: () =>
        toSignal(
          queue.pipe(
            concatMap(({ promise, ...request }) =>
              merge(
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                of(request as DialogRequest),
                from(promise).pipe(
                  catchError(e => of(e)),
                  map(() => null)
                )
              )
            ),
            takeUntilDestroyed()
          ),
          { initialValue: null }
        )
    },
    {
      provide: CONFIRM_ACTION,
      useFactory: (): ConfirmAction<unknown> => el => {
        const { promise, resolve: accept, reject } = Promise.withResolvers<unknown>();

        const { disabled, ...options } = getOptions(el);

        booleanAttribute(disabled) ? accept(void 0) : queue.next({ promise, accept, reject, options });

        return promise;
      }
    }
  ];
}

function getOptions(element: Element | undefined, attrPrefix = 'confirm-') {
  return Object.fromEntries(
    Array.from(element?.attributes ?? [])
      .filter(({ name, value }) => name.startsWith(attrPrefix) && value)
      .map(({ name, value }) => [name.substring(attrPrefix.length), value])
  );
}

// #endregion
