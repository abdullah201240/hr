import { Module } from '@nestjs/common';
import { DisciplinaryController } from './disciplinary.controller';
import { DisciplinaryService } from './disciplinary.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [DisciplinaryController],
  providers: [DisciplinaryService],
  exports: [DisciplinaryService],
})
export class DisciplinaryModule {}
