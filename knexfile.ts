  import type { Knex } from 'knex';

  const config: Knex.Config = {
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port: 5433,
      user: 'dataharvest',
      password: 'dataharvest',
      database: 'dataharvest',
      ssl: false,
    },
    migrations: {
      directory: './src/db/migrations',
      extension: 'ts',
    },
  };

  export default config;