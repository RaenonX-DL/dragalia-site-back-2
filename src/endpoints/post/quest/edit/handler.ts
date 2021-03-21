import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';
import {QuestPostEditPayload} from '../../../../api-def/api/post/quest/payload';
import {ApiResponseCode} from '../../../../api-def/api/responseCode';
import {ApiResponse} from '../../../../base/response';
import {GoogleUserController} from '../../../userControl/controller';
import {processPostEditPayload} from '../../base/payload';
import {ApiFailedResponse} from '../../base/response/failed';
import {QuestPostController} from '../controller';
import {QuestPostEditSuccessResponse} from './response';

export const handleEditQuestPost = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processPostEditPayload(req.query as unknown as QuestPostEditPayload);

  if (!payload.seqId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED, 400);
  }

  // Check user privilege
  const isAdmin = await GoogleUserController.isAdmin(mongoClient, payload.googleUid);
  if (!isAdmin) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION, 401);
  }

  // Edit post
  const postGetResult = await QuestPostController.editQuestPost(mongoClient, payload);
  if (postGetResult === 'NOT_FOUND') {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_EXISTS, 404);
  }

  return new QuestPostEditSuccessResponse(payload.seqId);
};
