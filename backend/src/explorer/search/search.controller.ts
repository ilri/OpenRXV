import { Controller, Body, Post, HttpCode, Param, Query } from '@nestjs/common';
import { ElasticService } from '../../shared/services/elastic/elastic.service';
import { SearchRequest } from '@elastic/elasticsearch/lib/api/types';

@Controller('search')
export class SearchController {
  constructor(private readonly elasticSearvice: ElasticService) {}
  @HttpCode(200)
  @Post('/')
  search(
    @Body('dashboard') dashboard = 'DEFAULT_DASHBOARD',
    @Body('query') query: SearchRequest = {},
    @Query('scroll') scroll: string,
  ) {
    query['track_total_hits'] = true;
    return this.elasticSearvice.search(query, null, scroll, dashboard);
  }

  @HttpCode(200)
  @Post('/:size')
  Sizesearch(
    @Body('dashboard') dashboard = 'DEFAULT_DASHBOARD',
    @Body() query: SearchRequest,
    @Param('size') size = 10,
    @Query('scroll') scroll: string,
  ) {
    query['track_total_hits'] = true;
    return this.elasticSearvice.search(query, size, scroll, dashboard);
  }

  @HttpCode(200)
  @Post('/scroll/:scroll')
  async searchScroll(@Body() query: SearchRequest, @Param('scroll') scroll: string) {
    query['track_total_hits'] = true;
    const body = await this.elasticSearvice.get(null, 'DEFAULT_DASHBOARD', query, scroll);
    return body;
  }
}
