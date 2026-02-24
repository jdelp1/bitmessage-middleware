import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";
import JWT from "../../lib/jwtDecoder.js";
import logger from "../../utils/logger.js";

const PUBLIC_TMP = path.join(process.cwd(), "public", "tmp");

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Format a single object as a line for scheduled SMS
// Expected format: fechaEnvio(dd/MM/yyyy)|horaEnvio(HH:mm)|telefono|texto
function formatSMSLine(obj) {
  if (obj.fechaEnvio) {
    // Parse ISO date to dd/MM/yyyy and HH:mm
    const date = new Date(obj.fechaEnvio);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year}|${hours}:${minutes}|${obj.telefono}|${obj.texto}`;
  }
  
  // Fallback for instant SMS (no fechaEnvio)
  return Object.values(obj).join("|");
}

// Generate SMS file from array of objects
function generateSMSFile(data, fileName) {
  ensureDir(PUBLIC_TMP);
  const content = data.map(formatSMSLine).join("\n");
  const filePath = path.join(PUBLIC_TMP, fileName);

  // Write without BOM - BitMessage parser doesn't handle it correctly
  fs.writeFileSync(filePath, content, "utf8");
  logger.info(
    { filePath, preview: content.slice(0, 500) },
    "Scheduled SMS file generated",
  );
  return filePath;
}

// Validate input is a non-empty array of non-null objects
function isValidSMSData(data) {
  return (
    Array.isArray(data) &&
    data.length &&
    data.every((obj) => obj && typeof obj === "object" && !Array.isArray(obj))
  );
}

// Main orchestrator: validates, generates file, returns result
export async function sendScheduledSMSFile(data, campanya) {
  if (!isValidSMSData(data)) {
    logger.error({ data }, "Input must be a non-empty array of objects");
    return {
      success: false,
      error: "Input must be a non-empty array of objects",
    };
  }

  const fileName = `scheduled-sms-${Date.now()}.txt`;
  const filePath = generateSMSFile(data, fileName);

  if (!fs.existsSync(filePath)) {
    logger.error({ filePath }, "Failed to generate SMS file");
    return { success: false, error: "Failed to generate SMS file" };
  }

  // Send file to BitMessage as multipart/form-data
  let bitMessageResponse;
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
      filename: fileName,
      contentType: "text/plain",
    });

    const url = `${process.env.BITMESSAGE_SCHEDULED_SMS_API}?campanya=${encodeURIComponent(campanya)}`;

    logger.info(
      { url, campanya, fileName },
      "Calling BitMessage Scheduled SMS API",
    );

    const response = await axios.post(url, form, {
      auth: {
        username: process.env.BITMESSAGE_USERNAME,
        password: process.env.BITMESSAGE_PASSWORD,
      },
      headers: { ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    bitMessageResponse = response.data;
    logger.info(
      { filePath, fileGenerated: true, bitMessageResponse },
      "Scheduled SMS file sent to BitMessage",
    );
    return {
      success: true,
      filePath,
      url: `/tmp/${fileName}`,
      bitMessageResponse,
    };
  } catch (error) {
    logger.error({ filePath, error }, "Failed to send file to BitMessage");
    return {
      success: false,
      filePath,
      url: `/tmp/${fileName}`,
      error: error.message,
    };
  }

  // logger.info(
  //   { filePath, fileGenerated: true },
  //   "Scheduled SMS file ready (BitMessage call skipped)",
  // );

  // return { success: true, filePath, url: `/tmp/${fileName}` };
}

/*
 * POST Handler for /receive-json-file/ route of Activity.
 * Receives JSON array, generates the txt file (sendScheduledSMSFile), sends it to BitMessage.
 */
// Express route handler: receives JSON, validates, generates file
export async function receiveJsonFile(req, res) {
  req.setTimeout(60000);
  const data = req.body;
  const campanya =
    req.query.campanya || process.env.BITMESSAGE_CAMPANYA || "SOIB";
  const result = await sendScheduledSMSFile(data, campanya);

  if (result && result.success) {
    logger.info("Scheduled SMS file sent successfully");
    return res.status(200).json({ success: true, response: result });
  } else {
    logger.error({ result }, "sendScheduledSMSFile did not return success");
    return res.status(400).json({
      success: false,
      error: result && result.error ? result.error : "Unknown error",
    });
  }
}

// Utility: Send Scheduled SMS via BitMessage API (single SMS via file upload)
async function sendScheduledSMS(payload) {
  try {
    const campanya = payload.campanyaReferencia || "SOIB";
    
    // Generate a single-record file
    const fileName = `scheduled-sms-${Date.now()}.txt`;
    ensureDir(PUBLIC_TMP);
    const content = formatSMSLine(payload);
    const filePath = path.join(PUBLIC_TMP, fileName);
    // Write without BOM - BitMessage parser doesn't handle it correctly
    fs.writeFileSync(filePath, content, "utf8");
    
    logger.info(
      { filePath, content },
      "Single scheduled SMS file generated",
    );

    // Upload file as multipart/form-data
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
      filename: fileName,
      contentType: "text/plain",
    });

    const url = `${process.env.BITMESSAGE_SCHEDULED_SMS_API}?campanya=${encodeURIComponent(campanya)}`;
    
    logger.info(
      { url, campanya, fileName, payload },
      "Calling BitMessage Scheduled SMS API with file",
    );

    const response = await axios.post(url, form, {
      auth: {
        username: process.env.BITMESSAGE_USERNAME,
        password: process.env.BITMESSAGE_PASSWORD,
      },
      headers: { ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const estado = response.data?.estado?.toUpperCase();
    return {
      success: estado === "PROGRAMADO" || estado === "ENVIADO",
      data: response.data,
      filePath,
      url: `/tmp/${fileName}`,
    };
  } catch (error) {
    logger.error(
      { err: error, response: error.response?.data },
      "BitMessage Scheduled SMS API call failed",
    );
    return { success: false, error };
  }
}

// =====================
// Route Handlers
// =====================

/*
 * POST Handler for /execute/ route of Activity.
 */
// Express route handler: executes scheduled SMS via BitMessage
export async function execute(req, res) {
  logger.info(
    { endpoint: "/scheduled-sms/execute" },
    "Scheduled SMS Execute endpoint called",
  );
  JWT(req.body, process.env.jwtSecret, async (err, decoded) => {
    if (err) return res.status(401).end();
    const inArgs = decoded?.inArguments;
    if (!inArgs || inArgs.length === 0) return res.status(200).json({ branchResult: "failed" });
    
    // Check if inArguments is an array of SMS objects (multiple SMS)
    const isMultipleSMS = inArgs.every(arg => 
      arg && (arg.telefono || arg.phone) && (arg.texto || arg.message)
    );
    
    if (isMultipleSMS && inArgs.length > 1) {
      // Multiple SMS: create array and use sendScheduledSMSFile
      const smsArray = inArgs.map(arg => {
        const smsObj = {
          telefono: arg.telefono || arg.phone,
          texto: arg.texto || arg.message,
          campanyaReferencia: arg.campanya || arg.campanyaReferencia || process.env.BITMESSAGE_CAMPANYA || "SOIB",
        };
        if (arg.fechaEnvio || arg.scheduledDate) {
          smsObj.fechaEnvio = arg.fechaEnvio || arg.scheduledDate;
        }
        return smsObj;
      });
      
      const campanya = smsArray[0].campanyaReferencia;
      const result = await sendScheduledSMSFile(smsArray, campanya);
      return res.status(200).json({ branchResult: result.success ? "scheduled" : "failed" });
    } else {
      // Single SMS: use sendScheduledSMS
      const args = inArgs[0];
      const smsPayload = {
        telefono: args.telefono || args.phone,
        texto: args.texto || args.message,
        campanyaReferencia: args.campanya || args.campanyaReferencia || process.env.BITMESSAGE_CAMPANYA || "SOIB",
      };
      
      // Add fechaEnvio only if provided
      if (args.fechaEnvio || args.scheduledDate) {
        smsPayload.fechaEnvio = args.fechaEnvio || args.scheduledDate;
      }
      
      const result = await sendScheduledSMS(smsPayload);
      return res.status(200).json({ branchResult: result.success ? "scheduled" : "failed" });
    }
  });
}

// Simple event handlers for other endpoints
function simpleHandler(endpoint) {
  return (req, res) => {
    logger.info(
      { endpoint, body: req.body },
      `Scheduled SMS ${endpoint} event received`,
    );
    res.send(200, endpoint.charAt(0).toUpperCase() + endpoint.slice(1));
  };
}

export const publish = simpleHandler("publish");
export const validate = simpleHandler("validate");
export const edit = simpleHandler("edit");
export const save = simpleHandler("save");
export const stop = simpleHandler("stop");
