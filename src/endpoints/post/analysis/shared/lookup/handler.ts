import {AnalysisLookupPayload} from '../../../../../api-def/api';
import {processLookupAnalysisPayload} from '../../../../../utils/payload/post/analysis';
import {HandlerParams} from '../../../../lookup';
import {GoogleUserController} from '../../../../userControl/controller';
import {AnalysisController} from '../../controller';
import {AnalysisLookupResponse} from './response';

export const handleLookupAnalysis = async (
  {payload, mongoClient}: HandlerParams<AnalysisLookupPayload>,
): Promise<AnalysisLookupResponse> => {
  payload = processLookupAnalysisPayload(payload);

  return new AnalysisLookupResponse({
    isAdmin: await GoogleUserController.isAdmin(mongoClient, payload.googleUid),
    analyses: await AnalysisController.getAnalysisLookup(mongoClient, payload.lang),
  });
};
