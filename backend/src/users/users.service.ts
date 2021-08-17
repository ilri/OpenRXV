import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ElasticService } from 'src/shared/services/elastic/elastic.service';

export type User = any;

@Injectable()
export class UsersService {
  constructor(private elastic: ElasticService) {}

  async findOne(email: string): Promise<User | undefined> {
    let data = await this.elastic.find({ 'email.keyword': email });
    if (data.hits[0]) return data.hits[0]._source;
    else throw new UnauthorizedException();
  }
  async add(user) {
    return await this.elastic.add(user);
  }
}
