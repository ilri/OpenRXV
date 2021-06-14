import { Controller, UseGuards, Post, Body, Get, HttpService, Query, UseInterceptors, UploadedFile, Logger, Request, Param, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JsonFilesService } from '../json-files/json-files.service';
import { map } from 'rxjs/operators';
import { HarvesterService } from 'src/harvester/services/harveter.service';
import { FileInterceptor, MulterModule } from '@nestjs/platform-express'
import { join } from 'path';
import * as fs from 'fs';
import { readdirSync } from 'fs';


@Controller('settings')
export class SettingsController {

    constructor(private jsonfielServoce: JsonFilesService, private httpService: HttpService) { }
    getDirectories = source => readdirSync(source, { withFileTypes: true }).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
    @UseGuards(AuthGuard('jwt'))
    @Get('plugins')
    async plugins() {
        let plugins = await this.getDirectories('./src/plugins');
        let plugins_values = await this.jsonfielServoce.read('../../../data/plugins.json')
        let info = []
        plugins.forEach(async plugin => {
            let infor = await this.jsonfielServoce.read('../../../src/plugins/' + plugin + '/info.json')
            let values = plugins_values.filter(plug => plug.name == plugin)
            if (values[0])
                infor['values'] = values[0].value
            else
                infor['values'] = []
            info.push(infor);
        })
        return info;
    }

    @Post('plugins')
    async savePlugins(@Body() body: any) {
        return await this.jsonfielServoce.save(body, '../../../data/plugins.json');
    }


    format(body: any) {
        let final = {};
        final['repositories'] = []
        body.repositories.forEach(repo => {

            let schema = {
                metadata: []
            };
            repo.schema.filter(d => ['parentCollection', 'parentCollectionList', 'parentCommunityList'].indexOf(d.metadata) >= 0).forEach(item => {
                schema[item.metadata] = {
                    "name": item.disply_name
                }
            });
            repo.schema.filter(d => ['parentCollection', 'parentCollectionList', 'parentCommunityList'].indexOf(d.metadata) == -1).forEach(item => {
                schema[item.metadata] = item.disply_name
            });

            repo.metadata.forEach(item => {
                let temp = {
                    "where": {
                        "key": item.metadata
                    },
                    "value": {
                        "value": item.disply_name
                    }
                }
                if (item.addOn)
                    temp['addOn'] = item.addOn
                schema.metadata.push(temp)
            })
            schema['bitstreams'] = [
                {
                    "where": {
                        "bundleName": "THUMBNAIL"
                    },
                    "value": {
                        "retrieveLink": "thumbnail"
                    },
                    "prefix": repo.itemsEndPoint
                }
            ];

            final['repositories'].push({
                name: repo.name,
                years: repo.years,
                type: "Dspace",
                startPage: repo.startPage,
                itemsEndPoint: repo.itemsEndPoint,
                siteMap: repo.siteMap,
                allCores: repo.allCores,
                schema,
            })
        });

        return final;
    }
    @UseGuards(AuthGuard('jwt'))
    @Post('')
    async Save(@Body() body: any) {

        await this.jsonfielServoce.save(body, '../../../data/data.json');
        await this.jsonfielServoce.save(this.format(body), '../../../data/dataToUse.json');

        return { success: true }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('explorer')
    async SaveExplorer(@Body() body: any) {
        await this.jsonfielServoce.save(body, '../../../data/explorer.json');
        return { success: true }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('appearance')
    async SaveAppearance(@Body() body: any) {
        await this.jsonfielServoce.save(body, '../../../data/appearance.json');
        return { success: true }
    }

    @Get('appearance')
    async ReadAppearance() {
        return await this.jsonfielServoce.read('../../../data/appearance.json');
    }


    @Get('explorer')
    async ReadExplorer() {
        let settings = await this.jsonfielServoce.read('../../../data/explorer.json');
        let configs = await this.jsonfielServoce.read('../../../data/data.json');
        let appearance = await this.jsonfielServoce.read('../../../data/appearance.json');
        settings['appearance'] = appearance
        let list_icons = {}
        if (configs.repositories) {
            configs.repositories.map(d => [list_icons[d.name] = d.icon])
            settings['appearance']['icons'] = list_icons
            return settings
        } else
            return {}


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
        let data = await this.jsonfielServoce.read('../../../data/data.json');
        let plugins = await this.jsonfielServoce.read('../../../data//plugins.json')
        let meta = [];
        for (var i = 0; i < plugins.length; i++) {
            if (plugins[i].name == 'dspace_altmetrics') {
                dspace_altmetrics = await this.jsonfielServoce.read('../../../src/plugins/dspace_altmetrics/info.json')
                meta.push(dspace_altmetrics.source)
            }
            if (plugins[i].name == 'dspace_downloads_and_views') {
                dspace_downloads_and_views = await this.jsonfielServoce.read('../../../src/plugins/dspace_downloads_and_views/info.json')
                meta.push(dspace_downloads_and_views.source)
            }
            if (plugins[i].name == 'mel_downloads_and_views') {
                mel_downloads_and_views = await this.jsonfielServoce.read('../../../src/plugins/mel_downloads_and_views/info.json')
                meta.push(mel_downloads_and_views.source)
            }
        }
        let a = [].concat(...meta)
        let uniqueArray = a.filter(function (item, pos) {
            return a.indexOf(item) == pos;
        })



        var merged = [].concat.apply([], data.repositories.map(d => [...d.schema, ...d.metadata]));
        return [...new Set(merged.map(d => d.disply_name)), ...data.repositories.filter(d => d.years).map(d => d.years), ...uniqueArray];
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('autometa')
    async AutoMeta(@Query('link') link: string) {

        let checkingVersion = this.httpService.get(new URL(link).origin + '/rest/status').pipe(map(async (response, index) => {
            if (response.data.apiVersion == undefined) {
                let data = await this.httpService.get(link + '/items?expand=metadata,parentCommunityList&limit=25').pipe(map((data: any) => {
                    let merged = {
                        base: [],
                        metadata: [],
                    }
                    data = data.data.forEach(element => {
                        merged.base = Array.from(new Set([].concat.apply(merged.base, Object.keys(element).filter(d => ['metadata', 'bitstreams', 'expand'].indexOf(d) == -1))));;
                        merged.metadata = Array.from(new Set([].concat.apply(merged.metadata,
                            element.metadata.map(item => {
                                return item.key
                            })
                        )));
                    });
                    return merged;
                }, error => {
                })).toPromise();

                return data;
            }
            else if(response.data.apiVersion == 6){
                let merged = {
                        base: [],
                        metadata: [],
                    }
                    let base = await this.httpService.get(link + '/items?expand=metadata,parentCommunityList&limit=25').pipe(map((data: any) => {

                        data = data.data.forEach(element => {
                            merged.base = Array.from(new Set([].concat.apply(merged.base, Object.keys(element).filter(d => ['metadata', 'bitstreams', 'expand'].indexOf(d) == -1))));;
                        });
                        return merged;
                    }, error => {
                    })).toPromise();

                let data = await this.httpService.get(link+'/registries/schema').pipe(map((data: any, index) => {
                    data = data.data.forEach((element, index) => {
                        merged.metadata = Array.from(new Set([].concat.apply(merged.metadata,
                            element.fields.map(item => {
                                return item.name
                            })
                        )));
                    });
                    return merged;
                }, error => {
                })).toPromise();
                return data;
            }
        })).toPromise()
        return checkingVersion
    }

    @Post('upload/image')
    @UseInterceptors(FileInterceptor('file', {
        preservePath: true, fileFilter: this.imageFileFilter, dest: join(__dirname, '../../../data/files/images')
    }))
    async uploadFile(@UploadedFile() file) {
        let splited = file.originalname.split('.');
        let name = splited[0] + '-' + new Date().getTime();
        let response = join(__dirname, '../../../data/files/images/') + name + '.' + splited[splited.length - 1];
        await fs.renameSync(join(__dirname, '../../../data/files/images/') + file.filename, response)
        return { location: response.slice(response.indexOf('files/') + 6) };
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('reportings')
    async SaveReports(@Body() body: any) {
        await this.jsonfielServoce.save(body, '../../../data/reports.json');
        return { success: true }
    }

    @Get('reports')
    async ReadReports() {
        return await this.jsonfielServoce.read('../../../data/reports.json');
    }
    @Post('upload/file')
    @UseInterceptors(FileInterceptor('file', {
        preservePath: true, fileFilter: this.imageFileFilter, dest: join(__dirname, '../../../data/files/files')
    }))
    async uploadFile1(@UploadedFile() file) {
        let splited = file.originalname.split('.');
        let name = splited[0].replace(/\s/g, '-') + '-' + new Date().getTime();
        let response = join(__dirname, '../../../data/files/files/') + name + '.' + splited[splited.length - 1];
        await fs.renameSync(join(__dirname, '../../../data/files/files/') + file.filename, response)
        return { location: response.slice(response.indexOf('files/') + 5) };
    }

    @Get('files/:fileName')
    async downloadFile(@Param('fileName') fileName, @Res() res): Promise<any> {
        return (res.sendFile(fileName, { root: 'data/files/files' }))
    }
}
