import {SubscriptionRemovePayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {SubscriptionRemoveResponse} from './response';


export const handleSubscriptionRemove = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionRemovePayload>): Promise<SubscriptionRemoveResponse> => {
  payload = processPayloadBase(payload);

  await SubscriptionRecordController.removeSubscription(mongoClient, payload);

  return new SubscriptionRemoveResponse();
};
