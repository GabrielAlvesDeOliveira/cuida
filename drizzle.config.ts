import type { Config } from 'drizzle-kit';

export default {
  schema: './models/database/schema/index.ts',
  out: './models/database/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
