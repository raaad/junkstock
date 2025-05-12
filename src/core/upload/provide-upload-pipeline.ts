import { FactoryProvider, inject } from '@angular/core';
import { of } from 'rxjs';
import { mocks } from './mocks';
import { UploadState } from './uploader';
import { clientThumb, mergeExternal, preprocessing, serverConfirmation, upload, validate } from './uploader/operators';
import { toLog } from './uploader/operators.helpers';
import { LOGGER, UPLOAD_PIPELINE, UploadPipeline } from './uploader/uploader.tokens';
import { batchUploadUrls, progressiveUpload } from './utils/progressive-upload';

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
          preprocessing(abort$, log, mocks.isHeic, mocks.fromHeic),
          validate(abort$, log, mocks.validateFile),
          clientThumb(abort$, log, mocks.getClientThumb),
          upload(abort$, log, progressiveUpload(batchUploadUrls(mocks.getUploadUrls), mocks.uploadFile)),
          serverConfirmation(log, mocks.waitForServerConfirmation),
          mergeExternal(log, initial$)
        );
    }
  };
}
