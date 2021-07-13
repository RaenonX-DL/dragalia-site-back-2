import {MongoClient} from 'mongodb';

import {AnalysisEditPayload, ApiResponseCode} from '../../../api-def/api';
import {ApiResponse} from '../../../base/response';
import {handleEditPost} from '../base/handler/edit/base';
import {FunctionConstructResponse, FunctionEditPost} from '../base/handler/edit/types';
import {ApiFailedResponse} from '../base/response/failed';
import {AnalysisEditResponse} from './base/response/edit';


export const handleEditAnalysis = async <P extends AnalysisEditPayload, R extends AnalysisEditResponse>(
  mongoClient: MongoClient,
  payload: P,
  fnEditPost: FunctionEditPost<P>,
  fnConstructResponse: FunctionConstructResponse<P, R>,
): Promise<ApiResponse> => {
  if (!payload.unitId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_UNIT_ID_NOT_SPECIFIED, {httpCode: 400});
  }

  return handleEditPost(mongoClient, payload, fnEditPost, fnConstructResponse);
};
