import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Prisma 7 keeps the connection URL here instead of in schema.prisma.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
