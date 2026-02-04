// Load environment variables
import "dotenv/config";

// Module Dependencies
// -------------------
import express from "express";
import compression from "compression";
import helmet from "helmet";
import errorhandler from "errorhandler";
import http from "http";
import path from "path";
import * as instantSms from "./routes/activities/instant-sms.js";
import * as scheduledSms from "./routes/activities/scheduled-sms.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Performance & Security Middlewares
app.set("port", process.env.PORT || 3000);
app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(express.raw({ type: "application/jwt" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Prevent caching of static files
app.use((req, res, next) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(
  "/instant-sms",
  express.static(path.join(__dirname, "public/instant-sms")),
);

app.use(
  "/scheduled-sms",
  express.static(path.join(__dirname, "public/scheduled-sms")),
);

// Serve files from public/tmp at /tmp URL path
app.use("/tmp", express.static(path.join(__dirname, "public/tmp")));

// Development Mode
if (app.get("env") === "development") {
  app.use(errorhandler());
}

// ===== Instant SMS Activity Routes =====
app.post("/instant-sms/save", instantSms.save);
app.post("/instant-sms/validate", instantSms.validate);
app.post("/instant-sms/publish", instantSms.publish);
app.post("/instant-sms/execute", instantSms.execute);
app.post("/instant-sms/stop", instantSms.stop);
app.post("/instant-sms/edit", instantSms.edit);

// ===== Scheduled SMS Activity Routes =====
app.post("/scheduled-sms/save", scheduledSms.save);
app.post("/scheduled-sms/validate", scheduledSms.validate);
app.post("/scheduled-sms/publish", scheduledSms.publish);
app.post("/scheduled-sms/execute", scheduledSms.execute);
app.post("/scheduled-sms/stop", scheduledSms.stop);
app.post("/scheduled-sms/edit", scheduledSms.edit);

// ===== Scheduled SMS Receive JSON Routes =====
app.post("/scheduled-sms/receive-json-file", scheduledSms.receiveJsonFile);

http.createServer(app).listen(app.get("port"), () => {
  console.log(`Express server listening on port ${app.get("port")}`);
});
