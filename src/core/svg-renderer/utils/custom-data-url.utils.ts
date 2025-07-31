import { ImageUrlResolverKind } from '../url-resolvers.token';

export function toCustomDataUrl(kind: ImageUrlResolverKind, data: unknown, args: unknown[] = []) {
  return `data:custom/${kind},${encodeURIComponent(JSON.stringify({ data, args }))}`;
}

export function fromCustomDataUrl(uri: string) {
  const index = uri.indexOf(',');
  const [, kind] = uri.substring(0, index).split('/');
  const { data, args }: { data: unknown; args: unknown[] } = JSON.parse(decodeURIComponent(uri.substring(index + 1)));
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  return { kind: kind as ImageUrlResolverKind, data, args };
}

export function isCustomDataUrl(url: string) {
  return url.startsWith('data:custom/');
}
