import { Component, computed, inject, signal } from '@angular/core';
import { INF_SCROLL_HOST, InfScrollDirective, InfScrollHostDirective } from '@core/angular';

@Component({
  selector: 'app-inf-scroll',
  imports: [InfScrollDirective],
  hostDirectives: [{ directive: InfScrollHostDirective }],
  template: `
    <div class="text-s sticky top-0 z-1 flex items-center bg-gray-100 p-4">
      infinite scroll: enabled <span [class.on]="enabled()" class="dot"></span> active <span [class.on]="scroll.active()" class="dot"></span> failed
      <span [class.on]="scroll.failed()" class="dot"></span>
      <button (click)="host.scroll({ top: 0, behavior: 'smooth' })" class="btn btn-icon ml-auto rounded-[50%]! border-none!" title="scroll up">↑</button>
    </div>
    <div
      [useInfScroll]="loader"
      [infScrollEnabled]="enabled()"
      #scroll="infScroll"
      class="trigger"
      [class.enabled]="enabled()"
      [class.active]="scroll.active()"
      [class.failed]="scroll.failed()">
      <span class="my-2 inline-flex items-center">
        @if (!scroll.failed()) {
          loading...
        } @else {
          failed <button (click)="scroll.retry()" class="btn btn-icon -my-3 rounded-[50%]! border-none!" title="retry">↻</button>
        }
      </span>
    </div>
    @for (item of items(); track item) {
      <div class="px-2 pt-1">{{ item.name }}</div>
    }
  `,
  styles: [
    `
      :host {
        overflow-anchor: none;
      }

      .trigger {
        --speed-in: 0.5s;
        --speed-out: calc(var(--speed-in) * 4);

        text-align: center;
        font-size: 75%;

        visibility: hidden;
        opacity: 0;
        height: 0;
        interpolate-size: allow-keywords;
        transition:
          height var(--speed-out),
          opacity var(--speed-out);

        &.active {
          visibility: visible;
          opacity: 1;
        }

        &.enabled {
          height: max-content;
          transition:
            height var(--speed-in),
            opacity var(--speed-in);
          transition-behavior: allow-discrete;
          transition-delay: var(--speed-in);
        }

        span:before {
          content: '';
          margin-right: 0.5rem;
        }

        &.failed {
          span:before {
            content: '🛈';
            font-size: 1rem;
            line-height: 1;
          }
        }

        &:not(.failed) {
          span:before {
            width: 0.75rem;
            aspect-ratio: 1;
            border: thin transparent solid;
            border-top-color: var(--color-black);
            border-radius: 50%;
            animation: 1s rotate linear infinite;
          }
        }
      }

      .dot {
        display: inline-block;
        width: 0.5rem;
        aspect-ratio: 1;
        margin: 0.125rem 0.5rem 0 0.25rem;
        border-radius: 50%;
        background-color: var(--color-red-300);
        border: thin solid var(--color-red-500);
        transition:
          background-color 0.5s,
          border-color 0.5s;

        &.on {
          background-color: var(--color-green-300);
          border: thin solid var(--color-green-500);
        }
      }

      @keyframes rotate {
        to {
          transform: rotate(360deg);
        }
      }
    `
  ]
})
export class InfScrollComponent {
  protected host = inject(INF_SCROLL_HOST);

  protected items = signal(new Array<{ id: number; name: string }>());

  private next = signal<number | undefined | null>(undefined);
  protected enabled = computed(() => this.next() !== null);

  protected loader = async () => {
    const { items, token } = await fetch(this.next() ?? undefined);

    this.items.update(old => [...items, ...old]);
    this.next.set(token);
  };
}

// #region mocks

async function fetch(token = 0, limit = 20) {
  const max = -156;

  await wait(token % 30 ? 3000 : 300, token === -80);
  const next = Math.max(token - limit, max);
  return { items: generate(token, Math.min(limit, token - next)), token: next === token - limit ? next : null };
}

function generate(token: number, limit: number) {
  return Array.from({ length: limit }, (_, i) => {
    const id = token - (i + 1);
    return { id, name: `item ${id}` };
  }).reverse();
}

const wait = (() => {
  let failed = false;
  return async (delay: number, fail: boolean) =>
    new Promise<void>((r, rj) => setTimeout(() => (fail && !failed ? ((failed = true), rj()) : ((failed = false), r())), delay));
})();

// #endregion
