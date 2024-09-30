const { pgTable, serial, text } = require("drizzle-orm/pg-core");

const hello = pgTable("hello", {
  id: serial("id"),
  name: text("name")
});

module.exports = { hello };
