import { TestBed } from '@angular/core/testing';
import { ItemsService } from './items.service';

describe('ItemsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ItemsService = TestBed.inject(ItemsService);
    expect(service).toBeTruthy();
  });
});
