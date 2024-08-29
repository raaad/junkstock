/** Fit the given size into the provided dimension */
export function fitToSize(
  { width: originalWidth, height: originalHeight }: { width: number; height: number },
  maxSize: { width: number; height: number },
  mode: 'contain' | 'scale-down' | 'cover' = 'contain'
) {
  const maxWidth = mode !== 'scale-down' ? maxSize.width : Math.min(originalWidth, maxSize.width ?? originalWidth);
  const maxHeight = mode !== 'scale-down' ? maxSize.height : Math.min(originalHeight, maxSize.height ?? originalHeight);

  const wFactor = maxWidth / (originalWidth || maxWidth || 1);
  const hFactor = maxHeight / (originalHeight || maxHeight || 1);
  const factor = mode === 'cover' ? Math.max(wFactor, hFactor) : Math.min(wFactor, hFactor);

  const width = Math.round(originalWidth * factor);
  const height = Math.round(originalHeight * factor);

  return { width, height };
}

/** Get the bounding box of the rotated rectangle */
export function getBoundingBox({ x, y, width, height }: { x: number; y: number; width: number; height: number }, angle: number) {
  angle = Math.abs(angle % 180);
  const radians = angle * (Math.PI / 180);
  const factor = angle < 90 ? 1 : -1;
  const r = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);

  return {
    x: getX2(x, r, width, radians, factor),
    y: getY2(y, r, height, radians, factor),
    ...getSize(radians, width, height)
  };

  function getX2(x1: number, r: number, width: number, radians: number, factor: number) {
    const x0 = x1 + width / 2;

    const cosA1 = ((x1 - x0) / r) * factor;
    const a1 = Math.acos(cosA1);
    const a2 = a1 + radians;

    const x2 = x0 + r * Math.cos(a2);
    return x2;
  }

  function getY2(y1: number, r: number, height: number, radians: number, factor: number) {
    const y0 = y1 + height / 2;

    const sinA1 = ((y1 - y0) / r) * factor;
    const a1 = Math.asin(sinA1);
    const a2 = a1 - radians;

    const y2 = y0 + r * Math.sin(a2);
    return y2;
  }

  function getSize(radians: number, w: number, h: number) {
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));

    const width = w * cos + h * sin;
    const height = h * cos + w * sin;
    return { width, height };
  }
}
