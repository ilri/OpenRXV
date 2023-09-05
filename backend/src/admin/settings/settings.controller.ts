import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  HttpService,
  Query,
  UseInterceptors,
  UploadedFile,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonFilesService } from '../json-files/json-files.service';
import { map } from 'rxjs/operators';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { readdirSync } from 'fs';
import { IndexMetadataService } from 'src/shared/services/index-metadata.service';
import { v4 as uuidv4 } from 'uuid';
import { ElasticService } from 'src/shared/services/elastic/elastic.service';
@Controller('settings')
export class SettingsController {
  constructor(
    private jsonFilesService: JsonFilesService,
    private httpService: HttpService,
    private indexMetadataService: IndexMetadataService,
    private elasticSearvice: ElasticService,
  ) {}
  getDirectories = (source) =>
    readdirSync(source, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  @UseGuards(AuthGuard('jwt'))
  @Get('plugins')i
  async plugins() {
    const plugins = await this.getDirectories('./src/plugins');
    const plugins_values = await this.jsonFilesService.read(
      '../../../data/plugins.json',
    );
    const info = [];
    plugins.forEach(async (plugin) => {
      const infor = await this.jsonFilesService.read(
        '../../../src/plugins/' + plugin + '/info.json',
      );
      const values = plugins_values.filter((plug) => plug.name == plugin);
      if (values[0]) infor['values'] = values[0].value;
      else infor['values'] = [];
      info.push(infor);
    });
    return info;
  }

  @Post('plugins')
  async savePlugins(@Body() body: any) {
    return await this.jsonFilesService.save(body, '../../../data/plugins.json');
  }

  format(body: any) {
    const final = {};
    final['repositories'] = [];
    body.repositories.forEach((repo) => {
      const schema = {
        metadata: [],
      };
      repo.schema
        .filter(
          (d) =>
            [
              'parentCollection',
              'parentCollectionList',
              'parentCommunityList',
            ].indexOf(d.metadata) >= 0,
        )
        .forEach((item) => {
          schema[item.metadata] = {
            name: item.disply_name,
          };
        });
      repo.schema
        .filter(
          (d) =>
            [
              'parentCollection',
              'parentCollectionList',
              'parentCommunityList',
            ].indexOf(d.metadata) == -1,
        )
        .forEach((item) => {
          schema[item.metadata] = item.disply_name;
        });

      repo.metadata.forEach((item) => {
        const temp = {
          where: {
            key: item.metadata,
          },
          value: {
            value: item.disply_name,
          },
        };
        if (item.addOn) temp['addOn'] = item.addOn;
        schema.metadata.push(temp);
      });
      schema['bitstreams'] = [
        {
          where: {
            bundleName: 'THUMBNAIL',
          },
          value: {
            retrieveLink: 'thumbnail',
          },
          prefix: repo.itemsEndPoint,
        },
      ];

      final['repositories'].push({
        name: repo.name,
        years: repo.years,
        type: repo.type || 'Dspace',
        index_name: repo.index_name,
        startPage: repo.startPage,
        itemsEndPoint: repo.itemsEndPoint,
        siteMap: repo.siteMap,
        apiKey: repo.apiKey,
        allCores: repo.allCores,
        schema,
      });
    });

    return final;
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  async Save(@Body() body: any) {
    await this.jsonFilesService.save(body, '../../../data/data.json');
    await this.jsonFilesService.save(
      this.format(body),
      '../../../data/dataToUse.json',
    );

    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('explorer')
  async SaveExplorer(
    @Body('data') data: any,
    @Body('dashboard_name') dashboard_name: any,
  ) {
    // console.log(data,  await this.jsonFilesService.read('../../../data/dashboards.json'));
    let dashboards = await this.jsonFilesService.read(
      '../../../data/dashboards.json',
    );
    if (!dashboards) return new NotFoundException();
    for (let dashboard of dashboards) {
      if (dashboard.name == dashboard_name) dashboard['explorer'] = data;
    }

    await this.jsonFilesService.save(
      dashboards,
      '../../../data/dashboards.json',
    );
    //  await this.jsonFilesService.save(body, '../../../data/explorer.json');
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('appearance')
  async SaveAppearance(
    @Body('data') data: any,
    @Body('dashboard_name') dashboard_name: any,
  ) {
    let dashboards = await this.jsonFilesService.read(
      '../../../data/dashboards.json',
    );
    if (!dashboards) return new NotFoundException();
    for (let dashboard of dashboards) {
      if (dashboard.name == dashboard_name) dashboard['appearance'] = data;
    }

    await this.jsonFilesService.save(
      dashboards,
      '../../../data/dashboards.json',
    );

    return { success: true };
  }
  @Get(['appearance', 'appearance/:name'])
  async ReadAppearance(@Param('name') name: string = 'index') {
    const dashboard = (
      await this.jsonFilesService.read('../../../data/dashboards.json')
    ).filter((d) => d.name == name)[0];
    if (!dashboard) throw new NotFoundException();

    return dashboard.appearance;
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('reportings')
  async SaveReports(
    @Body('data') data: any,
    @Body('dashboard_name') dashboard_name: any,
  ) {
    let dashboards = await this.jsonFilesService.read(
      '../../../data/dashboards.json',
    );
    if (!dashboards) return new NotFoundException();
    for (let dashboard of dashboards) {
      if (dashboard.name == dashboard_name) dashboard['reports'] = data;
    }

    await this.jsonFilesService.save(
      dashboards,
      '../../../data/dashboards.json',
    );

    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('indexes')
  async SaveIndexes(@Body() body: any, @Body('isNew') isNew: boolean, @Body('deletedId') deletedId: string) {
    let indexes = await this.jsonFilesService.read('../../../data/indexes.json');
    if(isNew) {
      const newIndex = {
        id: uuidv4(),
        name: body.data.name,
        description: body.data.description,
        created_at: new Date().toLocaleString(),
      };
      indexes.push(newIndex);
    } else {
      if (deletedId != null) {
        const dashboards = await this.jsonFilesService.read('../../../data/dashboards.json');

        let relatedDashboards = [];
        dashboards.map((dashboard) => {
          if (dashboard.index === deletedId) {
            relatedDashboards.push({
              id: dashboard.id,
              name: dashboard.name,
            });
          }
        });
        if (relatedDashboards.length > 0) {
          return {
            success: false,
            relatedDashboards
          };
        }
      }
      indexes = body.data;
    }
    await this.jsonFilesService.save(indexes, '../../../data/indexes.json');
    this.elasticSearvice.startUpIndexes();
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('dashboards')
  async SaveDashboards(@Body() body: any, @Body('isNew') isNew: boolean) {
    let dashboards = await this.jsonFilesService.read(
        '../../../data/dashboards.json',
    );
    if (isNew) {
      const newDashboard = {
        id: uuidv4(),
        name: body.data.name,
        index: body.data.index,
        description: body.data.description,
        created_at: new Date().toLocaleString(),
        reports:[],
        appearance: {
          primary_color: '#20a5b7',
          website_name: 'OpenRXV',
          logo: null,
          chartColors: [
            '#427730',
            '#009673',
            '#0065bd',
            '#e1d219',
            '#762022',
            '#FF6633',
            '#FFB399',
            '#FF33FF',
            '#FFFF99',
            '#00B3E6',
            '#E6B333',
            '#3366E6',
            '#999966',
            '#99FF99',
            '#B34D4D',
            '#80B300',
            '#809900',
            '#E6B3B3',
            '#6680B3',
            '#66991A',
            '#FF99E6',
            '#CCFF1A',
            '#FF1A66',
            '#E6331A',
            '#33FFCC',
            '#66994D',
            '#B366CC',
            '#4D8000',
            '#B33300',
            '#CC80CC',
            '#66664D',
            '#991AFF',
            '#E666FF',
            '#4DB3FF',
            '#1AB399',
            '#E666B3',
            '#33991A',
            '#CC9999',
            '#B3B31A',
            '#00E680',
            '#4D8066',
            '#809980',
            '#E6FF80',
            '#1AFF33',
            '#999933',
            '#FF3380',
            '#CCCC00',
            '#66E64D',
            '#4D80CC',
            '#9900B3',
            '#E64D66',
            '#4DB380',
            '#FF4D4D',
            '#99E6E6',
            '#6666FF',
          ],
        },
        explorer: {
          counters: [],
          filters: [],
          dashboard: [],
          appearance: {
            primary_color: '#20a5b7',
            website_name: 'OpenRXV',
            logo: null,
          },
          footer: '',
          welcome: {
            show: true,
            component: 'WelcomeComponent',
            componentConfigs: {
              title: 'Greetings',
              description:
                'Welcome to OpenRXV - Open Repository Explorer and Visualizer',
              show: true,
              id: 'welcome',
              text: '<h2 class="primary-text center-text" style="text-align: center;">Welcome to OpenRXV - Open Repository Explorer and Visualizer</h2>\n<p class="center-text">Choose your search options from the lists on your ICONS:search . Consider adding a filter &ndash; this can provide greater specificity to your query. You can start filtering anywhere you want. By selecting multiple criteria in each filter, all the other filters will be automatically updated to guarantee a combined result that returns no empty queries. AReS figures, graphics, tables and the Info Products List of Results update in real time and your results will be instantly displayed!</p>\n<p class="center-text">Navigate the page and explore all of its features. You can expand and collapse the filters&rsquo; tab and any other section as you like, by clicking on ICONS:search and ICONS:expand_more icons. All graphics are exportable by clicking on ICONS:view_headline, and the Info Products List of Results can be downloaded in .xls , .docx , .pdf formats. Want to clean up all filters and query something else? Click ICONS:loop and start a new query straight away!</p>',
            },
            tour: true,
          },
        },
      };
      dashboards.push(newDashboard);
    } else {
      dashboards = body.data;
    }
    await this.jsonFilesService.save(dashboards, '../../../data/dashboards.json');
    return { success: true };
  }

  @Get(['reports','reports/:name'])
  async ReadReports(@Param('name') name: string = 'index') {
    const dashboard = (
      await this.jsonFilesService.read('../../../data/dashboards.json')
    ).filter((d) => d.name == name)[0];
    if (!dashboard) throw new NotFoundException();

    return dashboard.reports;
  }

  @Get('outsourcePlugins')
  async readOutsourcePlugins() {
    const plugins = await readdirSync(
      join(__dirname, '../../../data//harvestors'),
    ).map((data) => {
      return data.slice(0, -5);
    });
    return plugins;
  }

  @Get('indexes')
  async ReadIndexes() {
    return await this.jsonFilesService.read('../../../data/indexes.json');
  }

  @Get('dashboards')
  async ReadDashboards() {
    return await this.jsonFilesService.read('../../../data/dashboards.json');
  }

  @Get(['explorer', 'explorer/:name'])
  async ReadExplorer(@Param('name') name: string = 'index') {
    const dashboard = (
      await this.jsonFilesService.read('../../../data/dashboards.json')
    ).filter((d) => d.name == name)[0];
    if (!dashboard) throw new NotFoundException();

    const settings = dashboard.explorer;
    const configs = await this.jsonFilesService.read('../../../data/data.json');
    settings['appearance'] = dashboard.appearance;
    const list_icons = {};
    if (configs.repositories) {
      configs.repositories.map((d) => [(list_icons[d.name] = d.icon)]);
      settings['appearance']['icons'] = list_icons;
      return settings;
    } else return {};
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('')
  async Read() {
    return await this.jsonFilesService.read('../../../data/data.json');
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(['metadata/:name/:index', 'metadata/:name', 'metadata'])
  async getMetadata(
      @Param('name') name: string = 'index',
      @Param('index') index_name: string = null,
  ) {
    index_name = index_name != null && index_name !== '' && index_name !== 'null' ? index_name : await this.jsonFilesService.getIndexFromDashboard(name);
    let dspace_altmetrics: any;
    let dspace_downloads_and_views: any;
    let mel_downloads_and_views: any;
    const data = await this.jsonFilesService.read('../../../data/data.json');
    const plugins = await this.jsonFilesService.read(
      '../../../data/plugins.json',
    );
    const medatadataKeys: Array<string> =
      await this.indexMetadataService.getMetadata(index_name);
    const meta = [];
    for (let i = 0; i < plugins.length; i++) {
      if (plugins[i].name == 'dspace_altmetrics') {
        dspace_altmetrics = await this.jsonFilesService.read(
          '../../../src/plugins/dspace_altmetrics/info.json',
        );
        meta.push(dspace_altmetrics.source);
      }
      if (plugins[i].name == 'dspace_downloads_and_views') {
        dspace_downloads_and_views = await this.jsonFilesService.read(
          '../../../src/plugins/dspace_downloads_and_views/info.json',
        );
        meta.push(dspace_downloads_and_views.source);
      }
      if (plugins[i].name == 'mel_downloads_and_views') {
        mel_downloads_and_views = await this.jsonFilesService.read(
          '../../../src/plugins/mel_downloads_and_views/info.json',
        );
        meta.push(mel_downloads_and_views.source);
      }
    }
    const a = [].concat(...meta);
    const uniqueArray = a.filter(function (item, pos) {
      return a.indexOf(item) == pos;
    });

    const merged = [].concat.apply(
      [],
      data.repositories.map((d) => [...d.schema, ...d.metadata]),
    );

    return [
      ...(merged.length > 0 ? [] : new Set(medatadataKeys)),
      ...new Set(merged.map((d) => d.disply_name)),
      ...data.repositories.filter((d) => d.years).map((d) => d.years),
      ...uniqueArray,
    ];
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('DSpace/autometa')
  async AutoMeta(@Query('link') link: string) {
    const checkingVersion = this.httpService
      .get(new URL(link).origin + '/rest/status')
      .pipe(
        map(async (response, index) => {
          if (response.data.apiVersion == undefined) {
            const data = await this.httpService
              .get(link + '/items?expand=metadata,parentCommunityList&limit=25')
              .pipe(
                map(
                  (data: any) => {
                    const merged = {
                      base: [],
                      metadata: [],
                    };
                    data = data.data.forEach((element) => {
                      merged.base = Array.from(
                        new Set(
                          [].concat.apply(
                            merged.base,
                            Object.keys(element).filter(
                              (d) =>
                                ['metadata', 'bitstreams', 'expand'].indexOf(
                                  d,
                                ) == -1,
                            ),
                          ),
                        ),
                      );
                      merged.metadata = Array.from(
                        new Set(
                          [].concat.apply(
                            merged.metadata,
                            element.metadata.map((item) => {
                              return item.key;
                            }),
                          ),
                        ),
                      );
                    });
                    return merged;
                  },
                  (error) => {},
                ),
              )
              .toPromise();

            return data;
          } else if (response.data.apiVersion == 6) {
            const merged = {
              base: [],
              metadata: [],
            };
            const base = await this.httpService
              .get(link + '/items?expand=metadata,parentCommunityList&limit=25')
              .pipe(
                map(
                  (data: any) => {
                    data = data.data.forEach((element) => {
                      merged.base = Array.from(
                        new Set(
                          [].concat.apply(
                            merged.base,
                            Object.keys(element).filter(
                              (d) =>
                                ['metadata', 'bitstreams', 'expand'].indexOf(
                                  d,
                                ) == -1,
                            ),
                          ),
                        ),
                      );
                    });
                    return merged;
                  },
                  (error) => {},
                ),
              )
              .toPromise();

            const data = await this.httpService
              .get(link + '/registries/schema')
              .pipe(
                map(
                  (data: any, index) => {
                    data = data.data.forEach((element, index) => {
                      merged.metadata = Array.from(
                        new Set(
                          [].concat.apply(
                            merged.metadata,
                            element.fields.map((item) => {
                              return item.name;
                            }),
                          ),
                        ),
                      );
                    });
                    return merged;
                  },
                  (error) => {},
                ),
              )
              .toPromise();
            return data;
          }
        }),
      )
      .toPromise();
    return checkingVersion;
  }

  @Post('upload/image')
  @UseInterceptors(
    FileInterceptor('file', {
      preservePath: true,
      // @ts-ignore: Object is possibly 'undefined'.
      fileFilter: this.imageFileFilter,
      dest: join(__dirname, '../../../data/files/images'),
    }),
  )
  async uploadFile(@UploadedFile() file) {
    const splited = file.originalname.split('.');
    const name = splited[0] + '-' + new Date().getTime();
    const response =
      join(__dirname, '../../../data/files/images/') +
      name +
      '.' +
      splited[splited.length - 1];
    await fs.renameSync(
      join(__dirname, '../../../data/files/images/') + file.filename,
      response,
    );
    return { location: response.slice(response.indexOf('files/') + 6) };
  }

  @Post('upload/file')
  @UseInterceptors(
    FileInterceptor('file', {
      preservePath: true,
      // @ts-ignore: Object is possibly 'undefined'.
      fileFilter: this.imageFileFilter,
      dest: join(__dirname, '../../../data/files/files'),
    }),
  )
  async uploadFile1(@UploadedFile() file) {
    const splited = file.originalname.split('.');
    const name = splited[0].replace(/\s/g, '-') + '-' + new Date().getTime();
    const response =
      join(__dirname, '../../../data/files/files/') +
      name +
      '.' +
      splited[splited.length - 1];
    await fs.renameSync(
      join(__dirname, '../../../data/files/files/') + file.filename,
      response,
    );
    return { location: response.slice(response.indexOf('files/') + 5) };
  }

  @Get('files/:fileName')
  async downloadFile(@Param('fileName') fileName, @Res() res): Promise<any> {
    return res.sendFile(fileName, { root: 'data/files/files' });
  }
}
