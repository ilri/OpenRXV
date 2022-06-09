import { TestBed } from '@angular/core/testing';

import { NoSapceService } from './no-sapce.service';

describe('NoSapceService', () => {
  let service: NoSapceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoSapceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
