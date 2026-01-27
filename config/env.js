"use strict";

const dotenv = require("dotenv");
const path = require("node:path");

// Determina qué archivo cargar según NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

module.exports = {
  NODE_ENV: process.env.NODE_ENV,
  BITMESSAGE_USER: process.env.BITMESSAGE_USER || "",
  BITMESSAGE_PASSWORD: process.env.BITMESSAGE_PASSWORD || "",
  BITMESSAGE_BASE_URL: process.env.BITMESSAGE_BASE_URL || "",
  BITMESSAGE_CAMPAIGN: process.env.BITMESSAGE_CAMPAIGN || "",
};
