import {SubscriptionAddPayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {SubscriptionAddResponse} from './response';


export const handleSubscriptionAdd = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionAddPayload>): Promise<SubscriptionAddResponse> => {
  payload = processPayloadBase(payload);

  await SubscriptionRecordController.addSubscription(mongoClient, payload);

  return new SubscriptionAddResponse();
};
