import {SubscriptionAddPayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {HandlerParams} from '../../../lookup';
import {SubscriptionAddResponse} from './response';


export const handleSubscriptionAdd = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionAddPayload>): Promise<SubscriptionAddResponse> => {
  await SubscriptionRecordController.addSubscription(mongoClient, payload);

  return new SubscriptionAddResponse();
};
