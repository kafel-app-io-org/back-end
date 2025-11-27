// example TypeORM migration (MySQL)
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUpdatedByToNfcDevice1756711678898 implements MigrationInterface {
  name = 'AddUpdatedByToNfcDevice1756711678898'
  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE nfc_devices
      ADD COLUMN updated_by INT NULL
      -- optionally add FK if it should reference users(id):
      -- , ADD CONSTRAINT fk_nfc_device_updated_by
      --   FOREIGN KEY (updated_by) REFERENCES users(id)
      --   ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }
  public async down(q: QueryRunner): Promise<void> {
    await q.query(`
      ALTER TABLE nfc_devices
      DROP COLUMN updated_by
    `);
  }
}
