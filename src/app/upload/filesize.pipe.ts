import { Pipe, PipeTransform } from "@angular/core";
import { filesize } from "filesize";

@Pipe({ name: 'filesize', pure: true, standalone: true })
export class FilesizePipe implements PipeTransform {
  transform(value: any, options?: any) {
    return filesize(value, options);
  }
}