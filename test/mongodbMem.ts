import {MongoClient} from 'mongodb';
import MongoMemoryServer from 'mongodb-memory-server-core';

export type MongoObjects = {
  server: MongoMemoryServer,
  client: MongoClient,
}

export const createServer = async (): Promise<MongoObjects> => {
  const server = new MongoMemoryServer();
  const uri = await server.getUri();

  const client = await MongoClient.connect(uri, {
    appName: 'dragalia-site-back-2-test',
  });

  return {server, client};
};

export const destroyServer = async (mongoObjects: MongoObjects): Promise<void> => {
  await mongoObjects.client.close();
  await mongoObjects.server.stop();
};
