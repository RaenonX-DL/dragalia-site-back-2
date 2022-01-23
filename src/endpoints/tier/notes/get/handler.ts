import {UnitTierNoteGetPayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {TierNoteController} from '../controller';
import {UnitTierNoteGetResponse} from './response';


export const handleTierNoteGet = async ({
  payload,
  mongoClient,
}: HandlerParams<UnitTierNoteGetPayload>): Promise<UnitTierNoteGetResponse> => {
  payload = processPayloadBase(payload);

  const [data, userSubscribed] = await Promise.all([
    TierNoteController.getAllTierNotes(mongoClient, payload.lang),
    SubscriptionRecordController.isUserSubscribed(mongoClient, payload.uid, [{type: 'const', name: 'ALL_TIER'}]),
  ]);

  return new UnitTierNoteGetResponse({data, userSubscribed});
};
