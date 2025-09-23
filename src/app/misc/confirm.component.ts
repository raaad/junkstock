import { booleanAttribute, ChangeDetectionStrategy, Component, inject, InjectionToken, Signal, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CONFIRM_ACTION, ConfirmAction, CustomConfirmDirective } from '@core/angular';
import { catchError, concatMap, from, map, merge, of, Subject } from 'rxjs';
import { DialogComponent, DialogOptions } from './dialog.component';

@Component({
  selector: 'app-confirm',
  imports: [FormsModule, CustomConfirmDirective, DialogComponent],
  template: `
    <dialog
      [show]="!!dialog()"
      (accept)="dialog()?.accept()"
      (reject)="dialog()?.reject()"
      [options]="dialog()?.options"
      [dismissable]="dismissable()"
      [class]="style()">
      @if (showBody()) {
        @if (showLayouts()) {
          <div class="mb-4 flex">
            <div class="m-auto inline-grid grid-cols-5 grid-rows-5 gap-2">
              <button (click)="style.set('edge top')" class="btn btn-icon !aspect-auto col-start-2 col-span-3">
                <span class="inline-block rotate-90">❮</span>
              </button>
              <button (click)="style.set('edge left')" class="btn btn-icon !aspect-auto row-start-2 row-span-3">❮</button>
              <button (click)="style.set('edge right')" class="btn btn-icon !aspect-auto row-start-2 row-span-3">❯</button>
              <button (click)="style.set('edge bottom')" class="btn btn-icon !aspect-auto col-start-2 col-span-3">
                <span class="inline-block -rotate-90">❮</span>
              </button>
              <button (click)="style.set('top left')" class="btn btn-icon !aspect-auto row-start-2 col-start-2">
                <span class="inline-block rotate-45">❮</span>
              </button>
              <button (click)="style.set('top')" class="btn btn-icon row-start-2 col-start-3"><span class="inline-block rotate-90">❮</span></button>
              <button (click)="style.set('top right')" class="btn btn-icon row-start-2 col-start-4">
                <span class="inline-block -rotate-45">❯</span>
              </button>
              <button (click)="style.set('left')" class="btn btn-icon row-start-3 col-start-2">❮</button>
              <button (click)="style.set('')" class="btn btn-icon row-start-3 col-start-3">✕</button>
              <button (click)="style.set('right')" class="btn btn-icon row-start-3 col-start-4">❯</button>
              <button (click)="style.set('bottom left')" class="btn btn-icon row-start-4 col-start-2">
                <span class="inline-block -rotate-45">❮</span>
              </button>
              <button (click)="style.set('bottom')" class="btn btn-icon row-start-4 col-start-3">
                <span class="inline-block -rotate-90">❮</span>
              </button>
              <button (click)="style.set('bottom right')" class="btn btn-icon row-start-4 col-start-4">
                <span class="inline-block rotate-45">❯</span>
              </button>
            </div>
          </div>
        }

        <div class="flex gap-4 flex-wrap max-w-sm">
          <label class="flex items-center gap-1">
            <input [ngModel]="dismissable()" (ngModelChange)="dismissable.set(!dismissable())" [ngModelOptions]="{ standalone: true }" type="checkbox" />
            dismissable
          </label>
          <label class="flex items-center gap-1">
            <input [ngModel]="showLayouts()" (ngModelChange)="showLayouts.set(!showLayouts())" [ngModelOptions]="{ standalone: true }" type="checkbox" />
            show layouts
          </label>
          <label class="flex items-center gap-1">
            <input [ngModel]="showBody()" (ngModelChange)="showBody.set(!showBody())" [ngModelOptions]="{ standalone: true }" type="checkbox" />
            show body
          </label>
          <label class="flex items-center gap-1">
            <input [ngModel]="largeBody()" (ngModelChange)="largeBody.set(!largeBody())" [ngModelOptions]="{ standalone: true }" type="checkbox" />
            large body
          </label>
          <label class="flex items-center gap-1">
            <input [ngModel]="footerExtra()" (ngModelChange)="footerExtra.set(!footerExtra())" [ngModelOptions]="{ standalone: true }" type="checkbox" />
            show extra footer
          </label>
        </div>

        @if (largeBody()) {
          <div class="mt-4 flex gap-4">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <span class="inline-block w-32 h-8 bg-neutral-200 m-1"></span>
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
        @if (footerExtra()) {
          Extra footer
        }
      </ng-container>
    </dialog>

    <div class="title">Confirm Action</div>
    <div (mousedown)="reset()" class="flex flex-wrap gap-4 m-4">
      <button (click.confirmed)="confirmed($event)" class="btn">Action</button>
      <button (dblclick.confirmed)="confirmed($event)" class="btn">Double click</button>
      <button (click.confirmed)="confirmed($event)" confirm-message="Custom message?" confirm-accept="Do it" confirm-reject="Don't do it" class="btn">
        Custom message
      </button>
      <button (click.confirmed)="confirmed($event)" [appCustomConfirm]="custom" class="btn">Custom confirm</button>
      <button (click.confirmed)="confirmed($event)" (click.rejected)="rejected()" class="btn">With rejected</button>

      <label class="flex items-center gap-1">
        <input [ngModel]="disabled()" (ngModelChange)="disabled.set(!disabled())" [ngModelOptions]="{ standalone: true }" type="checkbox" /> disable
      </label>
      <button (click.confirmed)="confirmed($event)" [attr.confirm-disabled]="disabled()" class="btn">{{ disabled() ? 'No confirm' : 'Confirm' }}</button>

      <!-- Not working without {event}.confirmed -->
      <button (click.rejected)="rejected()" class="btn">Not working</button>
    </div>

    <div class="m-4">Result: {{ result() }}</div>
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

  protected result = signal('');
  protected disabled = signal(false);

  protected style = signal('edge top');

  protected dismissable = signal(true);
  protected showLayouts = signal(true);
  protected showBody = signal(true);
  protected largeBody = signal(false);
  protected footerExtra = signal(false);

  confirmed(result?: unknown) {
    this.result.set(`confirmed: ${result}`);
  }

  rejected() {
    this.result.set('rejected');
  }

  protected reset() {
    this.result.set('');

    this.showBody.set(true);
  }

  protected readonly custom = () => (confirm('Custom confirm?') ? Promise.resolve() : Promise.reject());
}

function getOptions(element: Element | undefined, attrPrefix = 'confirm-') {
  return Object.fromEntries(
    Array.from(element?.attributes ?? [])
      .filter(({ name, value }) => name.startsWith(attrPrefix) && value)
      .map(({ name, value }) => [name.substring(attrPrefix.length), value])
  );
}

// #region CONFIRM_ACTION / DIALOG_REQUEST

export interface DialogRequest<R = void> {
  options?: DialogOptions;
  accept: (r: R) => void;
  reject: () => void;
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
                of(request),
                from(promise).pipe(
                  catchError(e => of(e)),
                  map(() => null)
                )
              )
            ),
            takeUntilDestroyed()
          )
        )
    },
    {
      provide: CONFIRM_ACTION,
      useFactory: (): ConfirmAction<unknown> => el => {
        const { promise, resolve: accept, reject } = Promise.withResolvers<void>();

        const { disabled, ...options } = getOptions(el);

        booleanAttribute(disabled) ? accept() : queue.next({ promise, accept, reject, options });

        return promise;
      }
    }
  ];
}

// #endregion
