import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExplorerModule } from './explorer/explorer.module';
import { AdminModule } from './admin/admin.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SharedModule } from './shared/shared.module';
import { ExportModule } from './export/export.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ScheduleModule } from '@nestjs/schedule';
import { PluginsModule } from './plugins/plugins.module';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [
    SharedModule,
    ExplorerModule,
    AdminModule,
    ExportModule,
    ServeStaticModule.forRoot({
      serveRoot: '/export/downloads',
      rootPath: join(__dirname, '../data/files/downloads'),
    }),
    ServeStaticModule.forRoot({
      serveRoot: '/images',
      rootPath: join(__dirname, '../data/files/images'),
    }),
    AuthModule,
    UsersModule,
    PluginsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
