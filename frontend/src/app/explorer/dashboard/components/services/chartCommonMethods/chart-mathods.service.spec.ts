import { TestBed } from '@angular/core/testing';

import { ChartMathodsService } from './chart-mathods.service';

describe('ChartMathodsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ChartMathodsService = TestBed.inject(ChartMathodsService);
    expect(service).toBeTruthy();
  });
});
