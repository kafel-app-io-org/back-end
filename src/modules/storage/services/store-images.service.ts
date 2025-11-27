import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';
import { StoreImages } from '../interfaces/store-images.interface';

@Injectable()
export class StoreImagesService implements StoreImages {
  private logger = new Logger(StoreImagesService.name);
  private readonly storagePath = join(__dirname, '..', '..', '..', '..');

  constructor() {
    // Ensure the storage directory exists
    if (!fs.existsSync(join(this.storagePath, 'public/images'))) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    this.logger.debug({
      function: 'uploadImage',
    });
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const uploadPath = join(this.storagePath, 'public/images', fileName);

    try {
      await fs.promises.writeFile(uploadPath, file.buffer);
      return `/public/images/${fileName}`;
    } catch (error) {
      throw new BadRequestException('Failed to upload image');
    }
  }

  async deleteImage(fileName: string): Promise<void> {
    this.logger.debug({
      function: 'deleteImage',
      fileName,
    });
    if (fileName){
      const filePath = join(this.storagePath, fileName);

      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('File not found');
      }

      try {
        fs.unlink(filePath, (err) => {
          if (err) {
            this.logger.warn(
              `Failed to delete old image: ${filePath}`,
              err.message,
            );
          } else {
            this.logger.log(`Deleted old image: ${filePath}`);
          }
        });
      } catch (error) {
        throw new BadRequestException('Failed to delete image');
      }
    }
  }

  async downloadImage(imagePath: string): Promise<Buffer> {
    this.logger.debug({
      function: 'downloadImage',
      imagePath,
    });
    if (!fs.existsSync(join(this.storagePath, 'public/images', imagePath))) {
      throw new BadRequestException('File not found');
    }

    try {
      return fs.readFileSync(imagePath);
    } catch (error) {
      throw new BadRequestException('Failed to download image');
    }
  }
}
