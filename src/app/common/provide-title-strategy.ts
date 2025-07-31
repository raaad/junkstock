import { ActivatedRouteSnapshot, DefaultTitleStrategy, TitleStrategy } from '@angular/router';
import { traverse } from '../../core/utils/traverse';

export function provideTitleStrategy() {
  return {
    provide: TitleStrategy,
    useClass: class extends DefaultTitleStrategy {
      private readonly rootTitle = this.title.getTitle();

      override getResolvedTitleForRoute(snapshot: ActivatedRouteSnapshot) {
        return [...Array.from(traverse(i => [super.getResolvedTitleForRoute(i) ?? null, i.parent], snapshot)), this.rootTitle].join(' - ');
      }
    }
  };
}
