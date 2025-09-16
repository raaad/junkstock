import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, ViewTransitionInfo, createUrlTreeFromSnapshot } from '@angular/router';
import { getFlatMenu } from './get-flat-menu';

const REVERSED_CLASS = 'view-transition-reversed';

export async function withReversed({ from, to, transition: { finished } }: ViewTransitionInfo) {
  const paths = getFlatMenu().map(({ path }) => path);
  const reverse = paths.indexOf(toPath(from)) > paths.indexOf(toPath(to));

  const rootClasses = document.documentElement.classList;
  rootClasses.toggle(REVERSED_CLASS, reverse) && (await finished, true) && rootClasses.remove(REVERSED_CLASS);
}

export function skipSubsets({ from, to, transition }: ViewTransitionInfo) {
  (isSubset() || toSubset(from, to)) && transition.skipTransition();

  function isSubset() {
    return (
      toPath(to) &&
      inject(Router).isActive(createUrlTreeFromSnapshot(to, []), {
        paths: 'subset',
        matrixParams: 'ignored',
        fragment: 'ignored',
        queryParams: 'ignored'
      })
    );
  }

  function toSubset(from: ActivatedRouteSnapshot, to: ActivatedRouteSnapshot) {
    const fromPath = toPath(from);
    return fromPath && toPath(to).startsWith(fromPath);
  }
}

// TODO: strip matrix
function toPath(s: ActivatedRouteSnapshot) {
  return inject(Router).serializeUrl(createUrlTreeFromSnapshot(s, [])).substring(1);
}
