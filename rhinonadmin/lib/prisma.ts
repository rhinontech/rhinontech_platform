import { PrismaClient } from '@prisma/client';

// Create Prisma Client instances for different environments
class PrismaClientSingleton {
    private static betaClient: PrismaClient | null = null;
    private static prodClient: PrismaClient | null = null;

    static getBetaClient(): PrismaClient {
        if (!this.betaClient) {
            this.betaClient = new PrismaClient({
                datasourceUrl: process.env.DATABASE_URL,
            });
        }
        return this.betaClient;
    }

    static getProdClient(): PrismaClient {
        if (!this.prodClient) {
            // Construct prod DATABASE_URL from environment variables
            const prodUrl = `postgresql://${process.env.PROD_DB_USERNAME}:${process.env.PROD_DB_PASSWORD}@${process.env.PROD_DB_HOST}:${process.env.PROD_DB_PORT}/${process.env.PROD_DB_NAME}?schema=public`;
            this.prodClient = new PrismaClient({
                datasourceUrl: prodUrl,
            });
        }
        return this.prodClient;
    }

    static getClient(env: 'beta' | 'prod' = 'beta'): PrismaClient {
        return env === 'prod' ? this.getProdClient() : this.getBetaClient();
    }
}

export const prisma = PrismaClientSingleton.getBetaClient();
export const getPrismaClient = PrismaClientSingleton.getClient.bind(PrismaClientSingleton);
