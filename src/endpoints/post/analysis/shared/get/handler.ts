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
    ({uid, unitId, lang}) => AnalysisController.getAnalysis({
      mongoClient, uid, unitIdentifier: unitId, lang, incCount: true,
    }),
    (getResult) => new AnalysisGetResponse(getResult.toResponseReady()),
  );
};
