import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IndexesComponent } from './indexes.component';

describe('IndexesComponent', () => {
  let component: IndexesComponent;
  let fixture: ComponentFixture<IndexesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [IndexesComponent],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IndexesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
