import {SubscriptionRemovePayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {HandlerParams} from '../../../lookup';
import {SubscriptionRemoveResponse} from './response';


export const handleSubscriptionRemove = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionRemovePayload>): Promise<SubscriptionRemoveResponse> => {
  await SubscriptionRecordController.removeSubscription(mongoClient, payload);

  return new SubscriptionRemoveResponse();
};
