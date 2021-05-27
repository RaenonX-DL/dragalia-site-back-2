import {AnalysisLookupLandingPayload} from '../../../../../api-def/api';
import {processLookupAnalysisPayload} from '../../../../../utils/payload';
import {HandlerParams} from '../../../../lookup';
import {GoogleUserController} from '../../../../userControl/controller';
import {AnalysisController} from '../../controller';
import {AnalysisLookupLandingResponse} from './response';

export const handleLookupAnalysisLanding = async (
  {payload, mongoClient}: HandlerParams<AnalysisLookupLandingPayload>,
): Promise<AnalysisLookupLandingResponse> => {
  payload = processLookupAnalysisPayload(payload);

  return new AnalysisLookupLandingResponse({
    isAdmin: await GoogleUserController.isAdmin(mongoClient, payload.googleUid),
    analyses: await AnalysisController.getAnalysisLookupLanding(mongoClient, payload.lang),
  });
};
