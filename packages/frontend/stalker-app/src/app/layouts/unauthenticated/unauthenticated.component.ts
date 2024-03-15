import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-unauthenticated',
  templateUrl: './unauthenticated.component.html',
  styleUrls: ['./unauthenticated.component.scss'],
})
export class UnauthenticatedComponent {
  constructor(private titleService: Title) {
    this.titleService.setTitle($localize`:Unauthenticated page title|:Oops! You're unauthenticated.`);
  }
}
