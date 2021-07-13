import {FastifyReply, FastifyRequest} from 'fastify';
import {MongoClient} from 'mongodb';

import {ApiEndPoints, RequestPayloadBase} from '../api-def/api';
import {ApiResponse} from '../base/response';
import {handleMethodNotAllowed} from '../statuses/methodNotAllowed/handler';
import {handleDataUnitNameRef} from './data/unitNameRef/handler';
import {handleUnitInfoLookupLanding} from './info/lookup/landing/handler';
import {handleUnitInfoLookup} from './info/lookup/main/handler';
import {handleGeneralMeta} from './meta/general/handler';
import {handlePostMeta} from './meta/post/handler';
import {handleUnitMeta} from './meta/unit/handler';
import {handleEditCharacterAnalysis} from './post/analysis/character/edit/handler';
import {handlePublishCharacterAnalysis} from './post/analysis/character/publish/handler';
import {handleEditDragonAnalysis} from './post/analysis/dragon/edit/handler';
import {handlePublishDragonAnalysis} from './post/analysis/dragon/publish/handler';
import {handleGetAnalysis} from './post/analysis/shared/get/handler';
import {handleAnalysisIdCheck} from './post/analysis/shared/idCheck/handler';
import {handleEditQuestPost} from './post/quest/edit/handler';
import {handleGetQuestPost} from './post/quest/get/handler';
import {handleQuestPostIdCheck} from './post/quest/idCheck/handler';
import {handleListQuestPost} from './post/quest/list/handler';
import {handlePublishQuestPost} from './post/quest/publish/handler';
import {handleGetAtkSkillPreset} from './preset/atkSkill/get/handler';
import {handleSetAtkSkillPreset} from './preset/atkSkill/set/handler';
import {handleRoot} from './root/handler';
import {handleEmitError} from './test/handler';


type HttpMethods = 'GET' | 'POST' | 'HEAD';

export type HandlerParams<T extends RequestPayloadBase = never> = {
  payload: T,
  mongoClient: MongoClient,
  request: FastifyRequest,
  response: FastifyReply,
}

type HandlerFunction<T extends RequestPayloadBase> = (
  params: HandlerParams<T>,
) => Promise<ApiResponse>;

type EndpointHandlers<P extends RequestPayloadBase = never> = {
  GET?: HandlerFunction<P>,
  POST?: HandlerFunction<P>,
}

export const handlerLookup: {[endpoint: string]: EndpointHandlers} = {
  [ApiEndPoints.ROOT]: {GET: handleRoot},
  [ApiEndPoints.ERROR_TEST]: {GET: handleEmitError},
  [ApiEndPoints.PAGE_META_GENERAL]: {GET: handleGeneralMeta},
  [ApiEndPoints.PAGE_META_POST]: {GET: handlePostMeta},
  [ApiEndPoints.PAGE_META_UNIT]: {GET: handleUnitMeta},
  [ApiEndPoints.POST_QUEST_PUBLISH]: {POST: handlePublishQuestPost},
  [ApiEndPoints.POST_QUEST_LIST]: {GET: handleListQuestPost},
  [ApiEndPoints.POST_QUEST_GET]: {GET: handleGetQuestPost},
  [ApiEndPoints.POST_QUEST_EDIT]: {POST: handleEditQuestPost},
  [ApiEndPoints.POST_QUEST_ID_CHECK]: {GET: handleQuestPostIdCheck},
  [ApiEndPoints.POST_ANALYSIS_PUBLISH_CHARA]: {POST: handlePublishCharacterAnalysis},
  [ApiEndPoints.POST_ANALYSIS_PUBLISH_DRAGON]: {POST: handlePublishDragonAnalysis},
  [ApiEndPoints.INFO_UNIT_LOOKUP]: {GET: handleUnitInfoLookup},
  [ApiEndPoints.INFO_UNIT_LOOKUP_LANDING]: {GET: handleUnitInfoLookupLanding},
  [ApiEndPoints.POST_ANALYSIS_GET]: {GET: handleGetAnalysis},
  [ApiEndPoints.POST_ANALYSIS_EDIT_CHARA]: {POST: handleEditCharacterAnalysis},
  [ApiEndPoints.POST_ANALYSIS_EDIT_DRAGON]: {POST: handleEditDragonAnalysis},
  [ApiEndPoints.POST_ANALYSIS_ID_CHECK]: {GET: handleAnalysisIdCheck},
  [ApiEndPoints.DATA_UNIT_NAME_REF]: {GET: handleDataUnitNameRef},
  [ApiEndPoints.PRESET_ATK_SKILL_INPUT]: {GET: handleGetAtkSkillPreset, POST: handleSetAtkSkillPreset},
};

export const handleResponse = async <T extends RequestPayloadBase>(
  req: FastifyRequest,
  res: FastifyReply,
  mongoClient: MongoClient,
  handler: HandlerFunction<T>,
): Promise<void> => {
  const method: HttpMethods = req.method.toUpperCase() as HttpMethods;

  console.info(`${method} ${req.url}`);

  try {
    let payload: T;

    if (method === 'GET' || method === 'HEAD') {
      payload = req.query as T;
    } else if (method === 'POST') {
      payload = req.body as T;
    } else {
      console.warn(`Payload unhandled for method ${method}`);
      payload = {} as T;
    }

    const response = await handler({request: req, response: res, payload, mongoClient});

    res.status(response.httpCode).send(response.toJson());
  } catch (err) {
    console.error(`${method} ${req.url} - ERROR: ${err.message}`);
    console.error(err);
    throw err;
  }
};

export const handleEndpoint = async <T extends RequestPayloadBase>(
  req: FastifyRequest,
  res: FastifyReply,
  mongoClient: MongoClient,
  handlers: EndpointHandlers<T>,
): Promise<void> => {
  let method: HttpMethods = req.method.toUpperCase() as HttpMethods;

  if (method === 'HEAD') {
    method = 'GET';
  }

  if (!handlers[method]) {
    await handleResponse(req, res, mongoClient, handleMethodNotAllowed(Object.keys(handlers)));
    return;
  }

  await handleResponse(req, res, mongoClient, handlers[method] as HandlerFunction<T>);
};
