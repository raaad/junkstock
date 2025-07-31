import { InjectionToken, Type } from '@angular/core';
import { SvgRendererComponent } from './svg-renderer.types';

type SvgComponentSelector = <T>(data: T) => Type<SvgRendererComponent<T>>;

/** Selector for the component used to render the preview */
export const RENDERER_COMPONENT_SELECTOR = new InjectionToken<SvgComponentSelector>('rendererComponentSelector');
