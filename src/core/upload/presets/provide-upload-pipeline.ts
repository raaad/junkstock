import { FactoryProvider, inject } from '@angular/core';
import { progressiveUpload } from '../demo/utils/progressive-upload';
import { clientThumb, convert, serverThumb, upload, validate } from '../uploader/operators';
import { toLog } from '../uploader/operators.helpers';
import { LOGGER, UPLOAD_PIPELINE, UploadPipeline } from '../uploader/uploader.tokens';
import { mocks } from './mocks';

export function provideUploadPipeline(): FactoryProvider {
  return {
    provide: UPLOAD_PIPELINE,
    useFactory: (): UploadPipeline => {
      const log = toLog(inject(LOGGER));

      return abort$ => source =>
        source.pipe(
          convert(abort$, log, mocks.isHeic, mocks.fromHeic),
          validate(abort$, log, mocks.validateFile),
          clientThumb(abort$, log, mocks.getClientThumb),
          upload(abort$, log, progressiveUpload(mocks.getUploadUrls, mocks.uploadFile)),
          serverThumb(log, mocks.waitServerThumb)
        );
    }
  };
}
