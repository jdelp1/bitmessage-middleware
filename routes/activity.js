"use strict";

const JWT = require("../utils/jwtDecoder");
const logger = require("../utils/logger");

async function routes(fastify) {
  fastify.post("/mc/activity/execute", async (request, reply) => {
    try {
      // Check if request body is JWT encoded (from Journey Builder)
      let args;
      logger.info({ body: request.body }, "Request body received");

      if (request?.body?.toString && request.body.toString().includes(".")) {
        // JWT encoded data from Journey Builder
        const data = JWT(request?.body);
        fastify.log.info({ data }, "JWT decoded data");
        args = data?.inArguments?.[0] || {};
      } else {
        // Regular JSON from frontend
        args = request?.body?.inArguments?.[0] || {};
      }

      const { telefono, texto } = args;
      logger.info({ args }, "Argumentos dentro de inArguments");

      if (!texto) {
        return reply.code(400).send({ error: "texto requerido" });
      }

      // Log the received message
      logger.info({ telefono, texto }, "Mensaje recibido");

      // Here you would call your actual service if needed
      // For now, just return success
      return reply
        .code(200)
        .send({ success: true, message: "Mensaje procesado correctamente" });
    } catch (e) {
      fastify.log.error(e);
      return reply.code(500).send({ error: "Error ejecutando actividad" });
    }
  });

  // Endpoints obligatorios del lifecycle
  fastify.post("/mc/activity/save", async (request, reply) => {
    logger.info({ body: request.body }, "Save endpoint called");
    return {};
  });
  fastify.post("/mc/activity/validate", async () => ({}));
  fastify.post("/mc/activity/publish", async () => ({}));
  fastify.post("/mc/activity/stop", async () => ({}));
}

module.exports = routes;
