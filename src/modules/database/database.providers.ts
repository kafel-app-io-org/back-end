import { DataSource } from 'typeorm';
import { PrettySqlLogger } from '../../common/utils/pretty-sql-logger';

export const databaseProviders = [
  {
    provide: DataSource,
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        username: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        logging: Boolean(process.env.MYSQL_LOGGING),
        synchronize: false,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        logger: new PrettySqlLogger(),
      });
      await dataSource.initialize();
      console.log('Database connected successfully');
      return dataSource;
    },
  },
];
