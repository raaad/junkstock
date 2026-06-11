import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

// eslint-disable-next-line no-console
bootstrapApplication(App, appConfig).catch(e => console.error(e));

declare const APP_VERSION: string;
// eslint-disable-next-line no-console
console.log(`version: ${APP_VERSION}`);
