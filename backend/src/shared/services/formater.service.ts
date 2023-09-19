import * as _ from 'underscore';
import CountryISO from '@mohammad231/iso_3166-1';
import { Country } from '@mohammad231/iso_3166-1/iso_3166-1';
import * as dayjs from 'dayjs';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ValuesService } from './values.service';
const langISO = require('iso-639-1');
let mapto: any = null;

@Injectable()
export class FormatService {
  constructor(
      private readonly valuesServes: ValuesService,
      private http: HttpService,
  ) {}

  collections: any = {};
  collectionsFetching: any = {};

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
        if (_.isArray(schemaItems)) { // These are metadata and bitstreams
          _.each(schemaItems, (schemaItem: any) => {
            const schemaValueName = Object.keys(schemaItem.value)[0];
            const schemaKeyName = Object.keys(schemaItem.where)[0];
            const addOn = schemaItem.addOn ? schemaItem.addOn : null;

            const values = harvestedItem[schemaName]
              .filter((metadataElement: any) => {
                return metadataElement[schemaKeyName] == schemaItem.where[schemaKeyName];
              })
              .map((metadataElement: any) => {
                const value = metadataElement[schemaValueName];
                const mappedValue = this.mapIt(value, addOn, schemaItem.value.value);
                return schemaItem.prefix ? schemaItem.prefix + mappedValue : mappedValue;
              })
                .filter(v => v !== '' && v != null);
            if (values.length)
              finalValues[schemaItem.value[schemaValueName]] = this.setValue(
                  finalValues[schemaItem.value[schemaValueName]],
                  this.getArrayOrValue(values),
              );
          });
        } else if (_.isObject(schemaItems)) {
          const titleFieldName = Object.keys(schemaItems)[0];
          const metadataField = schemaItems[titleFieldName];
          const addOn = schemaItems?.addOn;
          if (_.isArray(harvestedItem[schemaName])) {  // These are expands (collections, communities, ...)
            const mappedValues = harvestedItem[schemaName]
                .map((metadataElement: any) => this.mapIt(metadataElement[titleFieldName]), addOn)
                .filter(v => v !== '' && v != null);
            const values = this.getArrayOrValue(mappedValues);
            if (values)
              finalValues[metadataField] = this.setValue(
                finalValues[metadataField],
                values,
              );
          } else { // These are item basic information (id, name, handle, archived, ...)
            const mappedValue = this.mapIt(harvestedItem[schemaName], addOn);
            if (mappedValue !== '' && mappedValue != null) {
              finalValues[schemaName] = mappedValue;
            }
          }
        }
      }
    });
    return finalValues;
  }

  DSpace7Format(harvestedItem: any, schemas: any, collectionList: any) {
    const finalValues: any = {};
    const communities = [];
    _.each(schemas, (schemaItems: any, schemaName: string) => {
      if (_.isArray(schemaItems)) { // These are metadata
        if (harvestedItem[schemaName]) {
          _.each(schemaItems, (schemaItem: any) => {
            const schemaValueName = Object.keys(schemaItem.value)[0];
            const schemaKeyName = Object.keys(schemaItem.where)[0];
            const addOn = schemaItem.addOn ? schemaItem.addOn : null;

            for (const metadataFieldName in harvestedItem[schemaName]) {
              if (harvestedItem[schemaName].hasOwnProperty(metadataFieldName)) {
                if (metadataFieldName === schemaItem.where[schemaKeyName]) {
                  const values = [];
                  const metadataElements = harvestedItem[schemaName][metadataFieldName];
                  metadataElements.map((metadataElement) => {
                    if (metadataElement.hasOwnProperty(schemaValueName)) {
                      const mappedValue = this.mapIt(metadataElement[schemaValueName], addOn, schemaItem.value.value);
                      const value = schemaItem.prefix ? schemaItem.prefix + mappedValue : mappedValue;
                      if (value !== '' && value != null) {
                        values.push(value);
                      }
                    }
                  });
                  if (values.length)
                    finalValues[schemaItem.value[schemaValueName]] = this.setValue(
                        finalValues[schemaItem.value[schemaValueName]],
                        this.getArrayOrValue(values),
                    );
                }
              }
            }
          });
        }
      } else if (_.isObject(schemaItems) && schemaName !== 'parentCommunityList') {
        const titleFieldName = Object.keys(schemaItems)[0];
        const metadataField = schemaItems[titleFieldName];
        const addOn = schemaItems?.addOn;

        if (harvestedItem.hasOwnProperty(schemaName)) { // These are item basic information (id, name, handle, archived, ...)
          const mappedValue = this.mapIt(harvestedItem[schemaName], addOn);
          if (mappedValue !== '' && mappedValue != null) {
            finalValues[schemaName] = mappedValue;
          }
        } else { // These are expands (collections, communities, bitstreams, ...)
          let embeddedItem = harvestedItem?._embedded && harvestedItem._embedded.hasOwnProperty(schemaName) ? harvestedItem._embedded[schemaName] : null;

          if (embeddedItem?._embedded && embeddedItem._embedded.hasOwnProperty(schemaName)) {
            embeddedItem = embeddedItem._embedded[schemaName];
          }

          if (embeddedItem && !_.isArray(embeddedItem) && _.isObject(embeddedItem)) {
            embeddedItem = [embeddedItem];
          }

          if (embeddedItem && _.isArray(embeddedItem)) {
            let values = null;
            if (schemaName === 'thumbnail') {
              if (embeddedItem[0]?._links?.content.href) {
                values = embeddedItem[0]._links.content.href;
              }
            } else {
              const mappedValues = embeddedItem
                  .map((metadataElement: any) => {
                    if ((schemaName === 'owningCollection' || schemaName === 'mappedCollections') && metadataElement?.uuid) {
                      if (collectionList.hasOwnProperty(metadataElement.uuid)) {
                        const collection = collectionList[metadataElement.uuid];
                        collection.parentCommunities.map((parentCommunity) => {
                          communities.push(parentCommunity);
                        });
                      }
                    }
                    return this.mapIt(metadataElement[titleFieldName], addOn);
                  })
                  .filter(v => v !== '' && v != null);
              values = this.getArrayOrValue(mappedValues);
            }
            if (values)
              finalValues[metadataField] = this.setValue(
                  finalValues[metadataField],
                  values,
              );
          }
        }
      }
    });

    // Add parentCommunityList
    if (communities.length > 0 && schemas?.parentCommunityList && _.isObject(schemas.parentCommunityList)) {
      const metadataField = <string>Object.values(schemas.parentCommunityList)[0];
      const values = this.getArrayOrValue(communities);
      if (values)
        finalValues[metadataField] = this.setValue(
            finalValues[metadataField],
            values,
        );
    }

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
      CountryISO.get({alpha_2: value})
      ? (CountryISO.get({alpha_2: value}) as Country).name
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

  async getCommunities(endPoint) {
    return new Promise(async (resolve) => {
      // Remove the "/" from the end of the endPoint
      endPoint = endPoint.replace(/\/$/gm, '');

      const communitiesList = {};

      const request = await lastValueFrom(
          this.http.get(`${endPoint}/discover/search/objects?dsoType=community&size=1&page=0`)
      ).catch(() => {
        return null;
      });

      if (request?.data?._embedded?.searchResult?.page?.totalElements && request.data._embedded.searchResult.page.totalElements > 0) {
        const totalPages = Math.ceil(request.data._embedded.searchResult.page.totalElements / 100);
        for (let page = 0; page < totalPages; page++) {
          const data = await lastValueFrom(
              this.http.get(`${endPoint}/discover/search/objects?dsoType=community&embed=parentCommunity&size=100&page=${page}`)
          ).catch(() => {
            return null;
          });
          const communities = data?.data?._embedded?.searchResult?._embedded?.objects;
          if (communities) {
            communities.map((communityObject) => {
              const community = communityObject?._embedded?.indexableObject;
              if (community) {
                communitiesList[community.uuid] = {
                  name: community.name,
                  parent: null
                }
                const parentCommunity = community?._embedded?.parentCommunity;
                if (parentCommunity) {
                  communitiesList[community.uuid].parent = parentCommunity.uuid
                }
              }
            });
          }
        }
      }

      const communities = {};
      for (const communityId in communitiesList) {
        if (communitiesList.hasOwnProperty(communityId)) {
          const community = communitiesList[communityId];
          let parentId = community.parent;
          communities[communityId] = {
            name: community.name,
            parents: []
          }
          while (parentId) {
            if (communitiesList.hasOwnProperty(parentId)) {
              const parent = communitiesList[parentId];
              communities[communityId].parents.push(parent.name);
              parentId = parent.parent;
            }
          }
        }
      }

      resolve(communities);
    });
  }

  async getCollections(endPoint, repositoryName) {
    if (this.collectionsFetching[repositoryName]) {
      return this.collectionsFetching[repositoryName];
    } else {
      const communities = await this.getCommunities(endPoint);

      const collectionsList = {};
      return new Promise(async (resolve) => {
        // Remove the "/" from the end of the endPoint
        endPoint = endPoint.replace(/\/$/gm, '');

        const request = await lastValueFrom(
            this.http.get(`${endPoint}/discover/search/objects?dsoType=collection&size=1&page=0`)
        ).catch(() => {
          return null;
        });

        if (request?.data?._embedded?.searchResult?.page?.totalElements && request.data._embedded.searchResult.page.totalElements > 0) {
          const totalPages = Math.ceil(request.data._embedded.searchResult.page.totalElements / 100);
          for (let page = 0; page < totalPages; page++) {
            const data = await lastValueFrom(
                this.http.get(`${endPoint}/discover/search/objects?dsoType=collection&embed=parentCommunity&size=100&page=${page}`)
            ).catch(() => {
              return null;
            });
            const collections = data?.data?._embedded?.searchResult?._embedded?.objects;
            if (collections) {
              collections.map((collectionObject) => {
                const collection = collectionObject?._embedded?.indexableObject;
                if (collection) {
                  collectionsList[collection.uuid] = {
                    name: collection.name,
                    parentCommunities: []
                  }
                  const parentCommunity = collection?._embedded?.parentCommunity;
                  if (parentCommunity && communities.hasOwnProperty(parentCommunity.uuid)) {
                    const parentCommunities = communities[parentCommunity.uuid].parents;
                    parentCommunities.push(communities[parentCommunity.uuid].name);
                    collectionsList[collection.uuid].parentCommunities = [...new Set(parentCommunities)];
                  }
                }
              });
            }
          }
        }

        this.collections[repositoryName] = collectionsList;
        resolve(true);
      });
    }
  }
}
