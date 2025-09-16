import { Routes } from '@angular/router';
import { fetchI18n } from '@core/angular/i18n';
import { HomeComponent } from './common/home.component';
import { I18nComponent } from './i18n/i18n.component';
import { MiscComponent } from './misc/misc.component';
import { UploadsComponent } from './upload/uploads.component';
import { UtilsComponent } from './utils/utils.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'uploads',
    title: 'Uploads',
    component: UploadsComponent
  },
  {
    path: '',
    title: '2D / 3D',
    children: [
      {
        path: '3d',
        title: '3D',
        loadComponent: async () => (await import('./3d/3d.component')).ThreeComponent
      },
      {
        path: 'svg-render',
        title: 'SVG render',
        loadComponent: async () => (await import('./svg-render/svg-render.component')).SvgRenderComponent
      }
    ]
  },
  {
    path: 'utils',
    title: 'Utils',
    component: UtilsComponent
  },
  {
    path: 'misc',
    title: 'Misc',
    component: MiscComponent
  },
  {
    path: 'i18n',
    title: 'I18n',
    component: I18nComponent,
    children: [
      {
        path: 'lazy',
        loadComponent: async () => (
          await fetchI18n<'en' | 'us'>(lc => import(`./i18n/i18n-lazy.component.i18n.${lc}.ts`)),
          (await import('./i18n/i18n-lazy.component')).I18nLazyComponent
        )
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
