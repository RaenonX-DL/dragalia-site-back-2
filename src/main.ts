import * as dotenv from 'dotenv';
import {FastifyInstance} from 'fastify';

import {createApp} from './app';
import {isAppOnHeroku} from './utils/init/heroku';
import {initHerokuNginx} from './utils/init/herokuNginx';
import {initHttp} from './utils/init/http';

dotenv.config();

(async () => {
  const app: FastifyInstance = (await createApp(process.env.MONGO_URL || '')).app;

  if (!isAppOnHeroku()) {
    await initHttp(app);
    return;
  }

  await initHerokuNginx(app);
})().catch((e) => {
  console.error(`Application Error: ${e.message}`);
});
