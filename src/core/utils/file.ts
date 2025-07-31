import { throwIt } from '../common/throw-it';

/** Fetch file to blob from URL (http[s]: | blob: | data:) */
export async function fetchToBlob(url: string) {
  return await (await fetch(url)).blob();
}

export function fetchToImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image), false);
    image.addEventListener('error', reject, false);
    image.src = url;
  });
}

type DrawOptions = ImageEncodeOptions & {
  size?: { width: number; height: number };
  multiDraw?: { count: number; delay: number } | false; // Safari fix: call drawImage multiple times, image not decode when drawImage svg+xml
};

/** Draw image file to blob from URL (http[s]: | blob: | data:) */
export function drawToBlob(image: string, options?: DrawOptions): Promise<Blob>;
/** Draw image to blob */
export function drawToBlob(image: HTMLImageElement, options?: DrawOptions): Promise<Blob>;
export async function drawToBlob(data: string | HTMLImageElement, { size, multiDraw, ...options }: DrawOptions = {}) {
  const image = data instanceof HTMLImageElement ? data : await fetchToImage(data);

  const { width, height } = size ?? { width: image.width, height: image.height };
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // --- drawImage
  let count = Math.max((multiDraw && multiDraw.count) || 0, 1);
  const delay = (multiDraw && multiDraw.delay) || 0;

  while (count--) {
    ctx?.clearRect(0, 0, width, height);
    ctx?.drawImage(image, 0, 0, width, height);

    count && (await new Promise(r => setTimeout(r, delay)));
  }
  // ---

  const blob = await canvas.convertToBlob(options);

  // --- release https://pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/
  canvas.width = 1;
  canvas.height = 1;
  canvas.getContext('2d')?.clearRect(0, 0, 1, 1);

  return blob;
}

/** Convert Blob to DataURL */
export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string), false);
    reader.addEventListener('error', reject, false);

    reader.readAsDataURL(blob);
  });
}

/** Create object URL from Blob */
export function blobToObjectUrl(blob: Blob) {
  return URL.createObjectURL(blob);
}

/** Convert SVG string to DataURL */
export function svgToDataUrl(svg: string) {
  // unable to use blob for SVG with foreignObject because when canvas.toDataURL is called,
  // it throws the security error 'Tainted canvases may not be exported': stackoverflow.com/a/41338911
  // const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8', }));
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Convert SVG element to string */
export function svgToString(svg: SVGElement) {
  return new XMLSerializer().serializeToString(svg);
}

/** Download provided Blob as a file */
export function downloadFile(blob: Blob, name?: string): void;
/** Download provided Data URL as a file */
export function downloadFile(dataUrl: string, name?: string): void;
export function downloadFile(data: Blob | string, download = '') {
  const href =
    typeof data === 'string' ?
      isDataUrl(data) ? data
      : throwIt<string>(`Invalid Data URL provided: ${data}`)
    : blobToObjectUrl(data);

  const a = Object.assign(document.createElement('a'), {
    href,
    download,
    target: '_blank',
    rel: 'noopener'
  });

  a.dispatchEvent(new MouseEvent('click'));
  typeof data !== 'string' && setTimeout(() => URL.revokeObjectURL(href));
}

export function isDataUrl(url: string) {
  return url.startsWith('data:');
}
