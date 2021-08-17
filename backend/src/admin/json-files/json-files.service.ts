import { Injectable } from '@nestjs/common';
import * as jsonfile from 'jsonfile';
import { join } from 'path';
import * as fs from 'fs';
import { readdirSync, copyFileSync, existsSync, mkdirSync } from 'fs';
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

  async save(obj, name) {
    jsonfile.writeFileSync(join(__dirname, name), obj);
    return { success: true };
  }

  async read(name) {
    return jsonfile.readFileSync(join(__dirname, name));
  }
}
