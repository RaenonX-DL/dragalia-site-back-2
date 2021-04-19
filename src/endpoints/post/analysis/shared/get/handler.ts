import {AnalysisGetPayload, ApiResponseCode} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {HandlerParams} from '../../../../lookup';
import {handleGetPost} from '../../../base/handler/get';
import {ApiFailedResponse} from '../../../base/response/failed';
import {processGetAnalysisPayload} from '../../../utils/payload';
import {AnalysisController} from '../../controller';
import {AnalysisGetSuccessResponse} from './response';


export const handleGetAnalysis = async (
  {payload, mongoClient}: HandlerParams<AnalysisGetPayload>,
): Promise<ApiResponse> => {
  payload = processGetAnalysisPayload(payload);

  if (!payload.seqId) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_POST_ID_NOT_SPECIFIED, {httpCode: 400});
  }

  return handleGetPost(
    mongoClient,
    payload,
    AnalysisController.getAnalysis,
    (userData, getResult) => {
      return new AnalysisGetSuccessResponse(
        userData ? userData.isAdmin : false,
        userData ? !userData.isAdsFree : true,
        getResult.toResponseReady(),
      );
    },
  );
};
