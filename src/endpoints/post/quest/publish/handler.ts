import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';

import {ApiResponseCode, QuestPostPublishPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {GoogleUserController} from '../../../userControl/controller';
import {handlePublishPost} from '../../base/handler/publish';
import {ApiFailedResponse} from '../../base/response/failed';
import {processQuestPublishPayload} from '../../utils/payload';
import {QuestPostController} from '../controller';
import {QuestPostPublishSuccessResponse} from './response';

export const handlePublishQuestPost = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processQuestPublishPayload(req.query as unknown as QuestPostPublishPayload);

  // Check if the user has the admin privilege
  if (!await GoogleUserController.isAdmin(mongoClient, payload.googleUid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  return handlePublishPost(
    mongoClient,
    payload,
    QuestPostController.publishPost,
    (seqId) => new QuestPostPublishSuccessResponse(seqId),
  );
};
