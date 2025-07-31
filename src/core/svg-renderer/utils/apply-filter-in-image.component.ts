import { afterNextRender, ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SvgRendererContainerComponent } from '../svg-renderer.types';
import { RotationAngle } from './apply-filter-in-image.utils';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'svg[data-apply-filter-on-image]',
  template: `
    <svg:defs [innerHTML]="svgFilters()" />
    <svg:image
      [attr.href]="dataUrl()"
      [attr.filter]="filters().value"
      [attr.x]="x()"
      [attr.y]="y()"
      [attr.width]="width()"
      [attr.height]="height()"
      [attr.transform]="rotate()"
      transform-origin="center"
      crossorigin="anonymous"
      decoding="sync" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[attr.width]': 'svgWidth()',
    '[attr.height]': 'svgHeight()',
    '[attr.viewBox]': 'viewBox()',
    '[attr.xmlns]': '"http://www.w3.org/2000/svg"'
  }
})
export class ApplyFilterOnImageComponent implements SvgRendererContainerComponent {
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly dataUrl = input.required<string>();

  protected readonly filters = input.required<{ value: string; markup: string }>();

  protected readonly width = input.required<number>();

  protected readonly height = input.required<number>();

  protected readonly rotation = input.required<RotationAngle>();

  private readonly isPerpendicular = computed(() => [90, 270].includes(this.rotation()));

  protected readonly svgWidth = computed(() => (this.isPerpendicular() ? this.height() : this.width()));

  protected readonly svgHeight = computed(() => (this.isPerpendicular() ? this.width() : this.height()));

  protected readonly viewBox = computed(() => `0 0 ${this.svgWidth()} ${this.svgHeight()}`);

  protected readonly x = computed(() => (this.svgWidth() - this.width()) / 2);

  protected readonly y = computed(() => (this.svgHeight() - this.height()) / 2);

  /** Rotate back on the same angle to avoid double rotation (since "image-orientation: none" not working for the SVG image: https://issues.chromium.org/issues/40758655) */
  protected readonly rotate = computed(() => `rotate(-${this.rotation()})`);

  protected readonly svgFilters = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.filters().markup));

  readonly rendered = new Promise<void>(resolve => afterNextRender(resolve));
}
