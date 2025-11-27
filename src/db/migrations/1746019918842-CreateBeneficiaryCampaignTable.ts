import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class CreateBeneficiaryCampaignTable1746019918842
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'beneficiary_campaigns',
        columns: [
          {
            name: 'user_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'distributed_amount',
            type: 'integer',
            default: 0,
          },
          {
            name: 'campaign_id',
            type: 'int',
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
    await queryRunner.createForeignKey(
      'beneficiary_campaigns',
      new TableForeignKey({
        columnNames: ['campaign_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'campaigns',
      }),
    );
    await queryRunner.createForeignKey(
      'beneficiary_campaigns',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    );

    await queryRunner.addColumn(
      'beneficiaries',
      new TableColumn({
        name: 'user_id',
        type: 'int',
        isNullable: true,
      }),
    );
    await queryRunner.createForeignKey(
      'beneficiaries',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      }),
    );
    await queryRunner.createForeignKey(
      'beneficiary_distribution',
      new TableForeignKey({
        columnNames: ['beneficiary_campaign_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'beneficiary_campaigns',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const beneficiaryDistributionTable = await queryRunner.getTable(
      'beneficiary_distribution',
    );
    const fkBeneficiaryCampaign = beneficiaryDistributionTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('beneficiary_campaign_id') !== -1,
    );
    await queryRunner.dropForeignKey(
      'beneficiary_distribution',
      fkBeneficiaryCampaign,
    );
    const beneficiariesTable = await queryRunner.getTable('beneficiaries');
    const useCampaignForeignKey = beneficiariesTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    await queryRunner.dropForeignKey('beneficiaries', useCampaignForeignKey);
    await queryRunner.dropColumn('beneficiaries', 'user_id');

    const table = await queryRunner.getTable('beneficiary_campaigns');
    const campaignForeignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('campaign_id') !== -1,
    );
    const userForeignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('user_id') !== -1,
    );
    await queryRunner.dropForeignKey(
      'beneficiary_campaigns',
      campaignForeignKey,
    );
    await queryRunner.dropForeignKey('beneficiary_campaigns', userForeignKey);

    await queryRunner.dropTable('beneficiary_campaigns');
  }
}
