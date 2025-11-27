import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class CreateFeesPercentageTable1747847306571
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'fee_percentage',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'amount',
            type: 'int',
            isNullable: false,
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            onUpdate: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            default: null,
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'int',
            default: null,
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'int',
            isNullable: true,
            default: null,
          },
          {
            name: 'deleted_by',
            type: 'int',
            isNullable: true,
            default: null,
          },
        ],
      }),
      true,
    );
    await queryRunner.addColumn(
      'transfers',
      new TableColumn({
        name: 'fees_amount',
        type: 'float',
        isNullable: false,
        default: '0',
      }),
    );
    await queryRunner.addColumn(
      'withdraws',
      new TableColumn({
        name: 'fees_amount',
        type: 'float',
        isNullable: false,
        default: '0',
      }),
    );
    await queryRunner.addColumn(
      'deposits',
      new TableColumn({
        name: 'fees_amount',
        type: 'float',
        isNullable: false,
        default: '0',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('deposits', 'fees_amount');
    await queryRunner.dropColumn('withdraws', 'fees_amount');
    await queryRunner.dropColumn('transfers', 'fees_amount');
    await queryRunner.dropTable('fee_percentage');
  }
}
