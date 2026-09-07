import { PrismaClient } from '@prisma/client';
import path from 'path';

// Force and validate SQLite database path for local persistence
const defaultSqlitePath = path.resolve(process.cwd(), 'prisma', 'dev.db');
const defaultSqliteUrl = `file:${defaultSqlitePath}`;

if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = defaultSqliteUrl;
}

// Prevent multiple instances in development
declare global {
  // eslint-disable-next-line no-var
  var prismaInstance: PrismaClient | undefined;
}

export const prisma =
  global.prismaInstance ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL.startsWith('file:')
          ? process.env.DATABASE_URL
          : defaultSqliteUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaInstance = prisma;
}
