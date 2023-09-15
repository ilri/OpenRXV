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
  constructor(private httpService: HttpService) {
  }
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
    let dashboards = await this.read('../../../data/dashboards.json');
    let indexes = await this.read('../../../data/indexes.json');
    if (!dashboards) return new NotFoundException();

    const index_id = dashboards.filter((d) => (d.name == dashboard_name))[0]
      .index;

    const index_name = indexes.filter((d) => (d.id == index_id))[0].name;
    return index_name;
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
      const writer = fs.createWriteStream(join(__dirname, '../../../data/files/') + directory + '/' + name + '.' + fileType);

      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      return directory + '/' + name + '.' + fileType;
    } catch (e) { /* empty */
      return url;
    }
  }
}
