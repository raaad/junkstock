import { FactoryProvider, inject } from '@angular/core';
import {
  batchUploadUrls,
  clientThumb,
  LOGGER,
  postProcessing,
  preProcessing,
  progressiveUpload,
  upload,
  UPLOAD_PIPELINE,
  UploadPipeline,
  validate
} from '../../core/upload';
import { mocks } from './mocks';

export function provideUploadPipeline(): FactoryProvider {
  return {
    provide: UPLOAD_PIPELINE,
    useFactory: (): UploadPipeline => {
      const logger = inject(LOGGER);

      return abort$ => source =>
        source.pipe(
          preProcessing(file => (mocks.isHeic(file) ? mocks.fromHeic(file) : Promise.resolve(file)), logger, abort$),
          validate(mocks.validationRules, logger, abort$),
          clientThumb(mocks.getClientThumb, logger, abort$),
          upload(progressiveUpload(batchUploadUrls(mocks.getUploadUrls), mocks.uploadFile), logger, abort$),
          postProcessing(mocks.waitForServerConfirmation, logger)
        );
    }
  };
}
