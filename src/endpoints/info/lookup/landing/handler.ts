import {UnitInfoLookupLandingPayload} from '../../../../api-def/api';
import {processLookupAnalysisPayload} from '../../../../utils/payload';
import {HandlerParams} from '../../../lookup';
import {UnitInfoLookupController} from '../controller';
import {UnitInfoLookupLandingResponse} from './response';


export const handleUnitInfoLookupLanding = async ({
  payload, mongoClient,
}: HandlerParams<UnitInfoLookupLandingPayload>): Promise<UnitInfoLookupLandingResponse> => {
  const {uid, lang} = processLookupAnalysisPayload(payload);

  return new UnitInfoLookupLandingResponse({
    analyses: await UnitInfoLookupController.getRecentlyModifiedAnalyses({mongoClient, uid, lang}),
  });
};
