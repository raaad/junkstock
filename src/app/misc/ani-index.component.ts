import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AniIndexDirective } from '@core/angular';
import { compareBy } from '@core/utils';

@Component({
  selector: 'app-ani-index',
  imports: [AniIndexDirective],
  template: `
    <div class="flex flex-wrap gap-4 p-4">
      <button (click)="shuffle()" class="btn btn-sm">shuffle</button>
      <button (click)="prepend()" class="btn btn-sm">prepend</button>
      <button (click)="append()" class="btn btn-sm">append</button>
      <button (click)="insert()" class="btn btn-sm">insert</button>
      <button (click)="pop()" class="btn btn-sm btn-reject">pop</button>
      <button (click)="truncate()" class="btn btn-sm btn-reject">truncate</button>
      <button (click)="remove()" class="btn btn-sm btn-reject">remove</button>
    </div>
    <div class="flex gap-4 p-4">
      <ul appAniIndex class="flex flex-wrap flex-1 gap-4 content-start">
        @for (item of items(); track item) {
          <li [style.background-color]="item" class="tile"></li>
        }
      </ul>
      <ul appAniIndex class="flex flex-col flex-1 overflow-auto">
        @for (item of items().slice(0, 10); track item) {
          <li [style.background-color]="item + '32'" class="p-2">{{ item }}</li>
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
  protected readonly items = signal(new Array(50).fill(0).map(this.create));

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
