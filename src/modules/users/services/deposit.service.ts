import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Deposit, DepositStatus } from '../entities/deposit.entity';
import { AccountService } from '../../double-entry-ledger/services/account.service';
import { TransactionService } from '../../double-entry-ledger/services/transaction.service';
import { TransactionStatus } from '../../double-entry-ledger/entities/transaction.entity';
import { EntryType } from '../../double-entry-ledger/entities/entry.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FeePercentageService } from 'src/modules/constants/services/fee-percentage.service';

@Injectable()
export class DepositService {
  private readonly logger = new Logger(DepositService.name);
  private readonly stripe: Stripe;

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
    this.stripe = new Stripe(this.configService.get('stripe.secretKey'));
  }

  //PRODUCTION check the raw input of the webhook
  async handleWebhook(sig: any, rawBody: Buffer<ArrayBufferLike>, body: any) {
    this.logger.debug({
      function: 'handleWebhook',
      sig,
      rawBody,
      body,
      type: body.type,
      intent_id: body.data.object.id,
    });
    // const event = this.stripe.webhooks.constructEvent(
    //   rawBody,
    //   sig,
    //   this.configService.get('stripe.webhookKey'),
    // );
    switch (body.type) {
      case 'checkout.session.completed': {
        const intent_id = body.data.object.id;
        const deposit = await this.depositRepository.findOneByOrFail({
          intent_id,
          status: DepositStatus.PENDING,
        });

        const userAccount = await this.accountService.findByUserId(
          deposit.user_id,
        );

        const systemAccount = await this.accountService.getCashAccount();
        const depositFeeAccount =
          await this.accountService.getDepositFeeAccount();
        if (!userAccount || !systemAccount) throw new NotFoundException();

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
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
            queryRunner.manager,
          );

          const notification =
            await this.notificationService.createNotification(
              'Successful Deposit',
              `You deposited ${(deposit.amount / 100).toFixed(
                2,
              )}$ to your account`,
              'إيداع ناجح',
              `لقد قمت بإيداع مبلغ ${(deposit.amount / 100).toFixed(
                2,
              )}$ الى حسابك`,
              deposit.user_id,
              savedTransaction.id,
            );
          deposit.transaction_id = savedTransaction.id;
          deposit.status = DepositStatus.SUCCESS;

          await queryRunner.manager.save(deposit);
          await queryRunner.manager.save(notification);

          await queryRunner.commitTransaction();
          return deposit;
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          await queryRunner.release();
        }
      }
      default:
        this.logger.warn(`Unhandled event type `);
    }
  }

  async create(
    user_id: number,
    amount: number,
  ): Promise<{ url: string; deposit: Deposit }> {
    this.logger.debug({
      function: 'create',
      user_id,
      amount,
    });
    const userAccount = await this.accountService.findByUserId(user_id);

    const systemAccount = await this.accountService.getCashAccount();

    if (!userAccount || !systemAccount) throw new NotFoundException();

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'USDT',
            unit_amount: amount,
            product_data: {
              name: 'Deposit',
            },
          },
          quantity: 1,
        },
      ],
      phone_number_collection: {
        enabled: true,
      },
      mode: 'payment',
      success_url: 'http://localhost:3000/success',
      cancel_url: 'http://localhost:3000/canceled',
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const feePercentage = await this.feePercentageService.getPercentageByType(
        'deposit_fee_percentage',
      );
      let fee = amount * feePercentage;
      //by RSR if (fee < 5) {
      //   fee = 5;
      // }
      const deposit = new Deposit({
        user_id: user_id,
        status: DepositStatus.PENDING,
        amount: amount - fee,
        fees_amount: fee,
        intent_id: session.id,
      });

      await queryRunner.manager.save(deposit);

      await queryRunner.commitTransaction();
      return {
        url: session.url,
        deposit,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
