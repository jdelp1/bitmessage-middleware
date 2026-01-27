"use strict";

async function validate(fastify, opts) {
  fastify.post("/mc/activity/validate", async (req, reply) => reply.send({}));
}

module.exports = validate;
