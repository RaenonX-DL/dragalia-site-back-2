import {FastifyInstance} from 'fastify';

import {isProduction} from '../misc';

export const initHttp = async (app: FastifyInstance): Promise<void> => {
  await app.listen(
    process.env.PORT || 8787,
    isProduction() ? '0.0.0.0' : 'localhost',
  );
  console.log('App started listening.', app.server.address());
};
