// Load environment variables
import "dotenv/config";

// Module Dependencies
// -------------------
import express from "express";
import bodyParser from "body-parser";
import errorhandler from "errorhandler";
import http from "http";
import path from "path";
import * as instantSms from "./routes/activities/instant-sms.js";
import * as scheduledSms from "./routes/activities/scheduled-sms.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

// Configure Express
app.set("port", process.env.PORT || 3000);
app.use(bodyParser.raw({ type: "application/jwt" }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

// Prevent caching of static files
app.use((req, res, next) => {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

// Serve static files for each activity
app.use(
  "/instant-sms",
  express.static(path.join(__dirname, "public/instant-sms")),
);
app.use(
  "/scheduled-sms",
  express.static(path.join(__dirname, "public/scheduled-sms")),
);

// Express in Development Mode
if ("development" == app.get("env")) {
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

// New endpoint: Receives POST with JSON body
app.post("/scheduled-sms/receive-json", scheduledSms.receiveJson);

http.createServer(app).listen(app.get("port"), function () {
  console.log("Express server listening on port " + app.get("port"));
});
