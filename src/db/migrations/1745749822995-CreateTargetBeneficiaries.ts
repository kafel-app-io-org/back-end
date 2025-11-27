import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class CreateTargetBeneficiaries1745749822995
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'target_beneficiaries',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
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
    await queryRunner.dropColumn('campaigns', 'target_beneficiaries');
    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'target_beneficiaries_id',
        type: 'int',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'campaigns',
      new TableForeignKey({
        columnNames: ['target_beneficiaries_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'target_beneficiaries',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('campaigns');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('target_beneficiaries_id') !== -1,
    );
    await queryRunner.dropForeignKey('campaigns', foreignKey);
    await queryRunner.dropColumn('campaigns', 'target_beneficiaries_id');
    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'target_beneficiaries',
        type: 'varchar',
        isNullable: false,
      }),
    );
    await queryRunner.dropTable('target_beneficiaries');
  }
}
