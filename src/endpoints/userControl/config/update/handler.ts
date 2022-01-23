import {ApiResponseCode, UserConfigUpdatePayload} from '../../../../api-def/api';
import {SubscriptionRecordController} from '../../../../thirdparty/mail/data/subscription/controller';
import {processUserConfigApi} from '../../../../utils/payload/user/config';
import {HandlerParams} from '../../../lookup';
import {ApiFailedResponse} from '../../../post/base/response/failed';
import {UserConfigUpdateResponse} from './response';


export const handleUserConfigUpdate = async ({
  payload,
  mongoClient,
}: HandlerParams<UserConfigUpdatePayload>): Promise<UserConfigUpdateResponse | ApiFailedResponse> => {
  const {uid, subscriptionKeys} = processUserConfigApi(payload);

  if (!uid) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_NO_ANONYMOUS_ACCESS);
  }

  await SubscriptionRecordController.updateSubscriptions(mongoClient, uid, subscriptionKeys);

  return new UserConfigUpdateResponse();
};
