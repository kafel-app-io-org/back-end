import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTokenTypeToDeposit1752931059049 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'deposits',
      new TableColumn({
        name: 'token_type',
        type: 'varchar',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'deposits',
      'transaction_id',
      new TableColumn({
        name: 'transaction_id',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'deposits',
      'transaction_id',
      new TableColumn({
        name: 'transaction_id',
        type: 'int',
        isNullable: false,
      }),
    );
    await queryRunner.dropColumn('deposits', 'token_type');
  }
}
