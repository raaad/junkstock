import { throwIt } from './throw-it';

/** Fetch file to blob from URL (http[s]: | blob: | data:) */
export async function fetchToBlob(url: string) {
  const response = await fetch(url);
  return await response.blob();
}

/** Draw image file in blob from URL (http[s]: | blob: | data:) using Image element and Canvas */
export async function drawToBlob(
  url: string,
  { size, useOffscreenCanvas, type, quality }: ImageEncodeOptions & { size?: { width: number; height: number }; useOffscreenCanvas?: boolean } = {}
) {
  const image = new Image();
  image.crossOrigin = ' ';
  image.src = url;

  await new Promise((resolve, reject) => (image.addEventListener('load', resolve, false), image.addEventListener('error', reject, false)));

  const canvas = useOffscreenCanvas ?? true ? new OffscreenCanvas(0, 0) : document.createElement('canvas');

  const { width, height } = size ?? { width: image.width, height: image.height };
  canvas.width = width;
  canvas.height = height;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  ctx?.drawImage(image, 0, 0, width, height);

  const blob = await (canvas instanceof OffscreenCanvas
    ? canvas.convertToBlob({ type, quality })
    : new Promise<Blob>((resolve, reject) => canvas.toBlob(r => (r ? resolve(r) : reject(new Error('Blob is null'))), type, quality)));

  return blob;
}

/** Convert Blob to DataURL */
export async function blobToDataUrl(blob: Blob) {
  const reader = new FileReader();

  reader.readAsDataURL(blob);
  await new Promise((resolve, reject) => (reader.addEventListener('load', resolve, false), reader.addEventListener('error', reject, false)));

  return reader.result as string;
}

/** Create object URL from Blob */
export function blobToObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

/** Download provided Blob as a file */
export function downloadFile(blob: Blob, name?: string): void;
/** Download provided Data URI as a file */
export function downloadFile(dataUrl: string, name?: string): void;
export function downloadFile(data: Blob | string, download = '') {
  const href = typeof data === 'string' ? (data.startsWith('data:') ? data : throwIt<string>('Invalid Data URI provided')) : blobToObjectUrl(data);

  const a = Object.assign(document.createElement('a'), {
    href,
    download,
    target: '_blank',
    rel: 'noopener'
  });

  a.dispatchEvent(new MouseEvent('click'));
  typeof data !== 'string' && setTimeout(() => URL.revokeObjectURL(href));
}

/** Convert SVG element to DataURL */
export function svgToDataUrl(svg: SVGSVGElement): string;
export function svgToDataUrl(svg: string): string;
export function svgToDataUrl(svgElement: SVGSVGElement | string) {
  const svg = typeof svgElement === 'string' ? svgElement : new XMLSerializer().serializeToString(svgElement);

  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  // unable to use blob because SVG uses foreignObject and when canvas.toDataURL is called,
  // it throws the security error 'Tainted canvases may not be exported': stackoverflow.com/a/41338911
  // const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8', }));

  return dataUrl;
}
