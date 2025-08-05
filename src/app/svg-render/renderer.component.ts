import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InterpolatePipe } from '@core/common';
import { RENDERER_COMPONENT_SELECTOR, RenderOptions, SvgRendererComponent } from '@core/svg-renderer';
import { ResolveUrlPipe } from './image-url.resolvers';
import { RENDER_DATA } from './mock.data';

@Component({
  selector: 'app-render',
  imports: [ResolveUrlPipe, InterpolatePipe],
  template: `
    <!-- NG trick: to keep the style tag, place it inside <svg:defs>  -->
    <svg:defs>
      <style>
        app-render {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          height: 100%;
          background-color: #e0ffe3;
        }

        .item {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUAQMAAAC3R49OAAAABlBMVEUAAADDw8PUNIZRAAAAAXRSTlMAQObYZgAAABNJREFUCNdj+H+AgSjMYP+BGAwABZEdTYmL7+0AAAAASUVORK5CYII=);
        }

        span {
          padding: 1rem;
          font-family: Verdana, Geneva, Tahoma, sans-serif;
          font-size: 16px;
          background-color: #fffa;
        }

        img {
          flex: 1;
          min-height: 0;
          object-fit: contain;
        }

        .with-filters img {
          filter: grayscale(1);
          rotate: 45deg;
        }
      </style>
    </svg:defs>

    <!-- Firefox fix: filters must be placed inside an SVG tag -->
    <svg:svg width="0" height="0" xmlns="http://www.w3.org/2000/svg" style="position: absolute;">
      <defs>
        <filter id="svg-filter" color-interpolation-filters="linearRGB" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse">
          <feComponentTransfer x="0%" y="0%" width="100%" height="100%" in="SourceGraphic" result="componentTransfer">
            <feFuncR type="table" tableValues="1 0 1" />
            <feFuncG type="table" tableValues="0 1 0" />
            <feFuncB type="table" tableValues="1 0 1" />
            <feFuncA type="table" tableValues="0 1" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg:svg>

    <div class="item with-filters">
      <span>Static image from local assets + CSS filters</span>
      <img [src]="'bender.png' | resolveUrl: 'local-assets'" alt="" />
    </div>

    @for (item of data(); track $index) {
      <div class="item">
        <span>{{ item.title }}</span>
        <img [src]="item.contentId | resolveUrl: item.kind" [style.filter]="item.svgFilterId && ('url(#\${svgFilterId})' | interpolate: item)" alt="" />
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenderComponent implements SvgRendererComponent<typeof RENDER_DATA> {
  data = input.required<typeof RENDER_DATA>();
  options = input.required<RenderOptions>();
}

export function provideRenderer() {
  return [{ provide: RENDERER_COMPONENT_SELECTOR, useValue: () => RenderComponent }];
}
