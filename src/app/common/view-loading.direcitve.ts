import { Directive, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouteConfigLoadEnd, RouteConfigLoadStart, Router } from '@angular/router';
import { filter, map } from 'rxjs';

// TODO: ignore some routes

@Directive({
  selector: '[appViewLoading]',
  host: {
    '[class.view-loading]': 'loading()'
  }
})
export class ViewLoadingDirective {
  protected readonly loading = toSignal(
    inject(Router).events.pipe(
      filter(e => e instanceof RouteConfigLoadStart || e instanceof RouteConfigLoadEnd),
      map(e => e instanceof RouteConfigLoadStart)
    ),
    { initialValue: false }
  );
}
