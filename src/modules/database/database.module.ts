import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { databaseProviders } from './database.providers';

@Global()
@Module({
  imports: [],
  providers: [...databaseProviders],
  exports: [DataSource],
})
export class DatabaseModule {}
