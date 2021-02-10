import mongoose from 'mongoose';
import MongoMemoryServer from 'mongodb-memory-server-core';

// https://dev.to/paulasantamaria/testing-node-js-mongoose-with-an-in-memory-database-32np

export const createServer = async (): Promise<MongoMemoryServer> => {
  const mongod = new MongoMemoryServer();
  const uri = await mongod.getUri();

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return mongod;
};

export const destroyServer = async (server: MongoMemoryServer): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await server.stop();
};

export const clearServer = async (): Promise<void> => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
};
