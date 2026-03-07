import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginatedListComponent } from './paginated-list.component';

describe('PaginatedListComponent', () => {
  let component: PaginatedListComponent;
  let fixture: ComponentFixture<PaginatedListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [PaginatedListComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaginatedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
