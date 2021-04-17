import {Request, Response} from 'express';
import {MongoClient, MongoError} from 'mongodb';
import {ApiResponseCode, CharaAnalysisPublishPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {GoogleUserController} from '../../../../userControl/controller';
import {processCharaAnalysisPublishPayload} from '../../../base/payload';
import {ApiFailedResponse} from '../../../base/response/failed';
import {SeqIdSkippingError} from '../../../error';
import {AnalysisController} from '../../controller';
import {CharaAnalysisPublishedResponse} from './response';

export const handlePublishCharacterAnalysis = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processCharaAnalysisPublishPayload(req.query as unknown as CharaAnalysisPublishPayload);

  // Check if the user has the admin privilege
  if (!await GoogleUserController.isAdmin(mongoClient, payload.googleUid)) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_INSUFFICIENT_PERMISSION);
  }

  // Publish the post to the database
  let newSeqId;
  try {
    newSeqId = await AnalysisController.publishCharaAnalysis(mongoClient, payload);
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

  return new CharaAnalysisPublishedResponse(newSeqId);
};
