import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users/users.controller';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  providers: [UsersService],
  imports: [SharedModule],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
