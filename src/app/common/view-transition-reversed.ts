import { inject } from '@angular/core';
import { Router, ViewTransitionInfo, createUrlTreeFromSnapshot } from '@angular/router';
import { getFlatMenu } from './get-flat-menu';

const REVERSED_CLASS = 'view-transition-reversed';

export async function viewTransitionReversed({ from, to, transition: { finished } }: ViewTransitionInfo) {
  const router = inject(Router);
  const paths = getFlatMenu().map(({ path }) => path);
  const rootClasses = document.documentElement.classList;

  const f = router.serializeUrl(createUrlTreeFromSnapshot(from, [])).substring(1);
  const t = router.serializeUrl(createUrlTreeFromSnapshot(to, [])).substring(1);
  const reverse = paths.indexOf(f) > paths.indexOf(t);

  rootClasses.toggle(REVERSED_CLASS, reverse) && (await finished, true) && rootClasses.remove(REVERSED_CLASS);
}
