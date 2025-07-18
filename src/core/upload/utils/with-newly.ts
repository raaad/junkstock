import { Observable, buffer, debounceTime, filter, map, pairwise, shareReplay, startWith } from 'rxjs';
import { Upload } from '../upload.types';

export function withNewly(predicate: (u: Upload) => boolean, debounce = 100) {
  return (uploads$: Observable<Upload[]>) =>
    uploads$.pipe(
      map(items => items.filter(predicate)),
      startWith(new Array<Upload>()),
      pairwise(),
      map(([prev, current]) => {
        const ids = prev.map(({ id }) => id);
        return current.filter(({ id }) => !ids.includes(id));
      }),
      buffer(uploads$.pipe(debounceTime(debounce))),
      map(items => items.flat()),
      filter(items => !!items.length),
      shareReplay(1)
    );
}
