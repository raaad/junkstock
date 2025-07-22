import { FactoryProvider, inject } from '@angular/core';
import { concatMap, of } from 'rxjs';
import {
  batched,
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

      const batchUrls = batched(mocks.getUploadUrls);

      return abort$ => source =>
        source.pipe(
          preProcessing(file => (mocks.isHeic(file) ? mocks.fromHeic(file) : of(file)), logger, abort$),
          validate(mocks.validationRules, logger, abort$),
          clientThumb(mocks.getClientThumb, logger, abort$),
          upload(
            progressiveUpload((id, file) => batchUrls(id).pipe(concatMap(url => mocks.uploadFile(url, file)))),
            logger,
            abort$
          ),
          postProcessing(mocks.waitForServerConfirmation, logger, abort$)
        );
    }
  };
}
