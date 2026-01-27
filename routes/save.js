"use strict";

async function save(fastify, opts) {
  fastify.post("/mc/activity/save", async (req, reply) => reply.send({}));
}

module.exports = save;
