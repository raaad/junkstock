import { LocationStrategy } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';
import { throwIt } from '@core/common';
import { IMAGE_URL_RESOLVERS, ImageUrlResolver, ImageUrlResolverKind } from '@core/svg-renderer';
import { blobToObjectUrl, fetchToBlob } from '@core/utils';

@Pipe({ name: 'resolveUrl', pure: true })
export class ResolveUrlPipe implements PipeTransform {
  private resolvers = inject(IMAGE_URL_RESOLVERS);

  transform(contentId: string, kind: string, ...args: unknown[]) {
    return (this.resolvers.get(kind) ?? throwIt(`ImageUrlResolver for kind '${kind}' not found`))(contentId, args);
  }
}

export function provideImageUrlResolvers() {
  return [
    {
      provide: IMAGE_URL_RESOLVERS,
      useFactory: () => {
        const base = `${inject(LocationStrategy).getBaseHref()}assets/`;

        return new Map<ImageUrlResolverKind, ImageUrlResolver>([
          ['local-assets', (url: string) => `${base}${url}`],
          ['api-get-url', (name: string) => Promise.resolve(`${base}${name}.png`)],
          ['api-generated', () => fetchToBlob(`${base}bender.png`).then(blobToObjectUrl)]
        ]);
      }
    }
  ];
}
