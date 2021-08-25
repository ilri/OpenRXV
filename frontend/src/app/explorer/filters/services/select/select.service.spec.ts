import { TestBed } from '@angular/core/testing';

import { SelectService } from './select.service';

describe('SelectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SelectService = TestBed.inject(SelectService);
    expect(service).toBeTruthy();
  });
});
