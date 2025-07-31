import { InputSignal } from '@angular/core';

export type RenderType = 'svg' | 'png' | 'jpeg';

export interface RenderOptions {
  /** Resulting image size */
  size: { width: number; height: number };
  logLevel?: 'none' | 'debug' | 'trace';
}

export interface ExportOptions<C = unknown> {
  /** for SVG output only */
  embedImages: boolean;
  /** resolveUrl pipe context */
  context?: C;
}

export type InputOptions = RenderOptions & ExportOptions;

/** Component interface that can be used for rendering preview */
export interface SvgRendererComponent<T, O extends RenderOptions = RenderOptions> {
  data: T;
  options: O | InputSignal<O>;
}

export interface SvgRendererContainerComponent {
  rendered: Promise<void>;
}
