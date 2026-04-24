import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AniIndexDirective } from '@core/angular';
import { compareBy } from '@core/utils';

@Component({
  selector: 'app-ani-index',
  imports: [AniIndexDirective],
  template: `
    <div class="flex flex-wrap gap-4 p-4">
      <button (click)="shuffle()" class="btn">shuffle</button>
      <button (click)="prepend()" class="btn">prepend</button>
      <button (click)="append()" class="btn">append</button>
      <button (click)="insert()" class="btn">insert</button>
      <button (click)="pop()" class="btn btn-reject">pop</button>
      <button (click)="truncate()" class="btn btn-reject">truncate</button>
      <button (click)="remove()" class="btn btn-reject">remove</button>
    </div>
    <div class="flex h-[50vh] flex-col gap-4 overflow-auto p-4 md:flex-row">
      <ul appAniIndex class="flex flex-1 flex-wrap content-start gap-4">
        @for (item of items(); track item) {
          <li [style.background-color]="item" class="tile"></li>
        }
      </ul>
      <ul appAniIndex class="flex flex-1 flex-col overflow-auto">
        @for (item of items().slice(0, 10); track item) {
          <li [style.background-color]="item + '32'" class="px-2 py-1">{{ item }}</li>
        }
      </ul>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
      }

      .tile {
        width: 3rem;
        aspect-ratio: 1;
      }

      li {
        transition: translate 300ms;
        will-change: translate;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AniIndexComponent {
  protected readonly items = signal(new Array(10).fill(0).map(this.create));

  protected prepend() {
    this.items.set([this.create(), ...this.items()]);
  }

  protected append() {
    this.items.set([...this.items(), this.create()]);
  }

  protected insert() {
    this.items().splice(Math.floor(Math.random() * this.items().length), 0, this.create());
    this.items.set(this.items());
  }

  protected pop() {
    this.items.set(this.items().slice(1));
  }

  protected truncate() {
    this.items.set(this.items().slice(0, this.items().length - 1));
  }

  protected remove() {
    this.items().splice(Math.floor(Math.random() * this.items().length), 1);
    this.items.set(this.items());
  }

  protected shuffle() {
    this.items.set(this.items().sort(compareBy(() => Math.random() > 0.5)));
  }

  private create() {
    return `#${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')}`;
  }
}
