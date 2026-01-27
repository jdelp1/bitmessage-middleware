const pino = require("pino");

// Configuración básica de logger
const logger = pino({
  level: "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss",
    },
  },
});

module.exports = logger;
