import { Test, TestingModule } from '@nestjs/testing';
import { JsonFilesService } from './json-files.service';

describe('JsonFilesService', () => {
  let service: JsonFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JsonFilesService],
    }).compile();

    service = module.get<JsonFilesService>(JsonFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
