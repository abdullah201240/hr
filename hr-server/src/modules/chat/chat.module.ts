import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatRepository } from './repositories/chat.repository';
import { ChatNotificationProcessor } from './processors/chat-notification.processor';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessTokenSecret')!,
        signOptions: {
          expiresIn: config.get<string>('jwt.accessTokenExpiry', '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'chat-notification',
    }),
  ],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, ChatRepository, ChatNotificationProcessor],
  exports: [ChatService],
})
export class ChatModule {}
