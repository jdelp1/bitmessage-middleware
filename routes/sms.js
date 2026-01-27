"use strict";

const { sendSms } = require("../services/bitmessage.service.js");

async function smsRoutes(fastify, opts) {
  fastify.post("/sms", async (request, reply) => {
    try {
      const { telefono, texto } = request.body;

      if (!telefono || !texto) {
        return reply
          .status(400)
          .send({ error: "Faltan datos: telefono y texto son obligatorios" });
      }

      const result = await sendSms(telefono, texto);
      return reply.send({ success: true, result });
    } catch (err) {
      // Evitamos TypeError accediendo a propiedades inexistentes
      return reply.status(500).send({
        error: "Error 1 enviando SMS",
        details: err?.message || JSON.stringify(err),
      });
    }
  });
}

module.exports = smsRoutes;
