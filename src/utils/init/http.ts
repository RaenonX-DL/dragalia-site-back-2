import env from 'env-var';
import {FastifyInstance} from 'fastify';


export const initHttp = async (app: FastifyInstance): Promise<void> => {
  await app.listen(
    env.get('PORT').default(8787).asIntPositive(),
    'localhost',
  );
  console.log('App started listening.', app.server.address());
};
