import {ApiResponseCode, UserLoginPayload} from '../../../api-def/api';
import {HandlerParams} from '../../lookup';
import {ApiFailedResponse} from '../../post/base/response/failed';
import {processUserLoginPayload} from '../../post/utils/payload/userControl';
import {GoogleUserController} from '../controller';
import {UserLoginResponse} from './response';

export const handleUserLogin = async (
  {payload, mongoClient}: HandlerParams<UserLoginPayload>,
): Promise<UserLoginResponse | ApiFailedResponse> => {
  payload = processUserLoginPayload(payload);

  if (!payload.googleUid || !payload.googleEmail) {
    return new ApiFailedResponse(ApiResponseCode.FAILED_EMPTY_LOGIN_DATA);
  }

  return new UserLoginResponse(
    await GoogleUserController.userLogin(mongoClient, payload.googleUid, payload.googleEmail),
  );
};
