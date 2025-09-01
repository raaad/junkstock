import { Routes } from '@angular/router';
import { HomeComponent } from './common/home.component';
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
    component: UploadsComponent,
    title: 'Uploads'
  },
  {
    path: '',
    children: [
      {
        path: '3d',
        loadComponent: async () => (await import('./3d/3d.component')).ThreeComponent,
        title: '3D'
      },
      {
        path: 'svg-render',
        loadComponent: async () => (await import('./svg-render/svg-render.component')).SvgRenderComponent,
        title: 'SVG render'
      }
    ],
    title: '2D / 3D'
  },
  {
    path: 'utils',
    component: UtilsComponent,
    title: 'Utils'
  },
  {
    path: 'misc',
    component: MiscComponent,
    title: 'Misc'
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
