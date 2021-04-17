import {Server} from 'http';
import {AddressInfo} from 'net';

import {Application} from 'express';

import {createApp} from './app';

const PORT = Number(process.env.PORT) || 8787;

(async () => {
  const app: Application = (await createApp(process.env.MONGO_URL || '')).express;
  const server: Server = app.listen(PORT, () => {
    const actualPort: number = (server.address() as AddressInfo).port;
    console.log(`App is listening on port ${actualPort} (Given ${PORT})`);
  });
})().catch((e) => {
  console.error(`Application Error: ${e.message}`);
});
