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
import { JsonFilesService } from '../json-files/json-files.service';
import { ValuesService } from 'src/shared/services/values.service';
function isEmpty(obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}
@Controller('values')
export class ValuesController {
  constructor(
    private elastic: ValuesService,
    private jsonfielServoce: JsonFilesService,
  ) {}
  // @Get('import/')
  // async Import() {
  //     let values = await this.jsonfielServoce.read('../../../data/mapping.json')
  //     Object.keys(values).forEach(async key => {
  //         await this.elastic.add({ find: key, replace: values[key] });
  //     })
  //     return values;
  // }
  @UseGuards(AuthGuard('jwt'))
  @Get('term/:term')
  async GetValues(@Param('term') term: any) {
    return await this.elastic.findByTerm(term);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('term/')
  async GetValuesnull() {
    return await this.elastic.findByTerm();
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  NewUser(@Body() body: any) {
    return this.elastic.add(body);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async GetOneUser(@Param('id') id: string) {
    let user: any = await this.elastic.findOne(id);
    user['id'] = id;
    return user;
  }
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  DeleteOneUser(@Param('id') id: string) {
    return this.elastic.delete(id);
  }
  @Put(':id')
  updateOneUser(@Param('id') id: string, @Body() body) {
    return this.elastic.update(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('')
  async GetVales(@Query() query: any) {
    let filters = null;

    if (!isEmpty(query)) {
      filters = {};
      Object.keys(query).forEach((key) => {
        filters[key + '.keyword'] = query[key];
      });
    }

    return await this.elastic.find(filters);
  }
}
