import { ElasticService } from '../elastic/elastic.service';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
export declare class StartupService {
  private elsticsearch;
  private jsonfileservice;
  constructor(elsticsearch: ElasticService, jsonfileservice: JsonFilesService);
}
