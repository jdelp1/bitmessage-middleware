"use strict";

const { sendSms } = require("../services/bitmessage.service.js");
const fs = require("node:fs");
const path = require("node:path");

async function mcActivityRoutes(fastify, opts) {
  fastify.post("/mc/activity/execute2", async (request, reply) => {
    // decode data
    const data = JWT(request?.body);
    logger.info(data);

    try {
      // Marketing Cloud envía los argumentos dentro de inArguments
      const args = data?.inArguments?.[0] || {};
      logger.info({ args }, "Argumentos dentro de inArguments");
      const { telefono, texto } = args;

      if (!telefono || !texto) {
        return reply.status(400).send({
          error: "Faltan datos",
          details: "Se requiere telefono y texto en inArguments",
        });
      }

      // 🔹 Modo dev: solo generamos archivo local
      if (process.env.NODE_ENV === "development") {
        const filePath = path.join(
          __dirname,
          "../tmp",
          `sms_${Date.now()}.txt`,
        );
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, `${telefono}|${texto}\n`, "utf-8");
        console.log(`Archivo SMS generado localmente (modo dev): ${filePath}`);
        logger.info({ filePath }, "Archivo SMS generado localmente");
      } else {
        // 🔹 Modo prod: llamamos a BitMessage
        await sendSms(telefono, texto);
      }

      // Siempre devolvemos 200 OK para que Journey continúe
      return reply.status(200).send({});
    } catch (err) {
      console.error("Error ejecutando Custom Activity:", err);
      logger.info(err, "Error ejecutando Custom Activity:");
      return reply.status(500).send({
        error: "Error ejecutando Custom Activity",
        details: err.message || err.toString(),
      });
    }
  });
}

module.exports = mcActivityRoutes;
