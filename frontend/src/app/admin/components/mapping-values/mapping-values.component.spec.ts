import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MappingValuesComponent } from './mapping-values.component';

describe('MappingValuesComponent', () => {
  let component: MappingValuesComponent;
  let fixture: ComponentFixture<MappingValuesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [MappingValuesComponent],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MappingValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
