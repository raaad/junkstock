import { fetchToImage, svgToDataUrl } from '../../utils';

const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">
  <filter id="f"><feFlood flood-color="#00ff00" /></filter>
  <foreignObject width="100%" height="100%">
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      style="height: 100%; background: #ff0000; filter: url(#f)"
    ></div>
  </foreignObject>
</svg>
`;

const SUCCESS_COLOR = '00ff00';

/** Detect if browser supports SVG filter in foreignObject when drawing to canvas */
export function supportsSvgFilter(logger: Pick<Console, 'warn'> = console) {
  let supports: Promise<boolean>;

  return (supports ??= (async () => {
    try {
      const image = await fetchToImage(svgToDataUrl(SVG));

      const canvas = new OffscreenCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(image, 0, 0, image.width, image.height);

      const [r, g, b] = ctx?.getImageData(0, 0, 1, 1).data ?? [0, 0, 0];
      const rgb = [r, g, b].map(i => i.toString(16).padStart(2, '0')).join('');

      return rgb === SUCCESS_COLOR;
    } catch (e) {
      logger.warn(e);
      return false;
    }
  })());
}
