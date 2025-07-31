import {
  ApplicationRef,
  createComponent,
  createEnvironmentInjector,
  ElementRef,
  EnvironmentInjector,
  inject,
  Injectable,
  inputBinding,
  Type
} from '@angular/core';
import { LOGGER } from '../shared/logger';
import { blobToDataUrl, drawToBlob, fetchToBlob, fitToSize, isDataUrl, svgToDataUrl, svgToString } from '../utils';
import { RendererContainerComponent } from './container.component';
import { RENDERER_COMPONENT_SELECTOR } from './svg-component-selector.token';
import { ExportOptions, InputOptions, RenderOptions, RenderType, SvgRendererContainerComponent } from './svg-renderer.types';
import { IMAGE_URL_RESOLVERS, ImageUrlResolver, ImageUrlResolverKind } from './url-resolvers.token';
import { ApplyFilterOnImageComponent } from './utils/apply-filter-in-image.component';
import { extractImageData, extractSvgFilters } from './utils/apply-filter-in-image.utils';
import { fromCustomDataUrl, isCustomDataUrl, toCustomDataUrl } from './utils/custom-data-url.utils';

/**
 * IMPORTANT:
 * - None of the global styles or angular's component styles will be applied.
 *   Because the resulting SVG will be rendered to JPEG in isolated context. Only the template's inline style can be used.
 * - Async code is not supported.
 *   The rendered image will only contain what was rendered at the time of afterRender.
 * - Non-DataUri images must use - imageUrlResolver
 */
@Injectable()
export class SvgRenderer<T> {
  private readonly logger = inject(LOGGER);
  private readonly selector = inject(RENDERER_COMPONENT_SELECTOR);
  private readonly imageUrlResolvers = inject(IMAGE_URL_RESOLVERS);
  private readonly injector = this.overrideInjector(inject(ApplicationRef).injector);

  private readonly supportsSvgFilter = import('./utils/supports-svg-filter').then(({ supportsSvgFilter: supports }) => supports());

  // #region render

  /** Render preview as SVG */
  render<O extends InputOptions>(type: 'svg', data: T, options: O): Promise<string>;
  /** Render preview as PNG | JPEG */
  render<O extends Omit<InputOptions, 'embedImages'>>(type: Exclude<RenderType, 'svg'>, data: T, options: O): Promise<Blob>;
  async render<O extends RenderOptions & ExportOptions>(type: RenderType, data: T, { embedImages, context, ...options }: O) {
    const component = this.selector(data);

    const svg = await this.renderSvg(RendererContainerComponent<T, typeof options>, {
      component,
      data,
      options
    });

    const result =
      (
        type === 'svg' // typing issue workaround
      ) ?
        await this.export(type, svg, { embedImages, context })
      : await this.export(type, svg, { context });

    this.log(svg, result, options);

    return result;
  }

  private async renderSvg<C extends SvgRendererContainerComponent>(container: Type<C>, inputs: Partial<Omit<C, 'rendered'>>) {
    const ref = createComponent(container, {
      bindings: Object.entries(inputs).map(([name, value]) => inputBinding(name, () => value)),
      environmentInjector: this.injector
    });

    ref.changeDetectorRef.detectChanges();
    await ref.instance.rendered;
    ref.changeDetectorRef.detectChanges(); // double check

    const element = (ref.location as ElementRef<SVGSVGElement>).nativeElement;
    const svg = element.cloneNode(true) as SVGSVGElement;

    ref.destroy();
    return svg;
  }

  // #endregion

  private export(type: 'svg', svg: SVGSVGElement, options: ExportOptions): Promise<string>;
  private export(type: Exclude<RenderType, 'svg'>, svg: SVGSVGElement, options: Pick<ExportOptions, 'context'>): Promise<Blob>;
  private async export(type: RenderType, svg: SVGSVGElement, { embedImages, context }: ExportOptions) {
    const embeddedTotal = await this.resolveImages(svg, type !== 'svg' || embedImages, context);

    const str = svgToString(svg);

    switch (type) {
      case 'svg':
        return str;
      case 'png':
      case 'jpeg':
        return await drawToBlob(svgToDataUrl(str), {
          type: `image/${type}`,
          // Safari fix: https://github.com/bubkoo/html-to-image/issues/361#issuecomment-1413526381
          multiDraw: !(await this.supportsSvgFilter) && {
            count: Math.max(Math.min(embeddedTotal, 100), 2),
            delay: 50
          }
        });

      default:
        throw new Error(`Unsupported render type: ${type}`);
    }
  }

  // #region resolve images

  private async resolveImages(svg: SVGSVGElement, embed: boolean, context: unknown) {
    const images = await this.extractImages(svg, context);

    await this.preprocessImages(images);

    embed && (await this.embedImages(images));

    Array.from(images.entries()).forEach(([img, url]) => img.setAttribute('src', url));

    return embed ? images.size : 0;
  }

  private async extractImages(svg: SVGSVGElement, context: unknown) {
    return new Map(
      await Promise.all(
        Array.from(svg.querySelectorAll('img[src]'))
          .filter((e): e is HTMLImageElement => !!e)
          .map(async img => [img, await this.resolveImage(img.getAttribute('src') as string, context)] as [typeof img, string])
      )
    );
  }

  /** Get the real URL of the image using the serialised data deferred in the first step and the real resolver */
  private async resolveImage(url: string, context: unknown) {
    if (isCustomDataUrl(url)) {
      const { kind, data, args } = fromCustomDataUrl(url);

      const result = await this.imageUrlResolvers.get(kind)?.(data, args, context);

      if (result) {
        return result;
      } else {
        throw new Error(`Failed to resolve image: ${url}`);
      }
    } else {
      return url;
    }
  }

  private async embedImages(images: Map<HTMLImageElement, string>) {
    const fetched = new Map(await Promise.all(Array.from(new Set(images.values())).map(async url => [url, await this.fetchImage(url)] as [string, string])));

    Array.from(images.entries()).forEach(([img, url]) => images.set(img, fetched.get(url) ?? url));
  }

  private async fetchImage(url: string) {
    // To reduce image size fetchToBlob can be replaced with drawToBlob + fitToSize
    return isDataUrl(url) ? url : await blobToDataUrl(await fetchToBlob(url));
  }

  // #endregion

  // #region preapply filters

  private async preprocessImages(images: Map<HTMLImageElement, string>) {
    if (!(await this.supportsSvgFilter)) {
      await Promise.all(Array.from(images.entries()).map(async ([img, url]) => images.set(img, await this.preapplyFilters(img, url))));
    }
  }

  // Safari fix: create a new image with SVG filters applied, because it doesn't support SVG filters inside foreignObject
  private async preapplyFilters(img: HTMLImageElement, url: string) {
    const filters = extractSvgFilters(img);

    if (filters) {
      const { dataUrl, width, height, rotation } = await extractImageData(url);

      const svg = await this.renderSvg(ApplyFilterOnImageComponent, {
        dataUrl,
        filters,
        width,
        height,
        rotation
      });

      return await blobToDataUrl(await this.export('png', svg, {}));
    } else {
      return url;
    }
  }

  // #endregion

  // #region support

  /** Override the resolvers to defer the process by just serialising the schema, the data to be resolved and additional arguments */
  private overrideInjector(parent: EnvironmentInjector) {
    const deferredResolvers = new Map<ImageUrlResolverKind, ImageUrlResolver>(
      Array.from(this.imageUrlResolvers.keys()).map(schema => [schema, toCustomDataUrl.bind(undefined, schema)])
    );

    return createEnvironmentInjector([{ provide: IMAGE_URL_RESOLVERS, useValue: deferredResolvers }], parent);
  }

  private async log(svg: SVGSVGElement, result: string | Blob, { logLevel = 'trace', size }: RenderOptions) {
    if (logLevel !== 'none') {
      this.logger.debug('TIPS:');
      this.logger.debug('- For SVG in console: Non-embedded images are not displayed');
      this.logger.debug('- For SVG in new tab: Images with relative URLs are not displayed');
    }

    // log as URLs
    if (logLevel === 'trace') {
      this.logger.debug(`SVG: ${URL.createObjectURL(new Blob([svgToString(svg)], { type: 'image/svg+xml' }))}`);

      typeof result !== 'string' && this.logger.debug(`RESULT: ${URL.createObjectURL(result)}`);
    }

    // log as image
    if (logLevel !== 'none') {
      const url = await blobToDataUrl(typeof result === 'string' ? await drawToBlob(svgToDataUrl(result)) : result);

      const { width, height } = fitToSize(size, { width: 400, height: 300 });
      this.logger.debug('%c ', `background: center / contain no-repeat url(${url}); padding: ${height}px 0 0 ${width}px; border: thin solid #f003;`);
    }
  }

  // #endregion
}
