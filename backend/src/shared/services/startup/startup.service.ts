import { Injectable } from '@nestjs/common';
import { ElasticService } from '../elastic/elastic.service';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';

@Injectable()
export class StartupService {
  constructor(
    private elsticsearch: ElasticService,
    private jsonfileservice: JsonFilesService,
  ) {
    this.elsticsearch.startup();
    this.jsonfileservice.startup();
  }
}
