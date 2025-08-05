import { Routes } from '@angular/router';
import { HomeComponent } from './common/home.component';

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
    path: '3d',
    loadComponent: async () => (await import('./3d/3d.component')).ThreeComponent,
    title: '3D'
  },
  {
    path: 'svg-render',
    loadComponent: async () => (await import('./svg-render/svg-render.component')).SvgRenderComponent,
    title: 'SVG render'
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
