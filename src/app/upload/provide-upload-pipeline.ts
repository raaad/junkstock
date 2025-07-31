import { FactoryProvider, inject } from '@angular/core';
import { LOGGER } from '@core/common';
import { clientThumb, heic, postProcessing, preProcessing, progressiveUpload, upload, UPLOAD_PIPELINE, UploadPipeline, validate } from '@core/upload';
import { batched } from '@core/utils';
import { concatMap, of } from 'rxjs';
import { mocks } from './mocks';

export function provideUploadPipeline(): FactoryProvider {
  return {
    provide: UPLOAD_PIPELINE,
    useFactory: (): UploadPipeline => {
      const logger = inject(LOGGER);

      const batchUrls = batched(mocks.getUploadUrls);

      return abort$ => source =>
        source.pipe(
          preProcessing(file => (heic.isHeic(file) ? heic.convert(file) : of(file)), logger, abort$),
          validate(mocks.validationRules, logger, abort$),
          clientThumb(mocks.getClientThumb, logger, abort$),
          upload(
            progressiveUpload((id, file) => batchUrls(id).pipe(concatMap(url => mocks.uploadFile(url, file))), 5),
            logger,
            abort$
          ),
          postProcessing(mocks.waitForServerConfirmation, logger, abort$)
        );
    }
  };
}
