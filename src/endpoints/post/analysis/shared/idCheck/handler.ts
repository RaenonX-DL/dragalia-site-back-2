import {AnalysisIdCheckPayload} from '../../../../../api-def/api';
import {processAnalysisIdCheckPayload} from '../../../../../utils/payload/post/analysis';
import {HandlerParams} from '../../../../lookup';
import {GoogleUserController} from '../../../../userControl/controller';
import {AnalysisController} from '../../controller';
import {AnalysisIdCheckResponse} from './response';

export const handleAnalysisIdCheck = async (
  {payload, mongoClient}: HandlerParams<AnalysisIdCheckPayload>,
): Promise<AnalysisIdCheckResponse> => {
  payload = processAnalysisIdCheckPayload(payload);

  // Check the user privilege
  const isAdmin = await GoogleUserController.isAdmin(mongoClient, payload.googleUid);
  if (!isAdmin) {
    return new AnalysisIdCheckResponse(false, false);
  }

  // Check post ID availability
  const isAvailable = await AnalysisController.isAnalysisIdAvailable(mongoClient, payload.lang, payload.unitId);

  return new AnalysisIdCheckResponse(isAdmin, isAvailable);
};
