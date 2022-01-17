import {MongoClient} from 'mongodb';

import {AnalysisEditPayload, ApiResponseCode} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {handleEditPost} from '../../../base/handler/edit/base';
import {FunctionConstructResponse, FunctionEditPost} from '../../../base/handler/edit/types';
import {ApiFailedResponse} from '../../../base/response/failed';
import {PostEditResultCommon} from '../../../base/type';
import {AnalysisEditResponse} from '../../base/response/edit';


export const handleEditAnalysis = async <
  P extends AnalysisEditPayload,
  R extends AnalysisEditResponse,
  T extends PostEditResultCommon,
>(
  mongoClient: MongoClient,
  payload: P,
  fnEditPost: FunctionEditPost<P, T>,
  fnConstructResponse: FunctionConstructResponse<P, R, T>,
): Promise<ApiResponse> => {
  if (!payload.unitId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_UNIT_ID_NOT_SPECIFIED, {httpCode: 400});
  }

  return handleEditPost(mongoClient, payload, fnEditPost, fnConstructResponse);
};
