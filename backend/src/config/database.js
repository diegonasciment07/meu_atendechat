"use strict";
require("dotenv").config();

module.exports = {
  dialect: process.env.DB_DIALECT || "postgres",
  host: process.env.DB_HOST || "postgres",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres123",
  database: process.env.DB_NAME || "codatende",
  port: process.env.DB_PORT || 5432,
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
