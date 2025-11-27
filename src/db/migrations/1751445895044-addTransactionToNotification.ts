import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTransactionToNotification1751445895044
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'notifications',
      new TableColumn({
        name: 'transaction_id',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('notifications', 'transaction_id');
  }
}
