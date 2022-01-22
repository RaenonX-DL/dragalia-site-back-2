import {ApiResponseCode, SubscriptionGetPayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {SubscriptionGetResponse} from './response';


export const handleSubscriptionGet = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionGetPayload>): Promise<SubscriptionGetResponse | ApiFailedResponse> => {
  payload = processPayloadBase(payload);

  if (!payload.uid) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_NO_ANONYMOUS_ACCESS);
  }

  const subscriptionKeys = await SubscriptionRecordController.getSubscriptionsOfUser(mongoClient, payload.uid);

  return new SubscriptionGetResponse({subscriptionKeys});
};
