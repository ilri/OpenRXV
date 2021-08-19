import { TestBed } from '@angular/core/testing';

import { BodyBuilderService } from './body-builder.service';

describe('BodyBuilderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BodyBuilderService = TestBed.inject(BodyBuilderService);
    expect(service).toBeTruthy();
  });
});
