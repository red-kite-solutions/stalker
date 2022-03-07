import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Output()
  toggleSideBarEvent: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void { }

  toggleSideBar() {
    this.toggleSideBarEvent.emit();
  }

  search() {
    console.log("searching...");
  }

  focus() {
    console.log("focus");
  }

}
