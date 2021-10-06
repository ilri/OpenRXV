"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SharedModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedModule = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@nestjs/elasticsearch");
const elastic_service_1 = require("./services/elastic/elastic.service");
const metadata_service_1 = require("./services/metadata.service");
const values_service_1 = require("./services/values.service");
const share_service_1 = require("./services/share.service");
const startup_service_1 = require("./services/startup/startup.service");
const config_1 = require("@nestjs/config");
const json_files_service_1 = require("src/admin/json-files/json-files.service");
const formater_service_1 = require("./services/formater.service");
const harveter_service_1 = require("../harvester/services/harveter.service");
const bull_1 = require("@nestjs/bull");
let SharedModule = SharedModule_1 = class SharedModule {
};
SharedModule = SharedModule_1 = __decorate([
    common_1.Module({
        imports: [
            config_1.ConfigModule.forRoot(),
            elasticsearch_1.ElasticsearchModule.register({
                node: process.env.ELASTICSEARCH_HOST,
            }),
            common_1.HttpModule.register({
                headers: {
                    'User-Agent': 'OpenRXV harvesting bot; https://github.com/ilri/OpenRXV',
                },
            }),
            bull_1.BullModule.registerQueue({
                name: 'fetch',
                defaultJobOptions: {
                    attempts: 10,
                },
                settings: {
                    stalledInterval: 2000,
                    maxStalledCount: 10,
                    retryProcessDelay: 2000,
                    drainDelay: 20000,
                },
                redis: {
                    host: process.env.REDIS_HOST,
                    port: parseInt(process.env.REDIS_PORT),
                },
            }),
            bull_1.BullModule.registerQueue({
                name: 'plugins',
                defaultJobOptions: {
                    attempts: 5,
                    timeout: 900000,
                },
                settings: {
                    lockDuration: 900000,
                    maxStalledCount: 0,
                    retryProcessDelay: 9000,
                    drainDelay: 9000,
                },
                redis: {
                    host: process.env.REDIS_HOST,
                    port: parseInt(process.env.REDIS_PORT),
                },
            }),
        ],
        providers: [
            elastic_service_1.ElasticService,
            metadata_service_1.MetadataService,
            values_service_1.ValuesService,
            share_service_1.ShareService,
            startup_service_1.StartupService,
            json_files_service_1.JsonFilesService,
            formater_service_1.FormatSearvice,
            harveter_service_1.HarvesterService,
        ],
        exports: [
            SharedModule_1,
            bull_1.BullModule,
            elasticsearch_1.ElasticsearchModule,
            elastic_service_1.ElasticService,
            metadata_service_1.MetadataService,
            values_service_1.ValuesService,
            share_service_1.ShareService,
            common_1.HttpModule,
            json_files_service_1.JsonFilesService,
            formater_service_1.FormatSearvice,
            harveter_service_1.HarvesterService,
        ],
    })
], SharedModule);
exports.SharedModule = SharedModule;
