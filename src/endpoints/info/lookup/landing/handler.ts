import {UnitInfoLookupLandingPayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processLookupAnalysisPayload} from '../../../../utils/payload';
import {HandlerParams} from '../../../lookup';
import {UnitInfoLookupController} from '../controller';
import {UnitInfoLookupLandingResponse} from './response';


export const handleUnitInfoLookupLanding = async ({
  payload, mongoClient,
}: HandlerParams<UnitInfoLookupLandingPayload>): Promise<UnitInfoLookupLandingResponse> => {
  const {uid, lang} = processLookupAnalysisPayload(payload);

  const [analyses, userSubscribed] = await Promise.all([
    UnitInfoLookupController.getRecentlyModifiedAnalyses({mongoClient, uid, lang}),
    SubscriptionRecordController.isUserSubscribed(mongoClient, uid, [{type: 'const', name: 'ALL_ANALYSIS'}]),
  ]);

  return new UnitInfoLookupLandingResponse({analyses, userSubscribed});
};
