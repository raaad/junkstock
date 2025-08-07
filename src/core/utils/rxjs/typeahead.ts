import { debounceTime, distinctUntilChanged, filter, first, map, merge, Observable, skip } from 'rxjs';

/** Debounced & trimmed input */
export function typeahead(debounce = 1000, minLength = 2) {
  return (source: Observable<string | undefined | null>) =>
    merge(
      source.pipe(first()), // emit first immediately
      source.pipe(
        skip(1),
        map(v => v?.trim()),
        filter(v => !v || v.length >= minLength),
        debounceTime(debounce)
      )
    ).pipe(
      map(v => v ?? ''),
      distinctUntilChanged()
    );
}
