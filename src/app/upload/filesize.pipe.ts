import { Pipe, PipeTransform } from '@angular/core';
import { filesize, FileSizeOptions } from 'filesize';

@Pipe({ name: 'filesize', pure: true, standalone: true })
export class FilesizePipe implements PipeTransform {
  transform(value: number, options?: FileSizeOptions) {
    return filesize(value, options);
  }
}
