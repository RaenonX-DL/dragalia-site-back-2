import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';
import {QuestPostGetPayload} from '../../../../api-def/api/post/quest/payload';
import {ApiResponseCode} from '../../../../api-def/api/responseCode';
import {ApiResponse} from '../../../../base/response';
import {GoogleUserController} from '../../../userControl/controller';
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

  // Get a post
  const postGetResult = await QuestPostController.getQuestPost(
    mongoClient, payload.seqId, payload.lang, true,
  );
  if (!postGetResult) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_EXISTS, 404);
  }

  // Get the data of the user who send this request
  const userData = await GoogleUserController.getUserData(mongoClient, payload.googleUid);

  return new QuestPostGetSuccessResponse(
    userData ? userData.isAdmin : false,
    userData ? !userData.isAdsFree : true,
    postGetResult.toResponseReady(),
  );
};
