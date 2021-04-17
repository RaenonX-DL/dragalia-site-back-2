import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {QuestPostGetPayload} from '../../../../api-def/api/post/quest/payload';
import {ApiResponseCode} from '../../../../api-def/api/responseCode';
import {ApiResponse} from '../../../../base/response';
import {handleGetPost} from '../../base/handler/get';
import {ApiFailedResponse} from '../../base/response/failed';
import {processQuestGetPayload} from '../../utils/payload';
import {QuestPostController} from '../controller';
import {QuestPostGetSuccessResponse} from './response';

export const handleGetQuestPost = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processQuestGetPayload(req.query as unknown as QuestPostGetPayload);

  if (!payload.seqId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED, 400);
  }

  return handleGetPost(
    mongoClient,
    payload,
    QuestPostController.getQuestPost,
    (userData, getResult) => {
      return new QuestPostGetSuccessResponse(
        userData ? userData.isAdmin : false,
        userData ? !userData.isAdsFree : true,
        getResult.toResponseReady(),
      );
    },
  );
};
