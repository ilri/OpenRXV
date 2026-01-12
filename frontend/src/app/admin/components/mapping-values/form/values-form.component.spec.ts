import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ValuesForm } from './values-form.component';

describe('ValuesForm', () => {
  let component: ValuesForm;
  let fixture: ComponentFixture<ValuesForm>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [ValuesForm],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValuesForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
