import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

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

  // Use Turso (libsql) if TURSO_DATABASE_URL is set
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
    const adapter = new PrismaLibSQL(libsql);
    _db = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
    });
  } else {
    // Fallback to local SQLite
    _db = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error"] : [],
    });
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = _db;
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
