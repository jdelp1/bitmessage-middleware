'use strict';

async function routes(fastify) {

  fastify.post('/mc/activity/execute', async (request, reply) => {
    try {
      const args = request.body?.inArguments?.[0] || {};
      const { telefono, texto } = args;

      if (!telefono || !texto) {
        return reply.code(400).send({ error: 'telefono y texto requeridos' });
      }

      // Aquí se llamaría a tu middleware real si fuese necesario
      // En este caso, Journey solo espera 200 OK
      fastify.log.info({ telefono, texto }, 'SMS recibido desde Journey');

      return reply.code(200).send({});
    } catch (e) {
      fastify.log.error(e);
      return reply.code(500).send({ error: 'Error ejecutando actividad' });
    }
  });

  // Endpoints obligatorios del lifecycle
  fastify.post('/mc/activity/save', async () => ({}));
  fastify.post('/mc/activity/validate', async () => ({}));
  fastify.post('/mc/activity/publish', async () => ({}));
  fastify.post('/mc/activity/stop', async () => ({}));
}

module.exports = routes;