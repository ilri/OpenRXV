import { Injectable, NotFoundException } from '@nestjs/common';
import * as jsonfile from 'jsonfile';
import { join } from 'path';
import * as fs from 'fs';
import {
  readdirSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  rmdirSync,
} from 'fs';
function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class JsonFilesService {
  async startup() {
    let files = await readdirSync(join(__dirname, '../../../data/templates'));
    for (let file of files)
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
    console.log('get index from dashboard name => ',dashboard_name,index_name);
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
}
