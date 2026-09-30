import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuditModule } from './common/services/audit.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrandModule } from './modules/brand/brand.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ColoursModule } from './modules/colours/colours.module';
import { SizesModule } from './modules/sizes/sizes.module';
import { SizeChartsModule } from './modules/size-charts/size-charts.module';
import { FabricsModule } from './modules/fabrics/fabrics.module';
import { CraftOptionsModule } from './modules/craft-options/craft-options.module';
import { CustomDesignModule } from './modules/custom-design/custom-design.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductionModule } from './modules/production/production.module';
import { CrmModule } from './modules/crm/crm.module';
import { LeadsModule } from './modules/leads/leads.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { AgentsModule } from './modules/agents/agents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RedisModule,
    AuditModule,
    HealthModule,
    AuthModule,
    BrandModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    ColoursModule,
    SizesModule,
    SizeChartsModule,
    FabricsModule,
    CraftOptionsModule,
    CustomDesignModule,
    QuotationsModule,
    OrdersModule,
    PaymentsModule,
    ProductionModule,
    CrmModule,
    LeadsModule,
    CampaignsModule,
    AgentsModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
  ],
})
export class AppModule {}
