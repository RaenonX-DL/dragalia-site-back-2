import fastify, {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import fastifyCors from 'fastify-cors';
import fastifyHelmet from 'fastify-helmet';
import {MongoClient, MongoClientOptions} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server-core';

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
  mongoServer?: MongoMemoryServer;

  /**
   * Construct the application.
   *
   * @param {FastifyInstance} app fastify app instance
   * @param {MongoClient} mongoClient mongo client
   * @param {MongoMemoryServer} mongoServer mongo in-memory server
   */
  constructor(app: FastifyInstance, mongoClient: MongoClient, mongoServer?: MongoMemoryServer) {
    this.app = app;
    this.mongoClient = mongoClient;
    this.mongoServer = mongoServer;
  }

  /**
   * Method to be called right before closing/stopping the application.
   *
   * @return {Promise<void>}
   */
  async close(): Promise<void> {
    try {
      await this.mongoClient.close();
      await this.mongoServer?.stop();
    } catch (e) {
      console.error(`Error on application close: ${e.message}`);
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
    } catch (e) {
      console.error(`Error on application reset: ${e.message}`);
    }
  }
}

export const createApp = async (mongoUri?: string): Promise<Application> => {
  const app: FastifyInstance = fastify();

  // --- Initialize mongo connection & server
  let mongoClient: MongoClient;
  let server: MongoMemoryServer | undefined = undefined;
  const options: MongoClientOptions = {
    appName: 'dragalia-site-back-2',
  };
  if (!mongoUri) {
    server = new MongoMemoryServer();
    mongoClient = await MongoClient.connect(await server.getUri(), options);
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
