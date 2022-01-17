import {SubscriptionUpdatePayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {HandlerParams} from '../../../lookup';
import {SubscriptionUpdateResponse} from './response';


export const handleSubscriptionUpdate = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionUpdatePayload>): Promise<SubscriptionUpdateResponse> => {
  await SubscriptionRecordController.updateSubscriptions(mongoClient, payload);

  return new SubscriptionUpdateResponse();
};
