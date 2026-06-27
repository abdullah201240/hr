import { Module } from '@nestjs/common';
import { ProvidentFundService } from './provident-fund.service';
import { ProvidentFundController, ProvidentFundSettingsController } from './provident-fund.controller';

@Module({
  providers: [ProvidentFundService],
  controllers: [ProvidentFundController, ProvidentFundSettingsController],
  exports: [ProvidentFundService],
})
export class ProvidentFundModule {}
