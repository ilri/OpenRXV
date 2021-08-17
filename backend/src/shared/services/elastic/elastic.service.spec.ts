import { Test, TestingModule } from '@nestjs/testing';
import { ElasticService } from './elastic.service';

describe('ElasticService', () => {
  let service: ElasticService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElasticService],
    }).compile();

    service = module.get<ElasticService>(ElasticService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
