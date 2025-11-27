// src/seeds/seed-fee-account.ts
import { FeePercentage } from '../../modules/constants/entities/fee-percentage.entity';
import { AppDataSource } from '../data-source';

export async function seedFeePercentage() {
  const feePercentageRepo = AppDataSource.getRepository(FeePercentage);

  const existingDepositFeePercentage = await feePercentageRepo.findOneBy({
    type: 'deposit_fee_percentage',
  });

  if (!existingDepositFeePercentage) {
    const deposit_fee_percentage = feePercentageRepo.create({
      type: 'deposit_fee_percentage',
      amount: 200,
    });

    await feePercentageRepo.save(deposit_fee_percentage);
    console.log('✔️ Seeded deposit fee percentage.');
  } else {
    console.log('⚠️ Deposit fee percentage already exists.');
  }

  const existingWithdrawFeePercentage = await feePercentageRepo.findOneBy({
    type: 'withdraw_fee_percentage',
  });

  if (!existingWithdrawFeePercentage) {
    const withdraw_fee_percentage = feePercentageRepo.create({
      type: 'withdraw_fee_percentage',
      amount: 200,
    });

    await feePercentageRepo.save(withdraw_fee_percentage);
    console.log('✔️ Seeded withdraw fee percentage.');
  } else {
    console.log('⚠️ Withdraw fee percentage already exists.');
  }

  const existingTransferFeePercentage = await feePercentageRepo.findOneBy({
    type: 'transfer_fee_percentage',
  });

  if (!existingTransferFeePercentage) {
    const transfer_fee_percentage = feePercentageRepo.create({
      type: 'transfer_fee_percentage',
      amount: 200,
    });

    await feePercentageRepo.save(transfer_fee_percentage);
    console.log('✔️ Seeded transfer fee percentage.');
  } else {
    console.log('⚠️ Transfer fee percentage already exists.');
  }
}
