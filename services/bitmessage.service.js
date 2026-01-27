"use strict";

const { env } = require("../config/env.js");
const logger = require('../utils/logger.js')
const path = require("node:path");
const fs = require("node:fs");

/**
 * Construye el buffer del archivo de envío de SMS
 * @param {string} telefono
 * @param {string} texto
 * @returns {Buffer}
 */
function buildSmsFile(telefono, texto) {
  const line = `${telefono}|${texto}\n`;
  console.log(line);
  return Buffer.from(line, "utf-8");
}

/**
 * Envía un SMS mediante BITMessage
 * @param {string} telefono
 * @param {string} texto
 * @returns {Promise<any>}
 */
async function sendSms(telefono, texto) {
  try {
    const fileBuffer = buildSmsFile(telefono, texto);
    console.log("Buffer construido:", fileBuffer.toString());

    // Carpeta tmp dentro del proyecto
    const tmpDir = path.join(__dirname, "../tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir); // Crea la carpeta si no existe
    }

    // Guardamos localmente para verificar
    const filePath = path.join(__dirname, `../tmp/sms_${Date.now()}.txt`);
    fs.writeFileSync(filePath, fileBuffer);
    console.log("Archivo creado correctamente");
    logger.info({ filePath }, "Archivo SMS generado localmente (modo test)");

    // Simulamos respuesta de la API
    const mockResponse = {
      status: "ok",
      message: `SMS a ${telefono} preparado (mock)`,
      file: filePath,
    };

    return mockResponse;

    // FormData nativo de Node 24
    // const form = new FormData();
    // form.append("file", fileBuffer, {
    //   filename: `sms_${Date.now()}.txt`,
    //   contentType: "text/plain",
    // });

    // const url = `${env.BITMESSAGE_BASE_URL}/envios/sendfile?campanya=${env.BITMESSAGE_CAMPAIGN}`;

    // logger.info({ telefono }, "Enviando SMS a BITMessage");

    // const auth = Buffer.from(
    //   `${env.BITMESSAGE_USER}:${env.BITMESSAGE_PASSWORD}`,
    // ).toString("base64");

    // const res = await fetch(url, {
    //   method: "POST",
    //   headers: {
    //     Authorization: `Basic ${auth}`,
    //     ...form.getHeaders?.(), // form-data de npm si fuera necesario, nativo Node24 ignora
    //   },
    //   body: form,
    // });

    // if (!res.ok) {
    //   const text = await res.text();
    //   throw new Error(`Error al enviar SMS: ${res.status} - ${text}`);
    // }

    // const data = await res.json();
    // return data;
  } catch (err) {
    // Log completo, sin acceder a propiedades que no existen
    // Esto imprime TODO el error de forma segura
    // logger.error({ err }, "Error enviando SMS");

    // Para que la respuesta HTTP devuelva info útil:
    throw err; // lanzamos el error para que la ruta devuelva 500
  }
}

module.exports = { sendSms };
