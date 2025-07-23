import { heicTo } from 'heic-to';
import { concatMap, delay, of, tap, throwError } from 'rxjs';
import { UploadId } from '../../core/upload/upload.types';
import { blobToDataUrl, blobToObjectUrl, drawToBlob, fetchToImage, fitToSize, throwIt } from '../../core/utils';

const LOG_PREFIX = 'mock:';

function newIds() {
  let ids = 0;
  return () => (++ids).toString().padStart(3, '0');
}

/** trigger keyword in the filename: **validate-async** */
const validationRules = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'server reject': ({ name }: File) => (name.includes('validate-async') ? of(false).pipe(delay(5000)) : of(true)),
  unsupported: ({ name }: File) => ['.jpg', '.jpeg', '.png'].some(ext => name.toLocaleLowerCase().endsWith(ext))
};

function isHeic(file: File) {
  return file.name.toLowerCase().endsWith('.heic');
}

/** trigger keyword in the filename: **no-convert** */
async function fromHeic(file: File) {
  const blob = await heicTo({ blob: file, type: 'image/jpeg' });
  return file.name.includes('no-convert') ? throwIt<File>(`${LOG_PREFIX} Conversion error: ${file.name}`) : new File([blob], `${file.name}.jpg`);
}

/** trigger keyword in the id: **no-upload-url** */
function getUploadUrls(ids: UploadId[]) {
  return ids.some(id => id.includes('no-upload-url')) ?
      throwError(() => new Error(`${LOG_PREFIX} getUploadUrls error: ${ids.join(', ')}`))
    : of(Object.fromEntries(ids.map(id => [id, `http://x.com/upload/${id}`]))).pipe(
        // eslint-disable-next-line no-console
        tap(ids => console.log(LOG_PREFIX, 'getUploadUrls', ids)),
        delay(1000)
      );
}

/** trigger keyword in the filename: **no-upload** */
function uploadFile(url: string, { name, size }: File) {
  // eslint-disable-next-line no-console
  console.log(LOG_PREFIX, 'uploading', name);

  const chunksSize = 100 * 1024;
  const chunks = new Array(Math.floor(size / chunksSize))
    .fill(0)
    .reduce((acc: number[]) => [...acc, (acc.slice(-1)[0] ?? 0) + chunksSize], new Array<number>());

  return name.includes('no-upload') ?
      throwError(() => new Error(`${LOG_PREFIX} uploadFile error: ${name}`)).pipe(delay(1000))
    : of(...chunks.map(uploaded => ({ uploaded })), { uploaded: true } as { uploaded: true }).pipe(
        concatMap(i =>
          of(i).pipe(
            // eslint-disable-next-line no-console
            tap(i => console.log(LOG_PREFIX, 'uploaded chunk', i, name)),
            delay(1000)
          )
        )
      );
}

/** trigger keyword in the id: **need-confirmation**, **need-confirmation-toolong** */
function waitForServerConfirmation(id: UploadId) {
  return of(void 0).pipe(delay(id.includes('confirmation-toolong') ? 1000 * 60 : 2000));
}

async function getClientThumb(file: File, dimension = 100, useDataUri = false) {
  // TODO: filter by supported types

  const url = blobToObjectUrl(file);
  const image = await fetchToImage(url).finally(() => URL.revokeObjectURL(url));

  const size = fitToSize(image, { width: dimension, height: dimension }, 'scale-down');
  const blob = await drawToBlob(image, { size, type: file.type });

  return { url: useDataUri ? await blobToDataUrl(blob) : blobToObjectUrl(blob), ...size };
}

export const mocks = {
  newIds: newIds(),
  validationRules,
  isHeic,
  fromHeic,
  getUploadUrls,
  uploadFile,
  getClientThumb,
  waitForServerConfirmation
};
