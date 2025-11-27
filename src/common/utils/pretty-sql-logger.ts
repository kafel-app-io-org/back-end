/* eslint-disable */
import { Logger, QueryRunner } from 'typeorm';

export class PrettySqlLogger implements Logger {
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    if (parameters && parameters.length) {
      const formattedQuery = parameters.reduce(
        (q, p) => q.replace(/\?/, typeof p === 'string' ? `'${p}'` : p),
        query,
      );
      console.log(`query: ${formattedQuery}`);
    } else {
      console.log(`query: ${query}`);
    }
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    console.error(`Query failed: ${query}`);
    console.error(error);
  }

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ) {
    console.warn(`Slow query (${time}ms): ${query}`);
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    console.log(message);
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    console.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    console[level](message);
  }
}
