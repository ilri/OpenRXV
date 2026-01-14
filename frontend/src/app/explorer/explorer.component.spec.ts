import { TestBed, async } from '@angular/core/testing';
import { ExplorerComponent } from './explorer.component';

describe('ExplorerComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ExplorerComponent],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(ExplorerComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'RES'`, () => {
    const fixture = TestBed.createComponent(ExplorerComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('RES');
  });

  it('should render title in a h1 tag', () => {
    const fixture = TestBed.createComponent(ExplorerComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain(
      'Welcome to RES!',
    );
  });
});
