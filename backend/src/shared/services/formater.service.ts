import * as _ from 'underscore';
import CountryISO from '@mohammad231/iso_3166-1';
import { Country } from '@mohammad231/iso_3166-1/iso_3166-1';
import * as dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';
import { ValuesService } from './values.service';
const langISO = require('iso-639-1');

@Injectable()
export class FormatService {
  constructor(
      private readonly valuesServes: ValuesService,
  ) {}

  async getMappingValues(index_name: string) {
    const data = await this.valuesServes.find(null, `${index_name}-values`);
    const values = {};
    data.hits.map((d) => {
      values[d._source.find] = {
        replace: d._source.replace,
        metadataField: d._source.metadataField,
      }
    });
    return values;
  }

  extractParentCommunities(metadataElement, communities, metadataField) {
    if (metadataElement?._embedded?.parentCommunity) {
      communities = this.extractParentCommunities(metadataElement._embedded.parentCommunity, communities, metadataField);
    }
    if (metadataElement.hasOwnProperty(metadataField)) {
      communities.push(metadataElement[metadataField]);
    }
    return communities;
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

  mapIsoToCountry(value: string) {
    const country = CountryISO.get({alpha_2: value}) as Country;
    return country ? country.name : this.capitalizeFirstLetter(value);
  }

  mapCountryToIso(value: string) {
    const country = CountryISO.get({
      name: value,
      common_name: value,
      official_name: value,
    }) as Country;
    return country ? country.alpha_2 : null;
  }

  mapIt(value: any, addOn = null, metadataField: string = null, mapto: any = {}): string {
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
        if (addOn == 'datetime') {
          if (_.isArray(value)) value = value[0];
          try {
            value = dayjs(value).format('YYYY-MM-DDTHH:mm:ssZ');
            if (!dayjs(value).isValid()) {
              value = null;
            }
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
