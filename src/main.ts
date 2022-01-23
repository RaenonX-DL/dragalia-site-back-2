import * as dotenv from 'dotenv';
import env from 'env-var';
import {FastifyInstance} from 'fastify';


dotenv.config();

import {isProduction} from './api-def/utils';
import {createApp} from './app';
import {initHttp} from './utils/init/http';

// Start New Relic APM
if (isProduction()) {
  require('newrelic');
}

(async () => {
  const app: FastifyInstance = (await createApp({
    mongoUri: env.get('MONGO_URL').default('').required(isProduction()).asString(),
    logger: isProduction() ?
      true :
      {prettyPrint: {translateTime: true}},
  })).app;

  await initHttp(app);
})().catch((e) => {
  console.error(`Application Error: ${e.message}`);
});
