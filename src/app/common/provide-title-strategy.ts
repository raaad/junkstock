import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, DefaultTitleStrategy, TitleStrategy } from '@angular/router';
import { traverse } from '../../core/utils/traverse';

@Injectable()
class CustomTitleStrategy extends DefaultTitleStrategy {
  private readonly rootTitle = this.title.getTitle();

  override getResolvedTitleForRoute(snapshot: ActivatedRouteSnapshot) {
    return [...Array.from(traverse(i => [super.getResolvedTitleForRoute(i) ?? null, i.parent], snapshot)), this.rootTitle].join(' - ');
  }
}

export function provideTitleStrategy() {
  return {
    provide: TitleStrategy,
    useClass: CustomTitleStrategy
  };
}
