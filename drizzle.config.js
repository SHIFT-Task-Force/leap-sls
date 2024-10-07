require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}` // Load .env.development by default
});

module.exports = {
  dialect: "postgresql",
  schema: "./db-schema/*.js",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL
  },
  verbose: true
};
