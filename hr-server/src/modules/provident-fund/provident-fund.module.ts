import { Module } from '@nestjs/common';
import { ProvidentFundService } from './provident-fund.service';
import { ProvidentFundController } from './provident-fund.controller';

@Module({
  providers: [ProvidentFundService],
  controllers: [ProvidentFundController],
  exports: [ProvidentFundService],
})
export class ProvidentFundModule {}
