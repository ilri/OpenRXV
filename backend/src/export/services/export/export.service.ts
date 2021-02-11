import { Injectable } from '@nestjs/common';
import { FileType } from 'src/shared/models/types.helpers';
import {
  BodyResponse,
  Hits,
  ExporterResponse
} from 'src/shared/models/ResponseBody.modal';
import { ApiResponse } from '@elastic/elasticsearch';
import { Response as ExpressRes } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import * as PizZip from 'pizzip';
import * as Docxtemplater from 'docxtemplater';
import * as libre from 'libreoffice-convert'
var expressions = require('angular-expressions');
var assign = require("lodash/assign");
expressions.filters.lower = function (input) {
  if (!input) return input;
  return input.toLowerCase();
}
const ExcelJS = require('exceljs');
@Injectable()
export class ExportService {
  a
  async downloadFile(
    res: ExpressRes,
    { body: { hits, _scroll_id } }: ApiResponse<BodyResponse>,
    type: FileType,
    part: number,
    fileNameg: string,
    file,
    query,
    websiteName
  ): Promise<void> {
    try {
      this.a = fileNameg;
      const fileName = this.a
      if (hits.hits.length === 0) {
        res.json({ end: true });
        return;
      }

      const response: ExporterResponse = {
        end: hits.hits.length === 0,
        scrollId: _scroll_id,
        fileName: `${this.a}`,
        path: '/downloads',
        per_doc_size: 2000,
        total: hits.total.value
      };

      let filePath: string;

      if (type == 'docx') {
        filePath = await this.createDocx(fileNameg, hits, query, part, websiteName);
      } else if (type == 'xlsx') {
        filePath = await this.createXlsx(hits, file, part, websiteName);
      } else if (type === 'pdf') {
        filePath = await this.createPdf(await this.createDocx(fileNameg, hits, query, part, websiteName), fileName, type, res, response, part, websiteName) as string;
      }

      if (filePath)
        response.fileName = filePath
      res.json(response)
    } catch (error) {
      throw new Error(error);
    }
  }

  private async createDocx(fileName: string, hits: Hits, query: any, part, websiteName): Promise<string> {
    let sort = query.sort[0]._score.order
    let select = '';
    let search = '';
    let sortBy = "score"
    let dateObj = new Date()
    let currentDate = dateObj.toDateString()
    if (query.sort.length != 1) {
      sortBy = Object.getOwnPropertyNames(query.sort[1])[0].replace('.keyword', "")
      sort = query.sort[1][`${Object.getOwnPropertyNames(query.sort[1])[0]}`].order
    }
    if (query.query != undefined) {
      if (query.query.hasOwnProperty('query_string'))
        search = query.query.query_string.query;
      if (query.query.hasOwnProperty('range'))
        select = JSON.stringify(query.query.range).replace(/[^-A-Za-z 0-9 -_,: ]/g, "").replace("keyword", "")
      if (query.query.hasOwnProperty('bool')) {
        if (query.query.bool.hasOwnProperty('filter'))
          if (query.query.bool.filter.hasOwnProperty('term'))
            select = JSON.stringify(query.query.bool.filter.term).replace(/[^-A-Za-z,: ]/g, "").replace("keyword", "")
        if (query.query.bool.hasOwnProperty('must')) {
          if (query.query.bool.must.hasOwnProperty('query_string'))
            search = query.query.bool.must.query_string.query
          if (query.query.bool.must.hasOwnProperty('filter'))
            select = ',' + select + JSON.stringify(query.query.bool.filter.term).replace(/[^-A-Za-z,: ]/g, "").replace("keyword", "") + ","
          if (query.query.bool.must.hasOwnProperty('range'))
            select = "_" + select + JSON.stringify(query.query.bool.must.range).replace(/[^A-Za-z 0-9 _,: ]/g, "").replace("keyword", "") + "_"
          if (Array.isArray(query.query.bool.must)) {
            query.query.bool.must.map(a => {
              if (a.hasOwnProperty('query_string'))
                search = search + a.query_string.query
              if (a.hasOwnProperty('range'))
                select = "," + select + JSON.stringify(a.range).replace(/[^-A-Za-z 0-9 -_,: ]/g, "").replace("keyword", "") + ","
            })
          }
        }
        if (query.query.bool.hasOwnProperty('filter'))
          if (query.query.bool.filter.hasOwnProperty('bool')) {
            if (query.query.bool.filter.bool.hasOwnProperty('must')) {
              query.query.bool.filter.bool.must.map(a => { select = select + JSON.stringify(a.term).replace(/[^-A-Za-z,: ]/g, "").replace("keyword", " ") + ", " })
              select = '(And) ' + select
            }
            if (query.query.bool.filter.bool.hasOwnProperty('should')) {
              query.query.bool.filter.bool.should.map(a => { select = select + JSON.stringify(a.term).replace(/[^-A-Za-z,: ]/g, "").replace("keyword", " ") + ", " })
              select = '(OR) ' + select
            }
          }
      }
    }
    try {

      const zip = new PizZip(
        await fs.promises.readFile(this.resolvePath(fileName + "", false), 'binary')
      );
      function angularParser(tag) {
        if (tag != undefined && tag != null){
          if (tag === '.') {
            return {
              get: function (s) { return s; }
            };
          }
        const expr = expressions.compile(
          tag.replace(/(’|‘)/g, "'").replace(/(“|”)/g, '"')
        );
        return {
          get: function (scope, context) {
            let obj = {};
            const scopeList = context.scopeList;
            const num = context.num;
            for (let i = 0, len = num + 1; i < len; i++) {
              obj = assign(obj, scopeList[i]);
            }
            return expr(scope, obj);
          }
        };
      }
      }
      const doc = new Docxtemplater(zip, { parser: angularParser });
      doc.loadZip(zip);
      doc.setData({
        items: hits.hits.map(items => items._source),
        date: currentDate,
        searchQuery: search ? "search term: " + search + "," : "",
        selectQuery: select ? select.replace(/:/g, '= ') : "",
        sortingType: sort,
        sortedBy: sortBy,
        total: hits.total.value,
            });
      doc.render();
      const buf = doc.getZip().generate({ type: 'nodebuffer' });
      var d = new Date();
      var milliS = d.getTime()
      const filePath = this.resolvePath(`${websiteName}-${milliS}-${part}.docx`, true);
      // const spinner = ora(`🚀 writing DOCX`).start();
      return fs.promises.writeFile(filePath, buf).then(() => {
        // spinner.succeed(`👾 we are done writing DOCX`).stop();
        return `${websiteName}-${milliS}-${part}.docx`
      });
    } catch (error) {
      throw new Error(error);
    }
  }

  private async createXlsx(body, file, part, websiteName) {

    var workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('sheet', {
      pageSetup: { paperSize: 20, orientation: 'landscape', fitToPage: true }
    });
    let columns = new Array();
    for (let index = 0; index < file.tags.length; index++) {
      columns.push({ header: `${file.tags[index].label}` })
    }
    worksheet.columns = columns
    //TODO make it general for any object
    const sourcesMetadata =
      body.hits.map(({ _source }) => file.tags.map(tag => {
        let splited = tag.metadata.split('.')
        if (!splited[1] && splited[0])
          return _source[splited[0]] ? _source[splited[0]] : ''
        else
          return _source[splited[0]] ? _source[splited[0]][splited[1]] ? _source[splited[0]][splited[1]] : '' : ''
      }));
    sourcesMetadata.map((a) => {
      for (let index = 0; index < a.length; index++) {
        if (Array.isArray(a[index]))
          a[index] = a[index].join(', ')
      }
    })
    workbook.addWorksheet("My Sheet");
    for (let index = 0; index < sourcesMetadata.length; index++) {
      worksheet.getRow(index + 2).values = sourcesMetadata[index]

    }
    var d = new Date();
    var milliS = d.getTime()
    const filePath = this.resolvePath(`${websiteName}-${milliS}-${part}`, true);
    const buffer = await workbook.xlsx.writeBuffer();
    fs.writeFile(filePath + ".xlsx", buffer, (err) => {
      if (err) throw err;
    });
    return `${websiteName}-${milliS}-${part}` + ".xlsx";
  }


  private resolvePath(file: string, download?: boolean): string {
    return download
      ? path.resolve(__dirname, `../../../../data/files/downloads/${file}`)
      : path.resolve(__dirname, `../../../../data/files/${file}`);
  }

  private async createPdf(
    filePath: string,
    fileName: string,
    type: FileType,
    res: ExpressRes,
    response: object,
    part,
    websiteName
  ) {
    // const spinner = ora(`🔭 converting to PDF`).start();
    // Read file
    var d = new Date();
    var milliS = d.getTime()
    const file = fs.readFileSync(this.resolvePath(filePath, true));
    return await new Promise((resolve, rejet) => {
      libre.convert(file, type, undefined, async (err, done) => {
        if (err) {
          rejet(err)
          console.log(`Error converting file: ${err}`);
        }
        let filename = `${websiteName}-${milliS}-${part}.${type}`;
        // Here in done you have pdf file which you can save or transfer in another stream
        await fs.writeFileSync(this.resolvePath(filename, true), done);
        resolve(filename)
      });
    })
    // Convert it to pdf format with undefined filter (see Libreoffice doc about filter)

  }

}