// Deps
import axios from "axios";
import JWT from "../lib/jwtDecoder.js";
import logger from "../utils/logger.js";

/*
 * POST Handler for /execute/ route of Activity.
 */
export async function execute(req, res) {
  // Prevent caching
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  logger.info({ endpoint: "/execute" }, "Execute endpoint called");

  try {
    // example on how to decode JWT
    JWT(req.body, process.env.jwtSecret, async (err, decoded) => {
      logger.debug({ jwt: req.body.toString("utf8") }, "JWT received");

      // verification error -> unauthorized request
      if (err) {
        logger.error({ err }, "JWT verification failed");
        return res.status(401).end();
      }

      if (decoded && decoded.inArguments && decoded.inArguments.length > 0) {
        // decoded in arguments
        const decodedArgs = decoded.inArguments[0];
        logger.info({ args: decodedArgs }, "Decoded inArguments");

        // Below is an example of calling a third party service, you can modify the URL of the requestBin in the environment variables
        if (process.env.requestBin) {
          logger.info({ url: process.env.requestBin }, "Calling third party service");
          const response = await axios.post(
            process.env.requestBin,
            decodedArgs,
            {
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
          logger.info({ status: response.status }, "Third party service responded");
        }

        // This is how you would return a branch result in a RESTDECISION activity type: see config.json file for potential outcomes
        logger.info({ branchResult: "sent" }, "Returning success branch");
        return res.status(200).json({ branchResult: "sent" });
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
  // Prevent caching
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  logger.info({ endpoint: "/publish", body: req.body }, "Publish event received");
  res.send(200, "Publish");
}

/*
 * POST Handler for /validate/ route of Activity.
 */
export async function validate(req, res) {
  // Prevent caching
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  logger.info({ endpoint: "/validate", body: req.body }, "Validate event received");
  res.send(200, "Validate");
}

/*
 * POST Handler for / route of Activity (this is the edit route).
 */
export async function edit(req, res) {
  // Prevent caching
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  logger.info({ endpoint: "/edit", body: req.body }, "Edit event received");
  res.send(200, "Edit");
}

/*
 * POST Handler for /save/ route of Activity.
 */
export async function save(req, res) {
  // Prevent caching
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  logger.info({ endpoint: "/save", body: req.body }, "Save event received");
  res.send(200, "Save");
}

/*
 * POST Handler for /stop/ route of Activity.
 */
export async function stop(req, res) {
  // Prevent caching
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  logger.info({ endpoint: "/stop", body: req.body }, "Stop event received");
  res.send(200, "Stop");
}
