import {ApiResponseCode, SubscriptionUpdatePayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {SubscriptionUpdateResponse} from './response';


export const handleSubscriptionUpdate = async ({
  payload,
  mongoClient,
}: HandlerParams<SubscriptionUpdatePayload>): Promise<SubscriptionUpdateResponse | ApiFailedResponse> => {
  payload = processPayloadBase(payload);

  if (!payload.uid) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_NO_ANONYMOUS_ACCESS);
  }

  await SubscriptionRecordController.updateSubscriptions(mongoClient, payload);

  return new SubscriptionUpdateResponse();
};
