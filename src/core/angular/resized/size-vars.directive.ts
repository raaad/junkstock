import { Directive, signal } from '@angular/core';

@Directive({
  selector: '[appSizeVars]',
  host: {
    '(resized)': 'update($any($event))',
    '[style.--width.px]': 'size().width',
    '[style.--height.px]': 'size().height'
  }
})
export class SizeVarsDirective {
  protected size = signal({ width: 0, height: 0 });

  protected update(e: ResizeObserverEntry) {
    const { width, height } = e.contentRect;
    this.size.set({ width, height });
  }
}
