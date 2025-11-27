import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Deposit, DepositStatus } from '../entities/deposit.entity';
import { AccountService } from '../../double-entry-ledger/services/account.service';
import { TransactionService } from '../../double-entry-ledger/services/transaction.service';
import { TransactionStatus } from '../../double-entry-ledger/entities/transaction.entity';
import { EntryType } from '../../double-entry-ledger/entities/entry.entity';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FeePercentageService } from 'src/modules/constants/services/fee-percentage.service';
import { TronWeb } from 'tronweb';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import { Token } from 'src/common/enum/token.enum';

@Injectable()
export class DepositCryptoService {
  private readonly logger = new Logger(DepositCryptoService.name);
  private readonly tronWeb;
  private readonly USDT_CONTRACT_ADDRESS;
  private readonly USDC_CONTRACT_ADDRESS;
  private readonly usdtWalletAddress;
  private readonly usdcWalletAddress;

  constructor(
    @InjectRepository(Deposit)
    private readonly depositRepository: Repository<Deposit>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationsService,
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
    private readonly configService: ConfigService,
    private readonly feePercentageService: FeePercentageService,
  ) {
    this.USDT_CONTRACT_ADDRESS = this.configService.get(
      'crypto.usdtContractAddress',
    );
    this.USDC_CONTRACT_ADDRESS = this.configService.get(
      'crypto.usdcContractAddress',
    );
    this.usdtWalletAddress = this.configService.get('crypto.usdtWalletAddress');
    this.usdcWalletAddress = this.configService.get('crypto.usdcWalletAddress');
    const providerUrl = this.configService.get('crypto.providerUrl');
    this.tronWeb = new TronWeb({
      fullHost: providerUrl,
    });
  }

  decodeAddressFromTopic(topic: string): string {
    // topic is a 32-byte hex string like "000000...<40 hex chars>"
    const rawHex = topic.replace(/^0x/, '').slice(24); // last 40 chars (20 bytes)
    const tronHex = '41' + rawHex; // prepend Tron prefix
    return this.tronWeb.address.fromHex(tronHex);
  }

  async verifyTrc20Transfer(
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<{ success: boolean; amount?: number }> {
    this.logger.debug({
      function: 'verifyTrc20Transfer',
    });

    let walletAddress;
    let contractAddress;

    if (verifyPaymentDto.token === 'USDT') {
      contractAddress = this.tronWeb.address.toHex(this.USDT_CONTRACT_ADDRESS);
      walletAddress = this.usdtWalletAddress;
    } else {
      contractAddress = this.tronWeb.address.toHex(this.USDC_CONTRACT_ADDRESS);
      walletAddress = this.usdcWalletAddress;
    }

    const txInfo = await this.tronWeb.trx.getTransactionInfo(
      verifyPaymentDto.txHash,
    );
    console.log('txInfo', txInfo);
    if (!txInfo || txInfo.receipt?.result !== 'SUCCESS') {
      return { success: false };
    }

    const logs = txInfo.log || [];

    for (const log of logs) {
      const toAddress = '41' + log.address.toLowerCase();
      if (toAddress === contractAddress.toLowerCase()) {
        const toAddressHex = log.topics[2];
        const toAddress = this.decodeAddressFromTopic(toAddressHex);
        const amount = parseInt(log.data, 16) / 10_000;
        console.log('amount', amount);
        console.log('toAddress', toAddress);
        console.log('expectedAmount', verifyPaymentDto.expectedAmount);

        if (
          toAddress === walletAddress &&
          amount >= verifyPaymentDto.expectedAmount
        ) {
          return { success: true, amount };
        }
      }
    }

    return { success: false };
  }

  async create(
    user_id: number,
    verifyPaymentDto: VerifyPaymentDto,
  ): Promise<{ deposit: Deposit }> {
    this.logger.debug({
      function: 'create',
      user_id,
      verifyPaymentDto,
    });

    const isPreviousRecord = await this.depositRepository.findOne({
      where: {
        intent_id: verifyPaymentDto.txHash,
      },
    });
    if (isPreviousRecord) {
      throw new BadRequestException(
        'This transaction has already been processed',
      );
    }
    const isSuccessTransfer = await this.verifyTrc20Transfer(verifyPaymentDto);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const feePercentage = await this.feePercentageService.getPercentageByType(
        'deposit_fee_percentage',
      );
      let fee = verifyPaymentDto.expectedAmount * feePercentage;
      // By RSR if (fee < 5) {
      //   fee = 5;
      // }
      const deposit = new Deposit({
        user_id: user_id,
        status: DepositStatus.PENDING,
        amount: verifyPaymentDto.expectedAmount - fee,
        fees_amount: fee,
        intent_id: verifyPaymentDto.txHash,
        token_type: verifyPaymentDto.token,
      });
      await queryRunner.manager.save(deposit);

      if (isSuccessTransfer.success) {
        await this.saveDepositTransaction(deposit, queryRunner.manager);
      }

      await queryRunner.commitTransaction();
      return {
        deposit,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async saveDepositTransaction(deposit, manager) {
    this.logger.debug({
      function: 'saveDepositTransaction',
      deposit,
    });

    const userAccount = await this.accountService.findByUserId(deposit.user_id);

    const systemAccount = await this.accountService.getCashAccount();

    const depositFeeAccount = await this.accountService.getDepositFeeAccount();

    if (!userAccount || !systemAccount) throw new NotFoundException();

    const savedTransaction = await this.transactionService.create(
      {
        transaction_date: new Date().toISOString(),
        status: TransactionStatus.POSTED,
        entries: [
          {
            account_id: systemAccount.id,
            type: EntryType.DEBIT,
            amount: deposit.amount + deposit.fees_amount,
          },
          {
            account_id: userAccount.id,
            type: EntryType.CREDIT,
            amount: deposit.amount,
          },
          {
            account_id: depositFeeAccount.id,
            type: EntryType.CREDIT,
            amount: deposit.fees_amount,
          },
        ],
      },
      manager,
    );

    const notification = await this.notificationService.createNotification(
      'Successful Deposit',
      `You deposited ${(deposit.amount / 100).toFixed(2)}$ to your account`,
      'إيداع ناجح',
      `لقد قمت بإيداع مبلغ ${(deposit.amount / 100).toFixed(2)}$ الى حسابك`,
      deposit.user_id,
      savedTransaction.id,
    );
    deposit.transaction_id = savedTransaction.id;
    deposit.status = DepositStatus.SUCCESS;

    await manager.save(deposit);
    await manager.save(notification);
    // await queryRunner.commitTransaction();
  }

  @Cron('* * * * *')
  async checkPendingDeposits() {
    this.logger.debug({
      function: 'checkPendingDeposits',
    });
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const pendingDeposits = await this.depositRepository.find({
      where: { status: DepositStatus.PENDING },
    });
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      for (const deposit of pendingDeposits) {
        const verifyPaymentDto = new VerifyPaymentDto();
        verifyPaymentDto.txHash = deposit.intent_id;
        verifyPaymentDto.token = deposit.token_type as Token;
        verifyPaymentDto.expectedAmount = deposit.amount + deposit.fees_amount;
        const isSuccessTransfer = await this.verifyTrc20Transfer(
          verifyPaymentDto,
        );
        if (isSuccessTransfer.success) {
          await this.saveDepositTransaction(deposit, queryRunner.manager);
        } else {
          if (
            new Date().getTime() - deposit.created_at.getTime() >
            THIRTY_MINUTES
          ) {
            deposit.status = DepositStatus.FAILED;
            const notification =
              await this.notificationService.createNotification(
                'Failed Deposit',
                `Your deposit of ${(deposit.amount / 100).toFixed(2)}$ Failed`,
                'إيداع فاشل',
                `فشل ايداعك مبلغ ${(deposit.amount / 100).toFixed(
                  2,
                )}$  الى حسابك`,
                deposit.user_id,
              );
            await queryRunner.manager.save(deposit);
            await queryRunner.manager.save(notification);
          }
        }
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
