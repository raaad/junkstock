import { FactoryProvider, inject } from '@angular/core';
import { of } from 'rxjs';
import { UploadState } from '../../core/upload/uploader';
import { clientThumb, mergeExternal, postProcessing, preProcessing, upload, validate } from '../../core/upload/uploader/operators';
import { toLog } from '../../core/upload/uploader/operators.helpers';
import { LOGGER, UPLOAD_PIPELINE, UploadPipeline } from '../../core/upload/uploader/uploader.tokens';
import { batchUploadUrls, progressiveUpload } from '../../core/upload/utils/progressive-upload';
import { mocks } from './mocks';

const initial$ = of({
  id: 'ext-id',
  name: 'already-uploaded-file.jpg',
  path: '',
  size: 1e3,
  uploaded: 1e3,
  state: UploadState.Uploaded as UploadState.Uploaded,
  errors: []
});

export function provideUploadPipeline(): FactoryProvider {
  return {
    provide: UPLOAD_PIPELINE,
    useFactory: (): UploadPipeline => {
      const log = toLog(inject(LOGGER));

      return abort$ => source =>
        source.pipe(
          preProcessing(abort$, log, mocks.isHeic, mocks.fromHeic),
          validate(abort$, log, mocks.validateFile),
          clientThumb(abort$, log, mocks.getClientThumb),
          upload(abort$, log, progressiveUpload(batchUploadUrls(mocks.getUploadUrls), mocks.uploadFile)),
          postProcessing(log, mocks.waitForServerConfirmation),
          mergeExternal(log, initial$)
        );
    }
  };
}
