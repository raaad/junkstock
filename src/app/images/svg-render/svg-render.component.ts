import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SvgRenderer } from '../../../core/svg-renderer';
import { blobToObjectUrl } from '../../../core/utils';
import { provideImageUrlResolvers } from './image-url.resolvers';
import { RENDER_DATA } from './render-mock.data';
import { provideRenderer } from './renderer.component';

@Component({
  selector: 'app-svg-render',
  template: `
    <button (click)="render()" class="btn btn-sm">Render NG component as JPG</button>

    @if (result()) {
      <img [src]="result()" alt="" />
    }
  `,
  styles: [
    `
      :host {
        padding: 1rem;
      }

      img {
        margin-top: 1rem;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SvgRenderer, ...provideRenderer(), ...provideImageUrlResolvers()]
})
export class SvgRenderComponent {
  private renderer: SvgRenderer<typeof RENDER_DATA> = inject(SvgRenderer);

  protected readonly result = signal(undefined as string | undefined);

  async render() {
    const blob = await this.renderer.render('jpeg', RENDER_DATA, { size: { width: 400, height: 600 }, logLevel: 'trace' });

    this.result.set(blobToObjectUrl(blob));
  }
}
