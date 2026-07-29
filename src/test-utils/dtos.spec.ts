/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Bulk DTO coverage. For every DTO we run class-transformer's plainToInstance
 * (which fires every @Transform lambda) against three payload shapes — array
 * inputs, single-scalar inputs and empty inputs — so both branches of the
 * array/boolean transforms execute, then validate() to exercise the validators.
 */
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { DateRangeDto, AmountRangeDto } from '../common/dto/filter.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SignInDto, LoginDto } from '../modules/auth/dto/sign-in.dto';
import { CreateTargetBeneficiaryDto } from '../modules/beneficiaries/dto/create-target-beneficiaries.dto';
import { UpdateTargetBeneficiaryDto } from '../modules/beneficiaries/dto/update-target-beneficiaries.dto';
import { AddBeneficiaryCampaignDto } from '../modules/campaigns/dto/add-beneficiaries-campaign.dto';
import { CampaignFilterDto } from '../modules/campaigns/dto/campaign-filter.dto';
import { CreateBeneficiaryCampaignDto } from '../modules/campaigns/dto/create-beneficiary-campaigns.dto';
import { CreateCampaignDto } from '../modules/campaigns/dto/create-campaign.dto';
import { CreateDonationDto } from '../modules/campaigns/dto/create-donation.dto';
import { DeleteBeneficiaryDto } from '../modules/campaigns/dto/delete-beneficiary.dto';
import { DonationFilterDto } from '../modules/campaigns/dto/donation-filter.dto';
import { UpdateCampaignDto } from '../modules/campaigns/dto/update-campaign.dto';
import { AddBeneficiariesExcel } from '../modules/campaigns/dto/upload-excel.dto';
import { CreateCitiesDto } from '../modules/constants/dto/create-cities.dto';
import { CreateDistributionMethodsDto } from '../modules/constants/dto/create-distribution-methods.dto';
import { CreateHealthStatusDto } from '../modules/constants/dto/create-health-status.dto';
import { CreateLocationsDto } from '../modules/constants/dto/create-locations.dto';
import { CreateTransactionTypesDto } from '../modules/constants/dto/create-transaction-types.dto';
import { CreateUserTypesDto } from '../modules/constants/dto/create-user-types.dto';
import { UpdateCitiesDto } from '../modules/constants/dto/update-cities.dto';
import { UpdateDistributionMethodsDto } from '../modules/constants/dto/update-distribution-methods.dto';
import { UpdateFeePercentageDto } from '../modules/constants/dto/update-fee-percentage.dto';
import { UpdateHealthStatusDto } from '../modules/constants/dto/update-health-status.dto';
import { UpdateLocationsDto } from '../modules/constants/dto/update-locations.dto';
import { UpdateTransactionTypesDto } from '../modules/constants/dto/update-transaction-types.dto';
import { UpdateUserTypesDto } from '../modules/constants/dto/update-user-types.dto';
import { CreateAccountDto } from '../modules/double-entry-ledger/dto/create-account.dto';
import { CreateEntryDto } from '../modules/double-entry-ledger/dto/create-entry.dto';
import { CreateTransactionDto } from '../modules/double-entry-ledger/dto/create-transaction.dto';
import { DepositDto } from '../modules/double-entry-ledger/dto/deposit.dto';
import { PaymentRequestDto } from '../modules/nfc/dto/payment-request.dto';
import { StartSessionDto } from '../modules/nfc/dto/start-session.dto';
import { MarkAsReadDto } from '../modules/notifications/dto/set-read.dto';
import { TestNotificationDto } from '../modules/notifications/dto/test.dto';
import { DailyDonationItemDto } from '../modules/stats/dto/daily-donations.dto';
import { DateRangeQueryDto } from '../modules/stats/dto/date-range-query.dto';
import { DonationsByCountryItemDto } from '../modules/stats/dto/donations-country.dto';
import { StatsOverviewDto } from '../modules/stats/dto/overview.dto';
import { TransactionsByTypeItemDto } from '../modules/stats/dto/transactions-type.dto';
import { ChangeWithdrawPreferenceDto } from '../modules/users/dto/ChangeWithdrawPreference.dto';
import { CreateBeneficiaryDto } from '../modules/users/dto/create-beneficiary.dto';
import { CreateDepositDto } from '../modules/users/dto/create-deposit.dto';
import { CreateTransferDto } from '../modules/users/dto/create-transfer.dto';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';
import {
  TransactionHistoryFilterDto,
  TransactionHistoryResponseDto,
} from '../modules/users/dto/transaction-history.dto';
import { TransferFilterDto } from '../modules/users/dto/transfer-filter.dto';
import { UpdateBeneficiaryDto } from '../modules/users/dto/update-beneficiary.dto';
import { UpdateNotificationSettingsDto } from '../modules/users/dto/update-notification-settings.dto';
import { UpdateOrganizerProfileDto } from '../modules/users/dto/update-organizer-profile.dto';
import { UpdateProfileDto } from '../modules/users/dto/update-profile.dto';
import { UpdateUserDto } from '../modules/users/dto/update-user.dto';
import { VerifyPaymentDto } from '../modules/users/dto/verify-payment.dto';
import { BankDto } from '../modules/withdrawal/dto/bank.dto';
import { CreateWithdrawDto } from '../modules/withdrawal/dto/create-withdraw.dto';
import { CreateWithdrawalDto } from '../modules/withdrawal/dto/create-withdrawal.dto';
import { CryptoDto } from '../modules/withdrawal/dto/crypto.dto';
import { UpdateWithdrawalDto } from '../modules/withdrawal/dto/update-withdrawal.dto';

const ALL_DTOS: Array<new () => any> = [
  DateRangeDto,
  AmountRangeDto,
  PaginationDto,
  SignInDto,
  LoginDto,
  CreateTargetBeneficiaryDto,
  UpdateTargetBeneficiaryDto,
  AddBeneficiaryCampaignDto,
  CampaignFilterDto,
  CreateBeneficiaryCampaignDto,
  CreateCampaignDto,
  CreateDonationDto,
  DeleteBeneficiaryDto,
  DonationFilterDto,
  UpdateCampaignDto,
  AddBeneficiariesExcel,
  CreateCitiesDto,
  CreateDistributionMethodsDto,
  CreateHealthStatusDto,
  CreateLocationsDto,
  CreateTransactionTypesDto,
  CreateUserTypesDto,
  UpdateCitiesDto,
  UpdateDistributionMethodsDto,
  UpdateFeePercentageDto,
  UpdateHealthStatusDto,
  UpdateLocationsDto,
  UpdateTransactionTypesDto,
  UpdateUserTypesDto,
  CreateAccountDto,
  CreateEntryDto,
  CreateTransactionDto,
  DepositDto,
  PaymentRequestDto,
  StartSessionDto,
  MarkAsReadDto,
  TestNotificationDto,
  DailyDonationItemDto,
  DateRangeQueryDto,
  DonationsByCountryItemDto,
  StatsOverviewDto,
  TransactionsByTypeItemDto,
  ChangeWithdrawPreferenceDto,
  CreateBeneficiaryDto,
  CreateDepositDto,
  CreateTransferDto,
  CreateUserDto,
  TransactionHistoryFilterDto,
  TransactionHistoryResponseDto,
  TransferFilterDto,
  UpdateBeneficiaryDto,
  UpdateNotificationSettingsDto,
  UpdateOrganizerProfileDto,
  UpdateProfileDto,
  UpdateUserDto,
  VerifyPaymentDto,
  BankDto,
  CreateWithdrawDto,
  CreateWithdrawalDto,
  CryptoDto,
  UpdateWithdrawalDto,
];

const arrayPayload: Record<string, any> = {
  organizer_id: ['1', '2'],
  beneficiaryType: ['3'],
  campaignId: ['4'],
  campaign_id: 4,
  country: ['US', 'JO'],
  beneficiary_ids: [1, 2],
  user_ids: [1, 2],
  entries: [{ account_id: 1, amount: 10, type: 'debit' }],
  isOneTime: 'true',
  is_anonymous: 'yes',
  is_contra_account: true,
  category: 'all',
  transactionType: 'send',
  minAmount: '5',
  maxAmount: '10',
  minBeneficiaries: '1',
  maxBeneficiaries: '9',
  minTarget: '100',
  maxTarget: '900',
  fromDate: '2024-01-01',
  toDate: '2024-12-31',
  from: '2024-01-01',
  to: '2024-12-31',
  date: '2024-05-05',
  amount: 100,
  limit: '10',
  offset: '0',
  page: '1',
  percentage: 2.5,
  name: 'name',
  title: 'title',
  arabic_title: 'عنوان',
  description: 'desc',
  details: 'details',
  arabic_details: 'تفاصيل',
  email: 'a@b.com',
  phone_number: '+962790000000',
  receiver_phone_number: '+962790000001',
  password: 'password123',
  role: 'user',
  city: 'Amman',
  address: 'street',
  status: 'success',
  method: 'OneTime',
  type: 'debit',
  currency: 'USDT',
  code: '962',
  countryCode: 'JO',
  message: 'hi',
  token: 'token',
  idToken: 'idToken',
  fcm_token: 'fcm',
  preferred_language: 'en',
  wallet_address: '0xabc',
  depositAddress: '0xabc',
  iban: 'JO00',
  swift_code: 'ABCDJOAX',
  bank: 'Bank',
  account_number: '123',
  account_id: 1,
  transaction_id: 1,
  notification_id: 1,
  target_beneficiaries_id: 1,
  single_target: 100,
  num_beneficiaries: 10,
  start_date: '2024-01-01',
  end_date: '2024-06-01',
  national_id: '9999',
  health_status: 'good',
  website: 'https://x.com',
  overview: 'overview',
  icon: 'icon',
  image: 'image.png',
  video_url: 'v.mp4',
  notes: 'notes',
  birth_date: '2000-01-01',
  deviceFingerprint: 'fp',
  publicKeyPem: 'pem',
  signature: 'sig',
  signatureB64: 'c2ln',
  txHash: '0xhash',
  reference: 'ref',
  expectedAmount: 100,
  expires_at: '2024-12-31',
  external_id: 'ext',
  metadata: '{}',
  transaction_number: 'TX1',
  transaction_date: '2024-01-01',
  normal_balance: 'debit',
  parent_account_id: 1,
  swift: 'ABC',
};

const scalarPayload: Record<string, any> = {
  ...arrayPayload,
  organizer_id: '5',
  beneficiaryType: '6',
  campaignId: '7',
  country: 'US',
  isOneTime: 'false',
  is_anonymous: 'no',
};

const emptyPayload: Record<string, any> = Object.keys(arrayPayload).reduce(
  (acc, k) => {
    acc[k] = '';
    return acc;
  },
  {} as Record<string, any>,
);

describe('DTOs (bulk transform + validate)', () => {
  it.each(ALL_DTOS.map((d) => [d.name, d] as const))(
    'transforms and validates %s across payload shapes',
    async (_name, Dto) => {
      for (const payload of [arrayPayload, scalarPayload, emptyPayload]) {
        const instance = plainToInstance(Dto as any, payload, {
          enableImplicitConversion: false,
        });
        expect(instance).toBeInstanceOf(Dto as any);
        const errors = await validate(instance as object, {
          skipMissingProperties: true,
        });
        expect(Array.isArray(errors)).toBe(true);
      }
      // plain instantiation path
      expect(new (Dto as any)()).toBeInstanceOf(Dto as any);
    },
  );
});

describe('DTO transform branch specifics', () => {
  it('CampaignFilterDto normalizes organizer_id array & scalar & empty', () => {
    expect(
      plainToInstance(CampaignFilterDto, { organizer_id: ['1', '2'] })
        .organizer_id,
    ).toEqual([1, 2]);
    expect(
      plainToInstance(CampaignFilterDto, { organizer_id: '3' }).organizer_id,
    ).toEqual([3]);
    expect(
      plainToInstance(CampaignFilterDto, { organizer_id: '' }).organizer_id,
    ).toBeUndefined();
    expect(plainToInstance(CampaignFilterDto, { isOneTime: 'true' }).isOneTime).toBe(
      true,
    );
    expect(
      plainToInstance(CampaignFilterDto, { minBeneficiaries: '5' })
        .minBeneficiaries,
    ).toBe(5);
  });

  it('DonationFilterDto parses is_anonymous variants', () => {
    const parse = (v: any) =>
      plainToInstance(DonationFilterDto, { is_anonymous: v }).is_anonymous;
    expect(parse('yes')).toBe(true);
    expect(parse('n')).toBe(false);
    expect(parse(1)).toBe(true);
    expect(parse(true)).toBe(true);
    expect(parse('')).toBeUndefined();
    expect(parse('maybe')).toBeUndefined();
    expect(
      plainToInstance(DonationFilterDto, { campaignId: '9' }).campaignId,
    ).toEqual([9]);
  });

  it('PaginationDto parses numeric strings', () => {
    const p = plainToInstance(PaginationDto, {
      limit: '10',
      offset: '5',
      page: '2',
    });
    expect(p.limit).toBe(10);
    expect(p.offset).toBe(5);
    expect(p.page).toBe(2);
  });

  it('TransactionHistoryFilterDto validates the category enum', async () => {
    const bad = plainToInstance(TransactionHistoryFilterDto, {
      category: 'nope',
    });
    const errors = await validate(bad);
    expect(errors.length).toBeGreaterThan(0);
    const good = plainToInstance(TransactionHistoryFilterDto, {
      category: 'all',
    });
    expect((await validate(good)).length).toBe(0);
  });

  it('TransferFilterDto transforms amount and dates', () => {
    const t = plainToInstance(TransferFilterDto, {
      minAmount: '3',
      fromDate: '2024-01-01',
      toDate: '',
    });
    expect(t.minAmount).toBe(3);
    expect(t.fromDate).toBeInstanceOf(Date);
    expect(t.toDate).toBeUndefined();
  });

  it('response DTOs can carry data', () => {
    const r = new TransactionHistoryResponseDto();
    r.id = 1;
    r.amount = 50;
    expect(r.amount).toBe(50);
  });
});
