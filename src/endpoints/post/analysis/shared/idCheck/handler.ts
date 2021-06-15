import {AnalysisIdCheckPayload} from '../../../../../api-def/api';
import {processAnalysisIdCheckPayload} from '../../../../../utils/payload';
import {HandlerParams} from '../../../../lookup';
import {handlePostIdCheck} from '../../../base/handler/idCheck/main';
import {AnalysisController} from '../../controller';
import {AnalysisIdCheckResponse} from './response';

export const handleAnalysisIdCheck = async (
  {payload, mongoClient}: HandlerParams<AnalysisIdCheckPayload>,
): Promise<AnalysisIdCheckResponse> => {
  payload = processAnalysisIdCheckPayload(payload);

  return handlePostIdCheck(
    mongoClient,
    payload,
    (payload) => AnalysisController.isAnalysisIdAvailable(mongoClient, payload.lang, payload.unitId),
    (isAvailable) => {
      return new AnalysisIdCheckResponse(isAvailable);
    },
  );
};
