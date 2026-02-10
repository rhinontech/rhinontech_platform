import { Pool, PoolClient } from "pg";
import { dbConfig } from "../config/dbConfig";

// Global cache for connection pools to avoid exhausting connections in serverless envs (standard practice in Next.js)
const globalPools: { [key: string]: Pool } = {};

const isLocalDB = (host: string) => {
    return (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host === "host.docker.internal" ||
        host === "postgres"
    );
};

export const getDbConnection = (envName: string): Pool => {
    if (globalPools[envName]) {
        return globalPools[envName];
    }

    const config = dbConfig[envName as keyof typeof dbConfig];

    if (!config) {
        throw new Error(`Invalid environment: ${envName}`);
    }

    const pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: isLocalDB(config.host || "")
            ? undefined
            : {
                rejectUnauthorized: false,
            },
        max: 10, // Max clients in pool
        idleTimeoutMillis: 30000,
    });

    globalPools[envName] = pool;
    return pool;
};
