import { Module } from '@nestjs/common';
import { FestivalBonusService } from './festival-bonus.service';
import { FestivalBonusController } from './festival-bonus.controller';

@Module({
  controllers: [FestivalBonusController],
  providers: [FestivalBonusService],
  exports: [FestivalBonusService],
})
export class FestivalBonusModule {}
