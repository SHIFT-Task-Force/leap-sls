const { pgTable, integer, primaryKey } = require("drizzle-orm/pg-core");
const { codes } = require("./codes.js");

const code_group_mappings = pgTable(
  "code_group_mappings",
  {
    code_id: integer("code_id")
      .references(() => codes.id)
      .notNull(),
    group_id: integer("group_id")
      .references(() => codes.id)
      .notNull()
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.code_id, table.group_id] })
    };
  }
);

module.exports = { code_group_mappings };
