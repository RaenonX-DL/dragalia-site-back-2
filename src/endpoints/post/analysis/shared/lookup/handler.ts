import {AnalysisLookupPayload} from '../../../../../api-def/api';
import {processLookupAnalysisPayload} from '../../../../../utils/payload';
import {HandlerParams} from '../../../../lookup';
import {AnalysisController} from '../../controller';
import {AnalysisLookupResponse} from './response';


export const handleLookupAnalysis = async (
  {payload, mongoClient}: HandlerParams<AnalysisLookupPayload>,
): Promise<AnalysisLookupResponse> => {
  payload = processLookupAnalysisPayload(payload);

  return new AnalysisLookupResponse({
    analyses: await AnalysisController.getAnalysisLookup(mongoClient, payload.lang),
  });
};
