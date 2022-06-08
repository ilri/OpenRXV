import { Test, TestingModule } from '@nestjs/testing';
import { DashboardsController } from './dashboards.controller';

describe('DashboardsController', () => {
  let controller: DashboardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardsController],
    }).compile();

    controller = module.get<DashboardsController>(DashboardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
