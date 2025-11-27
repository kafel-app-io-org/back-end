import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TargetBeneficiariesType } from './entities/target-beneficiary.entity';
import { TargetBeneficiariesController } from './controllers/target-beneficiary.controller';
import { TargetBeneficiariesService } from './services/target-beneficiary.service';

@Module({
  imports: [TypeOrmModule.forFeature([TargetBeneficiariesType])],
  controllers: [TargetBeneficiariesController],
  providers: [TargetBeneficiariesService],
})
export class BeneficiariesModule {}
