import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReprotingFormComponent } from './reproting-form.component';

describe('ReprotingFormComponent', () => {
  let component: ReprotingFormComponent;
  let fixture: ComponentFixture<ReprotingFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ReprotingFormComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReprotingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
