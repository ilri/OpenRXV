import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { IndicesGetMappingResponse } from '@elastic/elasticsearch/lib/api/types';
import { ElasticService } from './elastic/elastic.service';
import { map } from 'rxjs/operators';

@Injectable()
export class IndexMetadataService extends ElasticService {
    constructor(
        public readonly elasticsearchService: ElasticsearchService,
        private httpService: HttpService,
    ) {
        super(elasticsearchService);
    }

    async getMetadata(index) {
        const mappings: IndicesGetMappingResponse = await this.elasticsearchService.indices.getMapping({
            index: index,
        });

        return mappings[index] ? Object.keys(mappings[index].mappings.properties) : mappings[index + '_final'] ? Object.keys(mappings[index + '_final'].mappings.properties) : [];
    }

    async DSpaceMetadataAutoRetrieve(link) {
        const version = await lastValueFrom(
            this.httpService
                .get(new URL(link).origin + '/rest/status')
                .pipe(map((d) => d.data))
        ).catch(() => null);

        const merged = {
            base: [],
            metadata: [],
        };

        if (Number(version?.apiVersion) > 0) {
            const baseFieldsArray = [];
            const base = await lastValueFrom(
                this.httpService
                    .get(`${link}/items?limit=25`)
                    .pipe(map((d) => d.data))
            ).catch(() => null);

            if (base && Array.isArray(base)) {
                base.map((item) => {
                    const baseFields = Object.keys(item);
                    baseFields.map((baseField) => {
                        if (baseField !== 'expand') {
                            baseFieldsArray.push(baseField);
                        }
                    });
                });
            }
            merged.base = [...new Set(baseFieldsArray)];

            const metadataFieldsArray = [];
            const schemas = await lastValueFrom(
                this.httpService
                    .get(`${link}/registries/schema`)
                    .pipe(map((d) => d.data))
            ).catch(() => null);

            schemas.map((schema) => {
                schema.fields.map((field) => {
                    metadataFieldsArray.push(field.name);
                });
            });
            merged.metadata = [...new Set(metadataFieldsArray)];
        }

        return merged;
    }

    async DSpace7MetadataAutoRetrieve(link) {
        const merged = {
            base: [],
            metadata: [],
        };

        const baseFieldsArray = [];
        const base = await lastValueFrom(
            this.httpService
                .get(`${link}/discover/search/objects?dsoType=item&embed=thumbnail,owningCollection,mappedCollections&size=25`)
                .pipe(map((d) => d.data))
        ).catch(() => null);
        if (base && base?._embedded?.searchResult?._embedded?.objects) {
            base._embedded.searchResult._embedded.objects.map((item) => {
                const baseFields = Object.keys(item?._embedded?.indexableObject);
                baseFields.map((baseField) => {
                    if (['metadata', '_links', '_embedded'].indexOf(baseField) === -1) {
                        baseFieldsArray.push(baseField);
                    } else if (baseField === '_embedded') {
                        const expandedFields = Object.keys(item._embedded.indexableObject[baseField]);
                        expandedFields.map((expandedFields) => {
                            baseFieldsArray.push(expandedFields)
                        });
                    }
                });
            });
        }
        merged.base = [...new Set(baseFieldsArray)];

        const schemasPages = await lastValueFrom(
            this.httpService
                .get(`${link}/core/metadatafields?page=0&size=1`)
                .pipe(map((d) => d.data))
        ).catch(() => null);

        if (schemasPages?.page?.totalElements && schemasPages.page.totalElements > 0) {
            const totalPages = Math.ceil(schemasPages.page.totalElements / 100);
            for (let page = 0; page < totalPages; page++) {
                const schemas = await lastValueFrom(
                    this.httpService
                        .get(`${link}/core/metadatafields?page=${page}&size=100`)
                        .pipe(map((d) => d.data))
                ).catch(() => null);
                if (schemas?._embedded?.metadatafields) {
                    for (const fields of schemas._embedded.metadatafields) {
                        const prefix = fields?._embedded?.schema?.prefix;
                        const element = fields?.element;
                        const qualifier = fields?.qualifier;
                        if (prefix != null && prefix !== '' && element != null && element !== '') {
                            const metadataFieldName = `${prefix}.${element}` + (qualifier != null && qualifier !== '' ? `.${qualifier}` : '');
                            merged.metadata.push(metadataFieldName);
                        }
                    }
                }
            }
        }

        return merged;
    }

    cleanIdNames(name: string): string {
        name = name.trim();
        // Replace non-word character with -
        name = name.replace(/\W|_/g, '-');
        // Remove duplicated -
        name = name.replace(/-{2,}/g, '-');
        // Remove trailing -
        name = name.replace(/^-|-$/g, '-');
        return name.toLowerCase();
    }
}
