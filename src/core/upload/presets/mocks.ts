import { HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { heicTo } from 'heic-to';
import { concatMap, delay, lastValueFrom, map, of, tap, throwError } from 'rxjs';
import { blobToDataUrl, blobToObjectUrl, drawToBlob, fetchToImage, fitToSize } from '../../utils';
import { UploadId } from '../uploader/uploader.types';

const LOG_PREFIX = 'mock:';

function newIds() {
  let ids = 0;
  return () => (++ids).toString().padStart(3, '0');
}

function validateFile({ name }: File) {
  return ['.jpg', '.jpeg', '.png', '.heic'].some(ext => name.toLocaleLowerCase().endsWith(ext)) ? [] : ['unsupported'];
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
  const url = blobToObjectUrl(file);
  const image = await fetchToImage(url);
  URL.revokeObjectURL(url);

  const thumbSize = fitToSize(image, { width: size, height: size }, 'scale-down');
  const blob = await drawToBlob(image, { size: thumbSize, type: file.type });

  return { url: await blobToDataUrl(blob), width: thumbSize.width, height: thumbSize.height };
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
