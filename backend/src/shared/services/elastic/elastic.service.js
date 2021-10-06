"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticService = void 0;
const common_1 = require("@nestjs/common");
const elasticsearch_1 = require("@nestjs/elasticsearch");
const bcrypt = __importStar(require("bcrypt"));
let ElasticService = class ElasticService {
    constructor(elasticsearchService) {
        this.elasticsearchService = elasticsearchService;
        this.index = 'openrxv-users';
    }
    startup() {
        return __awaiter(this, void 0, void 0, function* () {
            let values_exist = yield this.elasticsearchService.indices.exists({
                index: 'openrxv-values',
            });
            let users_exist = yield this.elasticsearchService.indices.exists({
                index: 'openrxv-users',
            });
            let shared_exist = yield this.elasticsearchService.indices.exists({
                index: 'openrxv-shared',
            });
            let items_final_exist = yield this.elasticsearchService.indices.exists({
                index: process.env.OPENRXV_FINAL_INDEX,
            });
            let items_temp_exist = yield this.elasticsearchService.indices.exists({
                index: process.env.OPENRXV_TEMP_INDEX,
            });
            if (!items_final_exist.body)
                yield this.elasticsearchService.indices.create({
                    index: process.env.OPENRXV_FINAL_INDEX,
                });
            if (!items_temp_exist.body)
                yield this.elasticsearchService.indices.create({
                    index: process.env.OPENRXV_TEMP_INDEX,
                });
            if (!shared_exist.body)
                yield this.elasticsearchService.indices.create({
                    index: 'openrxv-shared',
                });
            if (!values_exist.body)
                yield this.elasticsearchService.indices.create({
                    index: 'openrxv-values',
                });
            yield this.elasticsearchService.cluster.putSettings({
                body: {
                    transient: {
                        'cluster.routing.allocation.disk.threshold_enabled': false,
                    },
                },
            });
            yield this.elasticsearchService.indices.putSettings({
                body: {
                    'index.blocks.read_only_allow_delete': null,
                },
            });
            if (!users_exist.body) {
                let body = {
                    name: 'admin',
                    role: 'Admin',
                    email: 'admin',
                    password: 'admin',
                };
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync(body.password, salt);
                body.password = hash;
                yield this.add(body);
            }
        });
    }
    search(query, size = 10, scroll = null) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let options = {
                    index: process.env.OPENRXV_ALIAS,
                    method: 'POST',
                    body: query,
                };
                if (scroll)
                    options.scroll = scroll;
                if (size)
                    options.size = size;
                const { body } = yield this.elasticsearchService.search(options);
                return body;
            }
            catch (e) {
                return e;
            }
        });
    }
    add(item) {
        return __awaiter(this, void 0, void 0, function* () {
            item['created_at'] = new Date();
            let { body } = yield this.elasticsearchService.index({
                index: this.index,
                refresh: 'wait_for',
                body: item,
            });
            return body;
        });
    }
    update(id, item) {
        return __awaiter(this, void 0, void 0, function* () {
            let update = {
                id,
                index: this.index,
                refresh: 'wait_for',
                body: { doc: item },
            };
            return this.elasticsearchService.update(update);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let { body } = yield this.elasticsearchService.delete({
                index: this.index,
                refresh: 'wait_for',
                id,
            });
            return body._source;
        });
    }
    findOne(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let { body } = yield this.elasticsearchService.get({
                index: this.index,
                id,
            });
            return body._source;
        });
    }
    findByTerm(term = '') {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let obj;
                if (term != '')
                    obj = {
                        multi_match: {
                            query: term,
                        },
                    };
                else
                    obj = {
                        match_all: {},
                    };
                let { body } = yield this.elasticsearchService.search({
                    index: this.index,
                    method: 'POST',
                    from: 0,
                    size: 9999,
                    body: {
                        track_total_hits: true,
                        query: obj,
                        sort: [
                            {
                                created_at: {
                                    order: 'desc',
                                },
                            },
                        ],
                    },
                });
                return body.hits;
            }
            catch (e) {
                return { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] };
            }
        });
    }
    find(obj = null) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (obj)
                    obj = { bool: { filter: { term: obj } } };
                else
                    obj = {
                        match_all: {},
                    };
                let { body } = yield this.elasticsearchService.search({
                    index: this.index,
                    from: 0,
                    method: 'POST',
                    size: 9999,
                    body: {
                        track_total_hits: true,
                        query: obj,
                        sort: {
                            created_at: {
                                order: 'desc',
                            },
                        },
                    },
                });
                return body.hits;
            }
            catch (e) {
                return { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] };
            }
        });
    }
    get(q, scrollId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let scrollSearch;
                if (scrollId) {
                    scrollSearch = yield this.elasticsearchService.scroll({
                        scroll_id: scrollId,
                        scroll: '10m',
                        method: 'POST',
                    });
                }
                else {
                    scrollSearch = yield this.elasticsearchService.search({
                        index: process.env.OPENRXV_ALIAS,
                        scroll: '10m',
                        method: 'POST',
                        body: Object.assign({}, q),
                    });
                }
                return scrollSearch;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
};
ElasticService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [elasticsearch_1.ElasticsearchService])
], ElasticService);
exports.ElasticService = ElasticService;
