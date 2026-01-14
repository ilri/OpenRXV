import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PackedBubbleSplitComponent } from './packed-bubble-split.component';

describe('PackedBubbleSplitComponent', () => {
  let component: PackedBubbleSplitComponent;
  let fixture: ComponentFixture<PackedBubbleSplitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [PackedBubbleSplitComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PackedBubbleSplitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
