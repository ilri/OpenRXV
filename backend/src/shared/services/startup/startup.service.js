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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartupService = void 0;
const common_1 = require("@nestjs/common");
const elastic_service_1 = require("../elastic/elastic.service");
const json_files_service_1 = require("src/admin/json-files/json-files.service");
let StartupService = class StartupService {
    constructor(elsticsearch, jsonfileservice) {
        this.elsticsearch = elsticsearch;
        this.jsonfileservice = jsonfileservice;
        this.elsticsearch.startup();
        this.jsonfileservice.startup();
    }
};
StartupService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [elastic_service_1.ElasticService, typeof (_a = typeof json_files_service_1.JsonFilesService !== "undefined" && json_files_service_1.JsonFilesService) === "function" ? _a : Object])
], StartupService);
exports.StartupService = StartupService;
