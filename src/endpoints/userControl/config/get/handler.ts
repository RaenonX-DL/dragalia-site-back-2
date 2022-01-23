import {ApiResponseCode, UserConfigGetPayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processPayloadBase} from '../../../../utils/payload/base';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {UserConfigGetResponse} from './response';


export const handleUserConfigGet = async ({
  payload,
  mongoClient,
}: HandlerParams<UserConfigGetPayload>): Promise<UserConfigGetResponse | ApiFailedResponse> => {
  payload = processPayloadBase(payload);

  if (!payload.uid) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_NO_ANONYMOUS_ACCESS);
  }

  const subscriptionKeys = await SubscriptionRecordController.getSubscriptionsOfUser(mongoClient, payload.uid);

  return new UserConfigGetResponse({subscriptionKeys});
};
