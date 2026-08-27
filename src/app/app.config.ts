import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { CORE_SERVICE_PROVIDERS } from './core/services/core.providers';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideNoopAnimations(),
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    ...CORE_SERVICE_PROVIDERS,
  ],
};
