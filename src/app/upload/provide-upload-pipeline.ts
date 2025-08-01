import { FactoryProvider, inject } from '@angular/core';
import { LOGGER } from '@core/common';
import { clientThumb, heic, postProcessing, preProcessing, progressiveUpload, toLog, upload, UPLOAD_PIPELINE, UploadPipeline, validate } from '@core/upload';
import { batched } from '@core/utils';
import { concatMap, of } from 'rxjs';
import { mock } from './mock.data';

export function provideUploadPipeline(): FactoryProvider {
  return {
    provide: UPLOAD_PIPELINE,
    useFactory: (): UploadPipeline => {
      const log = toLog(inject(LOGGER));

      const batchUrls = batched(mock.getUploadUrls);

      return abort$ => source =>
        source.pipe(
          preProcessing(file => (heic.isHeic(file) ? heic.convert(file) : of(file)), log, abort$),
          validate(mock.validationRules, log, abort$),
          clientThumb(mock.getClientThumb, log, abort$),
          upload(
            progressiveUpload((id, file) => batchUrls(id).pipe(concatMap(url => mock.uploadFile(url, file))), 5),
            log,
            abort$
          ),
          postProcessing(mock.waitForServerConfirmation, log, abort$)
        );
    }
  };
}
