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
exports.FormatSearvice = void 0;
const _ = __importStar(require("underscore"));
const ISO = __importStar(require("iso-3166-1"));
const moment = __importStar(require("moment"));
moment.suppressDeprecationWarnings = true;
const common_1 = require("@nestjs/common");
const harveter_service_1 = require("../../harvester/services/harveter.service");
let langISO = require('iso-639-1');
let mapto = {};
let FormatSearvice = class FormatSearvice {
    constructor(harvesterService) {
        this.harvesterService = harvesterService;
        this.mapIsoToLang = (value) => langISO.validate(value) ? langISO.getName(value) : value;
        this.mapIsoToCountry = (value) => ISO.whereAlpha2(value)
            ? ISO.whereAlpha2(value).country
            : this.capitalizeFirstLetter(value);
    }
    Init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (mapto != {}) {
                mapto = yield this.harvesterService.getMappingValues();
            }
        });
    }
    format(json, schema) {
        let finalValues = {};
        _.each(schema, (item, index) => {
            if (json[index]) {
                if (_.isArray(item)) {
                    _.each(item, (subItem, subIndex) => {
                        let values = json[index]
                            .filter((d) => d[Object.keys(subItem.where)[0]] ==
                            subItem.where[Object.keys(subItem.where)[0]])
                            .map((d) => subItem.prefix
                            ? subItem.prefix +
                                this.mapIt(d[Object.keys(subItem.value)[0]], subItem.addOn ? subItem.addOn : null)
                            : this.mapIt(d[Object.keys(subItem.value)[0]], subItem.addOn ? subItem.addOn : null));
                        if (values.length)
                            finalValues[subItem.value[Object.keys(subItem.value)[0]]] =
                                this.setValue(finalValues[subItem.value[Object.keys(subItem.value)[0]]], this.getArrayOrValue(values));
                    });
                }
                else if (_.isObject(item)) {
                    if (_.isArray(json[index])) {
                        let values = this.getArrayOrValue(json[index].map((d) => this.mapIt(d[Object.keys(item)[0]])));
                        if (values)
                            finalValues[Object.values(item)[0]] = this.setValue(finalValues[Object.values(item)[0]], values);
                    }
                }
                else
                    finalValues[index] = this.mapIt(json[index]);
            }
        });
        return finalValues;
    }
    setValue(oldvalue, value) {
        if (_.isArray(oldvalue) && _.isArray(value))
            return [...oldvalue, ...value];
        else if (_.isArray(oldvalue) && !_.isArray(value)) {
            oldvalue.push(value);
            return oldvalue;
        }
        else
            return value;
    }
    capitalizeFirstLetter(string) {
        string = string.split(' ');
        for (let i = 0, x = string.length; i < x; i++) {
            string[i] = string[i][0].toUpperCase() + string[i].substr(1);
        }
        string = string.join(' ');
        return string;
    }
    mapIt(value, addOn = null) {
        if (addOn) {
            if (typeof value === 'string' || value instanceof String) {
                if (addOn == 'country')
                    value = value
                        .split(',')
                        .map((d) => this.mapIsoToCountry(d.trim().toLowerCase()));
                if (addOn == 'language')
                    value = value
                        .split(',')
                        .map((d) => this.mapIsoToLang(d.trim().toLowerCase()));
                if (addOn == 'date') {
                    if (_.isArray(value))
                        value = value[0];
                    try {
                        value = moment(new Date(value)).format('YYYY-MM-DD');
                        if (!moment(value).isValid())
                            value = null;
                    }
                    catch (e) {
                        value = null;
                    }
                }
                if (addOn == 'lowercase')
                    value = value.trim().toLowerCase();
            }
        }
        return mapto[value] ? mapto[value] : value;
    }
    getArrayOrValue(values) {
        if (values.length > 1)
            return values;
        else
            return values[0];
    }
};
FormatSearvice = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [harveter_service_1.HarvesterService])
], FormatSearvice);
exports.FormatSearvice = FormatSearvice;
