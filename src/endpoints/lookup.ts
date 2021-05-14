import {NextFunction, Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {ApiEndPoints, RequestPayloadBase} from '../api-def/api';
import {ApiResponse} from '../base/response';
import {handleMethodNotAllowed} from '../statuses/methodNotAllowed/handler';
import {handleEditCharacterAnalysis} from './post/analysis/character/edit/handler';
import {handlePublishCharacterAnalysis} from './post/analysis/character/publish/handler';
import {handleEditDragonAnalysis} from './post/analysis/dragon/edit/handler';
import {handlePublishDragonAnalysis} from './post/analysis/dragon/publish/handler';
import {handleGetAnalysis} from './post/analysis/shared/get/handler';
import {handleAnalysisIdCheck} from './post/analysis/shared/idCheck/handler';
import {handleListAnalysis} from './post/analysis/shared/list/handler';
import {handleEditQuestPost} from './post/quest/edit/handler';
import {handleGetQuestPost} from './post/quest/get/handler';
import {handleQuestPostIdCheck} from './post/quest/idCheck/handler';
import {handleListQuestPost} from './post/quest/list/handler';
import {handlePublishQuestPost} from './post/quest/publish/handler';
import {handleRoot} from './root/handler';
import {handleEmitError} from './test/handler';
import {handleUserIsAdmin} from './userControl/isAdmin/handler';
import {handleUserLogin} from './userControl/login/handler';
import {handleUserShowAds} from './userControl/showAds/handler';

type HttpMethods = 'GET' | 'POST' | 'HEAD';

export type HandlerParams<T extends RequestPayloadBase = never> = {
  payload: T,
  mongoClient: MongoClient,
  request: Request,
  response: Response,
}

type HandlerFunction<T extends RequestPayloadBase> = (params: HandlerParams<T>) => Promise<ApiResponse>;

type EndpointHandlers<T extends RequestPayloadBase = never> = {
  GET?: HandlerFunction<T>,
  POST?: HandlerFunction<T>,
}

export const handlerLookup: {[endpoint: string]: EndpointHandlers} = {
  [ApiEndPoints.ROOT]: {GET: handleRoot},
  [ApiEndPoints.ERROR_TEST]: {GET: handleEmitError},
  [ApiEndPoints.USER_LOGIN]: {POST: handleUserLogin},
  [ApiEndPoints.USER_IS_ADMIN]: {GET: handleUserIsAdmin},
  [ApiEndPoints.USER_SHOW_ADS]: {GET: handleUserShowAds},
  [ApiEndPoints.POST_QUEST_PUBLISH]: {POST: handlePublishQuestPost},
  [ApiEndPoints.POST_QUEST_LIST]: {GET: handleListQuestPost},
  [ApiEndPoints.POST_QUEST_GET]: {GET: handleGetQuestPost},
  [ApiEndPoints.POST_QUEST_EDIT]: {POST: handleEditQuestPost},
  [ApiEndPoints.POST_QUEST_ID_CHECK]: {GET: handleQuestPostIdCheck},
  [ApiEndPoints.POST_ANALYSIS_PUBLISH_CHARA]: {POST: handlePublishCharacterAnalysis},
  [ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON]: {POST: handlePublishDragonAnalysis},
  [ApiEndPoints.POST_ANALYSIS_LIST]: {GET: handleListAnalysis},
  [ApiEndPoints.POST_ANALYSIS_GET]: {GET: handleGetAnalysis},
  [ApiEndPoints.POST_ANALYSIS_EDIT_CHARA]: {POST: handleEditCharacterAnalysis},
  [ApiEndPoints.POST_ANALYSIS_EDIT_DRAGON]: {POST: handleEditDragonAnalysis},
  [ApiEndPoints.POST_ANALYSIS_ID_CHECK]: {GET: handleAnalysisIdCheck},
};

export const handleResponse = async <T extends RequestPayloadBase>(
  req: Request, res: Response, mongoClient: MongoClient,
  handler: HandlerFunction<T>, nextFunction?: NextFunction,
): Promise<void> => {
  const method: HttpMethods = req.method.toUpperCase() as HttpMethods;

  console.info(`${method} ${req.path}`);

  try {
    let payload;

    if (method === 'GET' || method === 'HEAD') {
      payload = req.query;
    } else if (method === 'POST') {
      payload = req.body;
    } else {
      console.warn(`Payload unhandled for method ${method}`);
      payload = {};
    }

    const response = await handler({request: req, response: res, payload, mongoClient});

    res.status(response.httpCode).json(response.toJson());
  } catch (err) {
    console.error(`${method} ${req.path} - ERROR: ${err.message}`);
    console.error(err);
    if (nextFunction) {
      nextFunction(err);
    }
  }
};

export const handleEndpoint = async <T extends RequestPayloadBase>(
  req: Request, res: Response, mongoClient: MongoClient,
  handlers: EndpointHandlers<T>, nextFunction?: NextFunction,
): Promise<void> => {
  let method: HttpMethods = req.method.toUpperCase() as HttpMethods;

  if (method === 'HEAD') {
    method = 'GET';
  }

  if (!handlers[method]) {
    await handleResponse(req, res, mongoClient, handleMethodNotAllowed(Object.keys(handlers)), nextFunction);
    return;
  }

  await handleResponse(req, res, mongoClient, handlers[method] as HandlerFunction<T>, nextFunction);
};
