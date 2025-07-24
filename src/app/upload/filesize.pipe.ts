import { Pipe, PipeTransform } from '@angular/core';
import { filesize, FilesizeOptions } from 'filesize';

@Pipe({ name: 'filesize', pure: true, standalone: true })
export class FilesizePipe implements PipeTransform {
  transform(value: number, options?: FilesizeOptions) {
    return filesize(value, options);
  }
}
