import { InjectionToken } from '@angular/core';

export type ImageUrlResolverKind = string;

export type ImageUrlResolver<T = unknown, A extends unknown[] = unknown[], C = unknown> = (data: T, args?: A, context?: C) => string | Promise<string>;

/** The map of the resolvers, allows you to get the url | dataUrl of an image by a specific kind */
export const IMAGE_URL_RESOLVERS = new InjectionToken<Map<ImageUrlResolverKind, ImageUrlResolver>>('IMAGE_URL_RESOLVERS');
