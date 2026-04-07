import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaLibSQL({
  url: "libsql://mitrasewaapp-gedung.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzU1NDg3NTQsImlkIjoiMDE5ZDY2ZjMtOWMwMS03NzgxLTgzYmQtMzNlMGE0YTFhYmU3IiwicmlkIjoiYWFlYzMwZTctMTFmMC00ODY0LTlkZDItZDc0Mjk1YWRhZTQxIn0.dHtEDJxK0weFeYMAafHBF0Z7DoeJ_BSXYP7WGy69JCHJNRvonFNakvb8tT7rImhGh_w6Fy8mMjJ5lWmFKZ4MCw",
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
