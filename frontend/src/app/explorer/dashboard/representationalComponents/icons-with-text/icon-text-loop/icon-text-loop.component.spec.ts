import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IconTextLoopComponent } from './icon-text-loop.component';

describe('IconTextLoopComponent', () => {
  let component: IconTextLoopComponent;
  let fixture: ComponentFixture<IconTextLoopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [IconTextLoopComponent],
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IconTextLoopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
