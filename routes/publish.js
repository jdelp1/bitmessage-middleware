"use strict";

async function pusblish(fastify, opts) {
  fastify.post("/mc/activity/publish", async (req, reply) => reply.send({}));
}

module.exports = pusblish;
