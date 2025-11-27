import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class BeneficiaryDistributions1745744735824
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create beneficiary_distribution table
    await queryRunner.createTable(
      new Table({
        name: 'beneficiary_distribution',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'beneficiary_campaign_id',
            type: 'int',
          },
          {
            name: 'donation_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'integer',
          },
          {
            name: 'status',
            type: 'varchar',
            default: `'pending'`,
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            isNullable: true,
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
            isNullable: true,
            default: null,
          },
          {
            name: 'created_by',
            type: 'int',
            isNullable: true,
            default: null,
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
    );

    // Add foreign key for donation_id
    await queryRunner.createForeignKey(
      'beneficiary_distribution',
      new TableForeignKey({
        columnNames: ['donation_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'donations',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const beneficiaryDistributionTable = await queryRunner.getTable(
      'beneficiary_distribution',
    );
    const fkDonation = beneficiaryDistributionTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('donation_id') !== -1,
    );

    await queryRunner.dropForeignKey('beneficiary_distribution', fkDonation);

    // Drop table
    await queryRunner.dropTable('beneficiary_distribution');
  }
}
