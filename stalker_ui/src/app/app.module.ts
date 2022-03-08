import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DefaultModule } from './layouts/default/default.module';
import { AuthenticationModule } from './layouts/authentication/authentication.module';
import { EditUserComponent } from './modules/admin/edit-user/edit-user.component';
import { CreateUserComponent } from './modules/admin/create-user/create-user.component';
import { NotFoundComponent } from './error-pages/not-found/not-found.component';
import { SharedModule } from './shared/shared.module';
import { NotFoundModule } from './error-pages/not-found/not-found.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    DefaultModule,
    AuthenticationModule,
    SharedModule,
    NotFoundModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
