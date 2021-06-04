import * as dotenv from 'dotenv';
import {FastifyInstance} from 'fastify';

dotenv.config();

import {createApp} from './app';
import {isAppOnHeroku} from './utils/init/heroku';
import {initHerokuNginx} from './utils/init/herokuNginx';
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

  if (!isAppOnHeroku()) {
    await initHttp(app);
    return;
  }

  await initHerokuNginx(app);
})().catch((e) => {
  console.error(`Application Error: ${e.message}`);
});
