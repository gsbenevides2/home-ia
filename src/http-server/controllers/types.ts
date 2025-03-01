import Fastify from "fastify";

export type Controllers = Fastify.FastifyPluginCallback<Fastify.FastifyPluginOptions, Fastify.RawServerDefault, Fastify.FastifyTypeProvider, Fastify.FastifyBaseLogger>;
