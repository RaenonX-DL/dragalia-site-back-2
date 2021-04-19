import {AnalysisIdCheckPayload} from '../../../../../api-def/api';
import {HandlerParams} from '../../../../lookup';
import {handlePostIdCheck} from '../../../base/handler/idCheck';
import {processAnalysisIdCheckPayload} from '../../../utils/payload/analysis';
import {AnalysisController} from '../../controller';
import {AnalysisIdCheckResponse} from './response';

export const handleAnalysisIdCheck = async (
  {payload, mongoClient}: HandlerParams<AnalysisIdCheckPayload>,
): Promise<AnalysisIdCheckResponse> => {
  payload = processAnalysisIdCheckPayload(payload);

  return handlePostIdCheck(
    mongoClient,
    payload,
    AnalysisController.isAnalysisIdAvailable,
    (isAdmin, isAvailable) => {
      return new AnalysisIdCheckResponse(isAdmin, isAvailable);
    },
  );
};
