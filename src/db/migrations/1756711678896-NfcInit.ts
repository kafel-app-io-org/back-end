import { MigrationInterface, QueryRunner } from "typeorm";

export class NfcInit1756711678896 implements MigrationInterface {
  name = 'NfcInit1756711678896';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nfc_devices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ownerId INT NOT NULL,
        device_fingerprint VARCHAR(255) NOT NULL,
        public_key_pem TEXT NOT NULL,
        signing_counter INT NOT NULL DEFAULT 0,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT fk_nfc_devices_owner FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nfc_offline_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deviceId INT NOT NULL,
        nonce CHAR(36) NOT NULL UNIQUE,
        expires_at DATETIME(6) NOT NULL,
        used TINYINT(1) NOT NULL DEFAULT 0,
        used_at DATETIME(6) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        CONSTRAINT fk_nfc_tokens_device FOREIGN KEY (deviceId) REFERENCES nfc_devices(id) ON DELETE CASCADE,
        INDEX idx_nfc_tokens_device (deviceId),
        INDEX idx_nfc_tokens_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS nfc_offline_tokens;`);
    await queryRunner.query(`DROP TABLE IF EXISTS nfc_devices;`);
  }
}
