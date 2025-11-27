import {
  NotFoundException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { Repository, DataSource, EntityManager } from 'typeorm';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { Entry, EntryType } from '../entities/entry.entity';
import { Account } from '../entities/account.entity';
import type { CreateTransactionDto } from '../dto/create-transaction.dto';
import { I18nService } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(Entry)
    private readonly entryRepository: Repository<Entry>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  async storeTransaction(
    createTransactionDto: CreateTransactionDto,
    manager: EntityManager,
  ): Promise<Transaction> {
    this.logger.debug({
      function: 'storeTransaction',
      createTransactionDto,
    });
    // Create the transaction
    const transaction = this.transactionRepository.create({
      transaction_number: createTransactionDto.transaction_number,
      description: createTransactionDto.description,
      transaction_date: new Date(createTransactionDto.transaction_date),
      status: createTransactionDto.status || TransactionStatus.PENDING,
      external_id: createTransactionDto.external_id,
      metadata: createTransactionDto.metadata,
    });

    const savedTransaction = await manager.save(transaction);

    // Create entries
    const entries: Entry[] = [];
    for (const entryDto of createTransactionDto.entries) {
      const account = await manager.findOne(Account, {
        where: { id: entryDto.account_id },
        select: {
          id: true,
          available_balance: true,
          posted_balance: true,
        },
      });
      if (!account) {
        throw new NotFoundException(
          this.i18n.translate('account.errors.not_found', {
            args: { id: entryDto.account_id },
          }),
        );
      }

      const entry = this.entryRepository.create({
        account,
        account_id: account.id,
        transaction: savedTransaction,
        transaction_id: savedTransaction.id,
        type: entryDto.type,
        amount: entryDto.amount,
        description: entryDto.description,
        metadata: entryDto.metadata,
      });

      entries.push(entry);
    }

    await manager.save(entries);

    savedTransaction.entries = entries;

    // If transaction is posted, update balances
    if (savedTransaction.status === TransactionStatus.POSTED) {
      await this.updateBalances(savedTransaction, manager);
    }
    return savedTransaction;
  }
  async create(
    createTransactionDto: CreateTransactionDto,
    manager?: EntityManager,
  ): Promise<Transaction> {
    this.logger.debug({
      function: 'create',
      createTransactionDto,
    });
    // Validate transaction entries (debits = credits)
    this.validateTransactionEntries(createTransactionDto.entries);

    if (manager) {
      this.logger.debug({
        function: 'create with manager',
      });
      return this.storeTransaction(createTransactionDto, manager);
    }

    // Use a transaction to ensure all operations succeed or fail together
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedTransaction = await this.storeTransaction(
        createTransactionDto,
        queryRunner.manager,
      );
      await queryRunner.commitTransaction();
      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private validateTransactionEntries(entries: any[]): void {
    this.logger.debug({
      function: 'validateTransactionEntries',
      entries,
    });
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      if (entry.type === EntryType.DEBIT) {
        totalDebits += Number(entry.amount);
      } else if (entry.type === EntryType.CREDIT) {
        totalCredits += Number(entry.amount);
      }
    }

    // Ensure debits equal credits (with small tolerance for floating point errors)
    if (Math.abs(totalDebits - totalCredits) > 0.0001) {
      throw new BadRequestException(
        this.i18n.translate('transaction.errors.unbalanced', {
          args: { totalDebits, totalCredits },
        }),
      );
    }
  }

  private async updateBalances(
    transaction: Transaction,
    manager: EntityManager,
  ): Promise<void> {
    for (const entry of transaction.entries) {
      await this.updateBalance(entry, manager);
    }
  }

  // for now it is for deposit
  async updateBalance(entry: Entry, manager: EntityManager) {
    this.logger.debug({
      function: 'updateBalance',
      entry,
    });

    const account = await manager.findOne(Account, {
      where: { id: entry.account_id },
      select: {
        id: true,
        available_balance: true,
        posted_balance: true,
      },
    });
    if (!account)
      throw new NotFoundException(
        this.i18n.translate('balance.errors.account_not_found', {
          args: { id: entry.account_id },
        }),
      );

    this.logger.debug({
      function: 'before update balance',
      account,
      entry,
    });
    const available_balance =
      account.available_balance +
      (entry.type === EntryType.DEBIT ? -entry.amount : entry.amount);
    const posted_balance =
      account.posted_balance +
      (entry.type === EntryType.DEBIT ? -entry.amount : entry.amount);
    this.logger.debug({
      function: 'balanceUpdate',
      available_balance,
      posted_balance,
    });
    const { affected } = await manager
      .createQueryBuilder()
      .update(Account)
      .set({ posted_balance, available_balance })
      .where('id=:id', { id: account.id })
      .execute();

    this.logger.debug({
      message: 'affected rows in balance update',
      affected,
    });
  }

  async findAll(paginationDto: PaginationDto): Promise<Transaction[]> {
    this.logger.debug({
      function: 'findAll',
    });
    const { limit, offset } = paginationDto;
    return this.transactionRepository.find({
      relations: ['entries', 'entries.account'],
      skip: offset,
      take: limit,
      order: { transaction_date: 'DESC', created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Transaction> {
    this.logger.debug({
      function: 'findOne',
      id,
    });
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['entries', 'entries.account'],
    });

    if (!transaction) {
      throw new NotFoundException(
        this.i18n.translate('transaction.errors.not_found', {
          args: { id },
        }),
      );
    }

    return transaction;
  }

  async findByNumber(transaction_number: string): Promise<Transaction> {
    this.logger.debug({
      function: 'findByNumber',
      transaction_number,
    });
    const transaction = await this.transactionRepository.findOne({
      where: { transaction_number },
      relations: ['entries', 'entries.account'],
    });

    if (!transaction) {
      throw new NotFoundException(
        this.i18n.translate('transaction.errors.not_found_by_number', {
          args: { transaction_number },
        }),
      );
    }

    return transaction;
  }

  async postTransaction(id: number): Promise<Transaction> {
    this.logger.debug({
      function: 'postTransaction',
      id,
    });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id },
        relations: ['entries', 'entries.account'],
      });

      if (!transaction) {
        throw new NotFoundException(
          this.i18n.translate('transaction.errors.not_found', {
            args: { id },
          }),
        );
      }

      if (transaction.status === TransactionStatus.POSTED) {
        throw new BadRequestException(
          this.i18n.translate('transaction.errors.already_posted', {
            args: { id },
          }),
        );
      }

      if (transaction.status === TransactionStatus.VOIDED) {
        throw new BadRequestException(
          this.i18n.translate('transaction.errors.cannot_post_voided', {
            args: { id },
          }),
        );
      }

      transaction.status = TransactionStatus.POSTED;
      await queryRunner.manager.save(transaction);

      // Update balances
      await this.updateBalances(transaction, queryRunner.manager);

      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async voidTransaction(id: number): Promise<Transaction> {
    this.logger.debug({
      function: 'voidTransaction',
      id,
    });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await this.transactionRepository.findOne({
        where: { id },
        relations: ['entries', 'entries.account'],
      });

      if (!transaction) {
        throw new NotFoundException(
          this.i18n.translate('transaction.errors.not_found', {
            args: { id },
          }),
        );
      }

      if (transaction.status === TransactionStatus.VOIDED) {
        throw new BadRequestException(
          this.i18n.translate('transaction.errors.already_voided', {
            args: { id },
          }),
        );
      }

      transaction.status = TransactionStatus.VOIDED;
      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateAllBalancesJob() {
    this.logger.debug({
      function: 'updateAllBalancesJob',
    });
    // This method can be used to update all account balances periodically
    for (const account of await this.accountRepository.find()) {
      this.logger.debug({
        function: 'updateAllBalancesJob - account',
        account,
      });
      // Update the account's available and posted balances
      account.available_balance = 0;
      account.posted_balance = 0;

      const { creditSum } = await this.dataSource
        .getRepository(Entry)
        .createQueryBuilder('entry')
        .innerJoin('entry.transaction', 'transaction')
        .select('SUM(entry.amount)', 'creditSum')
        .where('entry.account_id = :accountId', { accountId: account.id })
        .andWhere('entry.type = :type', { type: 'credit' })
        .andWhere('transaction.status = :status', { status: 'posted' })
        .getRawOne();

      const { debitSum } = await this.dataSource
        .getRepository(Entry)
        .createQueryBuilder('entry')
        .innerJoin('entry.transaction', 'transaction')
        .select('SUM(entry.amount)', 'debitSum')
        .where('entry.account_id = :accountId', { accountId: account.id })
        .andWhere('entry.type = :type', { type: 'debit' })
        .andWhere('transaction.status = :status', { status: 'posted' })
        .getRawOne();
      const balance = (Number(creditSum) || 0) - (Number(debitSum) || 0);

      await this.dataSource.getRepository(Account).update(account.id, {
        available_balance: balance,
        posted_balance: balance,
      });
    }
  }
}
