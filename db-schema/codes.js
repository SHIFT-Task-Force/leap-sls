const {
  pgTable,
  text,
  serial,
  varchar,
  uniqueIndex
} = require("drizzle-orm/pg-core");

const codes = pgTable(
  "codes",
  {
    id: serial("id").primaryKey(),
    system: varchar("system", { length: 255 }).notNull(),
    code: varchar("code", { length: 255 }).notNull(),
    display: text("display"),
    type: varchar("type", { length: 255 }).notNull()
  },
  (table) => {
    return {
      systemCodeUniqueIdx: uniqueIndex("system_code_unique_idx").on(
        table.system,
        table.code
      )
    };
  }
);

module.exports = { codes };
