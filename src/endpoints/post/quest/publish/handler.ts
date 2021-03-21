import {Request, Response} from 'express';
import {MongoClient, MongoError} from 'mongodb';
import {ApiResponseCode, QuestPostPublishPayload} from '../../../../api-def/api';
import {ApiResponse} from '../../../../base/response';
import {GoogleUserController} from '../../../userControl/controller';
import {processQuestPostPublishPayload} from '../../base/payload';
import {ApiFailedResponse} from '../../base/response/failed';
import {SeqIdSkippingError} from '../../error';
import {QuestPostController} from '../controller';
import {QuestPostPublishSuccessResponse} from './response';

export const handlePublishQuestPost = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processQuestPostPublishPayload(req.query as unknown as QuestPostPublishPayload);

  // Check if the user has the admin privilege
  if (!await GoogleUserController.isAdmin(mongoClient, payload.googleUid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  // Publish the post to the database
  let newSeqId;
  try {
    newSeqId = await QuestPostController.publishPost(mongoClient, payload);
  } catch (e) {
    // https://stackoverflow.com/a/1433608/11571888
    if (e instanceof SeqIdSkippingError) {
      return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_PUBLISHED_ID_SKIPPED);
    } else if (e instanceof MongoError && e.code === 11000) {
      // E11000 for duplicated key
      return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ALREADY_EXISTS);
    } else {
      throw e; // let others bubble up
    }
  }

  return new QuestPostPublishSuccessResponse(newSeqId);
};
