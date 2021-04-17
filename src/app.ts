import {default as compression} from 'compression';
import express, {Application as ExpressApp, NextFunction, Request, Response} from 'express';
import {default as helmet} from 'helmet';
import {MongoClient, MongoClientOptions} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server-core';

import {handleEndpoint, handleResponse, handlerLookup} from './endpoints/lookup';
import {handleInternalError} from './statuses/internalError/handler';
import {handleNotExists} from './statuses/notExists/handler';
import {clearServer} from './utils/mongodb';

/**
 * A class holding the application related instances.
 */
export class Application {
  express: ExpressApp;
  mongoClient: MongoClient;
  mongoServer?: MongoMemoryServer;

  /**
   * Construct the application.
   *
   * @param {ExpressApp} express express app
   * @param {MongoClient} mongoClient mongo client
   * @param {MongoMemoryServer} mongoServer mongo in-memory server
   */
  constructor(express: ExpressApp, mongoClient: MongoClient, mongoServer?: MongoMemoryServer) {
    this.express = express;
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
  const app: ExpressApp = express();

  // Initialize mongo connection & server
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

  // https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/deployment
  app.use(compression());
  app.use(helmet());

  // Add routes to the app

  // RFC 2616 - 405 Method Not Allowed: https://tools.ietf.org/html/rfc2616#page-66
  Object.entries(handlerLookup).forEach(([endpoint, handlers]) => {
    app.all(endpoint, (req: Request, res: Response, next: NextFunction) => {
      handleEndpoint(req, res, mongoClient, handlers, next);
    });
  });

  // Handle erroneous behaviors
  app.use((req: Request, res: Response, _: NextFunction) => {
    handleResponse(req, res, mongoClient, handleNotExists);
  });

  app.use((error: Error, req: Request, res: Response, _: NextFunction) => {
    handleResponse(req, res, mongoClient, handleInternalError(error));
  });

  return new Application(app, mongoClient, server);
};
