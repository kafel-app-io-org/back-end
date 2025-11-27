// example TypeORM migration (MySQL)
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedByToNfcDevice1756711678897 implements MigrationInterface {
  name = 'AddCreatedByToNfcDevice1756711678897'
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE nfc_devices
      ADD COLUMN created_by INT NULL
      -- optionally add FK if it should reference users(id):
      -- , ADD CONSTRAINT fk_nfc_device_created_by
      --   FOREIGN KEY (created_by) REFERENCES users(id)
      --   ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE nfc_devices
      DROP COLUMN created_by
    `);
  }
}
