import {
  Account,
  AccountType,
} from '../../modules/double-entry-ledger/entities/account.entity';
import { AppDataSource } from '../data-source';

export async function seedFeeAccount() {
  const accountRepo = AppDataSource.getRepository(Account);

  const existingDepositFee = await accountRepo.findOneBy({
    system_role: 'deposit_fee',
  });

  if (!existingDepositFee) {
    const deposit_fee_account = accountRepo.create({
      name: 'deposit_fee',
      description: 'This account is for deposit fees',
      normal_balance: 'credit',
      type: AccountType.REVENUE,
      system_role: 'deposit_fee',
    });

    await accountRepo.save(deposit_fee_account);
    console.log('✔️ Seeded deposit fee account.');
  } else {
    console.log('⚠️ Deposit fee account already exists.');
  }

  const existingWithdrawFee = await accountRepo.findOneBy({
    system_role: 'withdraw_fee',
  });

  if (!existingWithdrawFee) {
    const withdraw_fee_account = accountRepo.create({
      name: 'withdraw_fee',
      description: 'This account is for withdraw fees',
      normal_balance: 'credit',
      type: AccountType.REVENUE,
      system_role: 'withdraw_fee',
    });

    await accountRepo.save(withdraw_fee_account);
    console.log('✔️ Seeded withdraw fee account.');
  } else {
    console.log('⚠️ Withdraw fee account already exists.');
  }

  const existingTransferFee = await accountRepo.findOneBy({
    system_role: 'transfer_fee',
  });

  if (!existingTransferFee) {
    const transfer_fee_account = accountRepo.create({
      name: 'transfer_fee',
      description: 'This account is for transfer fees',
      normal_balance: 'credit',
      type: AccountType.REVENUE,
      system_role: 'transfer_fee',
    });

    await accountRepo.save(transfer_fee_account);
    console.log('✔️ Seeded transfer fee account.');
  } else {
    console.log('⚠️ Transfer fee account already exists.');
  }
}
