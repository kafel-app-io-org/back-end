import { MigrationInterface, QueryRunner } from 'typeorm';

export class Renamewithdrawaldatatable1745319659412
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('withdrawal_data', 'withdrawals');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable('withdrawals', 'withdrawal_data');
  }
}
