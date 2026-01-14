import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IconsWithTextComponent } from './icons-with-text.component';

describe('IconsWithTextComponent', () => {
  let component: IconsWithTextComponent;
  let fixture: ComponentFixture<IconsWithTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [IconsWithTextComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IconsWithTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
