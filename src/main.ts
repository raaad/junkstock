import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

// eslint-disable-next-line no-console
bootstrapApplication(AppComponent, appConfig).catch(e => console.error(e));

declare const APP_VERSION: string;
// eslint-disable-next-line no-console
console.log(`version: ${APP_VERSION}`);
