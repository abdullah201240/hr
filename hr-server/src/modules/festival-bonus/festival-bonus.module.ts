import { Module } from '@nestjs/common';
import { FestivalBonusService } from './festival-bonus.service';
import { FestivalBonusController } from './festival-bonus.controller';

@Module({
  providers: [FestivalBonusService],
  controllers: [FestivalBonusController],
  exports: [FestivalBonusService],
})
export class FestivalBonusModule {}
