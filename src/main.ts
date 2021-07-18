import * as dotenv from 'dotenv';
import {FastifyInstance} from 'fastify';

dotenv.config();

import {createApp} from './app';
import {initHttp} from './utils/init/http';
import {isProduction} from './utils/misc';

// Start New Relic APM
if (isProduction()) {
  require('newrelic');
}

(async () => {
  const app: FastifyInstance = (await createApp({
    mongoUri: process.env.MONGO_URL || '',
    logger: isProduction() ?
      true :
      {
        prettyPrint: {
          translateTime: true,
        },
      },
  })).app;

  await initHttp(app);
})().catch((e) => {
  console.error(`Application Error: ${e.message}`);
});
