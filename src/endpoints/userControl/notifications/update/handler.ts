import {SubscriptionUpdatePayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {SubscriptionUpdateResponse} from './response';


export const handleSubscriptionUpdate = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionUpdatePayload>): Promise<SubscriptionUpdateResponse> => {
  payload = processPayloadBase(payload);

  await SubscriptionRecordController.updateSubscriptions(mongoClient, payload);

  return new SubscriptionUpdateResponse();
};
