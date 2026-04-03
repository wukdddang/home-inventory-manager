import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // ── Database ──
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_DATABASE: Joi.string().default('home_inventory'),

  // ── JWT ──
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('30m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  // ── Mail ──
  MAIL_HOST: Joi.string().default('smtp.gmail.com'),
  MAIL_PORT: Joi.number().default(587),
  MAIL_USER: Joi.string().required(),
  MAIL_PASSWORD: Joi.string().required(),
  MAIL_FROM: Joi.string().default('"집비치기" <noreply@example.com>'),

  // ── Firebase (FCM) ──
  FIREBASE_SERVICE_ACCOUNT_PATH: Joi.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: Joi.string().optional(),

  // ── Backup ──
  BACKUP_ENABLED: Joi.string().default('false'),
  BACKUP_PATH: Joi.string().default('./backups/database'),
  BACKUP_COMPRESS: Joi.string().default('true'),
  BACKUP_MAX_RETRIES: Joi.number().default(3),
  BACKUP_RETRY_DELAY_MS: Joi.number().default(5000),

  // ── App ──
  APP_URL: Joi.string().default('http://localhost:4100'),
  PORT: Joi.number().default(4200),
});
