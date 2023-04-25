import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextSelectMenuComponent } from './text-select-menu.component';

describe('TextSelectMenuComponent', () => {
  let component: TextSelectMenuComponent;
  let fixture: ComponentFixture<TextSelectMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextSelectMenuComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextSelectMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
