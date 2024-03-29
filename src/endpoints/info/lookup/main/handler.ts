import {UnitInfoLookupPayload} from '../../../../api-def/api';
import {processLookupAnalysisPayload} from '../../../../utils/payload/post/analysis';
import {HandlerParams} from '../../../lookup';
import {UnitInfoLookupController} from '../controller';
import {UnitInfoLookupResponse} from './response';


export const handleUnitInfoLookup = async ({
  payload, mongoClient,
}: HandlerParams<UnitInfoLookupPayload>): Promise<UnitInfoLookupResponse> => {
  const {uid, lang} = processLookupAnalysisPayload(payload);

  return new UnitInfoLookupResponse({
    analyses: await UnitInfoLookupController.getAnalysisLookup({mongoClient, uid, lang}),
  });
};
