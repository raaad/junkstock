import { fetchToImage, svgToDataUrl } from '../../utils';

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">
  <filter id="a">
    <feFlood flood-color="#0f0"/>
  </filter>
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="height:100%;background:#f00;filter:url(#a)"/>
  </foreignObject>
</svg>
`;

const SUCCESS_COLOR = '00ff00';

let supports: Promise<boolean>;

/** Detect if browser supports SVG filter in foreignObject when drawing to canvas */
export function supportsSvgFilter(logger: Pick<Console, 'warn' | 'trace'> = console) {
  return (supports ??= check(logger));
}

async function check(logger: Pick<Console, 'warn' | 'trace'>) {
  try {
    const image = await fetchToImage(svgToDataUrl(SVG));

    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(image, 0, 0, image.width, image.height);

    const [r, g, b] = ctx?.getImageData(0, 0, 1, 1).data ?? [0, 0, 0];
    const rgb = [r, g, b].map(i => i.toString(16).padStart(2, '0')).join('');

    const supports = rgb === SUCCESS_COLOR;
    logger.trace(`SVG: svg filters support: ${supports}`);
    return supports;
  } catch (e) {
    logger.warn(e);
    return false;
  }
}
