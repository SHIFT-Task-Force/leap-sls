const { db } = require("./db");
const { hello } = require("../../db-schema");

async function seedDatabase() {
  await db.insert(hello).values({ name: "world" });

  console.log("Seed completed");
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
