import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { PacienteEntity } from './entities/Paciente.class.js';

let dataSource: Promise<DataSource> | undefined;

/**
 * Returns the single TypeORM connection to SQL Server, created on first use
 */
export const getDataSource = (): Promise<DataSource> => {
  dataSource ??= new DataSource({
    type: 'mssql',
    host: process.env.MAIN_DB_HOST,
    port: Number(process.env.MAIN_DB_PORT),
    username: process.env.MAIN_DB_USER,
    password: process.env.MAIN_DB_PASSWORD,
    database: process.env.MAIN_DB_NAME,
    synchronize: false,
    logging: false,
    options: { encrypt: false },
    entities: [PacienteEntity]
  })
    .initialize()
    .catch((error: unknown) => {
      dataSource = undefined;
      throw error;
    });
  return dataSource;
};
