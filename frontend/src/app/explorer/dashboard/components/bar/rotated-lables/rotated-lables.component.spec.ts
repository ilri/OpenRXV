import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RotatedLablesComponent } from './rotated-lables.component';

describe('RotatedLablesComponent', () => {
  let component: RotatedLablesComponent;
  let fixture: ComponentFixture<RotatedLablesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [RotatedLablesComponent],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RotatedLablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
