const { pgTable, integer } = require("drizzle-orm/pg-core");
const { codes } = require("./codes.js");

const metadata = pgTable("metadata", {
  code_id: integer("code_id")
    .references(() => codes.id)
    .primaryKey(),
  basis_id: integer("basis_id").references(() => codes.id)
});

module.exports = { metadata };
