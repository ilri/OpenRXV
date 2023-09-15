import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonFilesService } from '../json-files/json-files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { readdirSync } from 'fs';
import { HttpService } from '@nestjs/axios';
import { IndexMetadataService } from 'src/shared/services/index-metadata.service';
import { v4 as uuidv4 } from 'uuid';
import { ElasticService } from 'src/shared/services/elastic/elastic.service';
@Controller('settings')
export class SettingsController {
  constructor(
    private jsonFilesService: JsonFilesService,
    private indexMetadataService: IndexMetadataService,
    private elasticSearvice: ElasticService,
    private httpService: HttpService,
  ) {}
  getDirectories = (source) =>
    readdirSync(source, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  @UseGuards(AuthGuard('jwt'))
  @Get('plugins/:index_name')
  async plugins(@Param('index_name') index_name: string = 'index') {
    const plugins = await this.getDirectories('./src/plugins');
    const plugins_values = await this.jsonFilesService.read(
      '../../../data/plugins.json',
    );
    const index_plugins_values = plugins_values.hasOwnProperty(index_name) ? plugins_values[index_name] : [];

    const info = [];
    plugins.forEach(async (plugin) => {
      const infor = await this.jsonFilesService.read(
        '../../../src/plugins/' + plugin + '/info.json',
      );
      const values = index_plugins_values.filter((plug) => plug.name == plugin);
      if (values[0]) infor['values'] = values[0].value;
      else infor['values'] = [];
      info.push(infor);
    });
    return info;
  }

  @Post('plugins/:index_name')
  async savePlugins(@Body() body: any, @Param('index_name') index_name: string = 'index') {
    const plugins_values = await this.jsonFilesService.read('../../../data/plugins.json');
    plugins_values[index_name] = body;
    return await this.jsonFilesService.save(plugins_values, '../../../data/plugins.json');
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('explorer')
  async SaveExplorer(
    @Body('data') data: any,
    @Body('dashboard_name') dashboard_name: any,
  ) {
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
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('appearance')
  async SaveAppearance(
    @Body('data ') data: any,
    @Body('dashboard_name') dashboard_name: any,
  ) {
    let dashboards = await this.jsonFilesService.read(
      '../../../data/dashboards.json',
    );
    if (!dashboards) return new NotFoundException();
    for (let dashboard of dashboards) {
      if (dashboard.name == dashboard_name) {
        if (data?.logo !== '' && data.logo != null) {
          data.logo = await this.jsonFilesService.DownloadImportedFile(data.logo, dashboard_name, 'images');
        }
        if (data?.favIcon !== '' && data.favIcon != null) {
          data.favIcon = await this.jsonFilesService.DownloadImportedFile(data.favIcon, dashboard_name, 'images');
        }

        dashboard['appearance'] = data;
        break;
      }
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
    const dashboards = await this.jsonFilesService.read(
      '../../../data/dashboards.json',
    );
    if (!dashboards) {
      return new NotFoundException();
    }

    for (const report of data) {
      if (report.fileType !== 'xlsx' && report?.file !== '') {
        report.file = '/' + await this.jsonFilesService.DownloadImportedFile(report.file, report.title, 'files');
      }
    }

    for (const dashboard of dashboards) {
      if (dashboard.name == dashboard_name) {
        dashboard['reports'] = data;
      }
    }

    await this.jsonFilesService.save(
      dashboards,
      '../../../data/dashboards.json',
    );

    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('indexes')
  async SaveIndexes(@Body() body: any, @Body('isNew') isNew: boolean, @Body('deleted') deleted: any) {
    let indexes = await this.jsonFilesService.read('../../../data/indexes.json');

    if (deleted?.id) {
      // Get the dashboards where the index is used
      const dashboards = await this.jsonFilesService.read('../../../data/dashboards.json');
      let relatedDashboards = [];
      if (Array.isArray(dashboards) && dashboards.length > 0) {
        dashboards.map((dashboard) => {
          if (dashboard?.index && dashboard.index === deleted.id) {
            relatedDashboards.push({
              id: dashboard.id,
              name: dashboard.name,
            });
          }
        });
      }

      // Get the dashboards where the index is used
      const repositories = await this.jsonFilesService.read('../../../data/data.json');
      let relatedRepositories = [];
      if (repositories?.repositories && Array.isArray(repositories.repositories) && repositories.repositories.length > 0) {
        repositories.repositories.map((repository) => {
          if (repository?.index_name && repository.index_name === deleted.name) {
            relatedRepositories.push({
              name: repository.name,
            });
          }
        });
      }

      // Prevent deletion if the index is linked to a dashboard or a repository
      if (relatedDashboards.length > 0 || relatedRepositories.length > 0) {
        return {
          success: false,
          relatedDashboards,
          relatedRepositories,
        };
      } else {
        indexes = body.data;
      }
    } else {
      if (isNew) {
        indexes.push({
          id: uuidv4(),
          name: body.data?.name,
          description: body.data?.description,
          to_be_indexed: body.data?.to_be_indexed,
          created_at: new Date().toLocaleString(),
        });
      } else {
        indexes = body.data;
      }

      const namesFiltered = [];
      for (let i = 0; i < indexes.length; i++) {
        indexes[i].name = this.indexMetadataService.cleanIdNames(indexes[i].name);
        if (indexes[i].name !== '') {
          namesFiltered.push(indexes[i].name);
        }
      }

      if (namesFiltered.length !== indexes.length) { // Don't allow empty index names
        return {
          success: false,
          message: `Index name cannot be empty`,
        };
      } else if ((new Set(namesFiltered)).size !== namesFiltered.length) { // If two indexes have the same name, prevent submit
        return {
          success: false,
          message: `Index name is already used`,
        };
      }
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
          secondary_color: null,
          website_name: 'OpenRXV',
          logo: null,
          favIcon: null,
          tracking_code: null,
          google_maps_api_key: null,
          description: null,
          show_tool_bar: true,
          show_side_nav: true,
          show_top_nav: false,
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

    const namesFiltered = [];
    for (let i = 0; i < dashboards.length; i++) {
      dashboards[i].name = this.indexMetadataService.cleanIdNames(dashboards[i].name);
      if (dashboards[i].name !== '') {
        namesFiltered.push(dashboards[i].name);
      }
    }

    if (namesFiltered.length !== dashboards.length) { // Don't allow empty index names
      return {
        success: false,
        message: `Dashboard name cannot be empty`,
      };
    } else if ((new Set(namesFiltered)).size !== namesFiltered.length) { // If two indexes have the same name, prevent submit
      return {
        success: false,
        message: `Dashboard name is already used`,
      };
    }

    await this.jsonFilesService.save(dashboards, '../../../data/dashboards.json');
    return { success: true };
  }

  @Get(['reports', 'reports/:name'])
  async ReadReports(@Param('name') name: string = 'index') {
    const dashboard = (
      await this.jsonFilesService.read('../../../data/dashboards.json')
    ).filter((d) => d.name == name)[0];
    if (!dashboard) throw new NotFoundException();

    return dashboard.reports;
  }

  @Get('outsourcePlugins')
  async readOutsourcePlugins() {
    const pluginsFilesDirectory = '../../../data/harvestors';
    const pluginsFiles = readdirSync(join(__dirname, pluginsFilesDirectory));

    const plugins = [];
    for (const pluginsFile of pluginsFiles) {
      plugins.push(await this.jsonFilesService.read(`${pluginsFilesDirectory}/${pluginsFile}`));
    }

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

    const index = (
        await this.jsonFilesService.read('../../../data/indexes.json')
    ).filter((d) => d.id === dashboard.index)[0];
    if (!index) throw new NotFoundException();
    const index_name = index.name;

    const settings = dashboard.explorer;
    const configs = await this.jsonFilesService.read('../../../data/data.json');
    settings['appearance'] = dashboard.appearance;
    const list_icons = {};
    if (index_name && configs.hasOwnProperty(index_name) && configs[index_name].repositories) {
      configs[index_name].repositories.map((d) => [(list_icons[d.name] = d.icon)]);
    }
    settings['appearance']['icons'] = list_icons;
    settings['index_last_update'] = index.last_update;
    return settings;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(['', ':index_name'])
  async Read(@Param('index_name') index_name: string = 'index') {
    const data = await this.jsonFilesService.read('../../../data/data.json');
    return data.hasOwnProperty(index_name) ? data[index_name] : {repositories: []};
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
    const index_data = data.hasOwnProperty(index_name) ? data[index_name] : {repositories: []};
    const plugins = await this.jsonFilesService.read(
      '../../../data/plugins.json',
    );

    let medatadataKeys = [];
    try {
      medatadataKeys = await this.indexMetadataService.getMetadata(index_name);
    } catch (e) {
    }

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
        index_data.repositories.map((d) => [...d.schema, ...d.metadata]),
    );

    return [
      ...(merged.length > 0 ? [] : new Set(medatadataKeys)),
      ...new Set(merged.map((d) => d.disply_name)),
      ...index_data.repositories.filter((d) => d.years).map((d) => d.years),
      ...uniqueArray,
    ];
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('repository/metadata-auto-retrieve')
  async RepositoryMetadataAutoRetrieve(
      @Query('repository_type') repository_type: string,
      @Query('link') link: string,
  ) {
    if (repository_type === 'DSpace') {
      return await this.indexMetadataService.DSpaceMetadataAutoRetrieve(link);
    } else if (repository_type === 'DSpace7') {
      return await this.indexMetadataService.DSpace7MetadataAutoRetrieve(link);
    } else {
      return {
        base: [],
        metadata: [],
      };
    }
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

  format(body: any) {
    const final = {};
    final['repositories'] = [];
    body.repositories.forEach((repo) => {
      const schema = {
        metadata: [],
      };

      let objectSchemaList = ['parentCollection', 'parentCollectionList', 'parentCommunityList'];
      if (repo.type === 'DSpace7'){
        objectSchemaList = ['owningCollection', 'mappedCollections', 'parentCommunityList', 'thumbnail'];
      }

      repo.schema.map((item) => {
        if (objectSchemaList.indexOf(item.metadata) >= 0) {
          schema[item.metadata] = {
            name: item.disply_name,
          };
        } else {
          schema[item.metadata] = item.disply_name;
        }
      });

      if (repo.type === 'DSpace') {
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
      }

      repo.metadata.map((item) => {
        const temp = {
          where: {
            key: item.metadata,
          },
          value: {
            value: item.disply_name,
          },
        };
        if (item.addOn)
          temp['addOn'] = item.addOn;
        schema.metadata.push(temp);
      });

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
  @Post(':index_name')
  async Save(@Body() body: any, @Param('index_name') index_name: string = 'index') {
    if (body?.repositories && Array.isArray(body.repositories)) {
      for (const repository of body.repositories) {
        if (repository?.icon !== '' && repository.icon != null) {
          repository.icon = await this.jsonFilesService.DownloadImportedFile(repository.icon, repository.name, 'images');
        }
      }
    }

    const data = await this.jsonFilesService.read('../../../data/data.json');
    data[index_name] = body;
    await this.jsonFilesService.save(data, '../../../data/data.json');

    const formattedData = this.format(body);
    const dataToUse = await this.jsonFilesService.read('../../../data/dataToUse.json');
    dataToUse[index_name] = formattedData;
    await this.jsonFilesService.save(dataToUse, '../../../data/dataToUse.json');

    return { success: true };
  }
}
