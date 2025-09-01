import { inject } from '@angular/core';
import { Route, Router } from '@angular/router';
import { lazy } from '@core/utils';

export const getFlatMenu = lazy(() => getMenu(inject(Router).config));

function getMenu(routes: Route[], base = new Array<string | undefined>()): { title: string; path?: string; indent: number }[] {
  return routes.flatMap(({ title, path, children }) => [
    ...(typeof title === 'string' ? [{ title, path: children ? undefined : [...base, path].join('/'), indent: base.length }] : []),
    ...getMenu(children ?? [], [...base, path].filter(Boolean))
  ]);
}
