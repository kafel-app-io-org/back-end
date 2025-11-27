import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager, Repository } from 'typeorm';
import { Account, SystemRole } from '../entities/account.entity';
import type { CreateAccountDto } from '../dto/create-account.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly i18n: I18nService,
  ) {}

  async getSystemAccounts() {
    return {
      cashAccount: await this.getCashAccount(),
      depositFeeAccount: await this.getDepositFeeAccount(),
      withdrawFeeAccount: await this.getWithdrawFeeAccount(),
      transferFeeAccount: await this.getTransferFeeAccount(),
    };
  }

  getCashAccount() {
    return this.accountRepository.findOne({
      where: { system_role: SystemRole.CASH },
    });
  }

  getDepositFeeAccount() {
    return this.accountRepository.findOne({
      where: { system_role: SystemRole.DEPOSIT_FEE },
    });
  }

  getWithdrawFeeAccount() {
    return this.accountRepository.findOne({
      where: { system_role: SystemRole.WITHDRAW_FEE },
    });
  }

  getTransferFeeAccount() {
    return this.accountRepository.findOne({
      where: { system_role: SystemRole.TRANSFER_FEE },
    });
  }

  async getBalance(user_id: number): Promise<any> {
    this.logger.debug({
      function: 'getBalance',
      user_id,
    });
    const account = await this.accountRepository.findOne({
      select: {
        id: true,
        available_balance: true,
      },
      where: { user_id },
    });
    return {
      balance: account.available_balance,
    };
  }
  getAccountByCampaignId(campaign_id: number) {
    this.logger.debug({
      function: 'getAccountByCampaignId',
      campaign_id,
    });
    return this.accountRepository.findOne({
      where: { campaign_id },
    });
  }

  async findByUserId(user_id: number): Promise<Account> {
    this.logger.debug({
      function: 'findByUserId',
      user_id,
    });
    return this.accountRepository.findOne({
      where: { user_id },
    });
  }

  async create(
    createAccountDto: CreateAccountDto,
    manager?: EntityManager,
  ): Promise<Account> {
    this.logger.debug({
      function: 'create',
      createAccountDto,
    });

    const account = this.accountRepository.create(createAccountDto);
    if (manager) return manager.save(account);
    return this.accountRepository.save(account);
  }

  async findAll(): Promise<Account[]> {
    return this.accountRepository.find();
  }

  async findOne(id: number): Promise<Account> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    const account = await this.accountRepository.findOne({
      where: { id: id },
      relations: ['balances'],
    });

    if (!account) {
      throw new NotFoundException(
        this.i18n.translate('account.errors.not_found', {
          args: { id },
        }),
      );
    }

    return account;
  }

  async findByNumber(account_number: string): Promise<Account> {
    this.logger.debug({
      function: 'findByNumber',
      account_number,
    });
    const account = await this.accountRepository.findOne({
      where: { account_number },
    });

    if (!account) {
      throw new NotFoundException(
        this.i18n.translate('account.errors.not_found_by_number', {
          args: { account_number },
        }),
      );
    }

    return account;
  }

  async update(
    id: number,
    updateAccountDto: Partial<CreateAccountDto>,
  ): Promise<Account> {
    this.logger.debug({
      function: 'update',
      id,
      updateAccountDto,
    });
    const account = await this.findOne(id);

    // If account number is being updated, check if it already exists
    if (
      updateAccountDto.account_number &&
      updateAccountDto.account_number !== account.account_number
    ) {
      const existingAccount = await this.accountRepository.findOne({
        where: { account_number: updateAccountDto.account_number },
      });

      if (existingAccount) {
        throw new ConflictException(
          this.i18n.translate('account.errors.already_exists', {
            args: { account_number: updateAccountDto.account_number },
          }),
        );
      }
    }

    Object.assign(account, updateAccountDto);
    return this.accountRepository.save(account);
  }

  async remove(id: number): Promise<void> {
    this.logger.debug({
      function: 'remove',
      id,
    });
    const account = await this.findOne(id);
    await this.accountRepository.remove(account);
  }
}
