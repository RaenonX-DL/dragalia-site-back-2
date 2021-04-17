import {Request, Response} from 'express';
import {MongoClient} from 'mongodb';
import {AnalysisGetPayload, ApiResponseCode} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {GoogleUserController} from '../../../../userControl/controller';
import {ApiFailedResponse} from '../../../base/response/failed';
import {processGetAnalysisPayload} from '../../../utils/payload';
import {AnalysisController} from '../../controller';
import {AnalysisGetSuccessResponse} from './response';


export const handleGetAnalysis = async (
  req: Request, res: Response, mongoClient: MongoClient,
): Promise<ApiResponse> => {
  const payload = processGetAnalysisPayload(req.query as unknown as AnalysisGetPayload);

  if (!payload.seqId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED, 400);
  }

  // Get a post
  const postGetResult = await AnalysisController.getAnalysis(
    mongoClient, payload.seqId, payload.lang, true,
  );
  if (!postGetResult) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_NOT_EXISTS, 404);
  }

  // Get the data of the user who send this request
  const userData = await GoogleUserController.getUserData(mongoClient, payload.googleUid);

  return new AnalysisGetSuccessResponse(
    userData ? userData.isAdmin : false,
    userData ? !userData.isAdsFree : true,
    postGetResult.toResponseReady(),
  );
};
