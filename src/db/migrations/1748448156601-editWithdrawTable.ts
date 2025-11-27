import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EditWithdrawTable1748448156601 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'withdraws',
      'transaction_id',
      new TableColumn({
        name: 'transaction_id',
        type: 'int',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'withdraws',
      'transaction_id',
      new TableColumn({
        name: 'transaction_id',
        type: 'int',
        isNullable: false,
        default: undefined, // remove default null
      }),
    );
  }
}
