import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _db: PrismaClient | null = null;

function getDb(): PrismaClient {
  if (_db) return _db;

  if (globalForPrisma.prisma) {
    _db = globalForPrisma.prisma;
    return _db;
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

  _db = client;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return _db;
}

// Lazy getter — only creates PrismaClient when actually accessed
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
