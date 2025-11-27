// src/modules/stats/stats.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { DateRangeQueryDto } from './dto/date-range-query.dto';

// ---- Import your existing auth setup (adjust paths/names if needed) ----
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import RolesGuard from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';
import { Role } from 'src/common/enum/role.enum';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

// ---- DTOs for typing (optional but recommended) ----
import { StatsOverviewDto } from './dto/overview.dto';
import { DonationsByCountryItemDto } from './dto/donations-country.dto';
import { TransactionsByTypeItemDto } from './dto/transactions-type.dto';
import { DailyDonationItemDto } from './dto/daily-donations.dto';

import { Public } from '../auth/public.decorator'; // adjust relative path if needed

@ApiBearerAuth()
@ApiTags('Dashboard Stats')
@UseGuards(RolesGuard)
// @Roles(Role.ADMIN, Role.ORGANIZER)
@Controller('admin/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * Helper to convert query DTO into the DateRange used by the service.
   */
  private toDateRange(query: DateRangeQueryDto) {
    return {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
    };
  }

  /**
   * Top cards: users, campaigns, tx counts, amounts, fees.
   *
   * GET /admin/stats/overview?from=2025-11-01&to=2025-11-30
   */
  @Public()
  @Get('overview')
  async getOverview(
    @Query() query: DateRangeQueryDto,
  ): Promise<StatsOverviewDto> {
    const range = this.toDateRange(query);
    return this.statsService.getOverview(range);
  }

//     @Public()
//   @Get('overview')
//   async getOverview(
//       ) {
//     return `{"Hello":"hi"}`;
//   }

  /**
   * Donations by country (for the “Donations Countries” widget).
   *
   * GET /admin/stats/donations/countries?from=...&to=...
   */
  @Public()
  @Get('donations/countries')
  async getDonationsByCountry(
    @Query() query: DateRangeQueryDto,
  ): Promise<DonationsByCountryItemDto[]> {
    const range = this.toDateRange(query);
    return this.statsService.getDonationsByCountry(range);
  }

  /**
   * Transactions by type (Transfer / Withdraw / Deposit / Donation / Others).
   *
   * GET /admin/stats/transactions/by-type?from=...&to=...
   */
  @Public()
  @Get('transactions/by-type')
  async getTransactionsByType(
    @Query() query: DateRangeQueryDto,
  ): Promise<TransactionsByTypeItemDto[]> {
    const range = this.toDateRange(query);
    return this.statsService.getTransactionsByType(range);
  }

  /**
   * Daily donations amount (for the green bar chart).
   *
   * GET /admin/stats/donations/daily?from=...&to=...
   */
  @Public()
  @Get('donations/daily')
  async getDailyDonations(
    @Query() query: DateRangeQueryDto,
  ): Promise<DailyDonationItemDto[]> {
    const range = this.toDateRange(query);
    return this.statsService.getDailyDonations(range);
  }
}
