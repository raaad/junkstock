export function isHeic(file: File) {
  return file.type === 'image/heic' || (!file.type && file.name.toLowerCase().endsWith('.heic'));
}

/**
 * Converts HEIC file to Jpeg with metadata preserved
 */
export async function convert(file: File, logger: Pick<Console, 'warn'> = console) {
  const { heicTo, getMetadata, insertMetadata } = await import('./heic.utils');

  const blobOrArray = await heicTo({
    blob: file,
    type: 'image/jpeg'
  });
  let blob = Array.isArray(blobOrArray) ? blobOrArray[0] : blobOrArray;

  try {
    const metadata = await getMetadata(file);
    blob = await insertMetadata(blob, metadata);
  } catch (e) {
    logger.warn(e);
  }

  const result = new File([blob], `${file.name}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified
  });

  return result;
}
