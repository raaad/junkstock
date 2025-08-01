import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LOGGER, Logger } from '@core/common';
import { RenderOptions, SvgRenderer } from '@core/svg-renderer';
import { blobToDataUrl, blobToObjectUrl, drawToBlob, fitToSize, svgToDataUrl } from '@core/utils';
import { provideImageUrlResolvers } from './image-url.resolvers';
import { RENDER_DATA } from './mock.data';
import { provideRenderer } from './renderer.component';

@Component({
  selector: 'app-svg-render',
  template: `
    <div class="flex gap-3">
      <button (click)="render('jpeg')" class="btn btn-sm">Render as JPEG</button>
      <button (click)="render('svg')" class="btn btn-sm">Render as SVG</button>
      @if (result()) {
        <a (click)="copy()" (keydown.enter)="copy()" class="hover:text-sky-700 cursor-pointer" tabindex="0">copy</a>
      }
    </div>

    @if (result()) {
      <img [src]="result()" alt="" />
    }
  `,
  styles: [
    `
      :host {
        padding: 1rem;
      }

      img {
        margin-top: 1rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SvgRenderer, ...provideRenderer(), ...provideImageUrlResolvers()]
})
export class SvgRenderComponent {
  private logger = inject(LOGGER);
  private renderer: SvgRenderer = inject(SvgRenderer);

  protected readonly result = signal(undefined as string | undefined);

  protected async render(type: 'jpeg' | 'svg') {
    const options = { size: { width: 400, height: 600 } };

    const blob =
      type === 'jpeg' ?
        await this.renderer.render('jpeg', RENDER_DATA, options)
      : await this.renderer.render('svg', RENDER_DATA, { ...options, embedImages: true });

    this.result.set(blob instanceof Blob ? blobToObjectUrl(blob) : svgToDataUrl(blob));

    await logResult(this.logger, blob, options);
  }

  protected copy() {
    navigator.clipboard.writeText(this.result() ?? '');
  }
}

async function logResult(logger: Logger, result: string | Blob, { size }: RenderOptions) {
  logger.trace('SVG: tips:');
  logger.trace('- For SVG in console: Non-embedded images are not displayed');
  logger.trace('- For SVG in new tab: Images with relative URLs are not displayed');

  // log as image
  const url = await blobToDataUrl(typeof result === 'string' ? await drawToBlob(svgToDataUrl(result)) : result);

  const { width, height } = fitToSize(size, { width: 400, height: 300 });

  logger.trace('%c ', `background: center / contain no-repeat url(${url}); padding: ${height}px 0 0 ${width}px; border: thin solid #f003;`);
}
