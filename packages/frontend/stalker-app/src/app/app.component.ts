import { Component } from '@angular/core';
import { PreviousRouteService } from './services/previous-route.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Red Kite';

  constructor(
    private theme: ThemeService,
    private previousRouteService: PreviousRouteService
  ) {}
}
