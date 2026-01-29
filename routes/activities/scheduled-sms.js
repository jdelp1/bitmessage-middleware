// Deps
import axios from "axios";
import JWT from "../../lib/jwtDecoder.js";
import logger from "../../utils/logger.js";

/**
 * Sends Scheduled SMS via BitMessage API
 * @param {Object} payload - SMS payload with scheduling parameters
 * @returns {Promise<{success: boolean, data: Object}>}
 */
async function sendScheduledSMS(payload) {
  try {
    logger.info({ payload }, "Calling BitMessage Scheduled SMS API");

    // TODO: Actualizar con la URL correcta de la API de SMS programados
    const response = await axios.post(
      process.env.BITMESSAGE_SCHEDULED_SMS_API,
      payload,
      {
        auth: {
          username: process.env.BITMESSAGE_USERNAME,
          password: process.env.BITMESSAGE_PASSWORD,
        },
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    logger.info(
      {
        status: response.status,
        estado: response.data?.estado,
        id: response.data?.id,
      },
      "BitMessage Scheduled SMS API responded",
    );

    // TODO: Ajustar lógica de éxito según respuesta real de la API
    const estado = response.data?.estado?.toUpperCase();

    if (estado === "PROGRAMADO" || estado === "ENVIADO") {
      logger.info(
        { smsId: response.data?.id },
        "Scheduled SMS created successfully",
      );
      return { success: true, data: response.data };
    } else {
      logger.warn(
        { estado, response: response.data },
        "Unknown BitMessage Scheduled SMS status",
      );
      return { success: false, data: response.data };
    }
  } catch (error) {
    logger.error(
      { err: error, response: error.response?.data },
      "BitMessage Scheduled SMS API call failed",
    );
    return { success: false, error };
  }
}

/*
 * POST Handler for /execute/ route of Activity.
 */
export async function execute(req, res) {
  logger.info(
    { endpoint: "/scheduled-sms/execute" },
    "Scheduled SMS Execute endpoint called",
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

        // TODO: Preparar payload según estructura de API de SMS programados
        const smsPayload = {
          telefono: decodedArgs.telefono || decodedArgs.phone,
          texto: decodedArgs.texto || decodedArgs.message,
          fechaEnvio: decodedArgs.fechaEnvio || decodedArgs.scheduledDate,
          campanyaReferencia: process.env.BITMESSAGE_CAMPANYA || "SOIB",
        };

        // Send Scheduled SMS via BitMessage API
        const result = await sendScheduledSMS(smsPayload);

        if (result.success) {
          logger.info(
            { branchResult: "scheduled" },
            "Returning success branch",
          );
          return res.status(200).json({ branchResult: "scheduled" });
        } else {
          logger.warn({ branchResult: "failed" }, "Returning failure branch");
          return res.status(200).json({ branchResult: "failed" });
        }
      } else {
        logger.warn("Invalid inArguments");
        return res.status(200).json({ branchResult: "failed" });
      }
    });
  } catch (err) {
    logger.error({ err }, "Execute endpoint error");
    return res.status(200).json({ branchResult: "failed" });
  }
}

/*
 * POST Handler for /publish/ route of Activity.
 */
export async function publish(req, res) {
  logger.info(
    { endpoint: "/scheduled-sms/publish", body: req.body },
    "Scheduled SMS Publish event received",
  );
  res.send(200, "Publish");
}

/*
 * POST Handler for /validate/ route of Activity.
 */
export async function validate(req, res) {
  logger.info(
    { endpoint: "/scheduled-sms/validate", body: req.body },
    "Scheduled SMS Validate event received",
  );
  res.send(200, "Validate");
}

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
export async function edit(req, res) {
  logger.info(
    { endpoint: "/scheduled-sms/edit", body: req.body },
    "Scheduled SMS Edit event received",
  );
  res.send(200, "Edit");
}

/*
 * POST Handler for /save/ route of Activity.
 */
export async function save(req, res) {
  logger.info(
    { endpoint: "/scheduled-sms/save", body: req.body },
    "Scheduled SMS Save event received",
  );
  res.send(200, "Save");
}

/*
 * POST Handler for /stop/ route of Activity.
 */
export async function stop(req, res) {
  logger.info(
    { endpoint: "/scheduled-sms/stop", body: req.body },
    "Scheduled SMS Stop event received",
  );
  res.send(200, "Stop");
}
