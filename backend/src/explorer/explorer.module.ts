import { Module } from '@nestjs/common';
import { SearchController } from './search/search.controller';

import { SharedModule } from 'src/shared/shared.module';
import { ShareController } from './share/share.controller';

@Module({
  controllers: [SearchController, ShareController],
  imports: [SharedModule],
  providers: [],
})
export class ExplorerModule {}
