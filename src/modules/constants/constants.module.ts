import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTypes } from './entities/user-types.entity';
import { Cities } from './entities/cities.entity';
import { Locations } from './entities/locations.entity';
import { DistributionMethods } from './entities/distribution-methods.entity';
import { TransactionTypes } from './entities/transaction-types.entity';
import { HealthStatus } from './entities/health-status.entity';
import { UserTypesController } from './controllers/user-types.controller';
import { UserTypesService } from './services/user-types.service';
import { CitiesService } from './services/cities.service';
import { LocationsService } from './services/locations.service';
import { DistributionMethodsService } from './services/distribution-methods.service';
import { TransactionTypesService } from './services/transaction-types.service';
import { HealthStatusService } from './services/health-status.service';
import { CitiesController } from './controllers/cities.controller';
import { DistributionMethodsController } from './controllers/distribution-methods.controller';
import { LocationsController } from './controllers/locations.controller';
import { TransactionTypesController } from './controllers/transaction-types.controller';
import { HealthStatusController } from './controllers/health-status.controller';
import { FeePercentage } from './entities/fee-percentage.entity';
import { FeePercentageController } from './controllers/fee-percentage.controller';
import { FeePercentageService } from './services/fee-percentage.service';
import { CountriesDialCodeService } from './services/countries-dial-code.service';
import { CountriesDialCodeController } from './controllers/countries-dial-code.controller';
import { CountriesDialCode } from './entities/countries-dial-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserTypes,
      Cities,
      Locations,
      DistributionMethods,
      TransactionTypes,
      HealthStatus,
      FeePercentage,
      CountriesDialCode,
    ]),
  ],
  controllers: [
    UserTypesController,
    CitiesController,
    DistributionMethodsController,
    LocationsController,
    TransactionTypesController,
    HealthStatusController,
    FeePercentageController,
    CountriesDialCodeController,
  ],
  providers: [
    UserTypesService,
    CitiesService,
    LocationsService,
    DistributionMethodsService,
    TransactionTypesService,
    HealthStatusService,
    FeePercentageService,
    CountriesDialCodeService,
  ],
  exports: [FeePercentageService],
})
export class ConstantsModule {}
