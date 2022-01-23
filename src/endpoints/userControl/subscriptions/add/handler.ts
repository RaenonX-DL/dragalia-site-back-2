import {ApiResponseCode, SubscriptionAddPayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {SubscriptionAddResponse} from './response';


export const handleSubscriptionAdd = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionAddPayload>): Promise<SubscriptionAddResponse | ApiFailedResponse> => {
  payload = processPayloadBase(payload);

  if (!payload.uid) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_NO_ANONYMOUS_ACCESS);
  }

  await SubscriptionRecordController.addSubscription(mongoClient, payload);

  return new SubscriptionAddResponse();
};
