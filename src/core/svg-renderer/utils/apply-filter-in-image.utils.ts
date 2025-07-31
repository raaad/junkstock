import { Tags } from 'exifreader';
import { blobToDataUrl, blobToObjectUrl, fetchToBlob, fetchToImage, svgToString } from '../../utils';

export type RotationAngle = 0 | 90 | 180 | 270;

export enum ExifOrientation {
  None = 0,
  Normal = 1,
  FlipX = 2,
  Rotated180 = 3,
  Rotated180FlipX = 4, // FlipY
  Rotated90FlipX = 5,
  Rotated90 = 6,
  Rotated270FlipX = 7,
  Rotated270 = 8
}

const ORIENTATION_MAP: Record<ExifOrientation, RotationAngle> = {
  [ExifOrientation.None]: 0,
  [ExifOrientation.Normal]: 0,
  [ExifOrientation.FlipX]: 0,
  [ExifOrientation.Rotated180]: 180,
  [ExifOrientation.Rotated180FlipX]: 180,
  [ExifOrientation.Rotated90FlipX]: 90,
  [ExifOrientation.Rotated90]: 90,
  [ExifOrientation.Rotated270FlipX]: 270,
  [ExifOrientation.Rotated270]: 270
};

export function extractSvgFilters(el: HTMLElement) {
  const pattern = /url\("#(.+)"\)/;
  const parent = el.closest('svg');

  const filters = el.style.filter
    .split(' ')
    .map(v => pattern.exec(v)?.[1])
    .filter((id): id is string => !!id);

  const value = filters.map(id => `url("#${id}")`).join(' ');

  const markup = filters
    .map(id => parent?.getElementById(id) as unknown)
    .filter((v): v is SVGSVGElement => v instanceof SVGSVGElement)
    .map(el => svgToString(el))
    .join('');

  return markup ? { value, markup } : null;
}

export async function extractImageData(url: string, logger: Pick<Console, 'warn'> = console) {
  const blob = await fetchToBlob(url);

  const blobUrl = blobToObjectUrl(blob);
  const image = await fetchToImage(blobUrl).finally(() => URL.revokeObjectURL(blobUrl));
  const { width, height } = image;

  const { load } = await import('exifreader');
  const exif: Tags = await load(new File([blob], ''), { async: true }).catch(e => (logger.warn(e), {} as Tags));
  const rotation = ORIENTATION_MAP[exif.Orientation?.value as ExifOrientation];

  const dataUrl = await blobToDataUrl(blob);

  return { dataUrl, width, height, rotation };
}
