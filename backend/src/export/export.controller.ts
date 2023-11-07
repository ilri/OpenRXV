import { Controller, Post, Body, Response, HttpCode } from '@nestjs/common';
import { ExportService } from './services/export/export.service';
import { ElasticService } from '../shared/services/elastic/elastic.service';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';

@Controller('export')
export class ExportController {
  constructor(
    private jsonfielServoce: JsonFilesService,
    private exportService: ExportService,
    private elasticService: ElasticService,
  ) {}
  @HttpCode(200)
  @Post('/')
  async ExportData(@Body() body: any, @Response() res: any) {
    try {
      const {
        type,
        scrollId,
        query,
        part,
        fileName,
        file,
        webSiteName,
        dashboard = 'DEFAULT_DASHBOARD',
      } = body;

      const index_name =
        await this.jsonfielServoce.getIndexFromDashboard(dashboard);
      if (query) query['_source'] = [];
      const searchQuery: any = { ...query, size: 2000 };
      this.exportService.downloadFile(
        res,
        await this.elasticService.get(index_name, searchQuery, scrollId),
        type,
        part,
        fileName,
        file,
        query,
        webSiteName,
      );
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  }
}
