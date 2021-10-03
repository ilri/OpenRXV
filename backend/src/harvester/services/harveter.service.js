"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var HarvesterService_1, _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HarvesterService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const elasticsearch_1 = require("@nestjs/elasticsearch");
const json_files_service_1 = require("src/admin/json-files/json-files.service");
const values_service_1 = require("src/shared/services/values.service");
const sitemapper_1 = __importDefault(require("sitemapper"));
let HarvesterService = HarvesterService_1 = class HarvesterService {
    constructor(elasticsearchService, jsonFilesService, valuesServes, pluginsQueue, fetchQueue) {
        this.elasticsearchService = elasticsearchService;
        this.jsonFilesService = jsonFilesService;
        this.valuesServes = valuesServes;
        this.pluginsQueue = pluginsQueue;
        this.fetchQueue = fetchQueue;
        this.logger = new common_1.Logger(HarvesterService_1.name);
    }
    getInfoById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let job = yield this.fetchQueue.getJob(id);
            return job;
        });
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let obj = {
                active_count: 0,
                waiting_count: 0,
                completed_count: 0,
                failed_count: 0,
                plugins_active_count: 0,
                plugins_waiting_count: 0,
                plugins_completed_count: 0,
                plugins_failed_count: 0,
                completed: [],
                failed: [],
                plugins_completed: [],
                plugins_failed: [],
            };
            obj.active_count = yield this.fetchQueue.getActiveCount();
            obj.waiting_count = yield this.fetchQueue.getWaitingCount();
            obj.completed_count = yield this.fetchQueue.getCompletedCount();
            obj.failed_count = yield this.fetchQueue.getFailedCount();
            obj.completed = yield this.fetchQueue.getCompleted(0, 10);
            obj.failed = yield this.fetchQueue.getFailed(0, 10);
            obj.plugins_active_count = yield this.pluginsQueue.getActiveCount();
            obj.plugins_waiting_count = yield this.pluginsQueue.getWaitingCount();
            obj.plugins_completed_count = yield this.pluginsQueue.getCompletedCount();
            obj.plugins_failed_count = yield this.pluginsQueue.getFailedCount();
            obj.plugins_completed = yield this.pluginsQueue.getCompleted(0, 10);
            obj.plugins_failed = yield this.pluginsQueue.getFailed(0, 10);
            return obj;
        });
    }
    getMappingValues() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield this.valuesServes.find();
            let values = {};
            data.hits.map((d) => (values[d._source.find] = d._source.replace));
            return values;
        });
    }
    stopHarvest() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('Stopping Harvest');
            yield this.fetchQueue.pause();
            yield this.fetchQueue.empty();
            yield this.fetchQueue.clean(0, 'wait');
            yield this.pluginsQueue.pause();
            yield this.pluginsQueue.empty();
            yield this.pluginsQueue.clean(0, 'failed');
            yield this.pluginsQueue.clean(0, 'wait');
            yield this.pluginsQueue.clean(0, 'active');
            yield this.pluginsQueue.clean(0, 'delayed');
            yield this.pluginsQueue.clean(0, 'completed');
            return yield this.fetchQueue.clean(0, 'active');
        });
    }
    startHarvest() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('Starting Harvest');
            yield this.fetchQueue.pause();
            yield this.fetchQueue.empty();
            yield this.fetchQueue.clean(0, 'failed');
            yield this.fetchQueue.clean(0, 'wait');
            yield this.fetchQueue.clean(0, 'active');
            yield this.fetchQueue.clean(0, 'delayed');
            yield this.fetchQueue.clean(0, 'completed');
            yield this.fetchQueue.resume();
            let settings = yield this.jsonFilesService.read('../../../data/dataToUse.json');
            settings.repositories.forEach((repo) => __awaiter(this, void 0, void 0, function* () {
                if (repo.type == 'dspace') {
                    const Sitemap = new sitemapper_1.default({
                        url: repo.siteMap,
                        timeout: 15000,
                    });
                    try {
                        const { sites } = yield Sitemap.fetch();
                        let itemsCount = sites.length;
                        let pages = Math.round(itemsCount / 10);
                        for (let page_number = 1; page_number <= pages; page_number++) {
                            setTimeout(() => {
                                this.fetchQueue.add('fetch', { page: page_number, repo });
                            }, page_number <= 5 ? page_number * 500 : 0);
                        }
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
                else
                    this.fetchQueue.add(repo.type, { repo });
            }));
            return 'started';
        });
    }
    CheckStart() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.fetchQueue.pause();
            yield this.fetchQueue.empty();
            yield this.fetchQueue.clean(0, 'wait');
            yield this.fetchQueue.clean(0, 'active');
            yield this.fetchQueue.clean(0, 'completed');
            yield this.fetchQueue.clean(0, 'failed');
            yield this.fetchQueue.resume();
            return yield this.Reindex();
        });
    }
    pluginsStart() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pluginsQueue.pause();
            yield this.pluginsQueue.empty();
            yield this.pluginsQueue.clean(0, 'failed');
            yield this.pluginsQueue.clean(0, 'wait');
            yield this.pluginsQueue.clean(0, 'active');
            yield this.pluginsQueue.clean(0, 'delayed');
            yield this.pluginsQueue.clean(0, 'completed');
            yield this.pluginsQueue.resume();
            let plugins = yield this.jsonFilesService.read('../../../data/plugins.json');
            if (plugins.filter((plugin) => plugin.value.length > 0).length > 0)
                for (let plugin of plugins) {
                    for (let param of plugin.value) {
                        yield this.pluginsQueue.add(plugin.name, Object.assign(Object.assign({}, param), { page: 1, index: process.env.OPENRXV_TEMP_INDEX }));
                    }
                }
        });
    }
    Reindex() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug('reindex function is called');
            yield this.elasticsearchService.indices.updateAliases({
                body: {
                    actions: [
                        {
                            remove: {
                                index: process.env.OPENRXV_FINAL_INDEX,
                                alias: process.env.OPENRXV_ALIAS,
                            },
                        },
                        {
                            add: {
                                index: process.env.OPENRXV_TEMP_INDEX,
                                alias: process.env.OPENRXV_ALIAS,
                            },
                        },
                    ],
                },
            });
            this.logger.debug('updateAliases final to tmep');
            yield this.elasticsearchService.indices.delete({
                index: process.env.OPENRXV_FINAL_INDEX,
                ignore_unavailable: true,
            });
            this.logger.debug('delete final');
            yield this.elasticsearchService.indices.create({
                index: process.env.OPENRXV_FINAL_INDEX,
            });
            this.logger.debug('create final');
            yield this.elasticsearchService
                .reindex({
                wait_for_completion: true,
                body: {
                    conflicts: 'proceed',
                    source: {
                        index: process.env.OPENRXV_TEMP_INDEX,
                    },
                    dest: { index: process.env.OPENRXV_FINAL_INDEX },
                },
            }, { requestTimeout: 2000000 })
                .catch((e) => this.logger.log(e));
            this.logger.debug('reindex to final');
            yield this.elasticsearchService.indices.updateAliases({
                body: {
                    actions: [
                        {
                            remove: {
                                index: process.env.OPENRXV_TEMP_INDEX,
                                alias: process.env.OPENRXV_ALIAS,
                            },
                        },
                        {
                            add: {
                                index: process.env.OPENRXV_FINAL_INDEX,
                                alias: process.env.OPENRXV_ALIAS,
                            },
                        },
                    ],
                },
            });
            this.logger.debug('updateAliases temp to final');
            yield this.elasticsearchService.indices.delete({
                index: process.env.OPENRXV_TEMP_INDEX,
                ignore_unavailable: true,
            });
            this.logger.debug('delete temp');
            yield this.elasticsearchService.indices.create({
                index: process.env.OPENRXV_TEMP_INDEX,
            });
            this.logger.debug('create temp');
            this.logger.debug('Index All Done ');
        });
    }
};
HarvesterService = HarvesterService_1 = __decorate([
    common_1.Injectable(),
    __param(3, bull_1.InjectQueue('plugins')),
    __param(4, bull_1.InjectQueue('fetch')),
    __metadata("design:paramtypes", [elasticsearch_1.ElasticsearchService, typeof (_a = typeof json_files_service_1.JsonFilesService !== "undefined" && json_files_service_1.JsonFilesService) === "function" ? _a : Object, typeof (_b = typeof values_service_1.ValuesService !== "undefined" && values_service_1.ValuesService) === "function" ? _b : Object, Object, Object])
], HarvesterService);
exports.HarvesterService = HarvesterService;
