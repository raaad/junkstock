import { Routes } from '@angular/router';
import { HomeComponent } from './common/home.component';
import { SizesComponent } from './images/sizes/sizes.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'uploads',
    loadComponent: async () => (await import('./upload/uploads.component')).UploadsComponent,
    title: 'Uploads'
  },
  {
    path: 'images',
    children: [
      {
        path: 'sizes',
        component: SizesComponent,
        title: 'Sizes'
      },
      {
        path: 'svg-render',
        loadComponent: async () => (await import('./images/svg-render/svg-render.component')).SvgRenderComponent,
        title: 'SVG render'
      }
    ],
    title: 'Images'
  },
  {
    path: '3d',
    loadComponent: async () => (await import('./3d/3d.component')).ThreeComponent,
    title: '3D'
  },
  {
    path: 'utils',
    loadComponent: async () => (await import('./utils/utils.component')).UtilsComponent,
    title: 'Utils'
  },
  {
    path: 'misc',
    loadComponent: async () => (await import('./misc/misc.component')).MiscComponent,
    title: 'Misc'
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
