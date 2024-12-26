import { getEnv } from "../common/utils/getEnv";

const  appConfig = () => ({
    PORT: getEnv("PORT", "4000"),
    NODE_ENV: getEnv("NODE_ENV", "development"),
    APP_ORIGIN: getEnv("APP_ORIGIN", "localhost"),
    BASE_PATH: getEnv("BASE_PATH", "/api/v1"),
    MONGO_DB: getEnv("MONGO_DB", "mongodb://localhost:27017/mydatabase"),
    Email:{
        MAIL_HOST: getEnv("SMTP_HOST","smtp.example.com"),
        MAIL_PORT: getEnv("SMTP_PORT","587"),
        MAIL_SERVICE: getEnv("SMTP_SERVICE","your_email_service"),
        MAIL_MAIL: getEnv("SMTP_MAIL","your_email@example.com"),
        MAIL_PASSWORD: getEnv("SMTP_PASSWORD","your_email_password"),
    },
    AWS:{
        AWS_REGION: getEnv("AWS_REGION", "us-east-1"),
        AWS_ACCESS_KEY_ID: getEnv("AWS_ACCESS_KEY_ID","your_aws_access_key"),
        AWS_SECRET_ACCESS_KEY: getEnv("AWS_SECRET_ACCESS_KEY","your_aws_secret_access_key"),
    },
    JWT:{
        SECRET: getEnv("JWT_SECRET", "your_secret_key"),
        EXPIRES_IN: getEnv("JWT_EXPIRES_IN","15m"),
        REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
        REFRESH_EXPIRES_IN: getEnv("JWT_REFRESH_EXPIRES_IN","30d"), 
    }
});

export const config = appConfig();