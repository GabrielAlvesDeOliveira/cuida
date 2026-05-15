import type { Config } from 'drizzle-kit';

export default {
  schema: './database/schema/index.ts',
  out: './database/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
