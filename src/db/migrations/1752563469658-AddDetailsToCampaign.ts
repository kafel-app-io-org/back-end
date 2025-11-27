import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDetailsToCampaign1752563469658 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'campaigns',
      new TableColumn({
        name: 'details',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('campaigns', 'details');
  }
}
