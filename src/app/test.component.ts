import { Component, OnInit } from '@angular/core';
import {
  combineLatest,
  concatMap,
  debounce,
  debounceTime,
  forkJoin,
  from,
  map,
  of,
  pairwise,
  scan,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
  timer
} from 'rxjs';

interface ImageEntity {
  id: string;
  date: number;
  time: string;
}

function isAll(v: string[] | 'all'): v is 'all' {
  return v === 'all';
}

const EXPIRE = 1e4;
const THRESHOLD = 1e3;

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [],
  template: `<button (click)="emit()">emit</button>`,
  styles: [``]
})
export class TestComponent implements OnInit {
  init = new Array<string>();

  ids$ = new Subject<string[] | 'all'>();

  items$ = this.ids$.pipe(
    debounceTime(100),
    startWith(new Array<string>()),
    concatMap(ids =>
      ids === 'all' ? from(this.fetch(ids)).pipe(map(preloaded => ({ ids: preloaded.map(({ id }) => id), preloaded }))) : of({ ids, preloaded: [] })
    ),
    pairwise(),
    concatMap(([{ ids: prev }, { ids, preloaded }]) => {
      const added = ids.filter(id => !prev.includes(id));
      return forkJoin({
        added: preloaded.length ? of(preloaded) : from(this.fetch(added)),
        ids: of(ids)
      });
    }),
    scan((r, { ids, added }) => [...r.filter(({ id }) => ids.includes(id)), ...added], new Array<ImageEntity>())
  );

  refresh$ = new Subject<ImageEntity[]>();

  refreshed$ = this.refresh$.pipe(
    map(entities => ({ entities, expiring: this.getExpiring(entities) })),
    tap(({ expiring: i }) => console.log(`expire in: ${i.delay / 1e3}s, ${i.ids.join(', ')}`)), // !!!
    debounce(({ expiring: { delay } }) => timer(delay)),
    switchMap(({ entities, expiring: { ids } }) => forkJoin([of(entities.filter(({ id }) => !ids.includes(id))), from(this.fetch(ids))])),
    map(v => v.flat()),
    startWith(new Array<ImageEntity>())
  );

  entities$ = combineLatest([this.items$, this.refreshed$]).pipe(
    map(([entities, refreshed]) => entities.map(i => refreshed.find(({ id }) => i.id === id) ?? i)),
    tap(entities => this.refresh$.next(entities)),
    tap(i => console.log(`entities: ${i.map(({ id, time }) => `${id} (${time})`).join(', ')}`)), // !!!
    shareReplay(1)
  );

  getExpiring(entities: ImageEntity[]) {
    const now = Date.now();

    const delay = Math.max(Math.min(...entities.map(({ date }) => date - now)) - THRESHOLD, 0);
    const ids = entities.filter(({ date }) => date < now + delay + THRESHOLD * 2).map(({ id }) => id);

    return { delay, ids };
  }

  ngOnInit() {
    this.entities$.subscribe();
  }

  emit() {
    this.ids$.next(!this.init.length ? 'all' : (this.init = [...this.init, (+this.init.slice(-1)[0] + 1).toString()]));
  }

  fetch(ids: string[] | 'all') {
    console.log(`fetch: ${isAll(ids) ? ids : ids.join(', ')}`);
    if (ids !== 'all' && !ids.length) return Promise.resolve([]);

    const all = ['1', '2', '3'];

    return new Promise<ImageEntity[]>(r =>
      setTimeout(
        () =>
          r(
            (isAll(ids) ? (this.init = all) : ids).map(
              id => ({ id, date: Date.now() + EXPIRE, time: new Intl.DateTimeFormat('ru', { timeStyle: 'medium' }).format(Date.now() + EXPIRE) } as ImageEntity)
            )
          ),
        500
      )
    );
  }
}
