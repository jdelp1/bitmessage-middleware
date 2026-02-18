// Deps
import axios from "axios";
import JWT from "../../lib/jwtDecoder.js";
import logger from "../../utils/logger.js";

/**
 * Sends SMS via BitMessage Instant SMS API
 * @param {Object} payload - SMS payload {telefono, texto, campanyaReferencia}
 * @returns {Promise<{success: boolean, data: Object}>}
 */
async function sendBitMessageSMS(payload) {
  try {
    // Build query parameters for GET request
    const params = new URLSearchParams({
      telefono: payload.telefono || payload.numero,
      texto: payload.texto || payload.message,
      campanyaReferencia: payload.campanyaReferencia || process.env.BITMESSAGE_CAMPANYA,
    });
    
    // Replace + with %20 for spaces (BitMessage API requirement)
    const url = `${process.env.BITMESSAGE_INSTANT_SMS_API}?${params.toString().replace(/\+/g, '%20')}`;

    logger.info(
      {
        fullUrl: url,
        params: {
          telefono: params.get('telefono'),
          texto: params.get('texto'),
          campanyaReferencia: params.get('campanyaReferencia'),
        },
      },
      "Calling BitMessage Instant SMS API with details",
    );

    const response = await axios.get(url, {
      auth: {
        username: process.env.BITMESSAGE_USERNAME,
        password: process.env.BITMESSAGE_PASSWORD,
      },
    });

    logger.info(
      {
        status: response.status,
        data: response.data,
      },
      "BitMessage Instant SMS API responded",
    );

    // Check response for success (adjust based on actual API response)
    if (response.status === 200) {
      logger.info(
        { response: response.data },
        "Instant SMS sent successfully",
      );
      return { success: true, data: response.data };
    } else {
      logger.warn(
        { status: response.status, response: response.data },
        "Unknown BitMessage Instant SMS status",
      );
      return { success: false, data: response.data };
    }
  } catch (error) {
    logger.error(
      { err: error, response: error.response?.data },
      "BitMessage Instant SMS API call failed",
    );
    return { success: false, error };
  }
}

/*
 * POST Handler for /execute/ route of Activity.
 */
export async function execute(req, res) {
  logger.info(
    { endpoint: "/instant-sms/execute" },
    "Instant SMS Execute endpoint called",
  );

  try {
    JWT(req.body, process.env.jwtSecret, async (err, decoded) => {
      logger.debug({ jwt: req.body.toString("utf8") }, "JWT received");

      // verification error -> unauthorized request
      if (err) {
        logger.error({ err }, "JWT verification failed");
        return res.status(401).end();
      }

      if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
        const decodedArgs = decoded.inArguments[0];
        logger.info({ args: decodedArgs }, "Decoded inArguments");

        // Prepare BitMessage payload
        const smsPayload = {
          telefono: decodedArgs.telefono || decodedArgs.phone,
          texto: decodedArgs.texto || decodedArgs.message,
          campanyaReferencia: process.env.BITMESSAGE_CAMPANYA || "SOIB",
        };

        // Send SMS via BitMessage API
        const result = await sendBitMessageSMS(smsPayload);

        if (result.success) {
          logger.info({ branchResult: "sent" }, "Returning success branch");
          return res.status(200).json({ branchResult: "sent" });
        } else {
          logger.warn({ branchResult: "notsent" }, "Returning failure branch");
          return res.status(200).json({ branchResult: "notsent" });
        }
      } else {
        logger.warn("Invalid inArguments");
        return res.status(200).json({ branchResult: "notsent" });
      }
    });
  } catch (err) {
    logger.error({ err }, "Execute endpoint error");
    return res.status(200).json({ branchResult: "notsent" });
  }
}

/*
 * POST Handler for /publish/ route of Activity.
 */
export async function publish(req, res) {
  logger.info(
    { endpoint: "/instant-sms/publish", body: req.body },
    "Instant SMS Publish event received",
  );
  res.send(200, "Publish");
}

/*
 * POST Handler for /validate/ route of Activity.
 */
export async function validate(req, res) {
  logger.info(
    { endpoint: "/instant-sms/validate", body: req.body },
    "Instant SMS Validate event received",
  );
  res.send(200, "Validate");
}

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
export async function edit(req, res) {
  logger.info(
    { endpoint: "/instant-sms/edit", body: req.body },
    "Instant SMS Edit event received",
  );
  res.send(200, "Edit");
}

/*
 * POST Handler for /save/ route of Activity.
 */
export async function save(req, res) {
  logger.info(
    { endpoint: "/instant-sms/save", body: req.body },
    "Instant SMS Save event received",
  );
  res.send(200, "Save");
}

/*
 * POST Handler for /stop/ route of Activity.
 */
export async function stop(req, res) {
  logger.info(
    { endpoint: "/instant-sms/stop", body: req.body },
    "Instant SMS Stop event received",
  );
  res.send(200, "Stop");
}
