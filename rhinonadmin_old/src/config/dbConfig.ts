export const dbConfig = {
    Beta: {
        host: process.env.BETA_DB_HOST,
        port: parseInt(process.env.BETA_DB_PORT || "5432"),
        database: process.env.BETA_DB_NAME,
        user: process.env.BETA_DB_USERNAME,
        password: process.env.BETA_DB_PASSWORD,
    },
    Production: {
        host: process.env.PROD_DB_HOST,
        port: parseInt(process.env.PROD_DB_PORT || "5432"),
        database: process.env.PROD_DB_NAME,
        user: process.env.PROD_DB_USERNAME,
        password: process.env.PROD_DB_PASSWORD,
    },
};
