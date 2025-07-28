import { Directive, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouteConfigLoadEnd, RouteConfigLoadStart, Router } from '@angular/router';
import { filter, map } from 'rxjs';

@Directive({
  selector: '[appViewPageLoading]',
  host: {
    '[class.view-loading]': 'loading()'
  }
})
export class ViewPageLoadingDirective {
  protected readonly loading = toSignal(
    inject(Router).events.pipe(
      filter(e => e instanceof RouteConfigLoadStart || e instanceof RouteConfigLoadEnd),
      map(e => e instanceof RouteConfigLoadStart)
    )
  );
}
