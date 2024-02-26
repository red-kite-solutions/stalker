import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import 'moment/locale/fr';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { ToastrModule } from 'ngx-toastr';
import { environment } from '../environments/environment';
import { AuthService } from './api/auth/auth.service';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NotFoundModule } from './error-pages/not-found/not-found.module';
import { getPaginatorIntl } from './i18n/paginator/paginator.i18n';
import { DefaultModule } from './layouts/default/default.module';
import { UnauthenticatedModule } from './layouts/unauthenticated/unauthenticated.module';
import { ErrorInterceptor } from './middlewares/error.interceptor';
import { JwtInterceptor } from './middlewares/jwt.interceptor';
import { SharedModule } from './shared/shared.module';
import { CodeEditorService } from './shared/widget/code-editor/code-editor.service';

const config: SocketIoConfig = {
  url: environment.fmWsUrl,
  options: {},
};

export const MY_FORMATS = {
  parse: {
    dateInput: 'YYYY/MM/DD',
  },
  display: {
    dateInput: 'YYYY/MM/DD',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'YYYY/MM/DD',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DefaultModule,
    UnauthenticatedModule,
    SharedModule,
    NotFoundModule,
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-bottom-right',
      preventDuplicates: true,
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning',
      },
    }),
    SocketIoModule.forRoot(config),
    HttpClientModule,
  ],
  providers: [
    AuthService,
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: MatPaginatorIntl, useValue: getPaginatorIntl() },
    {
      provide: APP_INITIALIZER,
      useFactory: (service: CodeEditorService) => () => service.load(),
      multi: true,
      deps: [CodeEditorService],
    },
    provideMomentDateAdapter(MY_FORMATS),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
