export enum UploadState {
  Enqueued,
  Processing,
  Uploading,
  Uploaded,
  Failed,
  Aborted
}

export type UploadId = string;

export interface Upload {
  id: UploadId;
  name: string;
  path: string;
  size: number;
  uploaded: number;
  state: UploadState;
  errors: string[];
  thumb?: { url: string; width: number; height: number };
}

export interface FileUpload extends Upload {
  file: File;
}

export type QueueUpload = Pick<FileUpload, 'id' | 'file'>;

export type Logger = Pick<typeof console, 'trace' | 'debug' | 'error' | 'warn'>;
