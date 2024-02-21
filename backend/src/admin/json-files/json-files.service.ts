import { Injectable, NotFoundException } from '@nestjs/common';
import * as jsonfile from 'jsonfile';
import { join } from 'path';
import * as fs from 'fs';
import { readdirSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { HttpService } from '@nestjs/axios';
const mimeTypes = require('mime-types');
function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class JsonFilesService {
  constructor(private httpService: HttpService) {}
  async startup() {
    const files = await readdirSync(join(__dirname, '../../../data/templates'));
    for (const file of files)
      if (
        !(await existsSync(join(__dirname, '../../../data/' + file.substr(8))))
      )
        await copyFileSync(
          join(__dirname, '../../../data/templates/' + file),
          join(__dirname, '../../../data/' + file.substr(8)),
        );

    if (await existsSync(join(__dirname, '../../../data/files/images')))
      await mkdirSync(join(__dirname, '../../../data/files/images'), {
        recursive: true,
      });
  }
  async getIndexFromDashboard(dashboard_name) {
    const dashboard = await this.GetDashboard(dashboard_name);
    if (!dashboard) return new NotFoundException();
    const indexes = await this.read('../../../data/indexes.json');

    const index_id = dashboard.index;

    return indexes.filter((d) => d.id == index_id)[0].name;
  }
  async getPredefinedFiltersFromDashboard(dashboard_name) {
    const dashboard = await this.GetDashboard(dashboard_name);
    return dashboard?.explorer?.predefinedFilters;
  }
  async createifnotexist() {
    const directory = join(__dirname, '../../../data/harvestors');
    if (!(await existsSync(directory)))
      await mkdirSync(directory, {
        recursive: true,
      });

    fs.readdir(directory, (err, files) => {
      if (err) throw err;

      for (const file of files) {
        fs.unlink(join(directory, file), (err) => {
          if (err) throw err;
        });
      }
    });
  }

  async save(obj, name) {
    jsonfile.writeFileSync(join(__dirname, name), obj);
    return { success: true };
  }

  async read(name) {
    return jsonfile.readFileSync(join(__dirname, name));
  }

  async DownloadImportedFile(url: string, fileName: string, directory: string) {
    try {
      // Imported reports could have the file as URL
      new URL(url);
      const response = await this.httpService.axiosRef({
        url: url,
        method: 'GET',
        responseType: 'stream',
      });
      const fileType = mimeTypes.extension(response.headers['content-type']);
      const name = fileName.replace(/\s/g, '-') + '-' + new Date().getTime();
      const writer = fs.createWriteStream(
        join(__dirname, '../../../data/files/') +
          directory +
          '/' +
          name +
          '.' +
          fileType,
      );

      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return directory + '/' + name + '.' + fileType;
    } catch (e) {
      /* empty */
      return url;
    }
  }

  async GetDashboard(dashboard_name: string = 'DEFAULT_DASHBOARD') {
    const dashboards = await this.read('../../../data/dashboards.json');
    let dashboard;
    if (
      dashboard_name === 'DEFAULT_DASHBOARD' ||
      dashboard_name === '' ||
      dashboard_name === 'null' ||
      dashboard_name == null
    ) {
      dashboard = dashboards.find((dashboard) => {
        if (dashboard?.is_default && dashboard.is_default === true) {
          return dashboard;
        }
      });
      // If no default dashboard is defined, return the first dashboard
      if (!dashboard && dashboards.length > 0) {
        return dashboards[0];
      }
    } else {
      dashboard = dashboards.find((dashboard) => {
        if (dashboard.name === dashboard_name) {
          return dashboard;
        }
      });
    }
    return dashboard;
  }
}
