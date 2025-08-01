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
import { LOGGER } from '../common/logger';
import { blobToDataUrl, drawToBlob, fetchToBlob, isDataUrl, svgToDataUrl, svgToString } from '../utils';
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
 * - Non-DataUrl images must use imageUrlResolver
 */
@Injectable()
export class SvgRenderer {
  private readonly logger = inject(LOGGER);
  private readonly selector = inject(RENDERER_COMPONENT_SELECTOR);
  private readonly imageUrlResolvers = inject(IMAGE_URL_RESOLVERS);
  private readonly injector = this.overrideInjector(inject(ApplicationRef).injector);

  // #region render

  /** Render preview as SVG */
  render<T, O extends InputOptions>(type: 'svg', data: T, options: O): Promise<string>;
  /** Render preview as PNG | JPEG */
  render<T, O extends Omit<InputOptions, 'embedImages'>>(type: Exclude<RenderType, 'svg'>, data: T, options: O): Promise<Blob>;
  async render<T, O extends RenderOptions & ExportOptions>(type: RenderType, data: T, { embedImages, context, ...options }: O) {
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

    this.logger.trace(() => ['SVG: rendered', svg.cloneNode(true)]);

    ref.destroy();
    return svg;
  }

  // #endregion

  private export(type: 'svg', svg: SVGSVGElement, options: ExportOptions): Promise<string>;
  private export(type: Exclude<RenderType, 'svg'>, svg: SVGSVGElement, options: Pick<ExportOptions, 'context'>): Promise<Blob>;
  private async export(type: RenderType, svg: SVGSVGElement, { embedImages, context }: ExportOptions) {
    const embeddedTotal = await this.resolveImages(svg, type !== 'svg' || embedImages, context);

    const str = svgToString(svg);

    this.logger.trace(() => ['SVG: exporting', svg]);

    switch (type) {
      case 'svg':
        return str;
      case 'png':
      case 'jpeg':
        return await drawToBlob(svgToDataUrl(str), {
          type: `image/${type}`,
          // Safari fix: https://github.com/bubkoo/html-to-image/issues/361#issuecomment-1413526381
          multiDraw: !(await this.supportsSvgFilter()) && {
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

    this.logger.trace(() => ['SVG: images extracted', Array.from(images.values()).map(i => (isDataUrl(i) ? 'data:...' : i))]);

    await this.preprocessImages(images);

    embed && (await this.embedImages(images));

    Array.from(images.entries()).forEach(([img, url]) => img.setAttribute('src', url));

    return embed ? images.size : 0;
  }

  private async extractImages(svg: SVGSVGElement, context: unknown) {
    // TODO: extract imageUrls from backgrounds?, CSS variables?
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

      this.logger.trace(`SVG: resolving image '${kind}'`, data, args);

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
    this.logger.debug(() => [`SVG: embedding images`, Array.from(images.values()).map(i => (isDataUrl(i) ? 'data:...' : i))]);

    const fetched = new Map(await Promise.all(Array.from(new Set(images.values())).map(async url => [url, await this.fetchImage(url)] as [string, string])));

    Array.from(images.entries()).forEach(([img, url]) => images.set(img, fetched.get(url) ?? url));
  }

  private async fetchImage(url: string) {
    !isDataUrl(url) && this.logger.trace(`SVG: fetching image: ${url}`);

    // To reduce image size fetchToBlob can be replaced with drawToBlob + fitToSize
    return isDataUrl(url) ? url : await blobToDataUrl(await fetchToBlob(url));
  }

  // #endregion

  // #region preapply filters

  private async preprocessImages(images: Map<HTMLImageElement, string>) {
    if (!(await this.supportsSvgFilter())) {
      await Promise.all(Array.from(images.entries()).map(async ([img, url]) => images.set(img, await this.preapplyFilters(img, url))));
    }
  }

  // Safari fix: create a new image with SVG filters applied, because it doesn't support SVG filters inside foreignObject
  private async preapplyFilters(img: HTMLImageElement, url: string) {
    const filters = extractSvgFilters(img);

    if (filters) {
      this.logger.debug(`SVG: preapplying SVG filters`, url, filters);

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

  /** Override the resolvers to defer the process by just serialising the kind, the data to be resolved and additional arguments */
  private overrideInjector(parent: EnvironmentInjector) {
    const deferredResolvers = new Map<ImageUrlResolverKind, ImageUrlResolver>(
      Array.from(this.imageUrlResolvers.keys()).map(kind => [
        kind,
        (data: unknown, args?: unknown[]) => (this.logger.trace(`SVG: preserving resolve '${kind}'`, data, args), toCustomDataUrl(kind, data, args))
      ])
    );

    return createEnvironmentInjector([{ provide: IMAGE_URL_RESOLVERS, useValue: deferredResolvers }], parent);
  }

  private async supportsSvgFilter() {
    const { supportsSvgFilter } = await import('./utils/supports-svg-filter');

    return await supportsSvgFilter(this.logger);
  }

  // #endregion
}
