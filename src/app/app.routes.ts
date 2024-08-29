import { Routes } from '@angular/router';
import { SizesComponent } from './images/sizes/sizes.component';

export const routes: Routes = [
  {
    path: 'images',
    children: [
      {
        path: 'sizes',
        component: SizesComponent,
        title: 'Sizes'
      }
    ],
    title: 'Images'
  },
  {
    path: '3d',
    loadComponent: async () => (await import('./3d/3d.component')).ThreeDComponent,
    title: '3D'
  },
  {
    path: 'utils',
    loadComponent: async () => (await import('./utils/utils.component')).UtilsComponent,
    title: 'Utils'
  }
];
