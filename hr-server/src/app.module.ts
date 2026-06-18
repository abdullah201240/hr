import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import cloudinaryConfig from './config/cloudinary.config';
import jwtConfig from './config/jwt.config';
import bullmqConfig from './modules/queue/bullmq.config';
import { DatabaseModule } from './db';
import { RedisModule } from './common/cache/redis.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';
import { QueueModule } from './modules/queue/queue.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { AuthModule } from './modules/auth/auth.module';
import { DepartmentModule } from './modules/department/department.module';
import { DesignationModule } from './modules/designation/designation.module';
import { LeaveTypeModule } from './modules/leave-type/leave-type.module';
import { LeaveApplicationModule } from './modules/leave-application/leave-application.module';
import { AttendanceSettingsModule } from './modules/attendance-settings/attendance-settings.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { FestivalBonusModule } from './modules/festival-bonus/festival-bonus.module';
import { ProvidentFundModule } from './modules/provident-fund/provident-fund.module';
import { SalaryModule } from './modules/salary/salary.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        cloudinaryConfig,
        jwtConfig,
        bullmqConfig,
      ],
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'HH:MM:ss.l',
                  ignore: 'pid,hostname,req,res',
                  messageFormat: '{msg}',
                  levelFirst: false,
                },
              }
            : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        // Disable auto-logging — our LoggingInterceptor handles request logging cleanly
        autoLogging: false,
        customProps: () => ({
          env: process.env.NODE_ENV || 'development',
        }),
      },
    }),
    DatabaseModule,
    RedisModule,
    HealthModule,
    UploadModule,
    QueueModule,
    EmployeeModule,
    AuthModule,
    DepartmentModule,
    DesignationModule,
    LeaveTypeModule,
    LeaveApplicationModule,
    AttendanceSettingsModule,
    AttendanceModule,
    AnnouncementsModule,
    FestivalBonusModule,
    ProvidentFundModule,
    SalaryModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
