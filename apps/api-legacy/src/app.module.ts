import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { CommonModule } from "./common/common.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BudgetsModule } from "./modules/budgets/budgets.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { ImportsModule } from "./modules/imports/imports.module";
import { PartnersModule } from "./modules/partners/partners.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    CommonModule,
    AuthModule,
    UsersModule,
    SettingsModule,
    PartnersModule,
    BudgetsModule,
    ContractsModule,
    DocumentsModule,
    AlertsModule,
    DashboardModule,
    AuditModule,
    ImportsModule
  ]
})
export class AppModule {}

