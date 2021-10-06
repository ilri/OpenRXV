import { Queue } from 'bull';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { JsonFilesService } from 'src/admin/json-files/json-files.service';
import { ValuesService } from '../shared/services/values.service';
export declare class HarvesterService {
  readonly elasticsearchService: ElasticsearchService;
  readonly jsonFilesService: JsonFilesService;
  readonly valuesServes: ValuesService;
  private pluginsQueue;
  private fetchQueue;
  private readonly logger;
  constructor(
    elasticsearchService: ElasticsearchService,
    jsonFilesService: JsonFilesService,
    valuesServes: ValuesService,
    pluginsQueue: Queue,
    fetchQueue: Queue,
  );
  getInfoById(id: any): Promise<import('bull').Job<any> | null>;
  getInfo(): Promise<{
    active_count: number;
    waiting_count: number;
    completed_count: number;
    failed_count: number;
    plugins_active_count: number;
    plugins_waiting_count: number;
    plugins_completed_count: number;
    plugins_failed_count: number;
    completed: never[];
    failed: never[];
    plugins_completed: never[];
    plugins_failed: never[];
  }>;
  getMappingValues(): Promise<{}>;
  stopHarvest(): Promise<import('bull').Job<any>[]>;
  startHarvest(): Promise<string>;
  CheckStart(): Promise<void>;
  pluginsStart(): Promise<void>;
  Reindex(): Promise<void>;
}
