import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  IndexResponse,
  UpdateResponse,
} from '@elastic/elasticsearch/lib/api/types';
import { ValuesService } from '../../shared/services/values.service';
function isEmpty(obj) {
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}
@Controller('values')
export class ValuesController {
  constructor(private elastic: ValuesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('term/:term/:index')
  async GetValues(
    @Param('term') term: any,
    @Param('index_name') index_name: string,
  ) {
    return await this.elastic.findByTerm(term, index_name);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('term/')
  async GetValuesnull(@Query() query: any) {
    let index_name = null;
    if (query.hasOwnProperty('index_name')) {
      index_name = query.index_name;
    }
    if (query?.term && query.term !== '') {
      return await this.elastic.findByTerm(query.term, index_name);
    } else {
      return await this.elastic.findByTerm('', index_name);
    }
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  async NewValue(@Body() body: any) {
    let index_name = null;
    if (body.hasOwnProperty('index_name')) {
      index_name = body.index_name;
      delete body.index_name;
    }

    body.find = body.find === '' ? null : body.find;
    body.replace = body.replace === '' ? null : body.replace;
    body.metadataField = body.metadataField === '' ? null : body.metadataField;
    const existsQuery: any = {
      bool: {
        must: [
          {
            term: { 'find.keyword': body.find },
          },
          {
            term: { 'replace.keyword': body.replace },
          },
        ],
      },
    };
    if (body?.metadataField) {
      existsQuery.bool.must.push({
        term: { 'metadataField.keyword': body.metadataField },
      });
    } else {
      existsQuery.bool.must_not = [{ exists: { field: 'metadataField' } }];
    }

    const exists = await this.elastic.query(
      {
        query: existsQuery,
      },
      index_name,
    );

    if (exists.length > 0) {
      return {
        success: false,
        message: 'Mapping exists',
        exists,
      };
    }

    const response: IndexResponse = await this.elastic.add(body, index_name);
    if (response?._shards?.failed === 0) {
      return {
        success: true,
        message: 'Value mapping saved successfully',
      };
    } else {
      const errors = response?._shards?.failures.map(
        (failure) => failure.reason.reason,
      );
      return {
        success: false,
        message: errors.length
          ? errors.join(', ')
          : 'Oops! something went wrong',
      };
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('bulk')
  async bulk(@Body() body: any) {
    const failed = [];
    const success = [];
    for (const item of body.data) {
      item.find = item.find === '' ? null : item.find;
      item.replace = item.replace === '' ? null : item.replace;
      item.metadataField =
        item.metadataField === '' ? null : item.metadataField;
      const existsQuery: any = {
        bool: {
          must: [
            {
              term: { 'find.keyword': item.find },
            },
            {
              term: { 'replace.keyword': item.replace },
            },
          ],
        },
      };
      if (item?.metadataField) {
        existsQuery.bool.must.push({
          term: { 'metadataField.keyword': item.metadataField },
        });
      } else {
        existsQuery.bool.must_not = [{ exists: { field: 'metadataField' } }];
      }

      const exists =
        (
          await this.elastic.query(
            {
              query: existsQuery,
            },
            body.index_name,
          )
        ).length > 0;

      if (!exists) {
        const response: IndexResponse = await this.elastic.add(
          item,
          body.index_name,
        );
        if (response?._shards?.failed === 0) {
          success.push({ item });
        } else {
          const errors = response?._shards?.failures.map(
            (failure) => failure.reason.reason,
          );
          failed.push({
            item,
            message: errors.length
              ? errors.join(', ')
              : 'Oops! something went wrong',
          });
        }
      } else {
        failed.push({
          item,
          message: 'Mapping exists',
        });
      }
    }

    return {
      success,
      failed,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/:index_name')
  async GetOneValue(
    @Param('id') id: string,
    @Param('index_name') index_name: string,
  ) {
    const value: any = await this.elastic.findOne(id, index_name);
    value['id'] = id;
    return value;
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('deleteAll/:index_name')
  DeleteAll(@Param('index_name') index_name: string) {
    return this.elastic.deleteAll(index_name);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id/:index_name')
  DeleteOneValue(
    @Param('id') id: string,
    @Param('index_name') index_name: string,
  ) {
    return this.elastic.delete(id, index_name);
  }
  @Put(':id')
  async updateOneValue(@Param('id') id: string, @Body() body) {
    let index_name = null;
    if (body.hasOwnProperty('index_name')) {
      index_name = body.index_name;
      delete body.index_name;
    }
    body.find = body.find === '' ? null : body.find;
    body.replace = body.replace === '' ? null : body.replace;
    body.metadataField = body.metadataField === '' ? null : body.metadataField;
    const existsQuery: any = {
      bool: {
        must: [
          {
            term: { 'find.keyword': body.find },
          },
          {
            term: { 'replace.keyword': body.replace },
          },
        ],
        must_not: [
          {
            term: { _id: id },
          },
        ],
      },
    };
    if (body?.metadataField) {
      existsQuery.bool.must.push({
        term: { 'metadataField.keyword': body.metadataField },
      });
    } else {
      existsQuery.bool.must_not.push({ exists: { field: 'metadataField' } });
    }

    const exists =
      (
        await this.elastic.query(
          {
            query: existsQuery,
          },
          index_name,
        )
      ).length > 0;

    if (exists) {
      return {
        success: false,
        message: 'Mapping exists',
      };
    }

    const response: UpdateResponse = await this.elastic.update(
      id,
      body,
      index_name,
    );
    if (response?._shards?.failed === 0) {
      return {
        success: true,
        message: 'Value mapping saved successfully',
      };
    } else {
      const errors = response?._shards?.failures.map(
        (failure) => failure.reason.reason,
      );
      return {
        success: false,
        message: errors.length
          ? errors.join(', ')
          : 'Oops! something went wrong',
      };
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('')
  async GetVales(@Query() query: any) {
    let index_name = null;
    if (query.hasOwnProperty('index_name')) {
      index_name = query.index_name;
      delete query.index_name;
    }
    let filters = null;

    if (!isEmpty(query)) {
      filters = {};
      Object.keys(query).forEach((key) => {
        filters[key + '.keyword'] = query[key];
      });
    }

    return await this.elastic.find(filters, index_name);
  }
}
