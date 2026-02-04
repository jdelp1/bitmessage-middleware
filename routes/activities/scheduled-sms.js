import fs from "fs";
import path from "path";
import FormData from "form-data";
import axios from "axios";
import JWT from "../../lib/jwtDecoder.js";
import logger from "../../utils/logger.js";

const PUBLIC_TMP = path.join(process.cwd(), "public", "tmp");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Generic formatter for all formats (expects array of values)
const smsFormatter = (arr) => arr.join("|");

const generateSMSFile = (data, fileName) => {
  ensureDir(PUBLIC_TMP);
  const content = data.map(smsFormatter).join("\n");
  const filePath = path.join(PUBLIC_TMP, fileName);
  fs.writeFileSync(filePath, content, "utf8");
  logger.info(
    { filePath, fileContentPreview: content.slice(0, 500) },
    `Scheduled SMS file generated`,
  );
  return filePath;
};

export async function sendScheduledSMSFile(data, campanya) {
  const fileName = `scheduled-sms-${Date.now()}.txt`;
  const filePath = generateSMSFile(data, fileName);

  // Check if file was created
  const fsExists = fs.existsSync(filePath);
  if (!fsExists) {
    logger.error({ filePath }, "Failed to generate SMS file");
    return { success: false, error: "Failed to generate SMS file" };
  }

  // Uncomment below to send to BitMessage
  // let bitMessageResponse;
  // try {
  //   const form = new FormData();
  //   form.append("file", fs.createReadStream(filePath), { filename: fileName, contentType: "text/plain" });
  //   const url = `https://bitmessage.fundaciobit.org/bitmessage/api/v1/envios/sendfile?campanya=${encodeURIComponent(campanya)}`;
  //   const response = await axios.post(url, form, {
  //     auth: { username: process.env.BITMESSAGE_USERNAME, password: process.env.BITMESSAGE_PASSWORD },
  //     headers: { ...form.getHeaders() },
  //     maxContentLength: Infinity,
  //     maxBodyLength: Infinity,
  //   });
  //   bitMessageResponse = response.data;
  //   logger.info({ filePath, fileGenerated: true, bitMessageResponse }, "Scheduled SMS file sent to BitMessage");
  //   return { success: true, filePath, url: `/tmp/${fileName}`, bitMessageResponse };
  // } catch (error) {
  //   logger.error({ filePath, error }, "Failed to send file to BitMessage");
  //   return { success: false, filePath, url: `/tmp/${fileName}`, error: error.message };
  // }

  logger.info(
    { filePath, fileGenerated: true },
    "Scheduled SMS file ready (BitMessage call skipped)",
  );
  return { success: true, filePath, url: `/tmp/${fileName}` };
}

/*
 * POST Handler for /receive-json-file/ route of Activity.
 * Receives JSON array, generates the txt file (sendScheduledSMSFile), sends it to BitMessage.
 */
export async function receiveJsonFile(req, res) {
  req.setTimeout(60000);
  const data = req.body;

  if (!Array.isArray(data) || !data.length) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid or empty JSON array" });
  }

  const campanya =
    req.query.campanya || process.env.BITMESSAGE_CAMPANYA || "SOIB";
  try {
    const result = await sendScheduledSMSFile(data, campanya);
    if (result && result.success) {
      logger.info("Scheduled SMS file sent successfully");
      return res.status(200).json({ success: true, response: result });
    } else {
      logger.error({ result }, "sendScheduledSMSFile did not return success");
      return res
        .status(500)
        .json({
          success: false,
          error: result && result.error ? result.error : "Unknown error",
        });
    }
  } catch (err) {
    logger.error({ err }, "Error in /scheduled-sms/receive-json-file endpoint");
    res.status(500).json({ success: false, error: err.message });
  }
}

// =====================
// Utility Functions
// =====================

/**
 * Sends Scheduled SMS via BitMessage API
 * @param {Object} payload - SMS payload with scheduling parameters
 * @returns {Promise<{success: boolean, data: Object}>}
 */
async function sendScheduledSMS(payload) {
  try {
    logger.info({ payload }, "Calling BitMessage Scheduled SMS API");
    const response = await axios.post(
      process.env.BITMESSAGE_SCHEDULED_SMS_API,
      payload,
      {
        auth: {
          username: process.env.BITMESSAGE_USERNAME,
          password: process.env.BITMESSAGE_PASSWORD,
        },
        headers: { "Content-Type": "application/json" },
      },
    );
    const estado = response.data?.estado?.toUpperCase();
    return {
      success: estado === "PROGRAMADO" || estado === "ENVIADO",
      data: response.data,
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
export async function execute(req, res) {
  logger.info(
    { endpoint: "/scheduled-sms/execute" },
    "Scheduled SMS Execute endpoint called",
  );
  JWT(req.body, process.env.jwtSecret, async (err, decoded) => {
    if (err) {
      return res.status(401).end();
    }
    const args = decoded?.inArguments?.[0];
    if (!args) {
      return res.status(200).json({ branchResult: "failed" });
    }

    const smsPayload = {
      telefono: args.telefono || args.phone,
      texto: args.texto || args.message,
      fechaEnvio: args.fechaEnvio || args.scheduledDate,
      campanyaReferencia: process.env.BITMESSAGE_CAMPANYA || "SOIB",
    };
    const result = await sendScheduledSMS(smsPayload);
    res
      .status(200)
      .json({ branchResult: result.success ? "scheduled" : "failed" });
  });
}

const simpleHandler = (endpoint) => (req, res) => {
  logger.info(
    { endpoint, body: req.body },
    `Scheduled SMS ${endpoint} event received`,
  );
  res.send(200, endpoint.charAt(0).toUpperCase() + endpoint.slice(1));
};

export const publish = simpleHandler("publish");
export const validate = simpleHandler("validate");
export const edit = simpleHandler("edit");
export const save = simpleHandler("save");
export const stop = simpleHandler("stop");
