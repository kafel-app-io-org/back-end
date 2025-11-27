import { AppDataSource } from '../data-source';
import { seedFeeAccount } from './fee-accounts-seed';
import { seedFeePercentage } from './fee-percentage-seed';
import { seedCountriesDialCode } from './countries-dial-code-seed';

async function seed() {
  await AppDataSource.initialize();
  await seedFeeAccount();
  await seedFeePercentage();
  await seedCountriesDialCode();
  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
