import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [provideExperimentalZonelessChangeDetection(), provideRouter(routes)]
})
  // eslint-disable-next-line no-console
  .catch(err => console.error(err));
