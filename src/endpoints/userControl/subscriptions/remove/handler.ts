import {ApiResponseCode, SubscriptionRemovePayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {SubscriptionRemoveResponse} from './response';


export const handleSubscriptionRemove = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionRemovePayload>): Promise<SubscriptionRemoveResponse | ApiFailedResponse> => {
  payload = processPayloadBase(payload);

  if (!payload.uid) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_NO_ANONYMOUS_ACCESS);
  }

  await SubscriptionRecordController.removeSubscription(mongoClient, payload);

  return new SubscriptionRemoveResponse();
};
