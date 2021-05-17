import {FastifyInstance} from 'fastify';

export const initHttp = async (app: FastifyInstance): Promise<void> => {
  await app.listen(
    process.env.PORT || 8787,
    process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
  );
  console.log('App started listening.');
  console.log('Address ', app.server.address());
  console.log('Port ', app.server.address());
};
