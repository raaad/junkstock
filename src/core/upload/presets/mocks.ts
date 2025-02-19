import { HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { heicTo } from 'heic-to';
import { concatMap, delay, lastValueFrom, map, of, tap, throwError } from 'rxjs';
import { UploadId } from '../uploader/uploader.types';

const LOG_PREFIX = 'mock:';

function newIds() {
  let ids = 0;
  return () => (++ids).toString().padStart(3, '0');
}

function validateFile({ name }: File) {
  return name.toLowerCase().endsWith('.jpg') || name.toLowerCase().endsWith('.heic') ? [] : ['unsupported'];
}

function isHeic(file: File) {
  return file.name.toLowerCase().endsWith('.heic');
}

async function fromHeic(file: File) {
  const blob = await heicTo({ blob: file, type: 'image/jpeg' });
  return new File([blob], `${file.name}.jpg`);

  /* if (file.name.includes('corrupted')) {
    throw new Error(`${LOG_PREFIX} corrupted HEIC`);
  } else {
    return await new Promise<File>(r => setTimeout(() => r(new File([file], `${file.name}.jpg`)), 5000));
  } */
}

function getUploadUrls(ids: UploadId[]) {
  /* if (ids.some(id => id === '013')) {
    throw new Error(`${LOG_PREFIX} bad luck: 013`);
  } */

  return lastValueFrom(
    of(Object.fromEntries(ids.map(id => [id, `http://x.com/upload/${id}`]))).pipe(
      tap(ids => console.log(LOG_PREFIX, 'getUploadUrls', ids)),
      delay(1000)
    )
  );
}

function uploadFile(url: string, { name, size }: File) {
  console.log(LOG_PREFIX, 'upload', name);

  const chunksSize = 100 * 1024;
  const chunks = new Array(Math.floor(size / chunksSize))
    .fill(0)
    .reduce((acc: number[]) => [...acc, (acc.slice(-1)[0] ?? 0) + chunksSize], new Array<number>());

  return name.includes('corrupted')
    ? throwError(() => new Error(`${LOG_PREFIX} Server error`)).pipe(delay(1000))
    : of(...chunks.map(loaded => <HttpProgressEvent>{ type: HttpEventType.UploadProgress, loaded }), new HttpResponse<void>({ status: 200 })).pipe(
        concatMap(i =>
          of(i).pipe(
            tap(i => console.log(LOG_PREFIX, 'uploaded chunk', i, name)),
            delay(1000)
          )
        )
      );
}

function waitServerThumb(id: UploadId) {
  return lastValueFrom(
    of({ id, success: true }).pipe(
      delay(5000),
      map(({ success }) => success)
    )
  );
}

async function getClientThumb(file: File, size = 100) {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.src = url;

  await new Promise((resolve, reject) => (image.addEventListener('load', resolve, false), image.addEventListener('error', reject, false)));

  URL.revokeObjectURL(url);

  const width = size;
  const height = Math.round(image.height * (size / image.width));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(image, 0, 0, width, height);

  const blob = await canvas.convertToBlob({ type: file.type });

  return { url: URL.createObjectURL(blob), width, height };
}

export const mocks = {
  newIds: newIds(),
  validateFile,
  isHeic,
  fromHeic,
  getUploadUrls,
  uploadFile,
  getClientThumb,
  waitServerThumb
};
