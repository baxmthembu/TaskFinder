require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE,
    },
    migrations: {
      directory: './migrations'
    }
  },
  production: {
    client: 'pg',
    connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    },
    migrations: {
      directory: './migrations'
    }
  }
};