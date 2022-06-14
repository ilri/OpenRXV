import { Controller, Body, Post, HttpCode, Param, Query } from '@nestjs/common';
import { ElasticService } from '../../shared/services/elastic/elastic.service';

@Controller('search')
export class SearchController {
  constructor(private readonly elasticSearvice: ElasticService) {}
  @HttpCode(200)
  @Post('/')
  search(
    @Body('dashboard') dashboard: any,
    @Body('query') query: any = {},
    @Query('scroll') scroll: string,
  ) {
    query['track_total_hits'] = true;
    return this.elasticSearvice.search(query, null, scroll, dashboard);
  }

  @HttpCode(200)
  @Post('/:size')
  Sizesearch(
      @Body('dashboard') dashboard: any,
    @Body() query: any,
    @Param('size') size = 10,
    @Query('scroll') scroll: string,
  ) {
    query['track_total_hits'] = true;
    return this.elasticSearvice.search(query, size, scroll, dashboard);
  }

  @HttpCode(200)
  @Post('/scroll/:scroll')
  async searchScroll(@Body() query: any, @Param('scroll') scroll: string) {
    query['track_total_hits'] = true;
    const { body } = await this.elasticSearvice.get(query, scroll);
    return body;
  }
}
