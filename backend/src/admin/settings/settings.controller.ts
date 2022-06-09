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
@Controller('settings')
export class SettingsController {
  constructor(
    private jsonfielServoce: JsonFilesService,
    private httpService: HttpService,
    private indexMetadataService: IndexMetadataService,
  ) {}
  getDirectories = (source) =>
    readdirSync(source, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  @UseGuards(AuthGuard('jwt'))
  @Get('plugins')
  async plugins() {
    const plugins = await this.getDirectories('./src/plugins');
    const plugins_values = await this.jsonfielServoce.read(
      '../../../data/plugins.json',
    );
    const info = [];
    plugins.forEach(async (plugin) => {
      const infor = await this.jsonfielServoce.read(
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
    return await this.jsonfielServoce.save(body, '../../../data/plugins.json');
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
    await this.jsonfielServoce.save(body, '../../../data/data.json');
    await this.jsonfielServoce.save(
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
    // console.log(data,  await this.jsonfielServoce.read('../../../data/dashboards.json'));
    let dashboards = await this.jsonfielServoce.read(
      '../../../data/dashboards.json',
    );
    if (!dashboards) return new NotFoundException();
    for (let dashboard of dashboards) {
      if (dashboard.name == dashboard_name) dashboard['explorer'] = data;
    }

    await this.jsonfielServoce.save(
      dashboards,
      '../../../data/dashboards.json',
    );
    //  await this.jsonfielServoce.save(body, '../../../data/explorer.json');
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('appearance')
  async SaveAppearance(
    @Body('data') data: any,
    @Body('dashboard_name') dashboard_name: any,
  ) {
    let dashboards = await this.jsonfielServoce.read(
      '../../../data/dashboards.json',
    );
    if (!dashboards) return new NotFoundException();
    for (let dashboard of dashboards) {
      if (dashboard.name == dashboard_name) dashboard['appearance'] = data;
    }

    await this.jsonfielServoce.save(
      dashboards,
      '../../../data/dashboards.json',
    );

    return { success: true };
  }
  @Get(['appearance', 'appearance/:name'])
  async ReadAppearance(@Param('name') name: string = 'index') {
    const dashboard = (
      await this.jsonfielServoce.read('../../../data/dashboards.json')
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
    let dashboards = await this.jsonfielServoce.read(
      '../../../data/dashboards.json',
    );
    if (!dashboards) return new NotFoundException();
    for (let dashboard of dashboards) {
      if (dashboard.name == dashboard_name) dashboard['reports'] = data;
    }

    await this.jsonfielServoce.save(
      dashboards,
      '../../../data/dashboards.json',
    );

    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('indexes')
  async SaveIndexes(@Body() body: any,  @Body('isNew') isNew: boolean) {
    console.log("isNew", isNew);
    let indexes = await this.jsonfielServoce.read('../../../data/indexes.json');
    if(isNew) {
      const newIndex = {
        id: uuidv4().substring(0, 2),
        name: body.data.name,
        description: body.data.description,
        created_at: new Date().toLocaleString()
      }
      indexes.indexes.push(newIndex);
    } else {
      console.log(body.data)
      indexes = body.data;

    }
    await this.jsonfielServoce.save(indexes, '../../../data/indexes.json');
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('dashboards')
  async SaveDashboards(@Body() body: any,  @Body('isNew') isNew: boolean) {
    console.log("isNew", isNew);
    let dashboards = await this.jsonfielServoce.read('../../../data/dashboards.json');
    if(isNew) {
      const newDashboard = {
        id: uuidv4().substring(0, 2),
        name: body.data.name,
        index: body.data.index,
        description: body.data.description,
        created_at: new Date().toLocaleString()
      }
      dashboards.dashboards.push(newDashboard);
    } else {
      console.log(body.data)
      dashboards = body.data;
    }
    await this.jsonfielServoce.save(dashboards, '../../../data/dashboards.json');
    return { success: true };
  }

  @Get(['reports','reports/:name'])
  async ReadReports(@Param('name') name: string = 'index') {
    const dashboard = (
      await this.jsonfielServoce.read('../../../data/dashboards.json')
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
    return await this.jsonfielServoce.read('../../../data/indexes.json');
  }

  @Get('dashboards')
  async ReadDashboards() {
    return await this.jsonfielServoce.read('../../../data/dashboards.json');
  }

  @Get(['explorer', 'explorer/:name'])
  async ReadExplorer(@Param('name') name: string = 'index') {
    const dashboard = (
      await this.jsonfielServoce.read('../../../data/dashboards.json')
    ).filter((d) => d.name == name)[0];
    if (!dashboard) throw new NotFoundException();

    const settings = dashboard.explorer;
    const configs = await this.jsonfielServoce.read('../../../data/data.json');
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
    return await this.jsonfielServoce.read('../../../data/data.json');
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('metadata')
  async getMetadata() {
    let dspace_altmetrics: any;
    let dspace_downloads_and_views: any;
    let mel_downloads_and_views: any;
    const data = await this.jsonfielServoce.read('../../../data/data.json');
    const plugins = await this.jsonfielServoce.read(
      '../../../data/plugins.json',
    );
    const medatadataKeys: Array<string> =
      await this.indexMetadataService.getMetadata();
    const meta = [];
    for (let i = 0; i < plugins.length; i++) {
      if (plugins[i].name == 'dspace_altmetrics') {
        dspace_altmetrics = await this.jsonfielServoce.read(
          '../../../src/plugins/dspace_altmetrics/info.json',
        );
        meta.push(dspace_altmetrics.source);
      }
      if (plugins[i].name == 'dspace_downloads_and_views') {
        dspace_downloads_and_views = await this.jsonfielServoce.read(
          '../../../src/plugins/dspace_downloads_and_views/info.json',
        );
        meta.push(dspace_downloads_and_views.source);
      }
      if (plugins[i].name == 'mel_downloads_and_views') {
        mel_downloads_and_views = await this.jsonfielServoce.read(
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
