import { customType, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

const longblob = customType<{ data: Buffer; driverData: string | Buffer }>({
  dataType() {
    return "longblob";
  },
  toDriver(value: Buffer) {
    return value;
  },
  fromDriver(value: string | Buffer) {
    if (typeof value === "string") return Buffer.from(value);
    return value;
  },
});

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Gallery images table for portfolio management
 */
export const galleryImages = mysqlTable("galleryImages", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(),
  category: varchar("category", { length: 64 }).default("landscapes").notNull(),
  displayOrder: int("displayOrder").default(0).notNull(),
  isPublished: int("isPublished").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GalleryImage = typeof galleryImages.$inferSelect;
export type InsertGalleryImage = typeof galleryImages.$inferInsert;

/**
 * Table for storing actual binary images in MySQL
 */
export const imageBlobs = mysqlTable("imageBlobs", {
  key: varchar("key", { length: 512 }).primaryKey(),
  mimeType: varchar("mimeType", { length: 255 }).notNull(),
  data: longblob("data").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ImageBlob = typeof imageBlobs.$inferSelect;
export type InsertImageBlob = typeof imageBlobs.$inferInsert;