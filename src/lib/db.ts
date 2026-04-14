import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  _prismaInit: boolean;
};

let _db: PrismaClient | null = null;

function getDb(): PrismaClient {
  if (_db) return _db;

  if (globalForPrisma.prisma) {
    _db = globalForPrisma.prisma;
    return _db;
  }

  const databaseUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!databaseUrl) {
    // Return a dummy disconnected client for build time
    // This prevents build failures when env vars are not available
    const fallbackClient = new PrismaClient({
      datasources: {
        db: {
          url: "file:./dummy.db",
        },
      },
    } as any);
    _db = fallbackClient;
    return _db;
  }

  const adapter = new PrismaLibSQL({
    url: databaseUrl,
    authToken: authToken,
  });

  const client = new PrismaClient({
    adapter,
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
