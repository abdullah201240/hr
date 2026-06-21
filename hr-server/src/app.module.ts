import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
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
import { ClaimsModule } from './modules/claims/claims.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { LettersModule } from './modules/letters/letters.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { DisciplinaryModule } from './modules/disciplinary/disciplinary.module';
import { SeparationModule } from './modules/separation/separation.module';
import { OrgChartModule } from './modules/org-chart/org-chart.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ChatModule } from './modules/chat/chat.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RolesModule } from './modules/roles/roles.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { OwnershipGuard } from './modules/auth/guards/ownership.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';




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
    ClaimsModule,
    RecruitmentModule,
    PayrollModule,
    LettersModule,
    PerformanceModule,
    DisciplinaryModule,
    SeparationModule,
    OrgChartModule,
    TasksModule,
    ChatModule,
    NotificationsModule,
    RolesModule,
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
    {
      // Defense-in-depth Layer 3: resource ownership enforcement
      provide: APP_GUARD,
      useClass: OwnershipGuard,
    },
    {
      // Audit trail: log all state-changing operations (POST, PATCH, DELETE, PUT)
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
