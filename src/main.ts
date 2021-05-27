import * as dotenv from 'dotenv';
import {FastifyInstance} from 'fastify';

dotenv.config();

import {createApp} from './app';
import {isAppOnHeroku} from './utils/init/heroku';
import {initHerokuNginx} from './utils/init/herokuNginx';
import {initHttp} from './utils/init/http';

// Start New Relic APM
require('newrelic');

(async () => {
  const app: FastifyInstance = (await createApp({
    mongoUri: process.env.MONGO_URL || '',
    logger: process.env.NODE_ENV === 'production' ?
      true :
      {
        prettyPrint: {
          translateTime: true,
        },
      },
  })).app;

  if (!isAppOnHeroku()) {
    await initHttp(app);
    return;
  }

  await initHerokuNginx(app);
})().catch((e) => {
  console.error(`Application Error: ${e.message}`);
});
