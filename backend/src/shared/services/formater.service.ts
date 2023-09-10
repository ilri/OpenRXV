import * as _ from 'underscore';
import * as ISO from 'iso-3166-1';
import * as dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';
import { ValuesService } from './values.service';
const langISO = require('iso-639-1');
let mapto: any = null;

@Injectable()
export class FormatService {
  constructor(private readonly valuesServes: ValuesService) {}

  async Init(index_name: string) {
    if (mapto === null) {
      const data = await this.valuesServes.find(null, `${index_name}-values`);
      const values = {};
      data.hits.map((d) => {
        values[d._source.find] = {
          replace: d._source.replace,
          metadataField: d._source.metadataField,
        }
      });
      mapto = values;
    }
  }

  format(harvestedItem: any, schemas: any) {
    const finalValues: any = {};
    _.each(schemas, (schemaItems: any, schemaName: string) => {
      if (harvestedItem[schemaName]) {
        if (_.isArray(schemaItems)) { // These are metadata
          _.each(schemaItems, (schemaItem: any) => {
            const schemaValueName = Object.keys(schemaItem.value)[0];
            const values = harvestedItem[schemaName]
              .filter((metadataElement: any) => {
                const schemaKeyName = Object.keys(schemaItem.where)[0];
                return metadataElement[schemaKeyName] == schemaItem.where[schemaKeyName];
              })
              .map((metadataElement: any) => {
                const addOn = schemaItem.addOn ? schemaItem.addOn : null;
                const value = metadataElement[schemaValueName];
                const mappedValue = this.mapIt(value, addOn, schemaItem.value.value);
                return schemaItem.prefix ? schemaItem.prefix + mappedValue : mappedValue;
              })
                .filter(v => v !== '' && v != null);
            if (values.length)
              finalValues[schemaItem.value[schemaValueName]] =
                this.setValue(
                  finalValues[schemaItem.value[schemaValueName]],
                  this.getArrayOrValue(values),
                );
          });
        } else if (_.isObject(schemaItems)) { // These are expands (collections, communities, bitstreams, ...)
          if (_.isArray(harvestedItem[schemaName])) {
            const metadataField = <string>Object.values(schemaItems)[0];
            const titleFieldName = Object.keys(schemaItems)[0];

            const mappedValues = harvestedItem[schemaName]
                .map((metadataElement: any) => this.mapIt(metadataElement[titleFieldName]))
                .filter(v => v !== '' && v != null);
            const values = this.getArrayOrValue(mappedValues);
            if (values)
              finalValues[metadataField] = this.setValue(
                finalValues[metadataField],
                values,
              );
          }
        } else { // These are item basic information (id, name, handle, archived, ...)
          const mappedValue = this.mapIt(harvestedItem[schemaName]);
          if (mappedValue !== '' && mappedValue != null) {
            finalValues[schemaName] = mappedValue;
          }
        }
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

  mapIt(value: any, addOn = null, metadataField: string = null): string {
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

    if (mapto[value]) {
      // If the mapping value is specific for a metadata field then apply it only to the specified metadata field,
      // otherwise apply it to all
      if (mapto[value]?.metadataField) {
        if (mapto[value].metadataField === metadataField) {
          value = mapto[value].replace;
        }
      } else {
        value = mapto[value].replace;
      }
    }
    return value;
  }
  getArrayOrValue(values: Array<any>) {
    if (values.length > 1) return values;
    else return values[0];
  }
}
