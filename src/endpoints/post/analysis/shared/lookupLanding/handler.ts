import {AnalysisLookupLandingPayload} from '../../../../../api-def/api';
import {processLookupAnalysisPayload} from '../../../../../utils/payload';
import {HandlerParams} from '../../../../lookup';
import {AnalysisController} from '../../controller';
import {AnalysisLookupLandingResponse} from './response';


export const handleLookupAnalysisLanding = async (
  {payload, mongoClient}: HandlerParams<AnalysisLookupLandingPayload>,
): Promise<AnalysisLookupLandingResponse> => {
  payload = processLookupAnalysisPayload(payload);

  return new AnalysisLookupLandingResponse({
    analyses: await AnalysisController.getAnalysisLookupLanding(mongoClient, payload.lang),
  });
};
