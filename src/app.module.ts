import { Module } from '@nestjs/common';
import { MonthlyReportsModule } from './monthly-reports/monthly-reports.module';
import { WeeklyReportsModule } from './weekly-reports/weekly-reports.module';
import { AuthModule } from './auth/auth.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { IndicatorsModule } from './indicators/indicators.module';
import { IndexTestingModule } from './index-testing/index-testing.module';
import { CyclesModule } from './cycles/cycles.module';

@Module({
  imports: [
    MonthlyReportsModule,
    WeeklyReportsModule,
    AuthModule,
    FacilitiesModule,
    IndicatorsModule,
    IndexTestingModule,
    CyclesModule,
  ],
})
export class AppModule {}
