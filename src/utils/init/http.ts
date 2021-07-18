import {FastifyInstance} from 'fastify';


export const initHttp = async (app: FastifyInstance): Promise<void> => {
  await app.listen(
    process.env.PORT || 8787,
    'localhost',
  );
  console.log('App started listening.', app.server.address());
};
