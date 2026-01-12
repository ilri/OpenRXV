import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PubImageComponent } from './pub-image.component';

describe('PubImageComponent', () => {
  let component: PubImageComponent;
  let fixture: ComponentFixture<PubImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [PubImageComponent],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PubImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
