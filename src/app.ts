import {Server} from 'http';
import {AddressInfo} from 'net';

import {default as compression} from 'compression';
import express, {Application, NextFunction, Request, Response} from 'express';
import {default as helmet} from 'helmet';

import {handleResponse, handlerLookup} from './endpoints/lookup';
import {handleNotExists} from './statuses/notExists/handler';
import {handleInternalError} from './statuses/internalError/handler';

export const runServer = (port = 0): Server => {
  const app: Application = express();

  // https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/deployment
  app.use(compression());
  app.use(helmet());

  // Add routes to the app
  Object.entries(handlerLookup).forEach(([endpoint, responseFunction]) => {
    app.get(endpoint, ((req: Request, res: Response) => {
      handleResponse(req, res, responseFunction);
    }));
  });

  // Handle non-existing routes
  app.use((req: Request, res: Response, _: NextFunction) => {
    handleResponse(req, res, handleNotExists);
  });

  app.use((error: Error, req: Request, res: Response, _: NextFunction) => {
    handleResponse(req, res, handleInternalError(error));
  });

  const server: Server = app.listen(port, () => {
    const actualPort: number = (server.address() as AddressInfo).port;
    console.log(`App is listening on port ${actualPort} (Given ${port})`);
  });

  return server;
};
