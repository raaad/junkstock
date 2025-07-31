import { NgComponentOutlet } from '@angular/common';
import { afterNextRender, ChangeDetectionStrategy, Component, input, Type, ViewEncapsulation } from '@angular/core';
import { RenderOptions, SvgRendererContainerComponent } from './svg-renderer.types';

/**
 * IMPORTANT:
 * - None of the global styles or angular's component styles will be applied.
 *   Because the resulting SVG will be rendered to JPEG in isolated context. Only the template's inline style can be used.
 * - Async code is not supported.
 *   The rendered image will only contain what was rendered at the time of afterRender.
 * - Background images will not be embedded.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'svg[data-renderer-container]',
  imports: [NgComponentOutlet],
  template: `
    <!-- Safari fix: attributes required -->
    <foreignObject x="0" y="0" width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width: 100%; height: 100%;">
        <ng-container
          *ngComponentOutlet="
            component();
            inputs: {
              data: data(),
              options: options()
            }
          " />
      </div>
    </foreignObject>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.width]': 'width',
    '[attr.height]': 'height',
    '[attr.viewBox]': 'viewBox',
    '[attr.xmlns]': '"http://www.w3.org/2000/svg"'
  }
})
export class RendererContainerComponent<T, O extends RenderOptions> implements SvgRendererContainerComponent {
  protected readonly component = input.required<Type<unknown>>();

  protected readonly data = input.required<T>();

  protected readonly options = input.required<O>();

  protected get width() {
    return this.options().size.width;
  }
  protected get height() {
    return this.options().size.height;
  }
  protected get viewBox() {
    return `0 0 ${this.width} ${this.height}`;
  }

  readonly rendered = new Promise<void>(resolve => afterNextRender(resolve));
}
