import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PackedBubbleComponent } from './packed-bubble.component';

describe('PackedBubbleComponent', () => {
  let component: PackedBubbleComponent;
  let fixture: ComponentFixture<PackedBubbleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [PackedBubbleComponent],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PackedBubbleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
