import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { FileUpload, Upload, UploadId } from './upload.types';

export type UploadPipeline = (abort$: Observable<UploadId>) => (source: Observable<FileUpload | Upload>) => Observable<Upload>;

export const UPLOAD_PIPELINE = new InjectionToken<UploadPipeline>('UPLOAD_PIPELINE');
