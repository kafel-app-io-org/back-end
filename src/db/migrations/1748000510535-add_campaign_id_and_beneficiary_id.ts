import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCampaignIdAndBeneficiaryId1748000510535
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'beneficiary_distribution',
      new TableColumn({
        name: 'campaign_id',
        type: 'int',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'beneficiary_distribution',
      new TableColumn({
        name: 'beneficiary_user_id',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('beneficiary_distribution', 'campaign_id');
    await queryRunner.dropColumn(
      'beneficiary_distribution',
      'beneficiary_user_id',
    );
  }
}
