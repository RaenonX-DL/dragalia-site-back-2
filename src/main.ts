import * as dotenv from 'dotenv';
import {FastifyInstance} from 'fastify';

import {createApp} from './app';

dotenv.config();

const PORT = Number(process.env.PORT) || 8787;

(async () => {
  const app: FastifyInstance = (await createApp(process.env.MONGO_URL || '')).app;
  await app.listen(PORT, process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost');
})().catch((e) => {
  console.error(`Application Error: ${e.message}`);
});
