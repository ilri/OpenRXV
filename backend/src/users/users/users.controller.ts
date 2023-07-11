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
import { ElasticService } from '../../shared/services/elastic/elastic.service';
import * as bcrypt from 'bcrypt';
function isEmpty(obj) {
  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }

  return JSON.stringify(obj) === JSON.stringify({});
}
@Controller('users')
export class UsersController {
  constructor(private elastic: ElasticService) {}
  @UseGuards(AuthGuard('jwt'))
  @Post('')
  NewUser(@Body() body: any) {
    if (body.password) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(body.password, salt);
      body.password = hash;
    }
    return this.elastic.add(body);
  }

  @Get(':id')
  async GetOneUser(@Param('id') id: string) {
    try {
      const user: any = await this.elastic.findOne(id);

      delete user.password;
      user['id'] = id;
      return user;
    } catch (e) {
      return e.statusCode == 404 ? {} : e;
    }
  }

  @Delete(':id')
  DeleteOneUser(@Param('id') id: string) {
    return this.elastic.delete(id);
  }
  @Put(':id')
  updateOneUser(@Param('id') id: string, @Body() body) {
    return this.elastic.update(id, body);
  }

  @Get('')
  async GetUsers(@Query() query: any) {
    try {
      let filters = null;

      if (!isEmpty(query)) {
        filters = {};
        Object.keys(query).forEach((key) => {
          filters[key + '.keyword'] = query[key];
        });
      }

      const users = await this.elastic.find(filters);

      users.hits.map((element: any) => {
        delete element._source.password;
      });
      return users;
    } catch (e) {
      return e.statusCode == 404 ? { hits: [] } : e;
    }
  }
}
