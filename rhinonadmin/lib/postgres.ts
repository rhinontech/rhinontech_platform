import { Pool } from 'pg';

// PostgreSQL connection configurations
const dbConfigs = {
    beta: {
        host: process.env.BETA_DB_HOST,
        port: parseInt(process.env.BETA_DB_PORT || '5432'),
        database: process.env.BETA_DB_NAME,
        user: process.env.BETA_DB_USERNAME,
        password: process.env.BETA_DB_PASSWORD,
        ssl: process.env.BETA_DB_HOST?.includes('aws') || process.env.BETA_DB_HOST?.includes('rds')
            ? { rejectUnauthorized: false }
            : undefined,
    },
    prod: {
        host: process.env.PROD_DB_HOST,
        port: parseInt(process.env.PROD_DB_PORT || '5432'),
        database: process.env.PROD_DB_NAME,
        user: process.env.PROD_DB_USERNAME,
        password: process.env.PROD_DB_PASSWORD,
        ssl: process.env.PROD_DB_HOST?.includes('aws') || process.env.PROD_DB_HOST?.includes('rds')
            ? { rejectUnauthorized: false }
            : undefined,
    },
};

const pools: Record<string, Pool> = {};

export function getPostgresPool(env: 'beta' | 'prod'): Pool {
    if (!pools[env]) {
        pools[env] = new Pool(dbConfigs[env]);
    }
    return pools[env];
}
