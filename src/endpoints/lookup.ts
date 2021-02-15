import {NextFunction, Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {ApiEndPoints} from '../api-def/api';
import {ApiResponse} from '../base/response';
import {handleMethodNotAllowed} from '../statuses/methodNotAllowed/handler';
import {handlePublishQuestPost} from './post/quest/publish/handler';
import {handleRoot} from './root/handler';
import {handleEmitError} from './test/handler';
import {handleUserLogin} from './userControl/login/handler';

type Methods = 'GET' | 'POST';

type HandlerFunction = (req: Request, res: Response, mongoClient: MongoClient) => Promise<ApiResponse>;

type EndpointHandlers = {
  GET?: HandlerFunction,
  POST?: HandlerFunction,
}

export const handlerLookup: {[endpoint: string]: EndpointHandlers} = {
  [ApiEndPoints.ROOT]: {GET: handleRoot},
  [ApiEndPoints.ERROR_TEST]: {GET: handleEmitError},
  [ApiEndPoints.USER_LOGIN]: {POST: handleUserLogin},
  [ApiEndPoints.POST_QUEST_PUBLISH]: {POST: handlePublishQuestPost},
};

export const handleResponse = async (
  req: Request, res: Response, mongoClient: MongoClient,
  handler: HandlerFunction, nextFunction?: NextFunction,
): Promise<void> => {
  const method: Methods = req.method.toUpperCase() as Methods;

  console.info(`${method} ${req.path}`);

  try {
    const response = await handler(req, res, mongoClient);
    res.status(response.httpCode).json(response.toJson());
  } catch (err) {
    console.error(`${method} ${req.path} - ERROR: ${err.message}`);
    console.error(err);
    if (nextFunction) {
      nextFunction(err);
    }
  }
};

export const handleEndpoint = async (
  req: Request, res: Response, mongoClient: MongoClient,
  handlers: EndpointHandlers, nextFunction?: NextFunction,
): Promise<void> => {
  const method: Methods = req.method.toUpperCase() as Methods;

  if (!handlers[method]) {
    await handleResponse(req, res, mongoClient, handleMethodNotAllowed(Object.keys(handlers)), nextFunction);
    return;
  }

  await handleResponse(req, res, mongoClient, handlers[method] as HandlerFunction, nextFunction);
};
