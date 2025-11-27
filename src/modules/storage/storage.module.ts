import { Module } from '@nestjs/common';
import { StoreImagesService } from './services/store-images.service';

@Module({
  imports: [],
  controllers: [],
  providers: [StoreImagesService],
  exports: [StoreImagesService],
})
export class StorageModule {}
