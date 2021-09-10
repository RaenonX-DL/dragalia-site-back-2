import fastify, {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifyHelmet from 'fastify-helmet';
import {FastifyLoggerOptions} from 'fastify/types/logger';
import {MongoClient, MongoClientOptions} from 'mongodb';
import {MongoMemoryReplSet} from 'mongodb-memory-server';

import {handleEndpoint, handleResponse, handlerLookup} from './endpoints/lookup';
import {corsOptions} from './middleware/cors';
import {handleInternalError} from './statuses/internalError/handler';
import {handleNotExists} from './statuses/notExists/handler';
import {clearServer} from './utils/mongodb';


/**
 * A class holding the application related instances.
 */
export class Application {
  app: FastifyInstance;
  mongoClient: MongoClient;
  mongoReplSet?: MongoMemoryReplSet;

  /**
   * Construct the application.
   *
   * @param {FastifyInstance} app fastify app instance
   * @param {MongoClient} mongoClient mongo client
   * @param {MongoMemoryReplSet} mongoReplSet mongo in-memory replica set
   */
  constructor(app: FastifyInstance, mongoClient: MongoClient, mongoReplSet?: MongoMemoryReplSet) {
    this.app = app;
    this.mongoClient = mongoClient;
    this.mongoReplSet = mongoReplSet;
  }

  /**
   * Method to be called right before closing/stopping the application.
   *
   * @return {Promise<void>}
   */
  async close(): Promise<void> {
    try {
      await this.mongoClient.close();
      await this.mongoReplSet?.stop();
    } catch (err) {
      console.error(`Error on application close: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Reset the application related instances to its initial state.
   *
   * @return {Promise<void>}
   */
  async reset(): Promise<void> {
    try {
      await clearServer(this.mongoClient);
    } catch (err) {
      console.error(`Error on application reset: ${err instanceof Error ? err.message : err}`);
    }
  }
}

type AppCreateOptions = {
  mongoUri?: string,
  logger?: boolean | FastifyLoggerOptions,
}

export const createApp = async ({mongoUri, logger}: AppCreateOptions = {}): Promise<Application> => {
  const app: FastifyInstance = fastify({
    logger: logger || false,
    connectionTimeout: 20000, // 20 seconds
    trustProxy: true,
  });

  // --- Initialize mongo connection & server
  let mongoClient: MongoClient;
  let server: MongoMemoryReplSet | undefined = undefined;
  const options: MongoClientOptions = {
    appName: 'dragalia-site-back-2',
  };
  if (!mongoUri) {
    // Only wired tiger supports transaction
    server = await MongoMemoryReplSet.create({replSet: {count: 1, storageEngine: 'wiredTiger'}});
    mongoClient = await MongoClient.connect(server.getUri(), options);
  } else {
    mongoClient = await MongoClient.connect(mongoUri, options);
  }

  // --- Attach Middlewares
  app.register(fastifyHelmet);
  app.register(fastifyCors, corsOptions);

  // --- Add routes to the app
  // RFC 2616 - 405 Method Not Allowed: https://tools.ietf.org/html/rfc2616#page-66
  Object.entries(handlerLookup).forEach(([endpoint, handlers]) => {
    app.all(endpoint, async (req: FastifyRequest, res: FastifyReply) => {
      await handleEndpoint(req, res, mongoClient, handlers);
    });
  });

  // --- Handle erroneous behaviors
  // 404
  app.setNotFoundHandler(async (req: FastifyRequest, res: FastifyReply) => {
    await handleResponse(req, res, mongoClient, handleNotExists);
  });
  // 500
  app.setErrorHandler(async (error: Error, req: FastifyRequest, res: FastifyReply) => {
    await handleResponse(req, res, mongoClient, handleInternalError(error));
  });

  return new Application(app, mongoClient, server);
};
