import {AnalysisGetPayload} from '../../../../../api-def/api';
import {ApiResponse} from '../../../../../base/response';
import {processGetAnalysisPayload} from '../../../../../utils/payload';
import {HandlerParams} from '../../../../lookup';
import {handleGetPost} from '../../../base/handler/get';
import {AnalysisController} from '../../controller';
import {AnalysisGetResponse} from './response';


export const handleGetAnalysis = async (
  {payload, mongoClient}: HandlerParams<AnalysisGetPayload>,
): Promise<ApiResponse> => {
  payload = processGetAnalysisPayload(payload);

  return handleGetPost(
    mongoClient,
    payload,
    (payload) => (
      AnalysisController.getAnalysis(mongoClient, payload.unitId, payload.lang, true)
    ),
    (userData, getResult) => {
      return new AnalysisGetResponse(
        userData ? userData.isAdmin : false,
        getResult.toResponseReady(),
      );
    },
  );
};
