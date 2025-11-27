import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTargetBeneficiariesTable1746018985153
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable(
      'target_beneficiaries',
      'target_beneficiaries_type',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameTable(
      'target_beneficiaries_type',
      'target_beneficiaries',
    );
  }
}
