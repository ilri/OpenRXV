import { TestBed } from '@angular/core/testing';

import { BarService } from './bar.service';

describe('BarService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BarService = TestBed.inject(BarService);
    expect(service).toBeTruthy();
  });
});
