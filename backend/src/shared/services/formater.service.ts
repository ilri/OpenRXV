import * as _ from 'underscore';
import * as ISO from 'iso-3166-1';
import * as dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';
import { ValuesService } from './values.service';
const langISO = require('iso-639-1');
let mapto: any = {};

@Injectable()
export class FormatService {
  constructor(private readonly valuesServes: ValuesService) {}

  async Init(index_name: string) {
    if (mapto != {}) {
      const data = await this.valuesServes.find(null, index_name);
      const values = {};
      data.hits.map((d) => (values[d._source.find] = d._source.replace));
      mapto = values;
    }
  }

  format(json: any, schema: any) {
    const finalValues: any = {};
    _.each(schema, (item: any, index: string) => {
      if (json[index]) {
        if (_.isArray(item)) {
          _.each(item, (subItem: any) => {
            const values = json[index]
              .filter(
                (d: any) =>
                  d[Object.keys(subItem.where)[0]] ==
                  subItem.where[Object.keys(subItem.where)[0]],
              )
              .map((d: any) =>
                subItem.prefix
                  ? subItem.prefix +
                    this.mapIt(
                      d[Object.keys(subItem.value)[0]],
                      subItem.addOn ? subItem.addOn : null,
                    )
                  : this.mapIt(
                      d[Object.keys(subItem.value)[0]],
                      subItem.addOn ? subItem.addOn : null,
                    ),
              );
            if (values.length)
              finalValues[subItem.value[Object.keys(subItem.value)[0]]] =
                this.setValue(
                  finalValues[subItem.value[Object.keys(subItem.value)[0]]],
                  this.getArrayOrValue(values),
                );
          });
        } else if (_.isObject(item)) {
          if (_.isArray(json[index])) {
            const values = this.getArrayOrValue(
              json[index].map((d: any) => this.mapIt(d[Object.keys(item)[0]])),
            );
            if (values)
              finalValues[<string>Object.values(item)[0]] = this.setValue(
                finalValues[<string>Object.values(item)[0]],
                values,
              );
          }
        } else finalValues[index] = this.mapIt(json[index]);
      }
    });
    return finalValues;
  }
  setValue(oldvalue, value) {
    if (_.isArray(oldvalue) && _.isArray(value)) return [...oldvalue, ...value];
    else if (_.isArray(oldvalue) && !_.isArray(value)) {
      oldvalue.push(value);
      return oldvalue;
    } else return value;
  }

  capitalizeFirstLetter(string: any) {
    string = string.split(' ');

    for (let i = 0, x = string.length; i < x; i++) {
      string[i] = string[i][0].toUpperCase() + string[i].substr(1);
    }
    string = string.join(' ');
    return string;
    // return string.charAt(0).toUpperCase() + string.toLocaleLowerCase().slice(1);
  }

  mapIsoToLang = (value: string) =>
    langISO.validate(value) ? langISO.getName(value) : value;
  mapIsoToCountry = (value: string) =>
    ISO.whereAlpha2(value)
      ? ISO.whereAlpha2(value).country
      : this.capitalizeFirstLetter(value);

  mapIt(value: any, addOn = null): string {
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
          if (_.isArray(value)) value = value[0];
          try {
            value = dayjs(value).format('YYYY-MM-DD');
            if (!dayjs(value).isValid()) value = null;
          } catch (e) {
            value = null;
          }
        }
        if (addOn == 'lowercase') value = value.trim().toLowerCase();
      }
    }
    return mapto[value] ? mapto[value] : value;
  }
  getArrayOrValue(values: Array<any>) {
    if (values.length > 1) return values;
    else return values[0];
  }
}
